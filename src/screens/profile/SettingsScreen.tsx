import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ListItem } from '../../components/common/ListItem';
import { Button } from '../../components/common/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

export const SettingsScreen: React.FC = () => {
  // Settings state - in a real app this would come from context/AsyncStorage
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [highQualityImages, setHighQualityImages] = useState(true);
  const [autoProcessOCR, setAutoProcessOCR] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and may improve app performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would clear the cache
            console.log('Cache cleared');
            Alert.alert('Success', 'Cache has been cleared');
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all your code snippets and files to a backup file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // In a real app, this would export data
            console.log('Data exported');
            Alert.alert('Success', 'Data has been exported to your device');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Confirm Delete', 
                  style: 'destructive',
                  onPress: () => {
                    // In a real app, this would delete the account
                    console.log('Account deletion confirmed');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <StyledView className="px-lg pt-xl pb-md">
      <StyledText className="text-caption1 font-sf-pro font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </StyledText>
    </StyledView>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-secondary">
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* General Settings */}
        <SectionHeader title="General" />
        <StyledView className="bg-white mx-lg rounded-md border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Notifications"
            subtitle="Receive updates and reminders"
            leftIcon={<Ionicons name="notifications-outline" size={24} color="#FF9500" />}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          
          <ListItem
            title="Dark Mode"
            subtitle="Use dark theme throughout the app"
            leftIcon={<Ionicons name="moon-outline" size={24} color="#5856D6" />}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          
          <ListItem
            title="Biometric Authentication"
            subtitle="Use Face ID or fingerprint to secure app"
            leftIcon={<Ionicons name="finger-print-outline" size={24} color="#FF3B30" />}
            rightElement={
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </StyledView>

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />
        <StyledView className="bg-white mx-lg rounded-md border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Auto Backup"
            subtitle="Automatically backup data to cloud"
            leftIcon={<Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />}
            rightElement={
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          
          <ListItem
            title="High Quality Images"
            subtitle="Save images in higher resolution"
            leftIcon={<Ionicons name="image-outline" size={24} color="#34C759" />}
            rightElement={
              <Switch
                value={highQualityImages}
                onValueChange={setHighQualityImages}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          
          <ListItem
            title="Storage Usage"
            subtitle="2.4 MB of 5 GB used"
            leftIcon={<Ionicons name="pie-chart-outline" size={24} color="#FF9500" />}
            showChevron
            onPress={() => console.log('Show storage details')}
          />
        </StyledView>

        {/* OCR & Processing */}
        <SectionHeader title="OCR & Processing" />
        <StyledView className="bg-white mx-lg rounded-md border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Auto Process OCR"
            subtitle="Automatically extract text from images"
            leftIcon={<Ionicons name="scan-outline" size={24} color="#5856D6" />}
            rightElement={
              <Switch
                value={autoProcessOCR}
                onValueChange={setAutoProcessOCR}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          
          <ListItem
            title="OCR Language"
            subtitle="English (US)"
            leftIcon={<Ionicons name="language-outline" size={24} color="#FF6B35" />}
            showChevron
            onPress={() => console.log('Select OCR language')}
          />
          
          <ListItem
            title="Processing Quality"
            subtitle="Balance between speed and accuracy"
            leftIcon={<Ionicons name="speedometer-outline" size={24} color="#30D158" />}
            showChevron
            onPress={() => console.log('Select processing quality')}
          />
        </StyledView>

        {/* Privacy & Security */}
        <SectionHeader title="Privacy & Security" />
        <StyledView className="bg-white mx-lg rounded-md border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Privacy Policy"
            subtitle="Review our privacy practices"
            leftIcon={<Ionicons name="shield-checkmark-outline" size={24} color="#34C759" />}
            showChevron
            onPress={() => console.log('Show privacy policy')}
          />
          
          <ListItem
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            leftIcon={<Ionicons name="document-text-outline" size={24} color="#007AFF" />}
            showChevron
            onPress={() => console.log('Show terms of service')}
          />
          
          <ListItem
            title="Data Export"
            subtitle="Download all your data"
            leftIcon={<Ionicons name="download-outline" size={24} color="#5856D6" />}
            showChevron
            onPress={handleExportData}
          />
        </StyledView>

        {/* Maintenance */}
        <SectionHeader title="Maintenance" />
        <StyledView className="bg-white mx-lg rounded-md border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Clear Cache"
            subtitle="Free up storage space"
            leftIcon={<Ionicons name="trash-outline" size={24} color="#FF9500" />}
            showChevron
            onPress={handleClearCache}
          />
          
          <ListItem
            title="Reset Settings"
            subtitle="Restore default app settings"
            leftIcon={<Ionicons name="refresh-outline" size={24} color="#8E8E93" />}
            showChevron
            onPress={() => console.log('Reset settings')}
          />
        </StyledView>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <StyledView className="mx-lg mb-2xl">
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="destructive"
            size="medium"
            leftIcon={<Ionicons name="warning-outline" size={18} color="#FFFFFF" />}
          />
        </StyledView>

      </StyledScrollView>
    </SafeAreaView>
  );
};