import React from 'react';
import { View, ViewStyle } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  className?: string;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  className,
  onPress
}) => {
  const variantClasses = {
    default: 'bg-white border border-gray-100 shadow-ios-sm',
    elevated: 'bg-white shadow-ios-lg',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-gray-50 border border-gray-100',
  };

  const paddingClasses = {
    none: '',
    small: 'p-sm',
    medium: 'p-md',
    large: 'p-lg',
  };

  const baseClasses = 'rounded-md';

  if (onPress) {
    return (
      <StyledView 
        className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} active:opacity-80 ${className || ''}`}
        style={style}
        onTouchEnd={onPress}
      >
        {children}
      </StyledView>
    );
  }

  return (
    <StyledView 
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className || ''}`}
      style={style}
    >
      {children}
    </StyledView>
  );
};