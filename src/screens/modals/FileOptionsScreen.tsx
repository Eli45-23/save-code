import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Share, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ModalStackScreenProps } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

type FileRow = Database['public']['Tables']['files']['Row'];

interface FileOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  destructive?: boolean;
  onPress: () => void;
}

type Props = ModalStackScreenProps<'FileOptions'>;

export const FileOptionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { fileId } = route.params;
  const [file, setFile] = useState<FileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    loadFile();
  }, []);

  const loadFile = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;
      
      setFile(data);
      setNewFileName(data.title);
    } catch (error) {
      console.error('Error loading file:', error);
      Alert.alert('Error', 'Failed to load file');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!file || !newFileName.trim()) return;
    
    setRenaming(true);
    try {
      const { error } = await supabase
        .from('files')
        .update({ title: newFileName.trim() })
        .eq('id', fileId);

      if (error) throw error;
      
      setFile({ ...file, title: newFileName.trim() });
      setShowRenameModal(false);
      Alert.alert('Success', 'File renamed successfully');
    } catch (error) {
      console.error('Error renaming file:', error);
      Alert.alert('Error', 'Failed to rename file');
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = () => {
    if (!file) return;
    
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.title}"? This will also delete all snippets in this file. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // First delete all snippets in the file
              const { error: snippetsError } = await supabase
                .from('snippets')
                .delete()
                .eq('file_id', fileId);

              if (snippetsError) throw snippetsError;

              // Then delete the file
              const { error: fileError } = await supabase
                .from('files')
                .delete()
                .eq('id', fileId);

              if (fileError) throw fileError;

              Alert.alert('Success', 'File deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          }
        }
      ]
    );
  };

  const handleDuplicate = async () => {
    if (!file) return;
    
    try {
      // Create a copy of the file
      const { data: newFile, error: fileError } = await supabase
        .from('files')
        .insert({
          user_id: file.user_id,
          title: `${file.title} (Copy)`,
          description: file.description,
          language: file.language,
          tags: file.tags
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Get all snippets from the original file
      const { data: snippets, error: snippetsError } = await supabase
        .from('snippets')
        .select('*')
        .eq('file_id', fileId);

      if (snippetsError) throw snippetsError;

      // Duplicate all snippets
      if (snippets && snippets.length > 0) {
        const newSnippets = snippets.map(snippet => ({
          file_id: newFile.id,
          user_id: snippet.user_id,
          screenshot_url: snippet.screenshot_url,
          extracted_text: snippet.extracted_text,
          ocr_confidence: snippet.ocr_confidence,
          language: snippet.language,
          position_in_file: snippet.position_in_file,
          is_favorite: snippet.is_favorite
        }));

        const { error: insertError } = await supabase
          .from('snippets')
          .insert(newSnippets);

        if (insertError) throw insertError;
      }

      Alert.alert('Success', 'File duplicated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error duplicating file:', error);
      Alert.alert('Error', 'Failed to duplicate file');
    }
  };

  const handleExport = async () => {
    if (!file) return;
    
    try {
      // Get all snippets for this file
      const { data: snippets, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('file_id', fileId)
        .order('position_in_file');

      if (error) throw error;

      // Create export content
      const exportContent = [
        `# ${file.title}`,
        file.description ? `\n${file.description}` : '',
        `\nLanguage: ${file.language || 'Not specified'}`,
        `Tags: ${file.tags?.join(', ') || 'None'}`,
        `Created: ${new Date(file.created_at).toLocaleDateString()}`,
        '\n---\n',
        ...(snippets || []).map((snippet, index) => [
          `## Snippet ${index + 1}`,
          snippet.language ? `Language: ${snippet.language}` : '',
          '```',
          snippet.extracted_text,
          '```',
          snippet.ocr_confidence ? `OCR Confidence: ${Math.round(snippet.ocr_confidence * 100)}%` : '',
          '\n'
        ].filter(Boolean).join('\n'))
      ].filter(Boolean).join('\n');

      // Share the content
      await Share.share({
        message: exportContent,
        title: `Export: ${file.title}`
      });
    } catch (error) {
      console.error('Error exporting file:', error);
      Alert.alert('Error', 'Failed to export file');
    }
  };

  const handleShare = async () => {
    if (!file) return;
    
    try {
      await Share.share({
        message: `Check out this code file: ${file.title}`,
        title: file.title
      });
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  };

  const fileOptions: FileOption[] = [
    {
      id: 'rename',
      title: 'Rename File',
      icon: 'pencil',
      color: '#007AFF',
      onPress: () => setShowRenameModal(true)
    },
    {
      id: 'duplicate',
      title: 'Duplicate File',
      icon: 'copy',
      color: '#007AFF',
      onPress: handleDuplicate
    },
    {
      id: 'export',
      title: 'Export File',
      icon: 'download',
      color: '#007AFF',
      onPress: handleExport
    },
    {
      id: 'share',
      title: 'Share File',
      icon: 'share',
      color: '#007AFF',
      onPress: handleShare
    },
    {
      id: 'delete',
      title: 'Delete File',
      icon: 'trash',
      color: '#FF3B30',
      destructive: true,
      onPress: handleDelete
    }
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StyledView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <StyledText className="mt-md text-body font-sf-pro text-gray-600">
            Loading file...
          </StyledText>
        </StyledView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <StyledView className="flex-row items-center justify-between px-lg py-md border-b border-gray-200">
        <Button
          title="Cancel"
          variant="ghost"
          size="medium"
          onPress={() => navigation.goBack()}
        />
        <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
          File Options
        </StyledText>
        <StyledView className="w-16" />
      </StyledView>

      {/* File Info */}
      {file && (
        <StyledView className="px-lg py-md border-b border-gray-100">
          <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
            {file.title}
          </StyledText>
          <StyledText className="text-footnote font-sf-pro text-gray-500 mt-xs">
            {file.snippet_count} snippet{file.snippet_count !== 1 ? 's' : ''} • {file.language || 'No language'}
          </StyledText>
          {file.description && (
            <StyledText className="text-body font-sf-pro text-gray-600 mt-sm">
              {file.description}
            </StyledText>
          )}
        </StyledView>
      )}

      {/* Options List */}
      <StyledScrollView className="flex-1">
        {fileOptions.map((option) => (
          <Button
            key={option.id}
            title={option.title}
            variant="ghost"
            size="large"
            onPress={option.onPress}
            style={{
              justifyContent: 'flex-start',
              borderBottomWidth: 1,
              borderBottomColor: '#F2F2F7',
              borderRadius: 0
            }}
            textStyle={{
              color: option.destructive ? option.color : '#000000'
            }}
            leftIcon={
              <Ionicons 
                name={option.icon} 
                size={20} 
                color={option.color} 
                style={{ marginRight: 12 }}
              />
            }
          />
        ))}
      </StyledScrollView>

      {/* Rename Modal */}
      {showRenameModal && (
        <StyledView className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center px-lg">
          <StyledView className="bg-white rounded-lg p-lg w-full">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-md">
              Rename File
            </StyledText>
            
            <TextInput
              value={newFileName}
              onChangeText={setNewFileName}
              variant="outlined"
              placeholder="Enter new file name"
              autoFocus
            />
            
            <StyledView className="flex-row justify-end mt-lg">
              <Button
                title="Cancel"
                variant="ghost"
                size="medium"
                onPress={() => {
                  setShowRenameModal(false);
                  setNewFileName(file?.title || '');
                }}
                style={{ marginRight: 12 }}
              />
              <Button
                title="Save"
                variant="primary"
                size="medium"
                loading={renaming}
                disabled={!newFileName.trim() || newFileName.trim() === file?.title}
                onPress={handleRename}
              />
            </StyledView>
          </StyledView>
        </StyledView>
      )}
    </SafeAreaView>
  );
};