import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../common/Tag';
import { AppFile } from '../../types/database';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export interface FileCardProps {
  file: AppFile;
  onPress?: () => void;
  onOptionsPress?: () => void;
  showOptions?: boolean;
  showSequence?: boolean;
  orderBy?: 'sequence' | 'updated' | 'created' | 'accessed';
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onPress,
  onOptionsPress,
  showOptions = true,
  showSequence = true,
  orderBy = 'sequence'
}) => {
  // Extract primary topic from title (remove language prefix and numbers)
  const getPrimaryTopic = (title: string) => {
    // Remove language prefixes like "javascript-", "python-", etc.
    const withoutLanguage = title.replace(/^(javascript|typescript|python|swift|java|kotlin|go|rust|cpp|csharp|c\+\+)-/i, '');
    // Remove trailing numbers like " 2", " 3", etc.
    const withoutNumbers = withoutLanguage.replace(/\s+\d+$/, '');
    // Capitalize first letter
    return withoutNumbers.charAt(0).toUpperCase() + withoutNumbers.slice(1);
  };
  const formatDate = (dateString: string, type: 'relative' | 'absolute' = 'relative') => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const diffInMinutes = diffInHours * 60;
    
    if (type === 'absolute') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
    
    // Enhanced relative time formatting
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 1 week
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
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

  return (
    <StyledTouchableOpacity 
      onPress={onPress} 
      className="bg-white active:bg-gray-50"
      activeOpacity={0.7}
    >
      <StyledView className="p-md">
        {/* Header */}
        <StyledView className="flex-row items-start justify-between mb-sm">
          <StyledView className="flex-1 mr-sm">
            <StyledView className="flex-row items-center mb-1">
              {/* ULTRA FIX: Only show sequence if it exists and is valid */}
              {showSequence && file.sequence_number && typeof file.sequence_number === 'number' && (
                <StyledView className="bg-blue-100 rounded-full px-2 py-0.5 mr-2">
                  <StyledText className="text-caption2 font-sf-pro text-blue-600 font-medium">
                    #{file.sequence_number}
                  </StyledText>
                </StyledView>
              )}
              <StyledText 
                className="text-headline font-sf-pro text-gray-900 font-semibold flex-1" 
                numberOfLines={2}
              >
                {file.title}
              </StyledText>
            </StyledView>
            
            {/* Show primary topic instead of generic description */}
            <StyledText 
              className="text-footnote font-sf-pro text-gray-600" 
              numberOfLines={1}
            >
              {getPrimaryTopic(file.title)}
            </StyledText>
          </StyledView>
          
          {showOptions && (
            <StyledTouchableOpacity
              onPress={onOptionsPress}
              className="p-1"
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
            </StyledTouchableOpacity>
          )}
        </StyledView>
        
        {/* Tags - Show top 2 topic tags only */}
        {file.tags && file.tags.length > 0 && (
          <StyledView className="flex-row flex-wrap mb-sm">
            {file.tags.slice(0, 2).map((tag, index) => (
              <Tag
                key={`tag-${index}`}
                label={tag}
                size="small"
                variant="outlined"
                style={{ marginRight: 4, marginBottom: 4 }}
              />
            ))}
            {file.tags.length > 2 && (
              <Tag
                key="more-tags"
                label={`+${file.tags.length - 2}`}
                size="small"
                variant="ghost"
                style={{ marginBottom: 4 }}
              />
            )}
          </StyledView>
        )}
        
        {/* Footer */}
        <StyledView className="flex-row items-center justify-between">
          <StyledView className="flex-row items-center">
            {/* Enhanced snippet count with badge style */}
            <StyledView className="bg-blue-50 rounded-full px-2 py-1 flex-row items-center">
              <Ionicons name="document-text-outline" size={12} color="#2563EB" />
              <StyledText className="text-caption1 font-sf-pro text-blue-600 font-medium ml-1">
                {file.snippet_count}
              </StyledText>
            </StyledView>
            {/* Add indicator for multi-snippet files */}
            {file.snippet_count > 1 && (
              <StyledView className="ml-2 flex-row items-center">
                <Ionicons name="layers-outline" size={12} color="#8E8E93" />
                <StyledText className="text-caption2 font-sf-pro text-gray-500 ml-1">
                  Multi-part
                </StyledText>
              </StyledView>
            )}
          </StyledView>
          
          <StyledView className="flex-row items-center">
            <Ionicons 
              name={orderBy === 'updated' ? 'pencil-outline' : 
                   orderBy === 'created' ? 'add-circle-outline' :
                   orderBy === 'accessed' ? 'eye-outline' : 'time-outline'} 
              size={14} 
              color="#8E8E93" 
            />
            <StyledText className="text-caption1 font-sf-pro text-gray-500 ml-1">
              {orderBy === 'updated' && formatDate(file.updated_at)}
              {orderBy === 'created' && formatDate(file.created_at)}
              {/* ULTRA FIX: Use updated_at as fallback for last_accessed_at */}
              {orderBy === 'accessed' && formatDate(file.last_accessed_at || file.updated_at)}
              {orderBy === 'sequence' && formatDate(file.updated_at)}
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>
    </StyledTouchableOpacity>
  );
};