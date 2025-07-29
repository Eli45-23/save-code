import { useState, useCallback, useRef, useEffect } from 'react';
import { ocrService, OCRService } from '../services/OCRService';
import { OCRResult } from '../types/database';

export interface UseOCRReturn {
  extractTextFromImage: (imageUri: string) => Promise<OCRResult | null>;
  extractCodeFromScreenshot: (imageUri: string) => Promise<OCRResult | null>;
  processBatch: (imageUris: string[]) => Promise<OCRResult[]>;
  isProcessing: boolean;
  error: string | null;
  progress: number;
  clearError: () => void;
  cancelProcessing: () => void;
}

/**
 * React hook for OCR operations with state management
 */
export const useOCR = (): UseOCRReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef<boolean>(false);

  // Initialize OCR service on mount
  useEffect(() => {
    const initializeOCR = async () => {
      try {
        await ocrService.initialize();
      } catch (err) {
        setError('Failed to initialize OCR service');
        console.error('OCR initialization error:', err);
      }
    };

    initializeOCR();

    // Cleanup on unmount
    return () => {
      ocrService.terminate();
    };
  }, []);

  const extractTextFromImage = useCallback(async (imageUri: string): Promise<OCRResult | null> => {
    if (isProcessing) {
      console.warn('OCR is already processing. Please wait.');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    cancelRef.current = false;

    try {
      setProgress(25);
      
      if (cancelRef.current) {
        return null;
      }

      setProgress(50);
      const result = await ocrService.extractTextFromImage(imageUri);
      
      if (cancelRef.current) {
        return null;
      }

      setProgress(100);
      
      // Validate result
      if (!result.text || result.text.trim().length === 0) {
        setError('No text found in image. Please try a clearer image.');
        return null;
      }

      if (result.confidence < 30) {
        setError('Low confidence in text recognition. Consider retaking the image.');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
      setError(errorMessage);
      console.error('OCR extraction error:', err);
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [isProcessing]);

  const extractCodeFromScreenshot = useCallback(async (imageUri: string): Promise<OCRResult | null> => {
    if (isProcessing) {
      console.warn('OCR is already processing. Please wait.');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    cancelRef.current = false;

    try {
      setProgress(20);
      
      if (cancelRef.current) {
        return null;
      }

      setProgress(40);
      
      // Use the enhanced code extraction method
      const result = await ocrService.extractCodeFromScreenshot(imageUri);
      
      if (cancelRef.current) {
        return null;
      }

      setProgress(80);

      // Enhanced validation for code
      if (!result.text || result.text.trim().length === 0) {
        setError('No code found in screenshot. Please ensure the image contains clear, readable code.');
        return null;
      }

      // Check if it looks like code (contains common programming characters)
      const codePattern = /[{}();=<>[\]]/;
      if (!codePattern.test(result.text)) {
        setError('The extracted text doesn\'t appear to be code. Please verify your screenshot.');
      }

      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code OCR processing failed';
      setError(errorMessage);
      console.error('Code OCR extraction error:', err);
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [isProcessing]);

  const processBatch = useCallback(async (imageUris: string[]): Promise<OCRResult[]> => {
    if (isProcessing) {
      console.warn('OCR is already processing. Please wait.');
      return [];
    }

    if (imageUris.length === 0) {
      return [];
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    cancelRef.current = false;

    try {
      const results: OCRResult[] = [];
      const total = imageUris.length;

      for (let i = 0; i < imageUris.length; i++) {
        if (cancelRef.current) {
          break;
        }

        const uri = imageUris[i];
        setProgress((i / total) * 100);

        try {
          const result = await ocrService.extractTextFromImage(uri);
          results.push(result);
        } catch (err) {
          console.error(`Failed to process image ${i + 1}:`, err);
          // Add empty result for failed images
          results.push({
            text: '',
            confidence: 0,
            words: [],
            lines: []
          });
        }
      }

      setProgress(100);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch OCR processing failed';
      setError(errorMessage);
      console.error('Batch OCR error:', err);
      return [];
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [isProcessing]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancelProcessing = useCallback(() => {
    cancelRef.current = true;
    setIsProcessing(false);
    setProgress(0);
  }, []);

  return {
    extractTextFromImage,
    extractCodeFromScreenshot,
    processBatch,
    isProcessing,
    error,
    progress,
    clearError,
    cancelProcessing
  };
};

/**
 * Hook for OCR with automatic retry logic
 */
export const useOCRWithRetry = (maxRetries = 3) => {
  const { extractTextFromImage, extractCodeFromScreenshot, ...rest } = useOCR();

  const extractWithRetry = useCallback(async (imageUri: string): Promise<OCRResult | null> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await extractTextFromImage(imageUri);
        if (result && result.confidence > 30) {
          return result;
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
    return null;
  }, [extractTextFromImage, maxRetries]);

  const extractCodeWithRetry = useCallback(async (imageUri: string): Promise<OCRResult | null> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await extractCodeFromScreenshot(imageUri);
        if (result && result.confidence > 30) {
          return result;
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
    return null;
  }, [extractCodeFromScreenshot, maxRetries]);

  return {
    ...rest,
    extractTextFromImage: extractWithRetry,
    extractCodeFromScreenshot: extractCodeWithRetry
  };
};