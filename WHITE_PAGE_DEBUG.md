# White Page Debugging Guide

## What I Fixed

1. **Error Boundary with Inline Styles** - Now uses inline styles instead of CSS classes, so error messages will show even if CSS doesn't load
2. **Better Error Handling** - Added try-catch around React render to catch initialization errors
3. **Fallback Styles** - Added basic inline styles as fallback

## How to Debug White Page

### Step 1: Check Browser Console
1. Open production site
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for **red error messages**
5. Copy the exact error message

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for:
   - **Failed requests** (red)
   - **CSS files** - check if `index-*.css` loads (status 200)
   - **JavaScript files** - check if `index-*.js` loads (status 200)

### Step 3: Check if Error Boundary Shows
If there's an error, you should now see:
- A styled error message (even without CSS)
- Error details that can be expanded
- A "Refresh Page" button

### Step 4: Common Causes

#### 1. JavaScript Error
**Symptoms:** White page, errors in console
**Fix:** Check console for the exact error

#### 2. CSS Not Loading
**Symptoms:** Page loads but no styling
**Fix:** Check Network tab for CSS file, verify base path

#### 3. Missing Environment Variables
**Symptoms:** App loads but features don't work
**Fix:** Check Lovable environment variables

#### 4. Build Issue
**Symptoms:** Old version deployed
**Fix:** Check Lovable build logs, redeploy

## What to Check in Lovable

1. **Build Logs:**
   - Go to Lovable dashboard
   - Check latest deployment
   - Look for build errors

2. **Environment Variables:**
   - Project Settings → Environment Variables
   - Ensure all required vars are set

3. **Build Directory:**
   - Should be set to `report-viewer-plus` (if Lovable supports it)
   - Or files should be at root

## Next Steps

After deploying these changes:
1. Wait for Lovable to redeploy (2-5 minutes)
2. Hard refresh the page (Ctrl+F5)
3. Check browser console for errors
4. If still white, check Network tab for failed requests
5. Share the error message from console

The error boundary will now show a visible error message even if CSS doesn't load, which will help us identify the exact issue.

