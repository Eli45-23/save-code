import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);
const StyledView = styled(View);

export interface TagProps {
  label: string;
  color?: string;
  variant?: 'filled' | 'outlined' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  color = '#3B82F6',
  variant = 'filled',
  size = 'medium',
  onPress,
  onRemove,
  selected = false,
  icon,
  style
}) => {
  const sizeClasses = {
    small: 'px-xs py-1 rounded-xs',
    medium: 'px-sm py-1 rounded-sm',
    large: 'px-md py-sm rounded-md',
  };

  const textSizeClasses = {
    small: 'text-caption2',
    medium: 'text-caption1',
    large: 'text-footnote',
  };

  const getVariantClasses = () => {
    const alpha = selected ? '20' : '10';
    
    switch (variant) {
      case 'filled':
        return {
          container: selected 
            ? `border border-gray-300` 
            : '',
          background: { backgroundColor: color + alpha },
          text: selected ? 'text-white' : 'text-gray-700'
        };
      case 'outlined':
        return {
          container: `border`,
          background: { 
            backgroundColor: selected ? color + '20' : 'transparent',
            borderColor: color 
          },
          text: selected ? 'text-white' : 'text-gray-700'
        };
      case 'ghost':
        return {
          container: '',
          background: { 
            backgroundColor: selected ? color + '20' : 'transparent' 
          },
          text: selected ? 'text-white' : 'text-gray-500'
        };
      default:
        return {
          container: '',
          background: { backgroundColor: color + alpha },
          text: 'text-gray-700'
        };
    }
  };

  const variantStyle = getVariantClasses();
  const Component = onPress ? StyledTouchableOpacity : StyledView;

  return (
    <Component
      className={`
        ${sizeClasses[size]} ${variantStyle.container}
        flex-row items-center justify-center
        ${onPress ? 'active:opacity-70' : ''}
      `}
      style={[variantStyle.background, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <StyledView className="mr-1">
          {icon}
        </StyledView>
      )}
      
      <StyledText 
        className={`${textSizeClasses[size]} font-sf-pro font-medium ${variantStyle.text}`}
        numberOfLines={1}
      >
        {label}
      </StyledText>
      
      {onRemove && (
        <StyledTouchableOpacity
          onPress={onRemove}
          className="ml-1 p-0.5"
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Ionicons name="close" size={12} color="#8E8E93" />
        </StyledTouchableOpacity>
      )}
    </Component>
  );
};