import React, { useState, forwardRef } from 'react';
import { 
  TextInput as RNTextInput, 
  View, 
  Text, 
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle
} from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(RNTextInput);

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  multiline = false,
  containerStyle,
  inputStyle,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const variantClasses = {
    default: 'bg-gray-50 border',
    filled: 'bg-gray-100',
    outlined: 'bg-white border-2',
  };

  const borderClasses = error 
    ? 'border-systemRed' 
    : isFocused 
      ? 'border-systemBlue' 
      : 'border-gray-200';

  const inputClasses = `
    rounded-md px-md py-sm text-body font-sf-pro text-gray-900
    ${variantClasses[variant]} ${borderClasses}
    ${multiline ? 'min-h-[100px] text-top' : 'h-11'}
  `;

  return (
    <StyledView className="mb-md" style={containerStyle}>
      {label && (
        <StyledText className="text-subheadline font-sf-pro text-gray-700 mb-xs font-medium">
          {label}
        </StyledText>
      )}
      
      <StyledView className="relative">
        {leftIcon && (
          <StyledView className="absolute left-3 top-3 z-10">
            {leftIcon}
          </StyledView>
        )}
        
        <StyledTextInput
          ref={ref}
          className={`${inputClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor="#8E8E93"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={inputStyle}
          {...props}
        />
        
        {rightIcon && (
          <StyledView className="absolute right-3 top-3 z-10">
            {rightIcon}
          </StyledView>
        )}
      </StyledView>
      
      {(error || helperText) && (
        <StyledText 
          className={`text-caption1 font-sf-pro mt-xs ${
            error ? 'text-systemRed' : 'text-gray-500'
          }`}
        >
          {error || helperText}
        </StyledText>
      )}
    </StyledView>
  );
});