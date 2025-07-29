import React from 'react';
import { View, Text, ScrollView, Linking, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ListItem } from '../../components/common/ListItem';
import { Button } from '../../components/common/Button';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

export const AboutScreen: React.FC = () => {
  // App info - in a real app this would come from app.json or config
  const appInfo = {
    name: 'Save Code',
    version: '1.0.0',
    buildNumber: '23',
    releaseDate: 'January 2024',
    description: 'Capture, organize, and study code snippets with OCR technology',
  };

  const handleOpenLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Unable to open ${title}`);
      }
    } catch (error) {
      Alert.alert('Error', `Unable to open ${title}`);
    }
  };

  const handleContactSupport = () => {
    const email = 'support@savecode.app';
    const subject = 'Save Code App Support';
    const body = `Hi Save Code Team,\n\nI need help with:\n\nApp Version: ${appInfo.version}\nBuild: ${appInfo.buildNumber}\n\nDescription of issue:\n`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    handleOpenLink(mailtoUrl, 'Email Support');
  };

  const handleRateApp = () => {
    // In a real app, this would use the app store URL
    const appStoreUrl = 'https://apps.apple.com/app/save-code/id123456789';
    handleOpenLink(appStoreUrl, 'App Store');
  };

  const handleShareApp = () => {
    Alert.alert(
      'Share Save Code',
      'Help others discover this amazing code organization app!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => {
            // In a real app, this would use the Share API
            console.log('Share app');
          }
        }
      ]
    );
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <StyledView className="px-lg pt-lg pb-sm">
      <StyledText className="text-caption1 font-sf-pro font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </StyledText>
    </StyledView>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* App Header */}
        <StyledView className="bg-white px-lg py-xl items-center border-b border-gray-100">
          <StyledView className="w-20 h-20 rounded-2xl bg-systemBlue items-center justify-center mb-md shadow-ios-md">
            <Ionicons name="code-slash" size={40} color="#FFFFFF" />
          </StyledView>
          <StyledText className="text-title1 font-sf-pro-display font-bold text-gray-900 text-center mb-xs">
            {appInfo.name}
          </StyledText>
          <StyledText className="text-subheadline font-sf-pro text-gray-600 text-center mb-sm">
            Version {appInfo.version} (Build {appInfo.buildNumber})
          </StyledText>
          <StyledText className="text-footnote font-sf-pro text-gray-500 text-center leading-5">
            {appInfo.description}
          </StyledText>
        </StyledView>

        {/* App Information */}
        <SectionHeader title="Information" />
        <StyledView className="bg-white mx-lg rounded-lg border border-gray-100 shadow-ios-sm">
          <ListItem
            title="What's New"
            subtitle="See the latest features and improvements"
            leftIcon={<Ionicons name="sparkles-outline" size={24} color="#FF9500" />}
            showChevron
            onPress={() => console.log('Show what\'s new')}
          />
          
          <ListItem
            title="Help & FAQ"
            subtitle="Find answers to common questions"
            leftIcon={<Ionicons name="help-circle-outline" size={24} color="#007AFF" />}
            showChevron
            onPress={() => handleOpenLink('https://savecode.app/help', 'Help Center')}
          />
          
          <ListItem
            title="Privacy Policy"
            subtitle="How we protect your data"
            leftIcon={<Ionicons name="shield-checkmark-outline" size={24} color="#34C759" />}
            showChevron
            onPress={() => handleOpenLink('https://savecode.app/privacy', 'Privacy Policy')}
          />
          
          <ListItem
            title="Terms of Service"
            subtitle="Terms and conditions of use"
            leftIcon={<Ionicons name="document-text-outline" size={24} color="#8E8E93" />}
            showChevron
            onPress={() => handleOpenLink('https://savecode.app/terms', 'Terms of Service')}
          />
        </StyledView>

        {/* Support */}
        <SectionHeader title="Support" />
        <StyledView className="bg-white mx-lg rounded-lg border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Contact Support"
            subtitle="Get help from our support team"
            leftIcon={<Ionicons name="mail-outline" size={24} color="#FF3B30" />}
            showChevron
            onPress={handleContactSupport}
          />
          
          <ListItem
            title="Report a Bug"
            subtitle="Help us improve the app"
            leftIcon={<Ionicons name="bug-outline" size={24} color="#FF9500" />}
            showChevron
            onPress={() => {
              const email = 'bugs@savecode.app';
              const subject = 'Bug Report - Save Code App';
              const body = `Bug Report:\n\nApp Version: ${appInfo.version}\nBuild: ${appInfo.buildNumber}\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:\n`;
              const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              handleOpenLink(mailtoUrl, 'Bug Report');
            }}
          />
          
          <ListItem
            title="Feature Request"
            subtitle="Suggest new features"
            leftIcon={<Ionicons name="lightbulb-outline" size={24} color="#5856D6" />}
            showChevron
            onPress={() => {
              const email = 'features@savecode.app';
              const subject = 'Feature Request - Save Code App';
              const body = `Feature Request:\n\nDescription:\n\nUse Case:\n\nWhy would this be helpful:\n`;
              const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              handleOpenLink(mailtoUrl, 'Feature Request');
            }}
          />
        </StyledView>

        {/* Community */}
        <SectionHeader title="Community" />
        <StyledView className="bg-white mx-lg rounded-lg border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Rate Save Code"
            subtitle="Help others discover our app"
            leftIcon={<Ionicons name="star-outline" size={24} color="#FF9500" />}
            showChevron
            onPress={handleRateApp}
          />
          
          <ListItem
            title="Share with Friends"
            subtitle="Recommend Save Code to others"
            leftIcon={<Ionicons name="share-outline" size={24} color="#007AFF" />}
            showChevron
            onPress={handleShareApp}
          />
          
          <ListItem
            title="Follow Us"
            subtitle="Stay updated on social media"
            leftIcon={<Ionicons name="logo-twitter" size={24} color="#1DA1F2" />}
            showChevron
            onPress={() => handleOpenLink('https://twitter.com/savecodeapp', 'Twitter')}
          />
        </StyledView>

        {/* Technical Information */}
        <SectionHeader title="Technical" />
        <StyledView className="bg-white mx-lg rounded-lg border border-gray-100 shadow-ios-sm">
          <ListItem
            title="Open Source Libraries"
            subtitle="View third-party software licenses"
            leftIcon={<Ionicons name="library-outline" size={24} color="#8E8E93" />}
            showChevron
            onPress={() => console.log('Show licenses')}
          />
          
          <ListItem
            title="System Information"
            subtitle="Device and app diagnostics"
            leftIcon={<Ionicons name="hardware-chip-outline" size={24} color="#5856D6" />}
            showChevron
            onPress={() => console.log('Show system info')}
          />
        </StyledView>

        {/* Footer */}
        <StyledView className="px-lg py-xl items-center">
          <StyledText className="text-caption1 font-sf-pro text-gray-500 text-center mb-sm">
            Made with ❤️ by the Save Code Team
          </StyledText>
          <StyledText className="text-caption2 font-sf-pro text-gray-400 text-center mb-md">
            Released {appInfo.releaseDate}
          </StyledText>
          <StyledText className="text-caption2 font-sf-pro text-gray-400 text-center">
            © 2024 Save Code. All rights reserved.
          </StyledText>
        </StyledView>

      </StyledScrollView>
    </SafeAreaView>
  );
};