import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
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

type Snippet = Database['public']['Tables']['snippets']['Row'];
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

type Props = ModalStackScreenProps<'EditSnippet'>;

export const EditSnippetScreen: React.FC<Props> = ({ route, navigation }) => {
  const { snippetId } = route.params;
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [language, setLanguage] = useState<string>('javascript');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    loadSnippet();
  }, []);

  const loadSnippet = async () => {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', snippetId)
        .single();

      if (error) throw error;
      
      setSnippet(data);
      setExtractedText(data.extracted_text);
      setLanguage(data.language || 'javascript');
      setIsFavorite(data.is_favorite);
    } catch (error) {
      console.error('Error loading snippet:', error);
      Alert.alert('Error', 'Failed to load snippet');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!snippet) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('snippets')
        .update({
          extracted_text: extractedText,
          language: language,
          is_favorite: isFavorite
        })
        .eq('id', snippetId);

      if (error) throw error;
      
      Alert.alert('Success', 'Snippet updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving snippet:', error);
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
            Loading snippet...
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
          Edit Snippet
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
        {/* Extracted Text */}
        <StyledView className="mt-lg">
          <TextInput
            label="Code Text"
            value={extractedText}
            onChangeText={setExtractedText}
            multiline
            variant="outlined"
            placeholder="Enter code text..."
            inputStyle={{ minHeight: 200, textAlignVertical: 'top' }}
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

        {/* Favorite Toggle */}
        <StyledView className="mt-lg">
          <StyledView className="flex-row items-center justify-between py-md px-sm bg-gray-50 rounded-md">
            <StyledView className="flex-row items-center">
              <Ionicons name="heart" size={20} color={isFavorite ? '#FF3B30' : '#8E8E93'} />
              <StyledText className="ml-sm text-body font-sf-pro text-gray-900">
                Mark as Favorite
              </StyledText>
            </StyledView>
            <Switch
              value={isFavorite}
              onValueChange={setIsFavorite}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor={isFavorite ? '#FFFFFF' : '#FFFFFF'}
            />
          </StyledView>
        </StyledView>

        {/* Metadata */}
        {snippet && (
          <StyledView className="mt-lg mb-lg">
            <StyledText className="text-caption1 font-sf-pro text-gray-500 text-center">
              Created: {new Date(snippet.created_at).toLocaleDateString()}
            </StyledText>
            {snippet.ocr_confidence && (
              <StyledText className="text-caption1 font-sf-pro text-gray-500 text-center mt-xs">
                OCR Confidence: {Math.round(snippet.ocr_confidence * 100)}%
              </StyledText>
            )}
          </StyledView>
        )}
      </StyledScrollView>
    </SafeAreaView>
  );
};