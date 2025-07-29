import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);

type Props = AuthStackScreenProps<'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for password reset instructions.',
        [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-1 px-lg py-xl">
        <StyledText className="text-title1 font-sf-pro-display text-gray-900 font-bold text-center mb-lg">
          Reset Password
        </StyledText>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="Send Reset Email"
          onPress={handleResetPassword}
          loading={loading}
          size="large"
        />

        <Button
          title="Back to Sign In"
          onPress={() => navigation.navigate('SignIn')}
          variant="ghost"
        />
      </StyledView>
    </SafeAreaView>
  );
};