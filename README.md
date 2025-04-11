# Kumbuka - Clipboard History Manager

Kumbuka is a powerful Electron-based clipboard history manager that helps you keep track of everything you copy. Built with React, TypeScript, and Material UI, it provides a seamless experience for managing your clipboard history.

## Features

- **Real-time Clipboard Monitoring**
  - Automatically captures text and images from your clipboard
  - Supports both text and image content
  - Smart duplicate detection to avoid redundant entries

- **Persistent Storage**
  - Stores clipboard history across application restarts
  - Efficient storage of images with automatic cleanup
  - Configurable history size limits

- **Modern Interface**
  - Clean and intuitive Material UI design
  - Dark mode by default
  - Tray icon for quick access
  - Keyboard shortcuts for common actions

- **Advanced Features**
  - Lock important items to prevent deletion
  - Clear history with one click
  - Copy items back to clipboard with a single click
  - Automatic cleanup of orphaned files

## Technology Stack

- **Frontend**
  - React
  - TypeScript
  - Material UI
  - Electron

- **Backend**
  - Electron
  - Node.js
  - electron-store for persistent storage

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/david.ta.ming/kumbuka.git
   cd kumbuka
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

## Development

To start the development server:

```bash
yarn electron:dev
```

This will:
- Start the React development server
- Launch the Electron application
- Enable hot reloading
- Open DevTools for debugging

## Building

To build the application for production:

```bash
yarn electron:build
```

The built application will be available in the `release` directory.

## Usage

- Click the tray icon to show/hide the application window
- Right-click the tray icon to access the quit option
- Use the interface to:
  - View your clipboard history
  - Lock/unlock items
  - Copy items back to clipboard
  - Clear history
  - Delete individual items

## License

MIT 