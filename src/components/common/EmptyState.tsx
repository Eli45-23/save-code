import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { styled } from 'nativewind';
import { Button } from './Button';

const StyledView = styled(View);
const StyledText = styled(Text);

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionButton?: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
  style
}) => {
  return (
    <StyledView className="flex-1 items-center justify-center p-lg" style={style}>
      {icon && (
        <StyledView className="w-16 h-16 items-center justify-center mb-md">
          {icon}
        </StyledView>
      )}
      
      <StyledText className="text-title2 font-sf-pro text-gray-900 text-center mb-xs font-bold">
        {title}
      </StyledText>
      
      {description && (
        <StyledText className="text-body font-sf-pro text-gray-500 text-center mb-lg max-w-xs leading-relaxed">
          {description}
        </StyledText>
      )}
      
      {actionButton && (
        <Button
          title={actionButton.title}
          onPress={actionButton.onPress}
          variant={actionButton.variant || 'primary'}
        />
      )}
    </StyledView>
  );
};