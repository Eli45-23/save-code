import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModalStackParamList } from '../types/navigation';

// Modal Screens
import { EditSnippetScreen } from '../screens/modals/EditSnippetScreen';
import { EditFileScreen } from '../screens/modals/EditFileScreen';
import { FileOptionsScreen } from '../screens/modals/FileOptionsScreen';
import { TagManagerScreen } from '../screens/modals/TagManagerScreen';

const Stack = createNativeStackNavigator<ModalStackParamList>();

export const ModalStackNavigator: React.FC = () => {
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
        },
        headerBackTitleVisible: false,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="EditSnippet"
        component={EditSnippetScreen}
        options={{
          title: 'Edit Snippet',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditFile"
        component={EditFileScreen}
        options={{
          title: 'Edit File',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="FileOptions"
        component={FileOptionsScreen}
        options={{
          title: 'File Options',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="TagManager"
        component={TagManagerScreen}
        options={{
          title: 'Manage Tags',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};