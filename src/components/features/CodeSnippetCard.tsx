import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Tag } from '../common/Tag';
import { AppSnippet } from '../../types/database';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

export interface CodeSnippetCardProps {
  snippet: AppSnippet;
  onPress?: () => void;
  onFavoritePress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  showActions?: boolean;
}

export const CodeSnippetCard: React.FC<CodeSnippetCardProps> = ({
  snippet,
  onPress,
  onFavoritePress,
  onEditPress,
  onDeletePress,
  showActions = true
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      javascript: '#F7DF1E',
      typescript: '#3178C6',
      python: '#3776AB',
      swift: '#FA7343',
      java: '#ED8B00',
      kotlin: '#7F52FF',
      go: '#00ADD8',
      rust: '#000000',
      cpp: '#00599C',
      csharp: '#239120',
    };
    return colors[language?.toLowerCase() || ''] || '#6B7280';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card variant="default" padding="none" onPress={onPress}>
      <StyledView className="p-md">
        {/* Header */}
        <StyledView className="flex-row items-start justify-between mb-sm">
          <StyledView className="flex-1 mr-sm">
            {snippet.language && (
              <Tag
                label={snippet.language}
                color={getLanguageColor(snippet.language)}
                size="small"
                variant="filled"
              />
            )}
          </StyledView>
          
          <StyledView className="flex-row items-center">
            <StyledText className="text-caption1 font-sf-pro text-gray-500 mr-sm">
              {formatDate(snippet.created_at)}
            </StyledText>
            
            {showActions && (
              <StyledView className="flex-row">
                <StyledTouchableOpacity
                  onPress={onFavoritePress}
                  className="p-1 mr-1"
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons
                    name={snippet.is_favorite ? 'heart' : 'heart-outline'}
                    size={16}
                    color={snippet.is_favorite ? '#FF3B30' : '#8E8E93'}
                  />
                </StyledTouchableOpacity>
                
                <StyledTouchableOpacity
                  onPress={onEditPress}
                  className="p-1"
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="ellipsis-horizontal" size={16} color="#8E8E93" />
                </StyledTouchableOpacity>
              </StyledView>
            )}
          </StyledView>
        </StyledView>

        {/* Code Content */}
        <StyledView className="mb-sm">
          <StyledText className="text-footnote font-sf-mono text-gray-800 leading-relaxed">
            {truncateText(snippet.extracted_text)}
          </StyledText>
        </StyledView>

        {/* Footer */}
        <StyledView className="flex-row items-center justify-between">
          {snippet.screenshot_url && (
            <StyledView className="flex-row items-center">
              <Ionicons name="camera" size={12} color="#8E8E93" />
              <StyledText className="text-caption2 font-sf-pro text-gray-500 ml-1">
                Screenshot
              </StyledText>
            </StyledView>
          )}
          
          {snippet.ocr_confidence && (
            <StyledView className="flex-row items-center">
              <Ionicons 
                name={snippet.ocr_confidence > 80 ? 'checkmark-circle' : 'warning'} 
                size={12} 
                color={snippet.ocr_confidence > 80 ? '#34C759' : '#FF9500'} 
              />
              <StyledText className="text-caption2 font-sf-pro text-gray-500 ml-1">
                {Math.round(snippet.ocr_confidence)}% confidence
              </StyledText>
            </StyledView>
          )}
        </StyledView>
      </StyledView>
    </Card>
  );
};