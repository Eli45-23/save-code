import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Alert, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import { LoadingState, EmptyState, SearchBar } from '../../components/common';
import { FileCard } from '../../components/features';

// Hooks and Services
import { useAuth } from '../../hooks/useAuth';
import { supabaseHelpers } from '../../lib/supabase';
import { FilesStackScreenProps } from '../../types/navigation';
import { AppFile } from '../../types/database';

const StyledView = styled(View);
const StyledScrollView = styled(ScrollView);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

type Props = FilesStackScreenProps<'FilesList'>;

// Language color mapping
const getLanguageColor = (language: string) => {
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
    other: '#8E8E93'
  };
  return colors[language?.toLowerCase()] || colors.other;
};

// Language Section Header Component
const LanguageSectionHeader: React.FC<{
  language: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ language, count, isExpanded, onToggle }) => {
  const displayName = language === 'Other' ? 'Other Languages' : 
    language.charAt(0).toUpperCase() + language.slice(1);
  
  return (
    <StyledTouchableOpacity
      onPress={onToggle}
      className="bg-gray-50 border-b border-gray-200 px-md py-sm flex-row items-center justify-between"
      style={{ borderTopColor: getLanguageColor(language), borderTopWidth: 2 }}
    >
      <StyledView className="flex-row items-center">
        <StyledView 
          className="w-3 h-3 rounded-full mr-sm"
          style={{ backgroundColor: getLanguageColor(language) }}
        />
        <StyledText className="text-headline font-sf-pro text-gray-900 font-semibold">
          {displayName}
        </StyledText>
        <StyledView className="bg-gray-200 rounded-full px-2 py-0.5 ml-sm">
          <StyledText className="text-caption1 font-sf-pro text-gray-600 font-medium">
            {count}
          </StyledText>
        </StyledView>
      </StyledView>
      <Ionicons 
        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
        size={20} 
        color="#8E8E93" 
      />
    </StyledTouchableOpacity>
  );
};

// Group files by language
const groupFilesByLanguage = (files: AppFile[]) => {
  const grouped = files.reduce((acc, file) => {
    const language = file.language || 'Other';
    if (!acc[language]) {
      acc[language] = [];
    }
    acc[language].push(file);
    return acc;
  }, {} as Record<string, AppFile[]>);

  // Sort languages by file count (descending)
  const sortedLanguages = Object.keys(grouped).sort((a, b) => {
    // Put 'Other' at the end
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return grouped[b].length - grouped[a].length;
  });

  return sortedLanguages.map(language => ({
    language,
    files: grouped[language],
    count: grouped[language].length
  }));
};

