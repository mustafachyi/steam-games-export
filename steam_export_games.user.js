// ==UserScript==
// @name         Steam Games Export
// @namespace    steamutils
// @version      0.4.3
// @description  Auto-exports Steam games list on profile load
// @author       mustafachyi
// @match        *://steamcommunity.com/*
// @grant        GM_cookie
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @connect      steamcommunity.com
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const CONFIG = {
        paths: { games: '/games', login: 'https://steamcommunity.com/login/home/' },
        storage: { profiles: 'steam_exported_profiles', username: 'steam_last_username' },
        retry: { max: 20, delay: 500 },
        ui: { notifyDuration: 3000, animDuration: 300 },
        keys: { logout: { ctrl: true, alt: true, key: 'l' } }
    };

    // UI: styles + handlers
    const ui = {
        styles: `
            .steam_export_notification{position:fixed;bottom:20px;right:20px;background:#1b2838;border:1px solid #66c0f4;color:#fff;padding:15px;border-radius:3px;box-shadow:0 0 10px rgba(0,0,0,.5);z-index:9999;font-family:"Motiva Sans",Arial,sans-serif;animation:steamNotificationSlide .3s ease-out;display:flex;align-items:center;gap:10px;min-width:280px}
            .steam_export_notification .icon{width:24px;height:24px;background:#66c0f4;border-radius:3px;display:flex;align-items:center;justify-content:center}
            .steam_export_notification .content{flex-grow:1}
            .steam_export_notification .title{font-weight:700;margin-bottom:3px;color:#66c0f4}
            .steam_export_notification .message{font-size:12px;color:#acb2b8}
            @keyframes steamNotificationSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
            .steam_export_btn{display:inline-flex;align-items:center;padding:0 15px;line-height:24px;border-radius:2px;background:#101822;color:#fff;margin-left:10px;cursor:pointer;border:none;font-family:"Motiva Sans",Arial,sans-serif;transition:all .25s ease}
            .steam_export_btn:hover{background:#4e92b9}
        `,
        activeNotifications: new WeakMap(),
        init: () => (document.head || document.documentElement).appendChild(Object.assign(document.createElement('style'), { textContent: ui.styles })),
        notify: (title, message) => {
            const el = document.createElement('div');
            el.className = 'steam_export_notification';
            el.innerHTML = `<div class="icon">✓</div><div class="content"><div class="title">${title}</div><div class="message">${message}</div></div>`;
            document.body.appendChild(el);

            const timers = {
                hide: setTimeout(() => {
                    el.style.animation = 'steamNotificationSlide 0.3s ease-in reverse';
                    timers.remove = setTimeout(() => el.remove(), CONFIG.ui.animDuration);
                }, CONFIG.ui.notifyDuration),
                remove: null
            };

            ui.activeNotifications.set(el, timers);
            return () => {
                const t = ui.activeNotifications.get(el);
                t && (clearTimeout(t.hide), clearTimeout(t.remove), el.remove());
                ui.activeNotifications.delete(el);
            };
        },
        addExportButton: () => {
            const btn = document.createElement('a');
            btn.className = 'steam_export_btn';
            btn.textContent = 'Export Games';
            btn.onclick = () => {
                const config = document.getElementById('gameslist_config')?.dataset.profileGameslist;
                if (!config) return;
                try {
                    const data = JSON.parse(config);
                    data.rgGames?.length && (games.export(data), storage.markExported(data.strSteamId, data.rgGames.length));
                } catch {}
            };

            // Ensure DOM is ready before adding button
            setTimeout(() => {
                new MutationObserver((_, obs) => {
                    const header = document.querySelector('.profile_small_header_text');
                    header && (header.appendChild(btn), obs.disconnect());
                }).observe(document.documentElement, { childList: true, subtree: true });
            }, 0);
        }
    };

    // Storage ops
    const storage = {
        get: key => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } },
        set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        markExported: (steamId, count) => {
            const profiles = storage.get(CONFIG.storage.profiles);
            profiles[steamId] = count;
            storage.set(CONFIG.storage.profiles, profiles);
        },
        shouldExport: (steamId, count) => {
            const profiles = storage.get(CONFIG.storage.profiles);
            return profiles[steamId] === undefined || profiles[steamId] !== count;
        }
    };

    // Game data ops
    const games = {
        waitForData: (retries = 0) => {
            const config = document.getElementById('gameslist_config')?.dataset.profileGameslist;
            if (config) {
                try {
                    const data = JSON.parse(config);
                    if (data.rgGames?.length) {
                        storage.shouldExport(data.strSteamId, data.rgGames.length) && (games.export(data), storage.markExported(data.strSteamId, data.rgGames.length));
                        !document.querySelector('.steam_export_btn') && ui.addExportButton();
                        return;
                    }
                } catch {}
            }
            retries < CONFIG.retry.max && setTimeout(() => games.waitForData(retries + 1), CONFIG.retry.delay);
        },
        export: data => {
            const username = localStorage.getItem(CONFIG.storage.username) || data.strProfileName || 'unknown';
            const url = URL.createObjectURL(new Blob([data.rgGames.map(g => g.name).join('\n')], { type: 'text/plain' }));
            
            // Ensure URL cleanup even if download fails
            const cleanup = setTimeout(() => URL.revokeObjectURL(url), 30000);
            
            const download = () => GM_download({
                url,
                name: `steam_games/${username}_games.txt`,
                saveAs: false,
                onload: () => {
                    clearTimeout(cleanup);
                    URL.revokeObjectURL(url);
                    ui.notify('Games List Exported', `Saved ${data.rgGames.length} games to steam_games/${username}_games.txt`);
                },
                onerror: error => {
                    clearTimeout(cleanup);
                    URL.revokeObjectURL(url);
                    error.includes('No such file or directory') 
                        ? GM_download({ url: 'data:text/plain;base64,', name: 'steam_games/.folder', saveAs: false, onload: download })
                        : ui.notify('Export Failed', 'Could not save games list. Please try again.');
                }
            });
            download();
        },
        getCount: steamId => new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://steamcommunity.com/profiles/${steamId}/games`,
                onload: res => {
                    try {
                        const doc = new DOMParser().parseFromString(res.responseText, 'text/html');
                        const data = JSON.parse(doc.getElementById('gameslist_config')?.dataset.profileGameslist || '{}');
                        resolve(data.rgGames?.length || null);
                    } catch { resolve(null); }
                },
                onerror: () => resolve(null)
            });
        })
    };

    // Auth ops
    const auth = {
        setupLoginCapture: () => {
            new MutationObserver((_, obs) => {
                const form = document.querySelector('form._2v60tM463fW0V7GDe92E5f');
                if (!form) return;

                const [userInput, passInput] = form.querySelectorAll('input._2GBWeup5cttgbTw8FM3tfx');
                if (!userInput || !passInput) return;

                const setReactValue = (input, value) => {
                    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    setter.call(input, value);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                };

                userInput.addEventListener('paste', e => {
                    const text = (e.clipboardData || window.clipboardData).getData('text');
                    if (!text.includes(':')) return;

                    e.preventDefault();
                    const [user, pass] = text.split(':').map(s => s.trim());
                    if (!user || !pass) return;

                    setReactValue(userInput, user);
                    setReactValue(passInput, pass);
                    ui.notify('Credentials Filled', 'Username and password have been entered');
                });

                form.querySelector('button.DjSvCZoKKfoNSmarsEcTS')?.addEventListener('click', () => {
                    const username = userInput.value.trim();
                    username && localStorage.setItem(CONFIG.storage.username, username);
                });

                obs.disconnect();
            }).observe(document.documentElement, { childList: true, subtree: true });
        },
        checkState: () => new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://steamcommunity.com/my/',
                onload: res => resolve(!res.finalUrl.includes('/login')),
                onerror: () => resolve(false)
            });
        }),
        setupLogout: () => document.addEventListener('keydown', e => {
            const { ctrl, alt, key } = CONFIG.keys.logout;
            (!ctrl || e.ctrlKey) && (!alt || e.altKey) && e.key.toLowerCase() === key && 
            (e.preventDefault(), typeof Logout === 'function' && Logout());
        }, true)
    };

    // URL utils
    const url = {
        isLogin: () => location.href.includes('/login/home'),
        isGames: () => location.pathname.includes('/games'),
        isProfile: () => /\/(?:id|profiles)\/[^\/]+(?:\/home|\/?$)/.test(location.pathname),
        getBase: () => (location.href.match(/(.*\/(?:id|profiles)\/[^\/]+)(?:\/home)?/) || [])[1] || null,
        getSteamId: () => (location.pathname.match(/\/(?:id|profiles)\/([^\/]+)(?:\/home)?/) || [])[1] || null
    };

    // Init
    document.addEventListener('DOMContentLoaded', async () => {
        ui.init();
        auth.setupLogout();

        if (url.isLogin()) return auth.setupLoginCapture();
        if (url.isGames()) return games.waitForData();
        if (!await auth.checkState()) return (location.href = CONFIG.paths.login);
        
        if (url.isProfile()) {
            const steamId = url.getSteamId();
            if (!steamId) return;

            const profiles = storage.get(CONFIG.storage.profiles);
            const prevCount = profiles[steamId];
            
            if (prevCount !== undefined) {
                const currCount = await games.getCount(steamId);
                if (!currCount || currCount === prevCount) return;
            }

            const base = url.getBase();
            base && (location.href = base + CONFIG.paths.games);
        }
    });
})(); 
