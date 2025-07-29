import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FilesStackParamList } from '../types/navigation';

// Screens
import { FilesListScreen } from '../screens/files/FilesListScreen';
import { FileDetailScreen } from '../screens/files/FileDetailScreen';
import { SnippetDetailScreen } from '../screens/files/SnippetDetailScreen';

const Stack = createNativeStackNavigator<FilesStackParamList>();

export const FilesStackNavigator: React.FC = () => {
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
    >
      <Stack.Screen
        name="FilesList"
        component={FilesListScreen}
        options={{
          title: 'My Files',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="FileDetail"
        component={FileDetailScreen}
        options={({ route }) => ({
          title: route.params.fileName,
          headerLargeTitle: false,
        })}
      />
      <Stack.Screen
        name="SnippetDetail"
        component={SnippetDetailScreen}
        options={{
          title: 'Code Snippet',
          headerLargeTitle: false,
        }}
      />
    </Stack.Navigator>
  );
};