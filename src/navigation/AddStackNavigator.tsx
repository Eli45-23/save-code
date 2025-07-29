import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddStackParamList } from '../types/navigation';

// Screens
import { CameraScreen } from '../screens/add/CameraScreen';
import { PhotoLibraryScreen } from '../screens/add/PhotoLibraryScreen';
import { ProcessImageScreen } from '../screens/add/ProcessImageScreen';
import { ReviewAndSaveScreen } from '../screens/add/ReviewAndSaveScreen';

const Stack = createNativeStackNavigator<AddStackParamList>();

export const AddStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontFamily: 'SF Pro Display',
          fontSize: 17,
          fontWeight: '600',
          color: '#1C1C1E',
        },
        headerBackTitleVisible: false,
        headerShadowVisible: true,
        headerBlurEffect: 'systemMaterial',
        headerTransparent: false,
      }}
      initialRouteName="Camera"
    >
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Add Code',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="PhotoLibrary"
        component={PhotoLibraryScreen}
        options={{
          title: 'Photo Library',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="ProcessImage"
        component={ProcessImageScreen}
        options={{
          title: 'Process Image',
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen
        name="ReviewAndSave"
        component={ReviewAndSaveScreen}
        options={{
          title: 'Review & Save',
          headerLargeTitle: false,
        }}
      />
    </Stack.Navigator>
  );
};