export const FilesListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<AppFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<AppFile[]>([]);
  const [sortBy, setSortBy] = useState<'sequence' | 'updated' | 'created' | 'accessed'>('sequence');
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(new Set());

  // Load files
  const loadFiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userFiles = await supabaseHelpers.getUserFiles(user.id, sortBy);
      setFiles(userFiles);
      setFilteredFiles(userFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, sortBy]);

  // Refresh files
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  }, [loadFiles]);

  // Filter files based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = files.filter(file =>
        file.title.toLowerCase().includes(query) ||
        file.description?.toLowerCase().includes(query) ||
        file.language?.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  // Initialize expanded languages (expand all by default)
  useEffect(() => {
    const languages = new Set(files.map(f => f.language || 'Other'));
    setExpandedLanguages(languages);
  }, [files]);

  // Load files when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [loadFiles])
  );

  // Handle file press
  const handleFilePress = async (file: AppFile) => {
    // Update access time for 'accessed' sorting
    if (sortBy === 'accessed') {
      await supabaseHelpers.updateFileAccess(file.id);
    }
    
    navigation.navigate('FileDetail', {
      fileId: file.id,
      fileName: file.title,
    });
  };

  // Handle file options
  const handleFileOptions = (file: AppFile) => {
    // Navigate to modal with file options
    navigation.getParent()?.navigate('Modal', {
      screen: 'FileOptions',
      params: { fileId: file.id },
    });
  };

  // Toggle language section expansion
  const toggleLanguageExpansion = (language: string) => {
    setExpandedLanguages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(language)) {
        newSet.delete(language);
      } else {
        newSet.add(language);
      }
      return newSet;
    });
  };

  if (loading) {
    return <LoadingState message="Loading your files..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background-secondary">
      <StyledView className="flex-1">
        {/* Search Bar */}
        <StyledView className="px-md py-sm bg-white border-b border-gray-100">
          <SearchBar
            placeholder="Search files..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </StyledView>

        {/* Sort Options */}
        <StyledView className="px-md py-sm bg-gray-50 border-b border-gray-100">
          <StyledScrollView horizontal showsHorizontalScrollIndicator={false}>
            <StyledView className="flex-row space-x-2">
              {[
                { key: 'sequence', label: 'Sequence', icon: 'list-outline' },
                { key: 'updated', label: 'Recently Updated', icon: 'pencil-outline' },
                { key: 'created', label: 'Recently Created', icon: 'add-circle-outline' },
                { key: 'accessed', label: 'Recently Viewed', icon: 'eye-outline' }
              ].map((option) => (
                <StyledTouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key as any)}
                  className={`flex-row items-center px-3 py-2 rounded-full ${
                    sortBy === option.key ? 'bg-blue-100' : 'bg-white'
                  } border border-gray-200`}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={16} 
                    color={sortBy === option.key ? '#2563EB' : '#6B7280'} 
                  />
                  <StyledText 
                    className={`ml-2 text-sm font-medium ${
                      sortBy === option.key ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {option.label}
                  </StyledText>
                </StyledTouchableOpacity>
              ))}
            </StyledView>
          </StyledScrollView>
        </StyledView>

        {/* Files List */}
        <StyledScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
        >
          {filteredFiles.length === 0 ? (
            <EmptyState
              icon={
                <Ionicons 
                  name={searchQuery ? "search-outline" : "folder-outline"} 
                  size={48} 
                  color="#8E8E93" 
                />
              }
              title={searchQuery ? "No files found" : "No saved code yet"}
              description={
                searchQuery 
                  ? `No files match "${searchQuery}". Try a different search term.`
                  : "Start by adding your first code screenshot using the Add tab."
              }
              actionButton={
                !searchQuery
                  ? {
                      title: "Add Your First Code",
                      onPress: () => navigation.getParent()?.navigate('Main', { screen: 'Add', params: { screen: 'Camera' } }),
                      variant: 'primary' as const,
                    }
                  : undefined
              }
            />
          ) : (
            <StyledView>
              {searchQuery ? (
                // Show flat list when searching
                <StyledView className="space-y-sm">
                  {filteredFiles.map((file, index) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onPress={() => handleFilePress(file)}
                      onOptionsPress={() => handleFileOptions(file)}
                      showSequence={sortBy === 'sequence'}
                      orderBy={sortBy}
                    />
                  ))}
                </StyledView>
              ) : (
                // Show grouped by language when not searching
                groupFilesByLanguage(filteredFiles).map((group, index) => {
                  const isExpanded = expandedLanguages.has(group.language);
                  
                  return (
                    <StyledView key={group.language} className={index > 0 ? 'mt-md' : ''}>
                      <LanguageSectionHeader
                        language={group.language}
                        count={group.count} 
                        isExpanded={isExpanded}
                        onToggle={() => toggleLanguageExpansion(group.language)}
                      />
                      
                      {isExpanded && (
                        <StyledView className="bg-white border-l-2" style={{ borderLeftColor: getLanguageColor(group.language) + '20' }}>
                          {group.files.map((file, fileIndex) => (
                            <StyledView 
                              key={file.id}
                              className={`px-sm ${fileIndex < group.files.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                              <FileCard
                                file={file}
                                onPress={() => handleFilePress(file)}
                                onOptionsPress={() => handleFileOptions(file)}
                                showSequence={sortBy === 'sequence'}
                                orderBy={sortBy}
                              />
                            </StyledView>
                          ))}
                        </StyledView>
                      )}
                    </StyledView>
                  );
                })
              )}
            </StyledView>
          )}
        </StyledScrollView>
      </StyledView>
    </SafeAreaView>
  );
};