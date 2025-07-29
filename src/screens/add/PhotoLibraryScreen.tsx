import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Components
import { Button, LoadingState, EmptyState } from '../../components/common';
import { AddStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

type Props = AddStackScreenProps<'PhotoLibrary'>;

export const PhotoLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      setLoading(false);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
      setLoading(false);
    }
  };

  const pickSinglePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('ProcessImage', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const pickMultiplePhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets.length > 0) {
        // For now, just process the first selected image
        // In future, could allow batch processing
        navigation.navigate('ProcessImage', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StyledView className="flex-1 items-center justify-center">
          <LoadingState 
            message="Checking permissions - Please wait while we verify photo library access"
          />
        </StyledView>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StyledView className="flex-1">
          {/* Header */}
          <StyledView className="flex-row items-center justify-between px-lg py-md border-b border-gray-200">
            <StyledTouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-xs"
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </StyledTouchableOpacity>
            <StyledText className="text-title3 font-sf-pro-display font-semibold text-gray-900">
              Photo Library
            </StyledText>
            <StyledView className="w-8" />
          </StyledView>

          <StyledView className="flex-1">
            <EmptyState
              icon={<Ionicons name="images-outline" size={48} color="#8E8E93" />}
              title="Photo Access Required"
              description="To select photos from your library, please enable photo access in your device settings."
              actionButton={{
                title: 'Grant Permission',
                onPress: requestPermissions,
                variant: 'primary',
              }}
            />
          </StyledView>
        </StyledView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StyledView className="flex-1">
        {/* Header */}
        <StyledView className="flex-row items-center justify-between px-lg py-md border-b border-gray-200">
          <StyledTouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-xs"
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </StyledTouchableOpacity>
          <StyledText className="text-title3 font-sf-pro-display font-semibold text-gray-900">
            Photo Library
          </StyledText>
          <StyledView className="w-8" />
        </StyledView>

        {/* Instructions */}
        <StyledView className="px-lg py-md bg-blue-50 border-b border-blue-100">
          <StyledText className="text-footnote font-sf-pro text-blue-800 text-center">
            Select photos containing code to extract and save
          </StyledText>
        </StyledView>

        <StyledScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <StyledView className="px-lg py-xl">
            {/* Single Photo Selection */}
            <StyledView className="mb-xl">
              <StyledView className="bg-white rounded-xl border border-gray-200 p-lg shadow-sm">
                <StyledView className="flex-row items-center mb-md">
                  <StyledView className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-md">
                    <Ionicons name="image" size={24} color="#007AFF" />
                  </StyledView>
                  <StyledView className="flex-1">
                    <StyledText className="text-title3 font-sf-pro-display font-medium text-gray-900 mb-xs">
                      Select Single Photo
                    </StyledText>
                    <StyledText className="text-footnote font-sf-pro text-gray-600">
                      Choose one photo with code to process
                    </StyledText>
                  </StyledView>
                </StyledView>
                
                <Button
                  title="Browse Photos"
                  variant="primary"
                  onPress={pickSinglePhoto}
                  leftIcon={<Ionicons name="image" size={20} color="white" />}
                />
              </StyledView>
            </StyledView>

            {/* Multiple Photo Selection */}
            <StyledView className="mb-xl">
              <StyledView className="bg-white rounded-xl border border-gray-200 p-lg shadow-sm">
                <StyledView className="flex-row items-center mb-md">
                  <StyledView className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-md">
                    <Ionicons name="images" size={24} color="#34C759" />
                  </StyledView>
                  <StyledView className="flex-1">
                    <StyledText className="text-title3 font-sf-pro-display font-medium text-gray-900 mb-xs">
                      Select Multiple Photos
                    </StyledText>
                    <StyledText className="text-footnote font-sf-pro text-gray-600">
                      Choose up to 5 photos (processes first selected)
                    </StyledText>
                  </StyledView>
                </StyledView>
                
                <Button
                  title="Select Multiple"
                  variant="secondary"
                  onPress={pickMultiplePhotos}
                  leftIcon={<Ionicons name="images" size={20} color="#007AFF" />}
                />
              </StyledView>
            </StyledView>

            {/* Tips Section */}
            <StyledView className="bg-gray-50 rounded-xl p-lg">
              <StyledView className="flex-row items-center mb-md">
                <Ionicons name="bulb" size={20} color="#FF9500" className="mr-sm" />
                <StyledText className="text-body font-sf-pro-medium text-gray-900 ml-sm">
                  Tips for Best Results
                </StyledText>
              </StyledView>
              
              <StyledView className="space-y-sm">
                <StyledView className="flex-row items-start">
                  <StyledText className="text-footnote font-sf-pro text-gray-600 mr-sm">•</StyledText>
                  <StyledText className="text-footnote font-sf-pro text-gray-600 flex-1">
                    Choose photos with clear, readable code
                  </StyledText>
                </StyledView>
                
                <StyledView className="flex-row items-start mt-xs">
                  <StyledText className="text-footnote font-sf-pro text-gray-600 mr-sm">•</StyledText>
                  <StyledText className="text-footnote font-sf-pro text-gray-600 flex-1">
                    Ensure good lighting and minimal glare
                  </StyledText>
                </StyledView>
                
                <StyledView className="flex-row items-start mt-xs">
                  <StyledText className="text-footnote font-sf-pro text-gray-600 mr-sm">•</StyledText>
                  <StyledText className="text-footnote font-sf-pro text-gray-600 flex-1">
                    Avoid blurry or low-resolution images
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledScrollView>
      </StyledView>
    </SafeAreaView>
  );
};