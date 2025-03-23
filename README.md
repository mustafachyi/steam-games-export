# Steam Games Export

A powerful browser userscript that automatically exports your Steam game libraries. Built for Steam users who want to maintain offline records of their game collections or analyze their gaming libraries.


If you find this project useful, please consider giving it a star ⭐! It helps make the project more visible and encourages continued development.

[![GitHub stars](https://img.shields.io/github/stars/mustafachyi/steam-games-export.svg?style=social&label=Star&maxAge=2592000)](https://github.com/mustafachyi/steam-games-export/stargazers/)

## Features

### Automatic Export
- Automatically detects and exports game lists when visiting Steam profiles
- Smart tracking system to only export when game library changes
- Creates organized text files with game lists per user

### User Interface
- Clean, Steam-themed notifications for all actions
- Seamlessly integrated "Export Games" button in profile pages
- Progress and status notifications for all operations
- Matches Steam's visual design language

### Security & Privacy
- Secure credential handling with username:password paste support
- No data stored except export history and last username
- Uses browser's secure storage mechanisms
- Quick logout shortcut (Ctrl+Alt+L) for security

## Output Format

### File Structure
```
steam_games/
├── username1_games.txt
├── username2_games.txt
└── .folder
```

### File Format
- Clean text files with one game per line
- Named using pattern: `username_games.txt`
- UTF-8 encoded for universal compatibility
- Auto-creates `steam_games` directory if missing

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

2. Install the script:
   - Click the "Install" button above, or
   - Copy the script content into your userscript manager
   - Verify the script appears in your userscript manager's dashboard

3. Configure permissions:
   - Ensure your userscript manager allows:
     - Access to steamcommunity.com
     - File downloads
     - Cookie access
     - XMLHttpRequests

## Usage

### Automatic Export
1. Visit any Steam profile page
2. Script automatically detects game library
3. If new games found, exports automatically
4. Notification appears upon successful export

### Manual Export
1. Navigate to any Steam profile
2. Look for the "Export Games" button in profile header
3. Click to trigger manual export
4. Check `steam_games` folder for output

### Credential Handling
- Format: `username:password`
- Paste directly into login form
- Credentials are never stored
- Quick logout available via Ctrl+Alt+L

## Technical Details

### Version Information
- Current Version: 0.4.3
- Compatibility: All major browsers
- Required Permissions:
  - `GM_cookie`: Cookie management
  - `GM_xmlhttpRequest`: External requests
  - `GM_download`: File downloads

### Storage
- Uses localStorage for:
  - Previously exported profiles
  - Last used username
  - Export history tracking

### Domain Coverage
- Primary: steamcommunity.com/*
- Handles all Steam profile variants
- Supports both /id/ and /profiles/ URLs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Steam Community for the web interface
- Tampermonkey/Greasemonkey communities
- All contributors and users
- Everyone who stars and supports this project
