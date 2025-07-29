import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import { Button, Card, Tag, TextInput as CustomTextInput, ConfidenceBadge, ImageCarousel } from '../../components/common';
import { AnalysisResultCard } from '../../components/features';
import { AddStackScreenProps } from '../../types/navigation';

// Services and Hooks
import { useAuth } from '../../hooks/useAuth';
import { SaveCodeService } from '../../services/SaveCodeService';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);
const StyledTextInput = styled(TextInput);

type Props = AddStackScreenProps<'ReviewAndSave'>;

export const ReviewAndSaveScreen: React.FC<Props> = ({ navigation, route }) => {
  const { 
    imageUri, 
    imageUris, 
    extractedText, 
    classification, 
    ocrConfidence,
    isMultiImage 
  } = route.params;
  const { user } = useAuth();
  
  // Determine if this is multi-image mode
  const isMultiple = isMultiImage && imageUris && imageUris.length > 1;
  const images = isMultiple ? imageUris : (imageUri ? [imageUri] : []);
  
  const [title, setTitle] = useState(classification?.topic?.primaryTopic || (isMultiple ? 'Code Sequence' : 'Code Snippet'));
  const [description, setDescription] = useState('');
  const [editedText, setEditedText] = useState(extractedText || '');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSave = async () => {
    if (!user || (isMultiple && (!imageUris || imageUris.length === 0)) || (!isMultiple && !imageUri)) {
      Alert.alert('Error', 'Please ensure images are selected.');
      return;
    }

    if (!isMultiple && !editedText.trim()) {
      Alert.alert('Error', 'Please ensure text content is not empty.');
      return;
    }

    setSaving(true);
    try {
      if (isMultiple && imageUris) {
        // Handle multiple images with batch processing
        const result = await SaveCodeService.batchProcessAndOrganize(
          imageUris,
          user.id,
          {
            customTitle: title.trim(),
            customTags,
            enableIntelligentOrganization: true,
            organizationStrategy: 'balanced'
          }
        );

        Alert.alert(
          'Success!',
          `${result.results.length} screenshots processed successfully. ${result.organizationSummary.successfulMerges} were intelligently grouped.`,
          [
            {
              text: 'View Files',
              onPress: () => {
                navigation.getParent()?.navigate('Files', { screen: 'FilesList' });
              }
            },
            {
              text: 'Add More',
              onPress: () => navigation.navigate('Camera')
            }
          ]
        );
      } else {
        // Handle single image
        const result = await SaveCodeService.saveCodeFromScreenshot({
          imageUri: imageUri!,
          extractedText: editedText,
          userId: user.id,
          title: title.trim(),
          description: description.trim(),
          customTags,
          ocrConfidence: ocrConfidence || 0
        });

        Alert.alert(
          'Success!',
          `Your code snippet has been saved successfully.${result.wasAppended ? ' Content was added to an existing file.' : ' A new file was created.'}`,
          [
            {
              text: 'View File',
              onPress: () => {
                navigation.getParent()?.navigate('Files', {
                  screen: 'FileDetail',
                  params: { fileId: result.fileId, fileName: result.title || 'Untitled' }
                });
              }
            },
            {
              text: 'Add More',
              onPress: () => navigation.navigate('Camera')
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Save Failed',
        error.message || 'Failed to save your code snippet(s). Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const addCustomTag = () => {
    Alert.prompt(
      'Add Tag',
      'Enter a custom tag for this code snippet:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (tagName) => {
            if (tagName && tagName.trim() && !customTags.includes(tagName.trim())) {
              setCustomTags([...customTags, tagName.trim()]);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StyledScrollView className="flex-1">
        <StyledView className="px-lg py-lg">
          {/* Header */}
          <StyledView className="flex-row items-center justify-between mb-xl">
            <Button
              title=""
              variant="ghost"
              size="medium"
              onPress={() => navigation.goBack()}
              className="min-h-[44px] w-11 h-11 p-0 items-center justify-center"
              leftIcon={<Ionicons name="arrow-back" size={24} color="#007AFF" />}
            />
            <StyledText className="text-title3 font-sf-pro-display font-semibold text-gray-900">
              Review & Save
            </StyledText>
            <StyledView className="w-11" />
          </StyledView>

          {/* Image Preview */}
          <Card className="mb-xl" padding="none">
            {isMultiple ? (
              <StyledView className="p-md">
                <StyledView className="flex-row items-center justify-between mb-sm">
                  <StyledText className="text-body font-sf-pro text-gray-900 font-medium">
                    Screenshots ({images.length})
                  </StyledText>
                  <StyledView className="bg-blue-100 rounded-full px-2 py-1">
                    <StyledText className="text-caption2 font-sf-pro text-blue-700 font-medium">
                      Batch Mode
                    </StyledText>
                  </StyledView>
                </StyledView>
                <ImageCarousel 
                  images={images}
                  height={160}
                />
              </StyledView>
            ) : (
              <StyledImage
                source={{ uri: imageUri }}
                className="w-full h-40 rounded-md"
                resizeMode="contain"
              />
            )}
          </Card>

          {/* AI Analysis Results */}
          <AnalysisResultCard 
            classification={classification}
            ocrConfidence={ocrConfidence}
          />

          {/* Title Input */}
          <Card className="mb-xl">
            <StyledView className="p-md">
              <StyledText className="text-body font-sf-pro text-gray-900 mb-xs font-medium">
                Title
              </StyledText>
              <CustomTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a title for your code snippet"
                className="mb-0"
              />
            </StyledView>
          </Card>

          {/* Description Input */}
          <Card className="mb-xl">
            <StyledView className="p-md">
              <StyledText className="text-body font-sf-pro text-gray-900 mb-xs font-medium">
                Description (Optional)
              </StyledText>
              <StyledTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description or notes about this code..."
                multiline
                numberOfLines={3}
                className="border border-gray-200 rounded-md p-md text-body font-sf-pro text-gray-900"
                style={{ textAlignVertical: 'top' }}
              />
            </StyledView>
          </Card>

          {/* Extracted Text / Batch Processing Info */}
          {!isMultiple ? (
            <Card className="mb-xl">
              <StyledView className="p-md">
                <StyledView className="flex-row items-center justify-between mb-xs">
                  <StyledText className="text-body font-sf-pro text-gray-900 font-medium">
                    Extracted Code
                  </StyledText>
                  {ocrConfidence && (
                    <ConfidenceBadge 
                      confidence={ocrConfidence} 
                      size="small"
                    />
                  )}
                </StyledView>
                
                <StyledTextInput
                  value={editedText}
                  onChangeText={setEditedText}
                  placeholder="Extracted text will appear here..."
                  multiline
                  numberOfLines={8}
                  className="border border-gray-200 rounded-md p-md text-footnote font-sf-mono text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                />
                
                <StyledText className="text-caption1 font-sf-pro text-gray-500 mt-xs">
                  You can edit the extracted text above to correct any OCR errors.
                </StyledText>
              </StyledView>
            </Card>
          ) : (
            <Card className="mb-xl" variant="filled">
              <StyledView className="p-md">
                <StyledView className="flex-row items-center mb-sm">
                  <StyledView className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-sm">
                    <Ionicons name="flash" size={16} color="#2563EB" />
                  </StyledView>
                  <StyledText className="text-body font-sf-pro text-gray-900 font-medium">
                    Batch Processing
                  </StyledText>
                </StyledView>
                
                <StyledText className="text-footnote font-sf-pro text-gray-700 mb-sm">
                  All {images.length} screenshots will be processed with OCR and intelligently organized. 
                  The app will automatically detect similar content and group related images together.
                </StyledText>
                
                <StyledView className="bg-white rounded-lg p-sm border border-blue-200">
                  <StyledView className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <StyledText className="text-caption1 font-sf-pro text-gray-600 ml-xs font-medium">
                      Smart grouping and text extraction will be applied automatically
                    </StyledText>
                  </StyledView>
                </StyledView>
              </StyledView>
            </Card>
          )}

          {/* Tags Section */}
          <Card className="mb-xl">
            <StyledView className="p-md">
              <StyledView className="flex-row items-center justify-between mb-md">
                <StyledText className="text-body font-sf-pro text-gray-900 font-medium">
                  Tags & Classification
                </StyledText>
                <Button
                  title="Add Tag"
                  variant="ghost"
                  size="small"
                  onPress={addCustomTag}
                  className="px-md py-sm min-h-[44px]"
                  leftIcon={<Ionicons name="add" size={16} color="#007AFF" />}
                />
              </StyledView>

              {/* Auto-detected section */}
              {(classification?.language?.language || (classification?.topic?.frameworks && classification.topic.frameworks.length > 0)) && (
                <StyledView className="mb-lg">
                  <StyledText className="text-caption1 font-sf-pro text-gray-600 mb-sm font-medium">
                    AUTO-DETECTED
                  </StyledText>
                  <StyledView className="flex-row flex-wrap">
                    {classification?.language?.language && (
                      <Tag
                        text={classification.language.language}
                        variant="primary"
                        className="mr-xs mb-xs"
                      />
                    )}
                    
                    {classification?.topic?.frameworks?.map((framework: string) => (
                      <Tag
                        key={framework}
                        text={framework}
                        variant="secondary"
                        className="mr-xs mb-xs"
                      />
                    ))}
                  </StyledView>
                </StyledView>
              )}

              {/* Custom tags section */}
              <StyledView>
                <StyledView className="flex-row items-center justify-between mb-sm">
                  <StyledText className="text-caption1 font-sf-pro text-gray-600 font-medium">
                    CUSTOM TAGS
                  </StyledText>
                  {customTags.length > 0 && (
                    <StyledText className="text-caption2 font-sf-pro text-gray-500">
                      {customTags.length} tag{customTags.length !== 1 ? 's' : ''}
                    </StyledText>
                  )}
                </StyledView>
                
                {customTags.length > 0 ? (
                  <StyledView className="flex-row flex-wrap">
                    {customTags.map((tag) => (
                      <Tag
                        key={tag}
                        text={tag}
                        variant="outline"
                        onRemove={() => removeTag(tag)}
                        className="mr-xs mb-xs"
                      />
                    ))}
                  </StyledView>
                ) : (
                  <StyledView className="bg-gray-50 rounded-lg px-md py-lg items-center">
                    <Ionicons name="pricetag-outline" size={24} color="#8E8E93" />
                    <StyledText className="text-footnote font-sf-pro text-gray-500 mt-sm text-center">
                      Add custom tags to help organize and find your code snippets later
                    </StyledText>
                  </StyledView>
                )}
              </StyledView>
            </StyledView>
          </Card>
        </StyledView>
      </StyledScrollView>

      {/* Save Button */}
      <StyledView className="px-lg py-lg border-t border-gray-100 bg-white shadow-ios-sm">
        <Button
          variant="primary"
          onPress={handleSave}
          disabled={saving || (!isMultiple && !editedText.trim()) || (isMultiple && images.length === 0)}
          className="w-full"
        >
          {saving ? (
            <StyledView className="flex-row items-center">
              <Ionicons name="refresh" size={20} color="white" />
              <StyledText className="text-body font-sf-pro text-white ml-sm font-medium">
                {isMultiple ? 'Processing...' : 'Saving...'}
              </StyledText>
            </StyledView>
          ) : (
            <StyledView className="flex-row items-center">
              <Ionicons name={isMultiple ? "flash" : "save"} size={20} color="white" />
              <StyledText className="text-body font-sf-pro text-white ml-sm font-medium">
                {isMultiple ? `Process ${images.length} Screenshots` : 'Save Code Snippet'}
              </StyledText>
            </StyledView>
          )}
        </Button>
      </StyledView>
    </SafeAreaView>
  );
};