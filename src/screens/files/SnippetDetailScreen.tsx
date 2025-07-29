import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FilesStackParamList, RootStackParamList } from '../../types/navigation';
import { AppSnippet, AppFile } from '../../types/database';
import { supabase, supabaseHelpers } from '../../lib/supabase';
import { LoadingState } from '../../components/common/LoadingState';
import { Button } from '../../components/common/Button';
import { Tag } from '../../components/common/Tag';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);

type SnippetDetailScreenRouteProp = RouteProp<FilesStackParamList, 'SnippetDetail'>;
type SnippetDetailScreenNavigationProp = NativeStackNavigationProp<FilesStackParamList, 'SnippetDetail'>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SnippetWithFile extends AppSnippet {
  file: AppFile;
}

export const SnippetDetailScreen: React.FC = () => {
  const filesNavigation = useNavigation<SnippetDetailScreenNavigationProp>();
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<SnippetDetailScreenRouteProp>();
  const { snippetId, fileId } = route.params;

  const [snippet, setSnippet] = useState<SnippetWithFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchSnippetData();
  }, [snippetId]);

  const fetchSnippetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('snippets')
        .select(`
          *,
          file:files(*)
        `)
        .eq('id', snippetId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to load snippet: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Snippet not found');
      }

      setSnippet(data as SnippetWithFile);

      // Record analytics for snippet view
      await supabaseHelpers.recordAnalytics('snippet_viewed', {
        snippetId,
        fileId,
        language: data.language
      });

    } catch (err) {
      console.error('Error fetching snippet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load snippet');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!snippet) return;

    try {
      await Clipboard.setStringAsync(snippet.extracted_text);
      Alert.alert('Copied!', 'Code copied to clipboard');
      
      // Record analytics
      await supabaseHelpers.recordAnalytics('code_copied', {
        snippetId,
        fileId,
        language: snippet.language
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to copy code to clipboard');
    }
  };

  const handleToggleFavorite = async () => {
    if (!snippet || favoriteLoading) return;

    try {
      setFavoriteLoading(true);
      
      const newFavoriteStatus = !snippet.is_favorite;
      
      const { error: updateError } = await supabase
        .from('snippets')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', snippetId);

      if (updateError) {
        throw new Error(`Failed to update favorite: ${updateError.message}`);
      }

      setSnippet(prev => prev ? { ...prev, is_favorite: newFavoriteStatus } : null);

      // Record analytics
      await supabaseHelpers.recordAnalytics(newFavoriteStatus ? 'snippet_favorited' : 'snippet_unfavorited', {
        snippetId,
        fileId,
        language: snippet.language
      });

    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorite status');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShareSnippet = async () => {
    if (!snippet) return;

    try {
      const shareContent = {
        message: `Check out this ${snippet.language || 'code'} snippet:\n\n${snippet.extracted_text}`,
        title: `Code Snippet from ${snippet.file.title}`
      };

      if (Platform.OS === 'ios') {
        await Share.share(shareContent);
      } else {
        await Share.share({ message: shareContent.message });
      }

      // Record analytics
      await supabaseHelpers.recordAnalytics('snippet_shared', {
        snippetId,
        fileId,
        language: snippet.language
      });

    } catch (err) {
      console.error('Error sharing snippet:', err);
      Alert.alert('Error', 'Failed to share snippet');
    }
  };

  const handleEditSnippet = () => {
    // Navigate to edit modal
    navigation.navigate('Modal', {
      screen: 'EditSnippet',
      params: { snippetId }
    });
  };

  const handleDeleteSnippet = () => {
    if (!snippet) return;

    Alert.alert(
      'Delete Snippet',
      'Are you sure you want to delete this snippet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDeleteSnippet
        }
      ]
    );
  };

  const confirmDeleteSnippet = async () => {
    if (!snippet) return;

    try {
      const { error: deleteError } = await supabase
        .from('snippets')
        .delete()
        .eq('id', snippetId);

      if (deleteError) {
        throw new Error(`Failed to delete snippet: ${deleteError.message}`);
      }

      // Update file snippet count
      await supabase
        .from('files')
        .update({ 
          snippet_count: Math.max(0, (snippet.file.snippet_count || 1) - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      // Record analytics
      await supabaseHelpers.recordAnalytics('snippet_deleted', {
        snippetId,
        fileId,
        language: snippet.language
      });

      Alert.alert('Deleted', 'Snippet deleted successfully');
      filesNavigation.goBack();

    } catch (err) {
      console.error('Error deleting snippet:', err);
      Alert.alert('Error', 'Failed to delete snippet');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const renderScreenshot = () => {
    if (!snippet?.screenshot_url) return null;

    const isBase64 = snippet.screenshot_url.startsWith('data:');
    
    return (
      <StyledView className="mb-lg">
        <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-sm">
          Screenshot
        </StyledText>
        <StyledView className="bg-gray-50 rounded-lg overflow-hidden">
          <StyledImage
            source={{ uri: snippet.screenshot_url }}
            className="w-full h-48"
            resizeMode="contain"
          />
        </StyledView>
      </StyledView>
    );
  };

  const renderCodeBlock = () => {
    if (!snippet) return null;

    return (
      <StyledView className="mb-lg">
        <StyledView className="flex-row items-center justify-between mb-sm">
          <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
            Code
          </StyledText>
          <Button
            title="Copy"
            onPress={handleCopyCode}
            variant="secondary"
            size="small"
            leftIcon={<Ionicons name="copy-outline" size={16} color="#6B7280" />}
          />
        </StyledView>
        
        <StyledView className="bg-gray-900 rounded-lg p-md">
          <StyledText 
            className="text-footnote font-sf-mono text-green-400 leading-relaxed"
            selectable
          >
            {snippet.extracted_text}
          </StyledText>
        </StyledView>
        
        {snippet.ocr_confidence && (
          <StyledView className="flex-row items-center mt-sm">
            <Ionicons 
              name={snippet.ocr_confidence > 80 ? 'checkmark-circle' : 'warning'} 
              size={16} 
              color={snippet.ocr_confidence > 80 ? '#34C759' : '#FF9500'} 
            />
            <StyledText className="text-caption1 font-sf-pro text-gray-500 ml-sm">
              OCR Confidence: {Math.round(snippet.ocr_confidence)}%
            </StyledText>
          </StyledView>
        )}
      </StyledView>
    );
  };

  const renderFileContext = () => {
    if (!snippet) return null;

    return (
      <StyledView className="mb-lg">
        <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-sm">
          File Context
        </StyledText>
        
        <StyledTouchableOpacity
          className="bg-blue-50 rounded-lg p-md border border-blue-100"
          onPress={() => filesNavigation.navigate('FileDetail', { 
            fileId, 
            fileName: snippet.file.title 
          })}
        >
          <StyledView className="flex-row items-center justify-between">
            <StyledView className="flex-1">
              <StyledText className="text-body font-sf-pro font-semibold text-gray-900 mb-xs">
                {snippet.file.title}
              </StyledText>
              {snippet.file.description && (
                <StyledText className="text-caption1 font-sf-pro text-gray-600 mb-sm">
                  {snippet.file.description}
                </StyledText>
              )}
              <StyledView className="flex-row items-center">
                <StyledText className="text-caption2 font-sf-pro text-gray-500">
                  {snippet.file.snippet_count || 0} snippet{(snippet.file.snippet_count || 0) !== 1 ? 's' : ''}
                </StyledText>
                <StyledText className="text-caption2 font-sf-pro text-gray-400 mx-sm">•</StyledText>
                <StyledText className="text-caption2 font-sf-pro text-gray-500">
                  Updated {formatDate(snippet.file.updated_at).split(',')[0]}
                </StyledText>
              </StyledView>
            </StyledView>
            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
          </StyledView>
        </StyledTouchableOpacity>
      </StyledView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState message="Loading snippet..." />
      </SafeAreaView>
    );
  }

  if (error || !snippet) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StyledView className="flex-1 items-center justify-center px-lg">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <StyledText className="text-title2 font-sf-pro-display font-bold text-gray-900 text-center mt-md mb-sm">
            {error || 'Snippet Not Found'}
          </StyledText>
          <StyledText className="text-body font-sf-pro text-gray-600 text-center mb-lg">
            {error || 'The snippet you\'re looking for could not be found.'}
          </StyledText>
          <Button
            title="Go Back"
            onPress={() => filesNavigation.goBack()}
            variant="primary"
          />
        </StyledView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <StyledView className="flex-row items-center justify-between px-lg py-sm border-b border-gray-200">
        <StyledTouchableOpacity
          onPress={() => filesNavigation.goBack()}
          className="p-sm -ml-sm"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </StyledTouchableOpacity>
        
        <StyledView className="flex-1 items-center">
          <StyledText className="text-body font-sf-pro-display font-semibold text-gray-900">
            Code Snippet
          </StyledText>
        </StyledView>
        
        <StyledView className="flex-row">
          <StyledTouchableOpacity
            onPress={handleToggleFavorite}
            className="p-sm mr-xs"
            disabled={favoriteLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={snippet.is_favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={snippet.is_favorite ? '#FF3B30' : '#8E8E93'}
            />
          </StyledTouchableOpacity>
          
          <StyledTouchableOpacity
            onPress={handleShareSnippet}
            className="p-sm"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>

      <StyledScrollView className="flex-1 px-lg">
        {/* Metadata */}
        <StyledView className="py-lg">
          <StyledView className="flex-row items-center justify-between mb-md">
            <StyledView className="flex-row items-center">
              {snippet.language && (
                <Tag
                  label={snippet.language}
                  color={getLanguageColor(snippet.language)}
                  size="medium"
                  variant="filled"
                />
              )}
            </StyledView>
            <StyledText className="text-caption1 font-sf-pro text-gray-500">
              {formatDate(snippet.created_at)}
            </StyledText>
          </StyledView>

          {/* File tags */}
          {snippet.file.tags && snippet.file.tags.length > 0 && (
            <StyledView className="flex-row flex-wrap mb-md">
              {snippet.file.tags.map((tag, index) => (
                <Tag
                  key={index}
                  label={tag}
                  color="#6B7280"
                  size="small"
                  variant="outlined"
                  style={{ marginRight: 8, marginBottom: 8 }}
                />
              ))}
            </StyledView>
          )}
        </StyledView>

        {/* Screenshot */}
        {renderScreenshot()}

        {/* Code Block */}
        {renderCodeBlock()}

        {/* File Context */}
        {renderFileContext()}

        {/* Actions */}
        <StyledView className="py-lg">
          <StyledView className="flex-row space-x-sm">
            <StyledView className="flex-1">
              <Button
                title="Edit"
                onPress={handleEditSnippet}
                variant="secondary"
                leftIcon={<Ionicons name="pencil-outline" size={18} color="#6B7280" />}
              />
            </StyledView>
            <StyledView className="flex-1">
              <Button
                title="Delete"
                onPress={handleDeleteSnippet}
                variant="destructive"
                leftIcon={<Ionicons name="trash-outline" size={18} color="white" />}
              />
            </StyledView>
          </StyledView>
        </StyledView>

        {/* Bottom padding for scroll */}
        <StyledView className="h-8" />
      </StyledScrollView>
    </SafeAreaView>
  );
};