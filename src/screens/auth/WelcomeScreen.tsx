import React from 'react';
import { View, Text, Image } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import { Button } from '../../components/common/Button';
import { AuthStackScreenProps } from '../../types/navigation';

const StyledView = styled(View);
const StyledText = styled(Text);

type Props = AuthStackScreenProps<'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StyledView className="flex-1 px-lg py-xl">
        {/* Hero Section */}
        <StyledView className="flex-1 items-center justify-center">
          <StyledView className="w-24 h-24 bg-systemBlue rounded-2xl items-center justify-center mb-lg">
            <Ionicons name="code-slash" size={48} color="white" />
          </StyledView>
          
          <StyledText className="text-largeTitle font-sf-pro-display text-gray-900 font-bold text-center mb-md">
            Save Code
          </StyledText>
          
          <StyledText className="text-body font-sf-pro text-gray-600 text-center leading-relaxed mb-xl max-w-sm">
            Capture, organize, and study your code snippets with AI-powered classification and smart search.
          </StyledText>

          {/* Features */}
          <StyledView className="w-full space-y-lg">
            <StyledView className="flex-row items-center">
              <StyledView className="w-8 h-8 bg-systemGreen rounded-full items-center justify-center mr-md">
                <Ionicons name="camera" size={16} color="white" />
              </StyledView>
              <StyledText className="text-body font-sf-pro text-gray-700 flex-1">
                Take screenshots of code from any source
              </StyledText>
            </StyledView>

            <StyledView className="flex-row items-center">
              <StyledView className="w-8 h-8 bg-systemPurple rounded-full items-center justify-center mr-md">
                <Ionicons name="scan" size={16} color="white" />
              </StyledView>
              <StyledText className="text-body font-sf-pro text-gray-700 flex-1">
                Extract text automatically with OCR
              </StyledText>
            </StyledView>

            <StyledView className="flex-row items-center">
              <StyledView className="w-8 h-8 bg-systemOrange rounded-full items-center justify-center mr-md">
                <Ionicons name="library" size={16} color="white" />
              </StyledView>
              <StyledText className="text-body font-sf-pro text-gray-700 flex-1">
                Organize by language and topic automatically
              </StyledText>
            </StyledView>

            <StyledView className="flex-row items-center">
              <StyledView className="w-8 h-8 bg-systemTeal rounded-full items-center justify-center mr-md">
                <Ionicons name="search" size={16} color="white" />
              </StyledView>
              <StyledText className="text-body font-sf-pro text-gray-700 flex-1">
                Search through your code collection instantly
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Action Buttons */}
        <StyledView className="space-y-md">
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('SignUp')}
            variant="primary"
            size="large"
          />
          
          <Button
            title="I already have an account"
            onPress={() => navigation.navigate('SignIn')}
            variant="ghost"
            size="large"
          />
        </StyledView>
      </StyledView>
    </SafeAreaView>
  );
};