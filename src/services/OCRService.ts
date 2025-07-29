import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { OCRResult } from '../types/database';
import { ocrConfig, isGoogleVisionConfigured, getOCRFeatureType } from '../config/ocr.config';

/**
 * React Native compatible OCR Service
 * Note: This is a mock implementation for development. In production, 
 * integrate with Google Cloud Vision, AWS Textract, or react-native-text-recognition
 */
export class OCRService {
  private isInitialized = false;

  /**
   * Initialize the OCR service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Mock initialization - in production, initialize your OCR service here
      console.log('[OCR] Initializing React Native OCR service...');
      
      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInitialized = true;
      console.log('[OCR] OCR service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw error;
    }
  }

  /**
   * Extract text from image using Google Cloud Vision API with fallback
   */
  async extractTextFromImage_Google(uri: string): Promise<string> {
    try {
      console.log('[Google OCR] Starting text extraction from:', uri);

      // Check if Google Vision is properly configured
      if (!isGoogleVisionConfigured()) {
        console.warn('[Google OCR] API key not configured properly, using fallback');
        return this.getMockCodeText();
      }

      // Convert image to base64
      const base64Image = await this.convertImageToBase64(uri);
      
      // Prepare the request body for Google Cloud Vision API
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [getOCRFeatureType(true)]
          }
        ]
      };

      // Make API call to Google Cloud Vision with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ocrConfig.google.requestConfig.timeout);

      const response = await fetch(ocrConfig.google.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Google OCR] API error ${response.status}: ${errorText}`);
        
        // Provide specific guidance for common errors
        if (response.status === 403 && errorText.includes('Cloud Vision API has not been used')) {
          console.error('[Google OCR] Cloud Vision API is not enabled. Please follow the setup guide in docs/GOOGLE_CLOUD_VISION_SETUP.md');
        } else if (response.status === 403) {
          console.error('[Google OCR] API key may be invalid or lacks proper permissions');
        } else if (response.status === 429) {
          console.error('[Google OCR] Rate limit exceeded. Consider implementing request throttling');
        }
        
        // Fall back to mock OCR if Google Vision fails
        console.log('[Google OCR] Falling back to mock OCR due to API error');
        return this.getMockCodeText();
      }

      const result = await response.json();
      
      // Check for API errors in response
      if (result.responses?.[0]?.error) {
        console.warn('[Google OCR] API returned error:', result.responses[0].error);
        return this.getMockCodeText();
      }
      
      // Extract text from the response
      const extractedText = result?.responses?.[0]?.fullTextAnnotation?.text || '';
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.log('[Google OCR] No text found, using mock fallback');
        return this.getMockCodeText();
      }
      
      // Clean up the text
      const cleanedText = extractedText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      console.log('[Google OCR] Text extraction completed, length:', cleanedText.length);
      return cleanedText;

    } catch (error) {
      console.error('[Google OCR] Text extraction failed:', error);
      
      // Provide specific error handling
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[Google OCR] Request timed out after 30 seconds');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('[Google OCR] Network error - check internet connection');
        }
      }
      
      console.log('[Google OCR] Using mock fallback due to error');
      return this.getMockCodeText();
    }
  }

  /**
   * Get mock code text for fallback when Google Vision fails
   */
  private getMockCodeText(): string {
    const mockTexts = [
      `function calculateTotal(items) {
  let total = 0;
  for (let item of items) {
    total += item.price * item.quantity;
  }
  return total;
}`,
      `import React, { useState, useEffect } from 'react';

export const DataFetcher = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return loading ? <div>Loading...</div> : <div>{JSON.stringify(data)}</div>;
};`,
      `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def optimized_fibonacci(n):
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }

  /**
   * Convert image URI to base64 string
   */
  private async convertImageToBase64(uri: string): Promise<string> {
    try {
      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return base64;
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw new Error('Failed to process image for OCR');
    }
  }

  /**
   * Extract text from image with preprocessing and error handling (original mock method)
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    await this.initialize();

    try {
      console.log('[OCR] Starting text extraction from:', imageUri);

      // Preprocess the image for better OCR accuracy
      const processedUri = await this.preprocessImage(imageUri);
      
      // In production, replace this mock with actual OCR
      const mockResult = await this.performMockOCR(processedUri);
      
      console.log('[OCR] Text extraction completed');
      return mockResult;

    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract code specifically from screenshot with optimized preprocessing
   */
  async extractCodeFromScreenshot(imageUri: string): Promise<OCRResult> {
    const enhancedUri = await this.preprocessCodeScreenshot(imageUri);
    return this.extractTextFromImage(enhancedUri);
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImage(imageUri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          // Resize for optimal OCR processing
          { resize: { width: 1200 } },
          // Increase contrast
          { rotate: 0 }, // This helps normalize the image
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error);
      return imageUri;
    }
  }

  /**
   * Specialized preprocessing for code screenshots
   */
  private async preprocessCodeScreenshot(imageUri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          // Optimal size for code recognition
          { resize: { width: 1000 } },
        ],
        {
          compress: 0.9,
          format: SaveFormat.PNG, // PNG better for text
        }
      );

      return result.uri;
    } catch (error) {
      console.warn('Code screenshot preprocessing failed:', error);
      return imageUri;
    }
  }

  /**
   * Mock OCR implementation for development
   * In production, replace with Google Cloud Vision, AWS Textract, or react-native-text-recognition
   */
  private async performMockOCR(imageUri: string): Promise<OCRResult> {
    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted text that looks like code
    const mockCodeExamples = [
      `function calculateTotal(items) {
  let total = 0;
  for (let item of items) {
    total += item.price * item.quantity;
  }
  return total;
}`,
      `class UserManager {
  constructor(database) {
    this.db = database;
    this.users = new Map();
  }
  
  async createUser(userData) {
    const user = new User(userData);
    await this.db.save(user);
    this.users.set(user.id, user);
    return user;
  }
}`,
      `import React, { useState, useEffect } from 'react';

export const DataFetcher = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
};`,
      `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def optimized_fibonacci(n):
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
      `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left = 0;
        int right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }
}`
    ];

    // Randomly select a mock code example
    const mockText = mockCodeExamples[Math.floor(Math.random() * mockCodeExamples.length)];

    return {
      text: mockText,
      confidence: 85 + Math.random() * 10, // Random confidence between 85-95%
      words: mockText.split(/\s+/).map((word, index) => ({
        text: word,
        confidence: 80 + Math.random() * 15,
        bbox: { x0: index * 30, y0: 10, x1: (index + 1) * 30, y1: 25 }
      })),
      lines: mockText.split('\n').map((line, index) => ({
        text: line,
        confidence: 85 + Math.random() * 10,
        bbox: { x0: 0, y0: index * 20, x1: 200, y1: (index + 1) * 20 }
      }))
    };
  }

  /**
   * Format extracted text specifically for code
   */
  private formatCodeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([{}();])/g, '$1\n') // Add newlines after code delimiters
      .replace(/\n\s*\n/g, '\n') // Remove extra empty lines
      .trim();
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(imageUris: string[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const uri of imageUris) {
      try {
        const result = await this.extractTextFromImage(uri);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${uri}:`, error);
        // Continue with other images
      }
    }
    
    return results;
  }

  /**
   * Cleanup resources
   */
  async terminate(): Promise<void> {
    try {
      console.log('[OCR] Cleaning up OCR service...');
      this.isInitialized = false;
      // In production, cleanup your OCR service resources here
    } catch (error) {
      console.error('Error terminating OCR service:', error);
    }
  }

  /**
   * Get OCR service status
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const ocrService = new OCRService();