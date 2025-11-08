# Build Configuration for Lovable

## Setup

The root directory now has build configuration files that delegate to `report-viewer-plus/`:

- **`package.json`** - Root package.json with scripts that build from `report-viewer-plus/`
- **`vite.config.ts`** - Vite config that sets `root: './report-viewer-plus'` to build from subdirectory
- **`index.html`** - Root index.html that references the source files

## How It Works

1. **Lovable builds from root** - Lovable detects `package.json` and `vite.config.ts` at root
2. **Vite config points to subdirectory** - `vite.config.ts` sets `root: './report-viewer-plus'`
3. **Build output goes to root `dist/`** - Output is placed in root `dist/` directory for Lovable to serve

## Build Process

When Lovable runs `npm run build`:
1. Script changes to `report-viewer-plus/` directory
2. Installs dependencies in `report-viewer-plus/node_modules/`
3. Runs build from `report-viewer-plus/`
4. Copies output to root `dist/` directory

## File Structure

```
ailegent/
├── package.json          # Root build config
├── vite.config.ts        # Points to report-viewer-plus
├── index.html            # Root HTML entry point
├── dist/                 # Build output (for Lovable)
└── report-viewer-plus/   # Actual frontend code
    ├── src/
    ├── package.json
    └── vite.config.ts
```

## For Local Development

Run from root:
```bash
npm run dev      # Starts dev server from report-viewer-plus
npm run build    # Builds from report-viewer-plus to root dist/
```

Or work directly in `report-viewer-plus/`:
```bash
cd report-viewer-plus
npm run dev
npm run build
```

