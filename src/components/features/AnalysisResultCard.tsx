import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

// Components
import { Card, ConfidenceBadge } from '../common';
import { ClassificationResult } from '../../types/database';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export interface AnalysisResultCardProps {
  classification?: ClassificationResult;
  ocrConfidence?: number;
  className?: string;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  classification,
  ocrConfidence,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!classification) return null;

  const { language, topic } = classification;

  return (
    <Card variant="elevated" className={`mb-xl ${className}`}>
      <StyledView className="p-md">
        {/* Header with expand/collapse */}
        <StyledTouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center justify-between mb-md"
          activeOpacity={0.7}
        >
          <StyledText className="text-body font-sf-pro text-gray-900 font-semibold">
            AI Analysis Results
          </StyledText>
          <StyledView className="flex-row items-center">
            {ocrConfidence && (
              <ConfidenceBadge 
                confidence={ocrConfidence} 
                size="small" 
                className="mr-sm"
              />
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#8E8E93"
            />
          </StyledView>
        </StyledTouchableOpacity>

        {isExpanded && (
          <StyledView>
            {/* Language Detection Section */}
            <StyledView className="mb-lg">
              <StyledView className="flex-row items-center mb-sm">
                <StyledView className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-sm">
                  <Ionicons name="code" size={16} color="#2563EB" />
                </StyledView>
                <StyledText className="text-subheadline font-sf-pro text-gray-900 font-medium">
                  Language Detection
                </StyledText>
              </StyledView>
              
              <StyledView className="flex-row items-center justify-between bg-gray-50 rounded-lg px-md py-sm">
                <StyledView>
                  <StyledText className="text-body font-sf-pro text-gray-900 font-medium capitalize">
                    {language?.language || 'Unknown'}
                  </StyledText>
                  {language?.confidence && (
                    <StyledText className="text-caption1 font-sf-pro text-gray-600 mt-0.5">
                      Based on code patterns and syntax
                    </StyledText>
                  )}
                </StyledView>
                {language?.confidence && (
                  <ConfidenceBadge 
                    confidence={language.confidence} 
                    size="small"
                  />
                )}
              </StyledView>
            </StyledView>

            {/* Topic Analysis Section */}
            <StyledView className="mb-lg">
              <StyledView className="flex-row items-center mb-sm">
                <StyledView className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-sm">
                  <Ionicons name="folder" size={16} color="#7C3AED" />
                </StyledView>
                <StyledText className="text-subheadline font-sf-pro text-gray-900 font-medium">
                  Topic Analysis
                </StyledText>
              </StyledView>
              
              <StyledView className="bg-gray-50 rounded-lg px-md py-sm">
                <StyledView className="flex-row items-center justify-between mb-sm">
                  <StyledView>
                    <StyledText className="text-body font-sf-pro text-gray-900 font-medium capitalize">
                      {topic?.primaryTopic || 'General Code'}
                    </StyledText>
                    {topic?.confidence && (
                      <StyledText className="text-caption1 font-sf-pro text-gray-600 mt-0.5">
                        Primary topic identified
                      </StyledText>
                    )}
                  </StyledView>
                  {topic?.confidence && (
                    <ConfidenceBadge 
                      confidence={topic.confidence} 
                      size="small"
                    />
                  )}
                </StyledView>

                {/* Suggested Tags */}
                {topic?.suggestedTags && topic.suggestedTags.length > 0 && (
                  <StyledView className="mt-sm pt-sm border-t border-gray-200">
                    <StyledText className="text-caption1 font-sf-pro text-gray-600 mb-xs">
                      Suggested Tags:
                    </StyledText>
                    <StyledView className="flex-row flex-wrap">
                      {topic.suggestedTags.slice(0, 3).map((tag, index) => (
                        <StyledView
                          key={index}
                          className="bg-blue-50 border border-blue-200 rounded-full px-2 py-1 mr-xs mb-xs"
                        >
                          <StyledText className="text-caption2 font-sf-pro text-blue-700">
                            {tag}
                          </StyledText>
                        </StyledView>
                      ))}
                    </StyledView>
                  </StyledView>
                )}
              </StyledView>
            </StyledView>

          </StyledView>
        )}
      </StyledView>
    </Card>
  );
};