import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
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

type File = Database['public']['Tables']['files']['Row'];
type LanguageOption = {
  value: string;
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'swift', label: 'Swift' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'other', label: 'Other' }
];

type Props = ModalStackScreenProps<'EditFile'>;

export const EditFileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { fileId } = route.params;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<string>('javascript');
  const [tags, setTags] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

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
      setTitle(data.title);
      setDescription(data.description || '');
      setLanguage(data.language || 'javascript');
      setTags(data.tags ? data.tags.join(', ') : '');
    } catch (error) {
      console.error('Error loading file:', error);
      Alert.alert('Error', 'Failed to load file');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file || !title.trim()) {
      Alert.alert('Error', 'Please enter a title for the file');
      return;
    }
    
    setSaving(true);
    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('files')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          language: language,
          tags: tagArray.length > 0 ? tagArray : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) throw error;
      
      Alert.alert('Success', 'File updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving file:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

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
          onPress={handleCancel}
        />
        <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
          Edit File
        </StyledText>
        <Button
          title="Save"
          variant="primary"
          size="medium"
          loading={saving}
          onPress={handleSave}
        />
      </StyledView>

      <StyledScrollView className="flex-1 px-lg">
        {/* Title */}
        <StyledView className="mt-lg">
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            variant="outlined"
            placeholder="Enter file title..."
          />
        </StyledView>

        {/* Description */}
        <StyledView className="mt-md">
          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            variant="outlined"
            placeholder="Enter file description..."
            inputStyle={{ minHeight: 100, textAlignVertical: 'top' }}
          />
        </StyledView>

        {/* Language Selector */}
        <StyledView className="mt-md">
          <StyledText className="text-subheadline font-sf-pro text-gray-700 mb-xs font-medium">
            Language
          </StyledText>
          <Button
            title={LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label || 'Select Language'}
            variant="secondary"
            size="medium"
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            rightIcon={<Ionicons name="chevron-down" size={16} color="#8E8E93" />}
          />
          
          {showLanguagePicker && (
            <StyledView className="mt-sm border border-gray-200 rounded-md bg-white">
              <StyledScrollView className="max-h-48">
                {LANGUAGE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    title={option.label}
                    variant="ghost"
                    size="medium"
                    onPress={() => {
                      setLanguage(option.value);
                      setShowLanguagePicker(false);
                    }}
                    style={{
                      justifyContent: 'flex-start',
                      backgroundColor: language === option.value ? '#F0F9FF' : 'transparent'
                    }}
                    leftIcon={
                      language === option.value ? (
                        <Ionicons name="checkmark" size={16} color="#007AFF" />
                      ) : null
                    }
                  />
                ))}
              </StyledScrollView>
            </StyledView>
          )}
        </StyledView>

        {/* Tags */}
        <StyledView className="mt-md">
          <TextInput
            label="Tags (Optional)"
            value={tags}
            onChangeText={setTags}
            variant="outlined"
            placeholder="Enter tags separated by commas..."
          />
        </StyledView>

        {/* Metadata */}
        {file && (
          <StyledView className="mt-lg mb-lg">
            <StyledText className="text-caption1 font-sf-pro text-gray-500 text-center">
              Created: {new Date(file.created_at).toLocaleDateString()}
            </StyledText>
            <StyledText className="text-caption1 font-sf-pro text-gray-500 text-center mt-xs">
              Snippets: {file.snippet_count || 0}
            </StyledText>
          </StyledView>
        )}
      </StyledScrollView>
    </SafeAreaView>
  );
};