# Production Crash Fix Guide

## Common Crash Causes After Submodule Merge

### 1. Missing Environment Variables
The app might be crashing because environment variables are not set in production.

**Check in Lovable:**
1. Go to Project Settings → Environment Variables
2. Ensure these are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_LIVEKIT_URL` (if using voice assistant)

### 2. Missing Dependencies
Some dependencies might not be installed.

**Fix:**
```bash
cd report-viewer-plus
npm install
```

### 3. Path Resolution Issues
The `@/` alias might not be resolving correctly in production.

**Check:**
- `vite.config.ts` has correct alias configuration
- `tsconfig.json` has correct paths

### 4. Missing Components
Some components might be imported but not found.

**Common missing:**
- `VoiceAssistantWidget` - should exist in `src/components/voice/`
- `useToast` hook - should exist in `src/hooks/use-toast.ts`

### 5. Browser Console Errors
Check the browser console for specific errors:
- Open production site
- Press F12 → Console tab
- Look for red error messages
- Share the exact error message

## Quick Fixes

### Fix 1: Add Error Boundary
Add error boundary to catch React errors:

```tsx
// src/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}
```

### Fix 2: Check for Null/Undefined
Wrap potentially failing code in try-catch or null checks.

### Fix 3: Verify All Imports
Ensure all imported files exist:
- `VoiceAssistantWidget.tsx` exists
- `use-toast.ts` exists
- All UI components exist

## Debugging Steps

1. **Check Browser Console**
   - Open production site
   - F12 → Console
   - Copy all red errors

2. **Check Network Tab**
   - F12 → Network
   - Look for failed requests (red)
   - Check if assets are loading

3. **Check Build Logs**
   - Go to Lovable dashboard
   - Check latest deployment logs
   - Look for build errors

4. **Test Locally**
   ```bash
   cd report-viewer-plus
   npm run build
   npm run preview
   ```
   - If local build works, issue is with Lovable config
   - If local build fails, fix the code first

## Most Likely Issues

Based on the code structure, most likely causes:

1. **Missing `useToast` hook** - Check if `src/hooks/use-toast.ts` exists
2. **Missing Supabase environment variables** - Check Lovable env vars
3. **Path alias not resolving** - Check vite.config.ts
4. **Missing component files** - Verify all imports resolve

## Next Steps

1. Share the exact error message from browser console
2. Share Lovable build logs if available
3. Check if files exist that are being imported

