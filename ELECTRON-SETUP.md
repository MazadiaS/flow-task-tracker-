# Electron Desktop App Setup

Your task tracker has been successfully configured to run as a native Mac app using Electron!

## Features

- Runs as a standalone Mac application
- Works completely offline (no network required)
- All data stored locally in localStorage
- AI suggestions gracefully disabled when offline
- Native Mac menu bar and keyboard shortcuts

## Development

### Run the app in development mode:

```bash
npm run dev:electron
```

This will:
1. Start the Vite dev server at http://localhost:5173
2. Launch Electron and load the app
3. Enable hot module reloading for instant updates

### Run just the web version (browser):

```bash
npm run dev
```

## Building for Production

### Build the Mac app:

```bash
npm run build:mac
```

This creates a `.dmg` file in the `release/` directory that you can:
- Install by dragging to your Applications folder
- Double-click to run like any native Mac app
- Run completely offline

### The built app includes:
- Optimized React production build
- All assets bundled
- Native Mac application bundle
- Works for both Intel (x64) and Apple Silicon (arm64) Macs

## File Structure

```
task-tracker/
├── electron/
│   ├── main.cjs        # Electron main process (creates window)
│   └── preload.cjs     # Preload script (security)
├── src/                # React app source code
├── dist/               # Built web files (created by `npm run build`)
└── release/            # Built Mac apps (created by `npm run build:mac`)
```

## How It Works

1. **Development**: Vite serves your React app, Electron loads it in a window
2. **Production**: React app is built to `dist/`, Electron packages it into a Mac app
3. **Offline**: All data uses localStorage, no backend needed
4. **AI Features**: Gracefully disabled when no network (optional feature anyway)

## Troubleshooting

### App won't start in dev mode
```bash
# Kill any running processes
pkill -f electron
pkill -f vite

# Try again
npm run dev:electron
```

### Build fails
```bash
# Clean and rebuild
rm -rf dist release node_modules
npm install
npm run build:mac
```

### App icon not showing
- Create an icon file at `build/icon.icns`
- Or remove the icon line from `package.json` build config

## Next Steps

- Add custom app icon
- Configure code signing for distribution
- Add auto-updater for future releases
- Customize the menu bar options

Enjoy your offline-first Mac app!
