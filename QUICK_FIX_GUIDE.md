# Quick Fix Guide - Save Code App

## Two Issues to Fix

### 1. Enable Google Cloud Vision API (2 minutes)
1. Click this link: https://console.developers.google.com/apis/api/vision.googleapis.com/overview?project=884391446620
2. Click the blue "ENABLE" button
3. Wait 2-3 minutes for it to activate
4. Done! OCR will now use real text extraction instead of mock data

### 2. Fix Screenshot Upload in Supabase (5 minutes)
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `/supabase/fix_storage_rls_policies.sql`
4. Click "Run" 
5. Done! Screenshots will now upload successfully

## How to Test
1. Open the app
2. Take or select a photo with code
3. Check the logs:
   - Should NOT see "Falling back to mock OCR"
   - Should NOT see "Screenshot upload error"
4. The code should be extracted and saved successfully

## If You Still Have Issues
- For Google Vision: Check if the API key is valid in Google Cloud Console
- For Storage: Run the diagnostic query included in the SQL file to debug

That's it! Your app should now work perfectly. 🎉