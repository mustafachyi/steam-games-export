// Steam automation WebSocket server
const WebSocket = require('ws');
const fs = require('fs').promises;
const fsSync = require('fs');
const readline = require('readline');

// Configuration
const CONFIG = {
    server: { port: 27060, host: '127.0.0.1' },
    heartbeat: 15000,
    accounts: { file: 'accounts.txt' }
};

// State management
const state = {
    accounts: [],
    currentIndex: 0,
    clients: {},
    autoMode: false
};

// Utility functions
const utils = {
    log: msg => process.stdout.write('\r\x1b[K' + msg),
    async handleLogin() {
        utils.log('Processing login via Steam login manager...');
        return true;
    }
};

// Account management
const accounts = {
    async load() {
        try {
            try {
                await fs.access(CONFIG.accounts.file);
            } catch {
                state.autoMode = false;
                utils.log('No accounts file found - manual mode');
                return;
            }
            
            const uniqueAccounts = new Set();
            let totalLines = 0;
            let invalidLines = 0;
            
            const fileStream = fsSync.createReadStream(CONFIG.accounts.file);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });
            
            for await (const line of rl) {
                totalLines++;
                const trimmed = line.trim();
                
                if (trimmed) {
                    const parts = trimmed.split(':');
                    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
                        uniqueAccounts.add(trimmed);
                    } else {
                        invalidLines++;
                    }
                } else {
                    invalidLines++;
                }
            }
            
            state.accounts = [...uniqueAccounts];
            
            if (state.accounts.length === 0) {
                state.autoMode = false;
                utils.log('No valid accounts found in file - manual mode');
                return;
            }
            
            state.autoMode = true;
            
            if (state.accounts.length !== totalLines) {
                await fs.writeFile(CONFIG.accounts.file, state.accounts.join('\n'), 'utf8');
                utils.log(`Cleaned accounts file: removed ${invalidLines} invalid format lines and ${totalLines - invalidLines - state.accounts.length} duplicates`);
            }
            
            utils.log(`Loaded ${state.accounts.length} accounts - auto mode`);
        } catch (error) {
            utils.log(`Error loading accounts: ${error.message}`);
            state.autoMode = false;
        }
    },

    getNext() {
        if (!state.autoMode || state.currentIndex >= state.accounts.length) {
            state.autoMode = false;
            return null;
        }
        return state.accounts[state.currentIndex++];
    }
};

// Message handlers
const handlers = {
    identify: (ws, data) => {
        if (data.client === 'userscript') {
            state.clients.userscript?.close();
            state.clients.userscript = ws;
            ws.send(JSON.stringify({ 
                type: 'connected', 
                mode: state.autoMode ? 'auto' : 'manual' 
            }));
            utils.log('Userscript connected');
        }
    },

    credentials_filled: async () => {
        utils.log('Processing login...');
        await utils.handleLogin();
    },

    ready_for_login: ws => {
        if (!state.autoMode) {
            ws.send(JSON.stringify({ type: 'manual_mode' }));
            return;
        }

        const account = accounts.getNext();
        if (!account) {
            ws.send(JSON.stringify({ type: 'all_done' }));
            utils.log('No more accounts - manual mode');
            return;
        }

        ws.send(JSON.stringify({ 
            type: 'account_data', 
            credentials: account 
        }));
        utils.log('Sent account credentials');
    },

    login_failed: ws => {
        if (!state.autoMode) return;

        const account = accounts.getNext();
        if (!account) {
            ws.send(JSON.stringify({ type: 'all_done' }));
            utils.log('No more accounts - manual mode');
            return;
        }

        ws.send(JSON.stringify({ 
            type: 'account_data', 
            credentials: account 
        }));
        utils.log('Login failed - sent next account');
    }
};

// Server initialization
const initServer = () => {
    const server = new WebSocket.Server(CONFIG.server);
    utils.log(`Server running at ws://${CONFIG.server.host}:${CONFIG.server.port}`);

    server.on('connection', ws => {
        ws.isAlive = true;
        ws.on('pong', () => ws.isAlive = true);
        
        ws.on('message', msg => {
            try {
                const data = JSON.parse(msg);
                ws.isAlive = true;
                handlers[data.type]?.(ws, data);
            } catch (error) {
                utils.log(`Message error: ${error.message}`);
            }
        });

        ws.on('close', () => {
            if (state.clients.userscript === ws) {
                state.clients.userscript = null;
                utils.log('Userscript disconnected');
            }
        });
    });

    setInterval(() => {
        server.clients.forEach(ws => {
            if (!ws.isAlive) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, CONFIG.heartbeat);

    process.on('SIGINT', () => {
        utils.log('Shutting down...');
        server.close(() => process.exit(0));
    });
};

// Start application
initServer();
accounts.load(); 