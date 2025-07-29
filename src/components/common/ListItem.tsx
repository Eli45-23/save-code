import React from 'react';
import { TouchableOpacity, View, Text, ViewStyle } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledView = styled(View);
const StyledText = styled(Text);

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'card' | 'inset';
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = false,
  onPress,
  variant = 'default',
  style
}) => {
  const variantClasses = {
    default: 'bg-white border-b border-gray-100',
    card: 'bg-white rounded-lg border border-gray-100 mb-xs shadow-ios-sm',
    inset: 'bg-white rounded-lg mx-md mb-xs',
  };

  const baseClasses = 'px-md py-sm flex-row items-center';

  const Component = onPress ? StyledTouchableOpacity : StyledView;

  return (
    <Component 
      className={`${baseClasses} ${variantClasses[variant]} ${onPress ? 'active:bg-gray-50' : ''}`}
      onPress={onPress}
      style={style}
      activeOpacity={0.8}
    >
      {leftIcon && (
        <StyledView className="mr-md">
          {leftIcon}
        </StyledView>
      )}
      
      <StyledView className="flex-1">
        <StyledText className="text-body font-sf-pro text-gray-900" numberOfLines={1}>
          {title}
        </StyledText>
        {subtitle && (
          <StyledText className="text-footnote font-sf-pro text-gray-500 mt-1" numberOfLines={2}>
            {subtitle}
          </StyledText>
        )}
      </StyledView>
      
      {rightElement && (
        <StyledView className="ml-md">
          {rightElement}
        </StyledView>
      )}
      
      {showChevron && (
        <StyledView className="ml-sm">
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </StyledView>
      )}
    </Component>
  );
};