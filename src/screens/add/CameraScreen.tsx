import React, { useState, useRef } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// Components
import { Button, EmptyState } from '../../components/common';
import { AddStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

type Props = AddStackScreenProps<'Camera'>;

export const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasLibraryPermission, setHasLibraryPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    (async () => {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasLibraryPermission(libraryPermission.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        navigation.navigate('ProcessImage', { imageUri: photo.uri });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('ProcessImage', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  if (cameraPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <StyledView className="flex-1 items-center justify-center">
          <StyledText className="text-white text-body font-sf-pro">
            Requesting camera permissions...
          </StyledText>
        </StyledView>
      </SafeAreaView>
    );
  }

  if (!cameraPermission?.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState
          icon={<Ionicons name="camera-outline" size={48} color="#8E8E93" />}
          title="Camera Access Required"
          description="To capture code screenshots, please enable camera access in your device settings."
          actionButton={{
            title: hasLibraryPermission ? 'Use Photo Library Instead' : 'Grant Camera Permission',
            onPress: hasLibraryPermission ? pickImage : requestCameraPermission,
            variant: 'secondary',
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StyledView className="flex-1">
        {/* Camera View */}
        <CameraView 
          ref={cameraRef}
          style={{ flex: 1 }} 
          facing={facing}
        >
          {/* Top Controls */}
          <StyledView className="flex-row justify-between items-center p-lg">
            <StyledTouchableOpacity
              className="w-11 h-11 bg-black bg-opacity-50 rounded-full items-center justify-center"
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="white" />
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              className="w-11 h-11 bg-black bg-opacity-50 rounded-full items-center justify-center"
              onPress={() => {
                setFacing(current => 
                  current === 'back' ? 'front' : 'back'
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </StyledTouchableOpacity>
          </StyledView>

          {/* Spacer */}
          <StyledView className="flex-1" />

          {/* Bottom Controls */}
          <StyledView className="pb-2xl pt-lg bg-black bg-opacity-30">
            {/* Multiple Photos Button */}
            <StyledView className="items-center mb-lg">
              <StyledTouchableOpacity
                className="bg-white bg-opacity-20 rounded-full px-lg py-md"
                onPress={() => navigation.navigate('MultiImagePicker')}
                activeOpacity={0.7}
              >
                <StyledView className="flex-row items-center">
                  <Ionicons name="copy" size={20} color="white" />
                  <StyledText className="text-body font-sf-pro text-white ml-sm font-medium">
                    Multiple Photos
                  </StyledText>
                </StyledView>
              </StyledTouchableOpacity>
            </StyledView>

            <StyledView className="flex-row items-center justify-center px-xl">
              {/* Photo Library Button */}
              <StyledTouchableOpacity
                className="w-12 h-12 bg-white bg-opacity-20 rounded-md items-center justify-center"
                onPress={pickImage}
                disabled={!hasLibraryPermission}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="images" 
                  size={24} 
                  color={hasLibraryPermission ? "white" : "#8E8E93"} 
                />
              </StyledTouchableOpacity>

              <StyledView className="flex-1 items-center">
                {/* Capture Button */}
                <StyledTouchableOpacity
                  className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-white shadow-ios-md"
                  onPress={takePicture}
                  activeOpacity={0.8}
                >
                  <StyledView className="w-16 h-16 bg-white rounded-full items-center justify-center">
                    <Ionicons name="camera" size={32} color="#007AFF" />
                  </StyledView>
                </StyledTouchableOpacity>
              </StyledView>

              {/* Flash Button (placeholder) */}
              <StyledTouchableOpacity
                className="w-12 h-12 bg-white bg-opacity-20 rounded-md items-center justify-center"
                onPress={() => {
                  // Flash toggle functionality could be added here
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="flash-off" size={24} color="white" />
              </StyledTouchableOpacity>
            </StyledView>

            {/* Instructions */}
            <StyledText className="text-white text-center text-footnote font-sf-pro mt-lg opacity-80">
              Position code clearly in frame and tap to capture
            </StyledText>
          </StyledView>
        </CameraView>
      </StyledView>
    </SafeAreaView>
  );
};