# Google Cloud Vision API Setup Guide

## Current Issue
The app is attempting to use Google Cloud Vision API for OCR, but the API is not enabled in the Google Cloud Project. The error shows:

```
Cloud Vision API has not been used in project 884391446620 before or it is disabled.
```

## Solution Steps

### 1. Enable the Google Cloud Vision API

1. Go to the activation URL provided in the error:
   https://console.developers.google.com/apis/api/vision.googleapis.com/overview?project=884391446620

2. Click "Enable API" button

3. Wait 2-3 minutes for the API to be fully activated

### 2. Verify API Key and Permissions

The current API key in the code is: `AIzaSyAtUhUWZFfDNIfK9ulS53nANr4VfegSy34`

To verify this key:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Check if this API key exists and has the proper restrictions
3. Ensure the key has access to Cloud Vision API

### 3. (Optional) Create a New API Key

If the existing key doesn't work:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click "Create Credentials" > "API Key"
3. Restrict the key to:
   - Cloud Vision API only
   - (Optional) Add IP/app restrictions for security
4. Update the key in `/src/services/OCRService.ts` line 6

### 4. Security Recommendations

**IMPORTANT**: The current implementation has security issues:

1. **API Key Exposure**: The API key is hardcoded in the source code. This should be moved to environment variables.

2. **Recommended Changes**:
   ```typescript
   // Instead of:
   const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyBR-Hk5VwtflevF99q7Oo-v4qvqXVQnVJM';
   
   // Use:
   const GOOGLE_CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
   ```

3. **For Expo/React Native**, use:
   - Create an `.env` file (add to .gitignore)
   - Use `expo-constants` or `react-native-dotenv` to load environment variables
   - Or use Expo's environment variables in `app.config.js`

### 5. Current Fallback Behavior

The app has good error handling:
- When Google Cloud Vision fails, it falls back to mock OCR
- This allows the app to continue functioning while the API is being set up
- The mock returns sample code snippets for testing

### 6. Testing After Setup

1. Enable the API as described above
2. Wait 2-3 minutes
3. Test the app again - it should now use real OCR instead of mock data
4. Check logs for "[Google OCR] Text extraction completed" instead of "Falling back to mock OCR"

## Alternative Solutions

If you don't want to use Google Cloud Vision:

1. **Apple's Vision Framework** (iOS only):
   - Use `react-native-vision-camera` with text recognition
   - No API key needed, runs on-device

2. **ML Kit** (Google's on-device solution):
   - Use `@react-native-ml-kit/text-recognition`
   - No API key needed, works offline

3. **Tesseract.js**:
   - JavaScript-based OCR that runs in the app
   - No API key needed, but larger app size

4. **AWS Textract**:
   - Alternative cloud-based OCR service
   - Requires AWS account setup

## Cost Considerations

Google Cloud Vision API pricing (as of 2024):
- First 1,000 units/month: Free
- After that: $1.50 per 1,000 units
- Each image processed = 1 unit

For a personal project, the free tier should be sufficient.