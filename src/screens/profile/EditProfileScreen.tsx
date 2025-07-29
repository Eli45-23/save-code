import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TextInput } from '../../components/common/TextInput';
import { Button } from '../../components/common/Button';
import { ProfileStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

type EditProfileScreenProps = ProfileStackScreenProps<'EditProfile'>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenProps['navigation']>();
  
  // Form state - in a real app this would come from user context
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Software developer passionate about mobile apps and clean code.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    company: 'Tech Corp',
    jobTitle: 'Senior Developer'
  });
  
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose how you would like to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: () => {
            // In a real app, this would open camera
            console.log('Open camera');
          }
        },
        { 
          text: 'Choose from Library', 
          onPress: () => {
            // In a real app, this would open photo library
            console.log('Open photo library');
          }
        },
        avatar ? { 
          text: 'Remove Photo', 
          style: 'destructive',
          onPress: () => setAvatar(null)
        } : null
      ].filter(Boolean) as any[]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success',
        'Your profile has been updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    }, 1500);
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Profile Picture Section */}
        <StyledView className="bg-white px-lg py-lg border-b border-gray-100">
          <StyledView className="items-center">
            <StyledTouchableOpacity 
              className="relative"
              onPress={handleAvatarPress}
              activeOpacity={0.7}
            >
              <StyledView className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                {avatar ? (
                  <StyledImage source={{ uri: avatar }} className="w-24 h-24 rounded-full" />
                ) : (
                  <Ionicons name="person" size={48} color="#8E8E93" />
                )}
              </StyledView>
              <StyledView className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-systemBlue items-center justify-center border-2 border-white">
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </StyledView>
            </StyledTouchableOpacity>
            <StyledText className="text-footnote font-sf-pro text-gray-500 mt-sm text-center">
              Tap to change profile picture
            </StyledText>
          </StyledView>
        </StyledView>

        <StyledView className="px-lg py-lg">
          
          {/* Basic Information */}
          <StyledView className="mb-lg">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-md">
              Basic Information
            </StyledText>
            
            <StyledView className="flex-row space-x-md">
              <StyledView className="flex-1">
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  placeholder="Enter first name"
                />
              </StyledView>
              <StyledView className="flex-1">
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  placeholder="Enter last name"
                />
              </StyledView>
            </StyledView>

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#8E8E93" />}
            />

            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color="#8E8E93" />}
            />
          </StyledView>

          {/* Professional Information */}
          <StyledView className="mb-lg">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-md">
              Professional Information
            </StyledText>

            <TextInput
              label="Job Title"
              value={formData.jobTitle}
              onChangeText={(text) => handleInputChange('jobTitle', text)}
              placeholder="Enter job title"
              leftIcon={<Ionicons name="briefcase-outline" size={20} color="#8E8E93" />}
            />

            <TextInput
              label="Company"
              value={formData.company}
              onChangeText={(text) => handleInputChange('company', text)}
              placeholder="Enter company name"
              leftIcon={<Ionicons name="business-outline" size={20} color="#8E8E93" />}
            />

            <TextInput
              label="Location"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              placeholder="Enter location"
              leftIcon={<Ionicons name="location-outline" size={20} color="#8E8E93" />}
            />

            <TextInput
              label="Website"
              value={formData.website}
              onChangeText={(text) => handleInputChange('website', text)}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
              leftIcon={<Ionicons name="globe-outline" size={20} color="#8E8E93" />}
            />
          </StyledView>

          {/* Bio Section */}
          <StyledView className="mb-lg">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-md">
              About
            </StyledText>

            <TextInput
              label="Bio"
              value={formData.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              placeholder="Tell us about yourself..."
              multiline
              helperText="Write a brief description about yourself and your interests"
            />
          </StyledView>

          {/* Action Buttons */}
          <StyledView className="flex-row space-x-md mb-xl">
            <StyledView className="flex-1">
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="secondary"
                size="large"
              />
            </StyledView>
            <StyledView className="flex-1">
              <Button
                title="Save Changes"
                onPress={handleSave}
                variant="primary"
                size="large"
                loading={isLoading}
                leftIcon={!isLoading ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : undefined}
              />
            </StyledView>
          </StyledView>

        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};