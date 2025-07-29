import React, { useState } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { useOCR } from '../../hooks/useOCR';
import { OCRResult } from '../../types/database';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export interface OCRProcessorProps {
  imageUri: string;
  onTextExtracted: (result: OCRResult) => void;
  onError?: (error: string) => void;
  autoProcess?: boolean;
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({
  imageUri,
  onTextExtracted,
  onError,
  autoProcess = false
}) => {
  const { extractCodeFromScreenshot, isProcessing, error, progress, clearError } = useOCR();
  const [extractedResult, setExtractedResult] = useState<OCRResult | null>(null);

  React.useEffect(() => {
    if (autoProcess) {
      handleExtractText();
    }
  }, [autoProcess]);

  const handleExtractText = async () => {
    clearError();
    
    try {
      const result = await extractCodeFromScreenshot(imageUri);
      
      if (result) {
        setExtractedResult(result);
        onTextExtracted(result);
      } else if (error) {
        onError?.(error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed';
      onError?.(errorMessage);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#34C759'; // Green
    if (confidence >= 60) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <StyledView className="space-y-md">
      {/* Image Preview */}
      <Card variant="outlined" padding="small">
        <StyledView className="items-center">
          <StyledImage
            source={{ uri: imageUri }}
            className="w-full h-48 rounded-md"
            resizeMode="contain"
          />
          <StyledText className="text-caption1 font-sf-pro text-gray-500 mt-sm text-center">
            Screenshot to process
          </StyledText>
        </StyledView>
      </Card>

      {/* Processing Controls */}
      <Card variant="default" padding="medium">
        <StyledView className="space-y-md">
          {/* Progress Bar */}
          {isProcessing && (
            <StyledView>
              <ProgressBar
                progress={progress}
                showLabel
                label="Processing image..."
                animated
              />
            </StyledView>
          )}

          {/* Action Button */}
          <Button
            title={isProcessing ? 'Processing...' : 'Extract Text from Screenshot'}
            onPress={handleExtractText}
            loading={isProcessing}
            disabled={isProcessing}
            leftIcon={
              !isProcessing ? (
                <Ionicons name="scan" size={20} color="white" style={{ marginRight: 8 }} />
              ) : undefined
            }
          />

          {/* Error Display */}
          {error && (
            <StyledView className="bg-red-50 border border-red-200 rounded-md p-sm">
              <StyledView className="flex-row items-center mb-xs">
                <Ionicons name="warning" size={16} color="#FF3B30" />
                <StyledText className="text-footnote font-sf-pro text-red-800 ml-xs font-semibold">
                  Processing Error
                </StyledText>
              </StyledView>
              <StyledText className="text-footnote font-sf-pro text-red-700">
                {error}
              </StyledText>
            </StyledView>
          )}
        </StyledView>
      </Card>

      {/* Results Display */}
      {extractedResult && (
        <Card variant="default" padding="medium">
          <StyledView className="space-y-sm">
            {/* Results Header */}
            <StyledView className="flex-row items-center justify-between mb-sm">
              <StyledText className="text-headline font-sf-pro text-gray-900 font-semibold">
                Extracted Text
              </StyledText>
              
              <StyledView className="flex-row items-center">
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={getConfidenceColor(extractedResult.confidence)} 
                />
                <StyledText 
                  className="text-footnote font-sf-pro ml-1 font-medium"
                  style={{ color: getConfidenceColor(extractedResult.confidence) }}
                >
                  {Math.round(extractedResult.confidence)}% ({getConfidenceLabel(extractedResult.confidence)})
                </StyledText>
              </StyledView>
            </StyledView>

            {/* Extracted Text */}
            <StyledView className="bg-gray-50 rounded-md p-sm border border-gray-200">
              <StyledText className="text-footnote font-sf-mono text-gray-800 leading-relaxed">
                {extractedResult.text || 'No text extracted'}
              </StyledText>
            </StyledView>

            {/* Stats */}
            <StyledView className="flex-row justify-between pt-sm border-t border-gray-100">
              <StyledView className="items-center">
                <StyledText className="text-caption2 font-sf-pro text-gray-500">
                  CHARACTERS
                </StyledText>
                <StyledText className="text-footnote font-sf-pro text-gray-900 font-semibold">
                  {extractedResult.text.length}
                </StyledText>
              </StyledView>
              
              <StyledView className="items-center">
                <StyledText className="text-caption2 font-sf-pro text-gray-500">
                  WORDS
                </StyledText>
                <StyledText className="text-footnote font-sf-pro text-gray-900 font-semibold">
                  {extractedResult.words?.length || 0}
                </StyledText>
              </StyledView>
              
              <StyledView className="items-center">
                <StyledText className="text-caption2 font-sf-pro text-gray-500">
                  LINES
                </StyledText>
                <StyledText className="text-footnote font-sf-pro text-gray-900 font-semibold">
                  {extractedResult.lines?.length || 0}
                </StyledText>
              </StyledView>
            </StyledView>

            {/* Low Confidence Warning */}
            {extractedResult.confidence < 60 && (
              <StyledView className="bg-orange-50 border border-orange-200 rounded-md p-sm">
                <StyledView className="flex-row items-center">
                  <Ionicons name="warning-outline" size={16} color="#FF9500" />
                  <StyledText className="text-footnote font-sf-pro text-orange-800 ml-xs">
                    Low confidence detected. Consider retaking the screenshot for better results.
                  </StyledText>
                </StyledView>
              </StyledView>
            )}
          </StyledView>
        </Card>
      )}
    </StyledView>
  );
};