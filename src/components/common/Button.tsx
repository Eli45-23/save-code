import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { styled } from 'nativewind';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  className
}) => {
  const isDisabled = disabled || loading;

  // Base classes
  const baseClasses = 'rounded-md flex-row items-center justify-center';
  
  // Variant classes
  const variantClasses = {
    primary: isDisabled 
      ? 'bg-gray-300' 
      : 'bg-systemBlue active:bg-blue-600',
    secondary: isDisabled 
      ? 'bg-gray-100 border border-gray-200' 
      : 'bg-gray-100 border border-gray-200 active:bg-gray-200',
    destructive: isDisabled 
      ? 'bg-gray-300' 
      : 'bg-systemRed active:bg-red-600',
    ghost: isDisabled 
      ? 'bg-transparent' 
      : 'bg-transparent active:bg-gray-100',
  };
  
  // Size classes
  const sizeClasses = {
    small: 'px-sm py-xs min-h-[32px]',
    medium: 'px-md py-sm min-h-[44px]',
    large: 'px-lg py-md min-h-[50px]',
  };
  
  // Text variant classes
  const textVariantClasses = {
    primary: isDisabled 
      ? 'text-gray-500' 
      : 'text-white',
    secondary: isDisabled 
      ? 'text-gray-400' 
      : 'text-gray-900',
    destructive: isDisabled 
      ? 'text-gray-500' 
      : 'text-white',
    ghost: isDisabled 
      ? 'text-gray-400' 
      : 'text-systemBlue',
  };
  
  // Text size classes
  const textSizeClasses = {
    small: 'text-footnote',
    medium: 'text-body',
    large: 'text-headline',
  };

  return (
    <StyledTouchableOpacity 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
      onPress={onPress}
      disabled={isDisabled}
      style={style}
      activeOpacity={0.7}
    >
      {leftIcon && !loading && leftIcon}
      
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'destructive' ? 'white' : '#007AFF'} 
        />
      ) : (
        <>
          <StyledText 
            className={`${textVariantClasses[variant]} ${textSizeClasses[size]} font-sf-pro font-semibold text-center`}
            style={textStyle}
          >
            {title}
          </StyledText>
          {rightIcon && rightIcon}
        </>
      )}
    </StyledTouchableOpacity>
  );
};