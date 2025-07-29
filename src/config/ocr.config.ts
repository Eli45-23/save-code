/**
 * OCR Service Configuration
 * 
 * This file centralizes OCR configuration to improve security and maintainability.
 * In production, these values should come from environment variables.
 */

// For development, you can hardcode the API key here temporarily
// For production, use environment variables
const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY || 'AIzaSyAtUhUWZFfDNIfK9ulS53nANr4VfegSy34';

export const ocrConfig = {
  google: {
    apiKey: GOOGLE_CLOUD_VISION_API_KEY,
    apiUrl: `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
    
    // Feature configuration
    features: {
      documentTextDetection: {
        type: 'DOCUMENT_TEXT_DETECTION',
        maxResults: 1
      },
      textDetection: {
        type: 'TEXT_DETECTION',
        maxResults: 1
      }
    },
    
    // Request configuration
    requestConfig: {
      timeout: 30000, // 30 seconds
      retries: 2,
      retryDelay: 1000 // 1 second
    }
  },
  
  // Fallback configuration
  fallback: {
    enabled: true,
    logErrors: true,
    mockDelay: 2000 // Simulate processing time in mock mode
  },
  
  // Image preprocessing configuration
  preprocessing: {
    maxWidth: 1200,
    quality: 0.8,
    format: 'JPEG' as const
  },
  
  // Code-specific preprocessing
  codePreprocessing: {
    maxWidth: 1000,
    quality: 0.9,
    format: 'PNG' as const // PNG is better for text
  }
};

/**
 * Check if Google Cloud Vision is properly configured
 */
export const isGoogleVisionConfigured = (): boolean => {
  return !!(ocrConfig.google.apiKey && 
           ocrConfig.google.apiKey !== 'YOUR_API_KEY_HERE' &&
           ocrConfig.google.apiKey.length > 20);
};

/**
 * Get the appropriate OCR feature type based on content
 */
export const getOCRFeatureType = (isCodeContent: boolean = true) => {
  return isCodeContent 
    ? ocrConfig.google.features.documentTextDetection 
    : ocrConfig.google.features.textDetection;
};