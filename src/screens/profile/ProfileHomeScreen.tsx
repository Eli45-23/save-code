import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ProfileStackScreenProps } from '../../types/navigation';
import { ListItem } from '../../components/common/ListItem';
import { Button } from '../../components/common/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

type ProfileHomeScreenProps = ProfileStackScreenProps<'ProfileHome'>;

export const ProfileHomeScreen: React.FC = () => {
  const navigation = useNavigation<ProfileHomeScreenProps['navigation']>();

  // Mock user data - in a real app this would come from context/state
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null,
    joinDate: 'January 2024',
    stats: {
      totalFiles: 24,
      totalSnippets: 156,
      favoriteSnippets: 12,
      totalStorage: '2.4 MB'
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  const handleSignOut = () => {
    // In a real app, this would handle sign out logic
    console.log('Sign out');
  };

  return (
    <SafeAreaView className="flex-1 bg-background-secondary">
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <StyledView className="bg-white px-lg py-xl border-b border-gray-100 shadow-ios-sm">
          <StyledView className="flex-row items-center mb-md">
            <StyledView className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mr-md">
              {userData.avatar ? (
                <StyledImage source={{ uri: userData.avatar }} className="w-20 h-20 rounded-full" />
              ) : (
                <Ionicons name="person" size={40} color="#8E8E93" />
              )}
            </StyledView>
            <StyledView className="flex-1">
              <StyledText className="text-title2 font-sf-pro-display font-bold text-gray-900 mb-xs">
                {userData.name}
              </StyledText>
              <StyledText className="text-subheadline font-sf-pro text-gray-600 mb-xs">
                {userData.email}
              </StyledText>
              <StyledText className="text-footnote font-sf-pro text-gray-500">
                Member since {userData.joinDate}
              </StyledText>
            </StyledView>
          </StyledView>

          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="secondary"
            size="medium"
            leftIcon={<Ionicons name="create-outline" size={18} color="#007AFF" />}
          />
        </StyledView>

        {/* Stats Section */}
        <StyledView className="bg-white mx-lg mt-xl rounded-lg border border-gray-100 shadow-ios-sm">
          <StyledView className="px-md py-md border-b border-gray-100">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
              Your Statistics
            </StyledText>
          </StyledView>
          
          <StyledView className="flex-row">
            <StyledView className="flex-1 items-center py-md border-r border-gray-100">
              <StyledText className="text-title1 font-sf-pro-display font-bold text-systemBlue mb-xs">
                {userData.stats.totalFiles}
              </StyledText>
              <StyledText className="text-caption1 font-sf-pro text-gray-600 text-center">
                Files
              </StyledText>
            </StyledView>
            
            <StyledView className="flex-1 items-center py-md border-r border-gray-100">
              <StyledText className="text-title1 font-sf-pro-display font-bold text-systemGreen mb-xs">
                {userData.stats.totalSnippets}
              </StyledText>
              <StyledText className="text-caption1 font-sf-pro text-gray-600 text-center">
                Snippets
              </StyledText>
            </StyledView>
            
            <StyledView className="flex-1 items-center py-md border-r border-gray-100">
              <StyledText className="text-title1 font-sf-pro-display font-bold text-systemOrange mb-xs">
                {userData.stats.favoriteSnippets}
              </StyledText>
              <StyledText className="text-caption1 font-sf-pro text-gray-600 text-center">
                Favorites
              </StyledText>
            </StyledView>
            
            <StyledView className="flex-1 items-center py-md">
              <StyledText className="text-title1 font-sf-pro-display font-bold text-systemPurple mb-xs">
                {userData.stats.totalStorage}
              </StyledText>
              <StyledText className="text-caption1 font-sf-pro text-gray-600 text-center">
                Storage
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Quick Actions */}
        <StyledView className="bg-white mx-lg mt-xl rounded-lg border border-gray-100 shadow-ios-sm">
          <StyledView className="px-md py-md border-b border-gray-100">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
              Quick Actions
            </StyledText>
          </StyledView>
          
          <ListItem
            title="My Files"
            subtitle="Browse all your saved files"
            leftIcon={<Ionicons name="folder-outline" size={24} color="#007AFF" />}
            showChevron
            onPress={() => console.log('Navigate to files')}
          />
          
          <ListItem
            title="Search Snippets"
            subtitle="Find code snippets quickly"
            leftIcon={<Ionicons name="search-outline" size={24} color="#34C759" />}
            showChevron
            onPress={() => console.log('Navigate to search')}
          />
          
          <ListItem
            title="Add New Code"
            subtitle="Take a photo or upload image"
            leftIcon={<Ionicons name="camera-outline" size={24} color="#FF9500" />}
            showChevron
            onPress={() => console.log('Navigate to camera')}
          />
        </StyledView>

        {/* Settings & Info */}
        <StyledView className="bg-white mx-lg mt-xl rounded-lg border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Settings"
            subtitle="App preferences and configuration"
            leftIcon={<Ionicons name="settings-outline" size={24} color="#8E8E93" />}
            showChevron
            onPress={handleSettings}
          />
          
          <ListItem
            title="About"
            subtitle="App information and credits"
            leftIcon={<Ionicons name="information-circle-outline" size={24} color="#8E8E93" />}
            showChevron
            onPress={handleAbout}
          />
        </StyledView>

        {/* Sign Out */}
        <StyledView className="mx-lg mt-xl mb-2xl">
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="destructive"
            size="medium"
            leftIcon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
          />
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};