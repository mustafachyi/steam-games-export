# Steam Games Export

A comprehensive automation system that exports Steam game libraries with WebSocket support for bulk account processing. Built for Steam users who want to maintain offline records of their game collections, analyze gaming libraries, or process multiple accounts efficiently.

If you find this project useful, please consider giving it a star ⭐! It helps make the project more visible and encourages continued development.

[![GitHub stars](https://img.shields.io/github/stars/mustafachyi/steam-games-export?style=social&label=Star)](https://github.com/mustafachyi/steam-games-export/stargazers/)

## Features

### Automatic Export
- Automatically detects and exports game lists when visiting Steam profiles
- Smart tracking system to only export when game library changes
- Creates organized text files with game lists per user
- WebSocket server support for automated multi-account processing

### User Interface
- Clean, Steam-themed notifications for all actions
- Seamlessly integrated "Export Games" button in profile pages
- Progress and status notifications for all operations
- Matches Steam's visual design language
- Login page optimization for faster processing

### Security & Privacy
- Secure credential handling with username:password paste support
- No data stored except export history and last username
- Uses browser's secure storage mechanisms
- Quick logout shortcut (Ctrl+Alt+L) for security
- WebSocket communication with local server only

## Architecture

The project consists of two main components:

### 1. Browser Userscript
- Runs in your browser via Tampermonkey/Greasemonkey
- Handles Steam website interaction, login, and data export
- Communicates with the WebSocket server for automation

### 2. WebSocket Server
- Node.js server that runs locally on your machine
- Reads accounts from a text file and feeds them to the userscript
- Manages the automation workflow and account queue
- Supports both manual and automatic modes

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

### Userscript
1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

2. Install the script:
   - Copy the `steam_export_games.user.js` content into your userscript manager
   - Verify the script appears in your userscript manager's dashboard

3. Configure permissions:
   - Ensure your userscript manager allows:
     - Access to steamcommunity.com
     - File downloads
     - Cookie access
     - XMLHttpRequests
     - WebSocket connections to localhost

### WebSocket Server (Optional)
1. Make sure Node.js is installed on your system
2. Clone or download this repository
3. Navigate to the server directory
4. Run `npm install` to install dependencies
5. Create an `accounts.txt` file with accounts in format `username:password` (one per line)
6. Start the server with `npm start`

## Usage

### Manual Mode
1. Visit any Steam profile page
2. Script automatically detects game library
3. If new games found, exports automatically
4. Notification appears upon successful export
5. Use the "Export Games" button for manual exports

### Automated Mode (with WebSocket Server)
1. Start the WebSocket server
2. Create an `accounts.txt` file with format `username:password` (one per line)
3. Open Steam login page in your browser
4. Server automatically feeds credentials and processes accounts sequentially
5. Game lists are exported for each account automatically

### Credential Handling
- Format: `username:password`
- Paste directly into login form or use accounts.txt for automation
- Credentials are never stored in the browser
- Quick logout available via Ctrl+Alt+L

## Technical Details

### Version Information
- Current Version: 0.7.4
- Compatibility: All major browsers
- Required Permissions:
  - `GM_cookie`: Cookie management
  - `GM_xmlhttpRequest`: External requests
  - `GM_download`: File downloads
  - WebSocket connections to localhost

### Storage
- Browser localStorage for:
  - Previously exported profiles
  - Last used username
  - Export history tracking
  - Operation mode (manual/auto)

### Server Configuration
- Default WebSocket port: 27060
- Accounts file: accounts.txt
- Automatic duplicate removal and account validation
- Connection heartbeat monitoring

### Domain Coverage
- Primary: steamcommunity.com/*
- Handles all Steam profile variants
- Supports both /id/ and /profiles/ URLs
- Automatic vanity URL resolution

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Steam Community for the web interface
- Tampermonkey/Greasemonkey communities
- All contributors and users
- Everyone who stars and supports this project
