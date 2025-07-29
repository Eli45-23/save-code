import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Components
import { Button, EmptyState } from '../../components/common';
import { AddStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);
const StyledTouchableOpacity = styled(TouchableOpacity);

type Props = AddStackScreenProps<'MultiImagePicker'>;

const { width } = Dimensions.get('window');
const GRID_PADDING = 32; // px-lg = 16px each side
const GRID_GAP = 8; // gap between images
const COLUMNS = 3;
const IMAGE_SIZE = (width - GRID_PADDING - (GRID_GAP * (COLUMNS - 1))) / COLUMNS;

export const MultiImagePickerScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hasLibraryPermission, setHasLibraryPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasLibraryPermission(libraryPermission.status === 'granted');
    })();
  }, []);

  const pickImages = async (multiple = true) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: multiple,
        quality: 0.8,
        selectionLimit: multiple ? 10 : 1,
      });

      if (!result.canceled && result.assets) {
        const newImageUris = result.assets.map(asset => asset.uri);
        if (multiple) {
          setSelectedImages(prev => [...prev, ...newImageUris]);
        } else {
          setSelectedImages(prev => [...prev, ...newImageUris]);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      
      if (toIndex >= 0 && toIndex < newImages.length) {
        [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
      }
      
      return newImages;
    });
  };

  const handleContinue = () => {
    navigation.navigate('ReviewAndSave', {
      imageUris: selectedImages,
      isMultiImage: true
    });
  };

  if (hasLibraryPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StyledView className="flex-1 items-center justify-center">
          <StyledText className="text-body font-sf-pro text-gray-600">
            Requesting photo library permissions...
          </StyledText>
        </StyledView>
      </SafeAreaView>
    );
  }

  if (!hasLibraryPermission) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState
          icon={<Ionicons name="images-outline" size={48} color="#8E8E93" />}
          title="Photo Library Access Required"
          description="To select multiple code screenshots, please enable photo library access in your device settings."
          actionButton={{
            title: 'Open Settings',
            onPress: () => {
              // Note: In a real app, you'd use Linking.openSettings()
              Alert.alert('Settings', 'Please enable photo library access in Settings > Privacy & Security > Photos');
            },
            variant: 'secondary',
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <StyledView className="flex-row items-center justify-between px-lg py-md border-b border-gray-100">
        <StyledTouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-11 h-11 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </StyledTouchableOpacity>
        
        <StyledView className="flex-1 items-center">
          <StyledText className="text-title3 font-sf-pro-display font-semibold text-gray-900">
            Select Screenshots
          </StyledText>
          <StyledText className="text-caption1 font-sf-pro text-gray-600">
            {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
          </StyledText>
        </StyledView>

        <StyledView className="w-11" />
      </StyledView>

      <StyledScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {selectedImages.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="camera-outline" size={48} color="#8E8E93" />}
            title="No Screenshots Selected"
            description="Choose multiple code screenshots from your photo library to organize them together."
            actionButton={{
              title: 'Select Photos',
              onPress: () => pickImages(true),
              variant: 'primary',
            }}
          />
        ) : (
          <StyledView>
            {/* Selected Images Grid */}
            <StyledView className="flex-row flex-wrap justify-between">
              {selectedImages.map((imageUri, index) => (
                <StyledView
                  key={`${imageUri}-${index}`}
                  className="mb-sm relative"
                  style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                >
                  <StyledImage
                    source={{ uri: imageUri }}
                    style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                    className="rounded-lg"
                    resizeMode="cover"
                  />
                  
                  {/* Remove button */}
                  <StyledTouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center shadow-ios-sm"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </StyledTouchableOpacity>

                  {/* Order controls */}
                  <StyledView className="absolute bottom-1 right-1 flex-row">
                    {index > 0 && (
                      <StyledTouchableOpacity
                        onPress={() => moveImage(index, 'up')}
                        className="w-6 h-6 bg-black bg-opacity-70 rounded-full items-center justify-center mr-1"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-up" size={12} color="white" />
                      </StyledTouchableOpacity>
                    )}
                    
                    {index < selectedImages.length - 1 && (
                      <StyledTouchableOpacity
                        onPress={() => moveImage(index, 'down')}
                        className="w-6 h-6 bg-black bg-opacity-70 rounded-full items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-down" size={12} color="white" />
                      </StyledTouchableOpacity>
                    )}
                  </StyledView>

                  {/* Order number */}
                  <StyledView className="absolute top-1 left-1 w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                    <StyledText className="text-caption2 font-sf-pro text-white font-bold">
                      {index + 1}
                    </StyledText>
                  </StyledView>
                </StyledView>
              ))}
            </StyledView>

            {/* Add more button */}
            <StyledTouchableOpacity
              onPress={() => pickImages(true)}
              className="border-2 border-dashed border-gray-300 rounded-lg items-center justify-center mt-lg"
              style={{ height: IMAGE_SIZE }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={32} color="#8E8E93" />
              <StyledText className="text-footnote font-sf-pro text-gray-600 mt-sm">
                Add More Photos
              </StyledText>
            </StyledTouchableOpacity>

            {/* Instructions */}
            <StyledView className="bg-blue-50 rounded-lg p-md mt-lg">
              <StyledView className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <StyledView className="flex-1 ml-sm">
                  <StyledText className="text-footnote font-sf-pro text-blue-800 font-medium mb-xs">
                    Organization Tips
                  </StyledText>
                  <StyledText className="text-caption1 font-sf-pro text-blue-700">
                    • Order images by sequence (first to last)
                    • Select related screenshots for better grouping
                    • The app will automatically detect similar content
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        )}
      </StyledScrollView>

      {/* Bottom Actions */}
      {selectedImages.length > 0 && (
        <StyledView className="px-lg py-lg border-t border-gray-100 bg-white shadow-ios-sm">
          <StyledView className="flex-row space-x-md">
            <Button
              variant="ghost"
              onPress={() => pickImages(true)}
              className="flex-1"
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <StyledText className="text-body font-sf-pro text-systemBlue ml-sm font-medium">
                Add More
              </StyledText>
            </Button>
            
            <Button
              variant="primary"
              onPress={handleContinue}
              disabled={selectedImages.length < 2}
              className="flex-1"
            >
              <StyledText className="text-body font-sf-pro text-white font-medium">
                Continue ({selectedImages.length})
              </StyledText>
            </Button>
          </StyledView>
          
          {selectedImages.length === 1 && (
            <StyledText className="text-caption1 font-sf-pro text-gray-500 text-center mt-sm">
              Select at least 2 images to continue
            </StyledText>
          )}
        </StyledView>
      )}
    </SafeAreaView>
  );
};