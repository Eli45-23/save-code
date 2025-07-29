import { useState, useCallback } from 'react';
import { TopicClassifierService } from '../services/TopicClassifierService';
import { ClassificationResult } from '../types/database';
import { supabaseHelpers } from '../lib/supabase';

export interface UseTopicClassifierReturn {
  classifyContent: (text: string, userId: string) => Promise<ClassificationResult | null>;
  isClassifying: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * React hook for topic classification operations
 */
export const useTopicClassifier = (): UseTopicClassifierReturn => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classifyContent = useCallback(async (
    text: string,
    userId: string
  ): Promise<ClassificationResult | null> => {
    if (isClassifying) {
      console.warn('Classification is already in progress');
      return null;
    }

    if (!text || text.trim().length === 0) {
      setError('No text provided for classification');
      return null;
    }

    setIsClassifying(true);
    setError(null);

    try {
      // Perform classification
      const result = await TopicClassifierService.classifyContent(text, userId);
      
      // Record analytics
      await supabaseHelpers.recordAnalytics('content_classified', {
        language: result.language.language,
        topic: result.topic.primaryTopic,
        confidence: result.language.confidence,
        similarFilesFound: result.similarFiles.length
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Classification failed';
      setError(errorMessage);
      console.error('Topic classification error:', err);
      return null;
    } finally {
      setIsClassifying(false);
    }
  }, [isClassifying]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    classifyContent,
    isClassifying,
    error,
    clearError
  };
};

/**
 * Hook for language detection only
 */
export const useLanguageDetector = () => {
  const detectLanguage = useCallback((text: string) => {
    return TopicClassifierService.detectLanguage(text);
  }, []);

  const generateFileName = useCallback((text: string, language?: string) => {
    return TopicClassifierService.generateFileName(text, language);
  }, []);

  return {
    detectLanguage,
    generateFileName
  };
};

/**
 * Hook for finding similar files
 */
export const useSimilarityMatcher = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findSimilarFiles = useCallback(async (
    text: string,
    userId: string,
    threshold: number = 0.3
  ) => {
    setIsSearching(true);
    setError(null);

    try {
      const similarFiles = await TopicClassifierService.findSimilarFiles(
        text, 
        userId, 
        threshold
      );
      
      return similarFiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Similarity search failed';
      setError(errorMessage);
      console.error('Similarity search error:', err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    findSimilarFiles,
    isSearching,
    error,
    clearError
  };
};