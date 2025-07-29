import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#007AFF',
  backgroundColor = '#E5E5EA',
  height = 8,
  showLabel = false,
  label,
  animated = true,
  style
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const progressWidth = `${clampedProgress}%`;

  return (
    <StyledView style={style}>
      {showLabel && (
        <StyledView className="flex-row justify-between items-center mb-xs">
          <StyledText className="text-footnote font-sf-pro text-gray-700">
            {label || 'Progress'}
          </StyledText>
          <StyledText className="text-footnote font-sf-pro text-gray-500 font-medium">
            {Math.round(clampedProgress)}%
          </StyledText>
        </StyledView>
      )}
      
      <StyledView
        className="w-full rounded-full overflow-hidden"
        style={{
          height,
          backgroundColor
        }}
      >
        <StyledView
          className={`h-full rounded-full ${animated ? 'transition-all duration-300' : ''}`}
          style={{
            width: progressWidth as any, // NativeWind handles string percentages
            backgroundColor: color
          }}
        />
      </StyledView>
    </StyledView>
  );
};