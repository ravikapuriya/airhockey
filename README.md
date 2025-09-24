# Air Hockey - Phaser 3 Game

A mobile-optimized air hockey game built with Phaser 3, TypeScript, and Vite.

## Features

- **Mobile Portrait Mode**: Optimized for 1080x1920 resolution
- **Scene-Based Architecture**: Boot → Menu → Customize → Game flow
- **Customization System**: Paddle and puck color customization
- **Match Modes**: Single-player (AI) and two-player modes
- **Best-of-N Matches**: Configurable match scoring system
- **Skin System**: JSON-based visual themes with asset fallbacks
- **Touch Controls**: Mobile-friendly UI with nineslice buttons

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm start
```
Opens development server at http://localhost:5173

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Architecture

### Core Systems
- **SkinSystem**: Visual theme management from JSON configurations
- **MatchManager**: Best-of-N match scoring logic
- **TextureFactory**: Procedural texture generation
- **AudioSystem**: Sound effect management
- **Save**: Persistent configuration with SDK/localStorage support

### Scenes
- **BootScene**: Initial loading and setup
- **MenuScene**: Main menu with game mode selection
- **CustomizeScene**: Paddle and puck color customization
- **GameScene**: Main gameplay with physics and collision detection

### Game Objects
- Physics-enabled table, puck, and player mallets
- Collision detection for walls, goals, and game objects
- AI opponent for single-player mode

## TypeScript

Type checking (no emit):
```bash
tsc --noEmit
```

## Project Structure
```
src/
├── core/          # Core game systems
├── scenes/        # Game scenes
├── ui/            # UI components
├── types.d.ts     # Type definitions
└── main.ts        # Game configuration

public/
└── skins/         # Skin JSON configurations

assets/
├── sprites/       # UI button assets
└── skins/         # Skin-specific image assets
```

## Skin System

Skins are configured via JSON files in `public/skins/` with optional image assets in `assets/skins/{skinname}/`. The system supports:
- Custom colors and physics properties
- Image assets (table.png, puck.png, mallet.png)
- Automatic fallback to procedural generation

## License

MIT