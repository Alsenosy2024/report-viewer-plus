# Production Fix Guide - After Submodule Merge

## 🔍 Problem Identified

After converting `report-viewer-plus` from a submodule to a regular folder, Lovable (your production deployment platform) is likely not working because:

1. **Lovable is still connected to the old repository structure**
2. **The build might be looking in the wrong directory** - files are now in `report-viewer-plus/` subfolder
3. **The remote repository might need updating**

## ✅ Solution Steps

### Option 1: Update Lovable to Use Subdirectory (Recommended)

If Lovable supports build directories, configure it to build from the `report-viewer-plus` subdirectory:

1. Go to: https://lovable.dev/projects/fe7f70d3-e9ae-433a-be6a-a95b146a9889
2. Navigate to **Settings** or **Deployment Settings**
3. Look for **"Build Directory"** or **"Root Directory"** setting
4. Set it to: `report-viewer-plus`
5. Save and redeploy

### Option 2: Move Files to Root (Alternative)

If Lovable doesn't support subdirectories, we need to move the frontend files to the root:

**⚠️ This requires restructuring the repository**

### Option 3: Keep Separate Repository for Frontend

If the above options don't work, you can:

1. Keep `report-viewer-plus` as a separate repository for Lovable
2. Use the main `ailegent` repository for the agent/backend
3. Sync changes between repositories when needed

## 🔧 Immediate Fix - Check These

### 1. Verify Git Remote

```bash
git remote -v
```

If it shows `report-viewer-plus`, that's correct for Lovable.

### 2. Check Lovable Build Logs

1. Go to Lovable dashboard
2. Check the latest deployment
3. Look for build errors
4. Common issues:
   - "Cannot find package.json" → Build directory issue
   - "Module not found" → Path resolution issue
   - "Build failed" → Check specific error message

### 3. Verify File Structure

Lovable expects:
- `package.json` in root OR in configured build directory
- `vite.config.ts` in same location
- `src/` folder with React code

Current structure:
```
ailegent/
├── report-viewer-plus/    ← Files are here now
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── agent.py
└── ...
```

## 🚀 Quick Fix: Update Lovable Configuration

### Step 1: Access Lovable Settings

1. Visit: https://lovable.dev/projects/fe7f70d3-e9ae-433a-be6a-a95b146a9889
2. Click on **Settings** (gear icon)
3. Look for **Build Settings** or **Deployment Settings**

### Step 2: Configure Build Directory

If available, set:
- **Root Directory**: `report-viewer-plus`
- **Build Command**: `npm run build` (should auto-detect)
- **Output Directory**: `dist` (Vite default)

### Step 3: Manual Deploy

1. After updating settings, click **"Deploy"** or **"Redeploy"**
2. Wait for build to complete
3. Check build logs for any errors

## 🔍 Troubleshooting

### Error: "Cannot find package.json"

**Solution**: Lovable is looking in root, but files are in `report-viewer-plus/`
- Set build directory to `report-viewer-plus` in Lovable settings

### Error: "Module resolution failed"

**Solution**: Path aliases might be broken
- Check `vite.config.ts` - paths should be relative to `report-viewer-plus/`
- Verify `tsconfig.json` paths are correct

### Error: "Build succeeded but site is blank"

**Solution**: Output directory might be wrong
- Check if `dist` folder is in `report-viewer-plus/dist`
- Update Lovable output directory setting

### Lovable doesn't detect new commits

**Solution**: 
1. Check if GitHub webhook is connected
2. Try manual deploy from Lovable dashboard
3. Verify repository connection in Lovable settings

## 📝 Alternative: Create Separate Frontend Repo

If Lovable can't handle subdirectories, create a separate repository:

```bash
# Create a new repo for frontend only
cd report-viewer-plus
git init
git remote add origin <new-frontend-repo-url>
git add .
git commit -m "Initial frontend setup"
git push -u origin main
```

Then connect this new repo to Lovable.

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Lovable build completes successfully
- [ ] Production URL loads without errors
- [ ] Frontend assets load correctly (CSS, JS)
- [ ] No console errors in browser
- [ ] Voice assistant button appears
- [ ] Can connect to LiveKit

## 🆘 Still Not Working?

If none of the above works:

1. **Check Lovable Support**: Contact Lovable support with:
   - Your project ID: `fe7f70d3-e9ae-433a-be6a-a95b146a9889`
   - Error message from build logs
   - Repository structure change explanation

2. **Check Build Logs**: Share the exact error from Lovable build logs

3. **Temporary Workaround**: 
   - Keep frontend in separate repo temporarily
   - Sync manually until Lovable supports subdirectories

---

**Next Steps**: 
1. Try Option 1 first (configure build directory)
2. If that doesn't work, check Lovable build logs
3. Share the specific error message for further assistance

