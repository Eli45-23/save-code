import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import { Button, TextInput } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

type Props = AuthStackScreenProps<'SignIn'>;

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      Alert.alert('Sign In Failed', message);
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
                <Ionicons name="log-in" size={32} color="white" />
              </StyledView>
              
              <StyledText className="text-largeTitle font-sf-pro-display text-gray-900 text-center mb-xs font-bold">
                Welcome Back
              </StyledText>
              
              <StyledText className="text-body font-sf-pro text-gray-500 text-center">
                Sign in to access your saved code
              </StyledText>
            </StyledView>

            {/* Form Container */}
            <StyledView className="flex-1 min-h-0">
              {/* Form Fields */}
              <StyledView className="mb-lg">
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email}
                  leftIcon={<Ionicons name="mail-outline" size={20} color="#8E8E93" />}
                  className="mb-md"
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#8E8E93" />}
                />
              </StyledView>

              {/* Sign In Button */}
              <Button
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                size="large"
                className="mb-md"
              />

              {/* Forgot Password Link */}
              <StyledView className="items-center mb-2xl">
                <Button
                  title="Forgot Password?"
                  onPress={() => navigation.navigate('ForgotPassword')}
                  variant="ghost"
                  size="medium"
                />
              </StyledView>
            </StyledView>

            {/* Footer - Create Account */}
            <StyledView className="items-center pt-lg border-t border-gray-100 mt-auto">
              <StyledText className="text-body font-sf-pro text-gray-500 text-center mb-md">
                Don't have an account?
              </StyledText>
              
              <Button
                title="Create Account"
                onPress={() => navigation.navigate('SignUp')}
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