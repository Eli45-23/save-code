import React, { useState, useEffect } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import { Button, LoadingState, Card, ProgressBar } from '../../components/common';
import { AddStackScreenProps } from '../../types/navigation';

// Services and Hooks
import { useAuth } from '../../hooks/useAuth';
import { useOCR } from '../../hooks/useOCR';
import { useTopicClassifier } from '../../hooks/useTopicClassifier';
import { ocrService } from '../../services/OCRService';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

type Props = AddStackScreenProps<'ProcessImage'>;

export const ProcessImageScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUri } = route.params;
  const { user } = useAuth();
  
  const [step, setStep] = useState<'ocr' | 'classify' | 'complete'>('ocr');
  const [extractedText, setExtractedText] = useState<string>('');
  const [classification, setClassification] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const { extractTextFromImage, isProcessing: ocrLoading, error: ocrError } = useOCR();
  const { classifyContent, isClassifying: classifyLoading } = useTopicClassifier();

  useEffect(() => {
    processImage();
  }, []);

  const processImage = async () => {
    if (!user || !imageUri) return;

    try {
      // Step 1: Google Cloud Vision OCR Processing
      setStep('ocr');
      setProgress(20);
      
      console.log('[ProcessImage] Using Google Cloud Vision OCR for:', imageUri);
      const extractedText = await ocrService.extractTextFromImage_Google(imageUri);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the image using Google Vision');
      }
      
      console.log('[ProcessImage] Google OCR extracted text:', extractedText.substring(0, 100) + '...');
      setExtractedText(extractedText);
      setProgress(60);

      // Step 2: AI Classification
      setStep('classify');
      const classificationResult = await classifyContent(extractedText, user.id);
      if (!classificationResult) {
        throw new Error('Failed to classify content');
      }
      setClassification(classificationResult);
      setProgress(100);

      // Step 3: Complete
      setStep('complete');
      
      // Navigate to review screen with results
      setTimeout(() => {
        navigation.navigate('ReviewAndSave', {
          imageUri,
          extractedText: extractedText,
          ocrResult: {
            text: extractedText,
            confidence: 95,
            words: [],
            lines: []
          },
          classification: classificationResult,
          ocrConfidence: 95 // Google Vision is typically high accuracy
        });
      }, 1000);

    } catch (error: any) {
      Alert.alert(
        'Processing Error',
        error.message || 'Failed to process image. Please try again.',
        [
          { text: 'Retry', onPress: processImage },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'ocr': return 'Extracting Text...';
      case 'classify': return 'Analyzing Code...';
      case 'complete': return 'Processing Complete!';
      default: return 'Processing...';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'ocr': return 'Extracting text using Google Cloud Vision API';
      case 'classify': return 'Identifying programming language and categorizing content';
      case 'complete': return 'Ready to review and save your code snippet';
      default: return 'Please wait...';
    }
  };

  if (ocrLoading || classifyLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StyledView className="flex-1 px-lg py-lg">
          {/* Header */}
          <StyledView className="flex-row items-center justify-between mb-xl">
            <Button
              title=""
              variant="ghost"
              size="medium"
              onPress={() => navigation.goBack()}
              leftIcon={<Ionicons name="arrow-back" size={24} color="#007AFF" />}
              className="min-h-[44px] w-11 h-11 p-0 items-center justify-center"
            />
            <StyledText className="text-title3 font-sf-pro-display font-semibold text-gray-900">
              Process Image
            </StyledText>
            <StyledView className="w-11" />
          </StyledView>

          {/* Image Preview */}
          <Card className="mb-xl">
            <StyledImage
              source={{ uri: imageUri }}
              className="w-full h-48 rounded-md"
              resizeMode="contain"
            />
          </Card>

          {/* Progress Section */}
          <Card className="mb-xl">
            <StyledView className="p-md">
              <StyledText className="text-title3 font-sf-pro-display font-semibold text-gray-900 mb-xs">
                {getStepTitle()}
              </StyledText>
              
              <StyledText className="text-body font-sf-pro text-gray-600 mb-md">
                {getStepDescription()}
              </StyledText>

              <ProgressBar
                progress={progress}
                showLabel={true}
                label="Processing Progress"
                animated={true}
              />
            </StyledView>
          </Card>

          {/* Status Details */}
          <Card>
            <StyledView className="p-md">
              <StyledView className="flex-row items-center mb-md">
                <Ionicons 
                  name={step === 'complete' ? 'checkmark-circle' : 'time'} 
                  size={20} 
                  color={step === 'complete' ? '#34C759' : '#007AFF'} 
                />
                <StyledText className="text-body font-sf-pro text-gray-700 ml-sm">
                  Google Vision OCR
                </StyledText>
              </StyledView>

              <StyledView className="flex-row items-center mb-md">
                <Ionicons 
                  name={step === 'complete' ? 'checkmark-circle' : step === 'classify' ? 'time' : 'ellipse-outline'} 
                  size={20} 
                  color={step === 'complete' ? '#34C759' : step === 'classify' ? '#007AFF' : '#8E8E93'} 
                />
                <StyledText className="text-body font-sf-pro text-gray-700 ml-sm">
                  AI Content Analysis
                </StyledText>
              </StyledView>

              <StyledView className="flex-row items-center">
                <Ionicons 
                  name={step === 'complete' ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={20} 
                  color={step === 'complete' ? '#34C759' : '#8E8E93'} 
                />
                <StyledText className="text-body font-sf-pro text-gray-700 ml-sm">
                  Ready for Review
                </StyledText>
              </StyledView>
            </StyledView>
          </Card>

          {/* Results Preview (if available) */}
          {extractedText && (
            <Card className="mt-xl">
              <StyledView className="p-md">
                <StyledText className="text-body font-sf-pro text-gray-900 mb-xs font-medium">
                  Extracted Text Preview:
                </StyledText>
                <StyledText className="text-footnote font-sf-pro text-gray-600" numberOfLines={3}>
                  {extractedText}
                </StyledText>
              </StyledView>
            </Card>
          )}
        </StyledView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-1 items-center justify-center px-lg">
        <Ionicons name="cloud-upload" size={64} color="#34C759" className="mb-md" />
        
        <StyledText className="text-title2 font-sf-pro-display text-gray-900 font-bold text-center mb-md">
          Processing Complete!
        </StyledText>
        
        <StyledText className="text-body font-sf-pro text-gray-500 text-center mb-xl">
          Your code has been extracted and analyzed successfully.
        </StyledText>

        <Button
          title="Review & Save Code"
          variant="primary"
          onPress={() => navigation.navigate('ReviewAndSave', {
            imageUri,
            extractedText,
            ocrResult: {
              text: extractedText,
              confidence: 95,
              words: [],
              lines: []
            },
            classification,
            ocrConfidence: 95 // Default confidence
          })}
          className="w-full"
        />

        <Button
          variant="ghost"
          onPress={() => navigation.goBack()}
          className="mt-lg"
        >
          Take Another Photo
        </Button>
      </StyledView>
    </SafeAreaView>
  );
};