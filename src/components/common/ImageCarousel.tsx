import React, { useState } from 'react';
import { View, ScrollView, Image, Dimensions, TouchableOpacity, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledScrollView = styled(ScrollView);
const StyledImage = styled(Image);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

export interface ImageCarouselProps {
  images: string[];
  height?: number;
  onImagePress?: (index: number) => void;
  showIndicators?: boolean;
  className?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 160,
  onImagePress,
  showIndicators = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    // Single image display
    return (
      <StyledView className={`${className}`}>
        <StyledTouchableOpacity
          onPress={() => onImagePress?.(0)}
          activeOpacity={0.8}
        >
          <StyledImage
            source={{ uri: images[0] }}
            style={{ width: '100%', height }}
            className="rounded-md"
            resizeMode="contain"
          />
        </StyledTouchableOpacity>
      </StyledView>
    );
  }

  // Multiple images carousel
  return (
    <StyledView className={`${className}`}>
      <StyledScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ height }}
      >
        {images.map((imageUri, index) => (
          <StyledTouchableOpacity
            key={index}
            onPress={() => onImagePress?.(index)}
            activeOpacity={0.8}
            style={{ width: screenWidth - 32 }} // Account for padding
          >
            <StyledImage
              source={{ uri: imageUri }}
              style={{ width: '100%', height }}
              className="rounded-md"
              resizeMode="contain"
            />
          </StyledTouchableOpacity>
        ))}
      </StyledScrollView>

      {/* Page Indicators */}
      {showIndicators && images.length > 1 && (
        <StyledView className="flex-row justify-center mt-sm">
          {images.map((_, index) => (
            <StyledView
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </StyledView>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <StyledView className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full px-2 py-1">
          <StyledText className="text-white text-caption2 font-sf-pro">
            {currentIndex + 1} / {images.length}
          </StyledText>
        </StyledView>
      )}
    </StyledView>
  );
};