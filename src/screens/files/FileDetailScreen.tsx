import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  FlatList,
  Dimensions
} from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Types
import { FilesStackScreenProps } from '../../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { AppFile, AppSnippet } from '../../types/database';

// Services & Helpers
import { supabase, supabaseHelpers } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

// Components
import {
  LoadingState,
  EmptyState,
  Button,
  Card,
  Tag
} from '../../components/common';
import { CodeSnippetCard } from '../../components/features';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

type FileDetailScreenProps = FilesStackScreenProps<'FileDetail'>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FileDetailScreen: React.FC<FileDetailScreenProps> = ({
  route,
  navigation: filesNavigation
}) => {
  const navigation = useNavigation<RootNavigationProp>();
  const { fileId, fileName } = route.params;
  const { user } = useAuth();
  
  // State
  const [file, setFile] = useState<AppFile | null>(null);
  const [snippets, setSnippets] = useState<AppSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch file data
  const fetchFileData = useCallback(async (showLoader = true) => {
    if (!user) return;
    
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const fileData = await supabaseHelpers.getFileWithSnippets(fileId);
      
      if (fileData) {
        setFile(fileData);
        setSnippets(fileData.snippets || []);
      } else {
        setError('File not found');
      }
    } catch (err) {
      console.error('Error fetching file data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fileId, user]);

  // Initial load and focus refresh
  useEffect(() => {
    fetchFileData();
  }, [fetchFileData]);

  useFocusEffect(
    useCallback(() => {
      if (file) {
        fetchFileData(false); // Refresh without showing loader
      }
    }, [fetchFileData, file])
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFileData(false);
  }, [fetchFileData]);

  // Navigate to snippet detail
  const handleSnippetPress = useCallback((snippet: AppSnippet) => {
    filesNavigation.navigate('SnippetDetail', {
      snippetId: snippet.id,
      fileId: fileId
    });
  }, [filesNavigation, fileId]);

  // Toggle snippet favorite
  const handleToggleFavorite = useCallback(async (snippet: AppSnippet) => {
    if (!user) return;
    
    try {
      setActionLoading(`favorite-${snippet.id}`);
      
      const { error } = await supabase
        .from('snippets')
        .update({ is_favorite: !snippet.is_favorite })
        .eq('id', snippet.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setSnippets(prev => 
        prev.map(s => 
          s.id === snippet.id 
            ? { ...s, is_favorite: !s.is_favorite }
            : s
        )
      );
      
      // Record analytics
      await supabaseHelpers.recordAnalytics('snippet_favorited', {
        snippetId: snippet.id,
        fileId: fileId,
        isFavorite: !snippet.is_favorite
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorite status');
    } finally {
      setActionLoading(null);
    }
  }, [user, fileId]);

  // Edit file
  const handleEditFile = useCallback(() => {
    if (!file) return;
    
    navigation.navigate('Modal', {
      screen: 'EditFile',
      params: { fileId }
    });
  }, [file, fileId]);

  // Delete file
  const handleDeleteFile = useCallback(() => {
    if (!file || !user) return;
    
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.title}"? This will also delete all ${snippets.length} snippet(s) in this file. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('delete');
              
              // Delete all snippets first
              const { error: snippetsError } = await supabase
                .from('snippets')
                .delete()
                .eq('file_id', fileId)
                .eq('user_id', user.id);
              
              if (snippetsError) throw snippetsError;
              
              // Delete the file
              const { error: fileError } = await supabase
                .from('files')
                .delete()
                .eq('id', fileId)
                .eq('user_id', user.id);
              
              if (fileError) throw fileError;
              
              // Record analytics
              await supabaseHelpers.recordAnalytics('file_deleted', {
                fileId: fileId,
                snippetCount: snippets.length
              });
              
              // Navigate back
              filesNavigation.goBack();
            } catch (err) {
              console.error('Error deleting file:', err);
              Alert.alert('Error', 'Failed to delete file. Please try again.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  }, [file, user, fileId, snippets.length, navigation]);

  // Share file
  const handleShareFile = useCallback(async () => {
    if (!file) return;
    
    try {
      setActionLoading('share');
      
      const shareContent = snippets
        .map((snippet, index) => `// Snippet ${index + 1}\n${snippet.extracted_text}`)
        .join('\n\n---\n\n');
      
      const shareMessage = `${file.title}\n\n${shareContent}`;
      
      await Share.share({
        message: shareMessage,
        title: file.title
      });
      
      // Record analytics
      await supabaseHelpers.recordAnalytics('file_shared', {
        fileId: fileId,
        snippetCount: snippets.length
      });
    } catch (err) {
      console.error('Error sharing file:', err);
      Alert.alert('Error', 'Failed to share file');
    } finally {
      setActionLoading(null);
    }
  }, [file, snippets, fileId]);

  // Get language color
  const getLanguageColor = useCallback((language: string | null) => {
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
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 1 week
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }, []);

  // Render snippet item
  const renderSnippet = useCallback(({ item: snippet }: { item: AppSnippet }) => (
    <StyledView className="mb-md">
      <CodeSnippetCard
        snippet={snippet}
        onPress={() => handleSnippetPress(snippet)}
        onFavoritePress={() => handleToggleFavorite(snippet)}
        showActions={true}
      />
    </StyledView>
  ), [handleSnippetPress, handleToggleFavorite]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-secondary">
        <LoadingState message="Loading file details..." />
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !file) {
    return (
      <SafeAreaView className="flex-1 bg-background-secondary">
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={48} color="#8E8E93" />}
          title="File Not Found"
          description={error || "This file doesn't exist or you don't have permission to view it."}
          actionButton={{
            title: "Go Back",
            onPress: () => filesNavigation.goBack(),
            variant: 'primary'
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-secondary">
      <StyledScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* File Header */}
        <StyledView className="bg-white mb-lg shadow-ios-sm">
          <StyledView className="px-lg py-lg">
            {/* Title and Description */}
            <StyledText className="text-title1 font-sf-pro-display text-gray-900 font-bold mb-xs">
              {file.title}
            </StyledText>
            
            {file.description && (
              <StyledText className="text-body font-sf-pro text-gray-600 mb-md leading-relaxed">
                {file.description}
              </StyledText>
            )}
            
            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <StyledView className="flex-row flex-wrap mb-md">
                {file.language && (
                  <Tag
                    key={`lang-${file.language}`}
                    label={file.language}
                    color={getLanguageColor(file.language)}
                    size="medium"
                    variant="filled"
                    style={{ marginRight: 8, marginBottom: 8 }}
                  />
                )}
                {file.tags.map((tag, index) => (
                  <Tag
                    key={`tag-${index}`}
                    label={tag}
                    size="medium"
                    variant="outlined"
                    style={{ marginRight: 8, marginBottom: 8 }}
                  />
                ))}
              </StyledView>
            )}
            
            {/* File Stats */}
            <StyledView className="flex-row items-center justify-between mb-lg">
              <StyledView className="flex-row items-center">
                <Ionicons name="document-text" size={16} color="#007AFF" />
                <StyledText className="text-footnote font-sf-pro text-gray-600 ml-xs">
                  {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
                </StyledText>
              </StyledView>
              
              <StyledView className="flex-row items-center">
                <Ionicons name="time" size={16} color="#8E8E93" />
                <StyledText className="text-footnote font-sf-pro text-gray-500 ml-xs">
                  Updated {formatDate(file.updated_at)}
                </StyledText>
              </StyledView>
            </StyledView>
            
            {/* Action Buttons */}
            <StyledView className="flex-row">
              <StyledView className="flex-1 mr-sm">
                <Button
                  title="Share"
                  onPress={handleShareFile}
                  variant="secondary"
                  size="medium"
                  loading={actionLoading === 'share'}
                  leftIcon={<Ionicons name="share-outline" size={16} color="#007AFF" />}
                />
              </StyledView>
              
              <StyledView className="flex-1 mx-xs">
                <Button
                  title="Edit"
                  onPress={handleEditFile}
                  variant="secondary"
                  size="medium"
                  loading={actionLoading === 'edit'}
                  leftIcon={<Ionicons name="create-outline" size={16} color="#007AFF" />}
                />
              </StyledView>
              
              <StyledView className="flex-1 ml-sm">
                <Button
                  title="Delete"
                  onPress={handleDeleteFile}
                  variant="destructive"
                  size="medium"
                  loading={actionLoading === 'delete'}
                  leftIcon={<Ionicons name="trash-outline" size={16} color="white" />}
                />
              </StyledView>
            </StyledView>
          </StyledView>
        </StyledView>
        
        {/* Snippets Section */}
        <StyledView className="px-lg pb-xl">
          <StyledView className="flex-row items-center justify-between mb-md">
            <StyledText className="text-title3 font-sf-pro-display text-gray-900 font-semibold">
              Code Snippets
            </StyledText>
            
            {snippets.length > 0 && (
              <StyledText className="text-footnote font-sf-pro text-gray-500">
                {snippets.filter(s => s.is_favorite).length} favorite{snippets.filter(s => s.is_favorite).length !== 1 ? 's' : ''}
              </StyledText>
            )}
          </StyledView>
          
          {snippets.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Ionicons name="code-slash-outline" size={48} color="#8E8E93" />}
                title="No Code Snippets"
                description="This file doesn't contain any code snippets yet. Add some screenshots to get started!"
                style={{ paddingVertical: 40 }}
              />
            </Card>
          ) : (
            <StyledView className="pb-md">
              {snippets.map((snippet, index) => (
                <StyledView key={snippet.id} className="mb-md">
                  <CodeSnippetCard
                    snippet={snippet}
                    onPress={() => handleSnippetPress(snippet)}
                    onFavoritePress={() => handleToggleFavorite(snippet)}
                    showActions={true}
                  />
                </StyledView>
              ))}
            </StyledView>
          )}
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};