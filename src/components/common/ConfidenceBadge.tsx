import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledText = styled(Text);

export interface ConfidenceBadgeProps {
  confidence: number; // 0-1 range
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = 'medium',
  showPercentage = true,
  showIcon = true,
  className = ''
}) => {
  // Convert to percentage
  const percentage = Math.round(confidence * 100);
  
  // Determine color scheme and icon based on confidence level
  const getConfidenceStyle = () => {
    if (confidence >= 0.8) {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: 'checkmark-circle' as const
      };
    } else if (confidence >= 0.6) {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: 'warning' as const
      };
    } else {
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: 'alert-circle' as const
      };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-1',
          text: 'text-caption2',
          icon: 12
        };
      case 'large':
        return {
          container: 'px-4 py-2',
          text: 'text-footnote',
          icon: 18
        };
      default: // medium
        return {
          container: 'px-3 py-1.5',
          text: 'text-caption1',
          icon: 14
        };
    }
  };

  const confidenceStyle = getConfidenceStyle();
  const sizeStyles = getSizeStyles();

  return (
    <StyledView 
      className={`
        flex-row items-center rounded-full border
        ${confidenceStyle.bgColor} 
        ${confidenceStyle.borderColor}
        ${sizeStyles.container}
        ${className}
      `}
    >
      {showIcon && (
        <Ionicons
          name={confidenceStyle.icon}
          size={sizeStyles.icon}
          color={confidenceStyle.textColor.includes('green') ? '#166534' : 
                 confidenceStyle.textColor.includes('yellow') ? '#92400e' : '#991b1b'}
          style={{ marginRight: showPercentage ? 4 : 0 }}
        />
      )}
      
      {showPercentage && (
        <StyledText 
          className={`
            ${confidenceStyle.textColor} 
            ${sizeStyles.text} 
            font-sf-pro font-medium
          `}
        >
          {percentage}%
        </StyledText>
      )}
    </StyledView>
  );
};