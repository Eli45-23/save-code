import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, TextInput } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

type Props = AuthStackScreenProps<'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(formData.email, formData.password, formData.fullName);
      
      if (result.success) {
        if (result.needsEmailConfirmation) {
          // Navigate to email confirmation screen
          navigation.navigate('EmailConfirmation', { email: formData.email });
        }
        // If no email confirmation needed, the auth context will handle navigation
      } else {
        Alert.alert('Sign Up Failed', result.message || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StyledScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StyledView className="flex-1 px-lg py-2xl">
            {/* Header */}
            <StyledView className="items-center mb-2xl">
              <StyledView className="w-16 h-16 bg-systemBlue rounded-xl items-center justify-center mb-md">
                <Ionicons name="person-add" size={32} color="white" />
              </StyledView>
              
              <StyledText className="text-largeTitle font-sf-pro-display text-gray-900 text-center mb-xs font-bold">
                Create Account
              </StyledText>
              
              <StyledText className="text-body font-sf-pro text-gray-500 text-center">
                Join SaveCode to start organizing your code
              </StyledText>
            </StyledView>

            {/* Form Container */}
            <StyledView className="flex-1">
              {/* Form Fields */}
              <StyledView className="mb-lg">
                <TextInput
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  placeholder="Enter your full name"
                  leftIcon={<Ionicons name="person-outline" size={20} color="#8E8E93" />}
                  className="mb-md"
                />

                <TextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={20} color="#8E8E93" />}
                  className="mb-md"
                />

                <TextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Create a password"
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />}
                  className="mb-md"
                />

                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholder="Confirm your password"
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />}
                />
              </StyledView>

              {/* Create Account Button */}
              <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={loading}
                size="large"
                className="mb-lg"
              />
            </StyledView>

            {/* Footer - Sign In Link */}
            <StyledView className="items-center pt-lg border-t border-gray-100 mt-auto">
              <StyledText className="text-body font-sf-pro text-gray-500 text-center mb-md">
                Already have an account?
              </StyledText>
              
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('SignIn')}
                variant="secondary"
                size="large"
                className="w-full"
              />
            </StyledView>
          </StyledView>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};