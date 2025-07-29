import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types/navigation';

// Screens
import { SearchHomeScreen } from '../screens/search/SearchHomeScreen';
import { SearchResultsScreen } from '../screens/search/SearchResultsScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export const SearchStackNavigator: React.FC = () => {
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
        name="SearchHome"
        component={SearchHomeScreen}
        options={{
          title: 'Search Code',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="SearchResults"
        component={SearchResultsScreen}
        options={({ route }) => ({
          title: `"${route.params.query}"`,
          headerLargeTitle: false,
        })}
      />
    </Stack.Navigator>
  );
};