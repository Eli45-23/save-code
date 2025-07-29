import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);

type Props = AuthStackScreenProps<'EmailConfirmation'>;

export const EmailConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { resendConfirmationEmail } = useAuth();
  const { email } = route.params;
  const [resendLoading, setResendLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      await resendConfirmationEmail(email);
      setEmailSent(true);
      Alert.alert(
        'Email Sent',
        'A new confirmation email has been sent to your inbox.'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to resend email'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-1 px-lg py-xl">
        <StyledView className="items-center mb-xl">
          <StyledView className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-lg">
            <Ionicons name="mail-outline" size={48} color="#3B82F6" />
          </StyledView>
          
          <StyledText className="text-title1 font-sf-pro-display text-gray-900 font-bold text-center mb-md">
            Check Your Email
          </StyledText>
          
          <StyledText className="text-body text-gray-600 text-center leading-relaxed">
            We've sent a confirmation link to:
          </StyledText>
          
          <StyledText className="text-body font-semibold text-gray-900 text-center mt-sm mb-lg">
            {email}
          </StyledText>
          
          <StyledText className="text-body text-gray-600 text-center leading-relaxed">
            Please check your email and click the confirmation link to complete your registration. You may need to check your spam folder.
          </StyledText>
        </StyledView>

        <StyledView className="space-y-md">
          <Button
            title={emailSent ? "Email Sent!" : "Resend Confirmation Email"}
            onPress={handleResendEmail}
            loading={resendLoading}
            disabled={emailSent}
            variant={emailSent ? "secondary" : "primary"}
            size="large"
          />

          <Button
            title="Back to Sign In"
            onPress={handleBackToSignIn}
            variant="ghost"
          />
        </StyledView>

        <StyledView className="mt-xl pt-lg border-t border-gray-200">
          <StyledText className="text-caption text-gray-500 text-center">
            Once you confirm your email, you can sign in to your account.
          </StyledText>
        </StyledView>
      </StyledView>
    </SafeAreaView>
  );
};