import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  showMessage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#007AFF',
  style,
  showMessage = true
}) => {
  return (
    <StyledView className="flex-1 items-center justify-center p-lg" style={style}>
      <ActivityIndicator size={size} color={color} />
      {showMessage && (
        <StyledText className="text-body font-sf-pro text-gray-500 mt-md text-center">
          {message}
        </StyledText>
      )}
    </StyledView>
  );
};