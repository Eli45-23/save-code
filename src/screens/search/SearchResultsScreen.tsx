import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../../components/common/SearchBar';
import { Tag } from '../../components/common/Tag';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { FileCard } from '../../components/features/FileCard';
import { CodeSnippetCard } from '../../components/features/CodeSnippetCard';
import { SearchStackParamList, SearchStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { supabaseHelpers, supabase } from '../../lib/supabase';
import { SearchResult, AppFile, AppSnippet } from '../../types/database';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledFlatList = styled(FlatList<SearchResultItem>);

type SearchResultsRouteProp = RouteProp<SearchStackParamList, 'SearchResults'>;
type SearchResultsScreenProps = SearchStackScreenProps<'SearchResults'>;

interface SearchResultItem {
  id: string;
  type: 'file' | 'snippet';
  title: string;
  content: string;
  language: string | null;
  created_at: string;
  rank: number;
  file?: AppFile;
  snippet?: AppSnippet;
}

type FilterType = 'all' | 'files' | 'snippets';
type LanguageFilter = 'all' | string;
type DateFilter = 'all' | 'today' | 'week' | 'month';

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<SearchResultsRouteProp>();
  const { user } = useAuth();
  const { query } = route.params;
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    if (user && query) {
      performSearch(query);
    }
  }, [user, query]);

  useEffect(() => {
    applyFilters();
  }, [typeFilter, languageFilter, dateFilter]);

  const performSearch = async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) return;
    
    try {
      setLoading(true);
      
      // Parse special query formats
      const parsedQuery = parseSearchQuery(searchQuery);
      
      // Perform search using database function
      const searchResults = await supabaseHelpers.searchContent(parsedQuery.text, 50);
      
      // Transform results and add additional data
      const transformedResults: SearchResultItem[] = await Promise.all(
        searchResults.map(async (result) => {
          if (result.type === 'file') {
            // Get full file data
            const { data: fileData } = await supabase
              .from('files')
              .select('*')
              .eq('id', result.id)
              .single();
            
            return {
              ...result,
              file: fileData || undefined
            };
          } else {
            // Get full snippet data with file info
            const { data: snippetData } = await supabase
              .from('snippets')
              .select('*, file:files(*)')
              .eq('id', result.id)
              .single();
            
            return {
              ...result,
              snippet: snippetData || undefined
            };
          }
        })
      );
      
      setResults(transformedResults);
      
      // Extract unique languages for filter
      const languages = [...new Set(
        transformedResults
          .map(r => r.language)
          .filter(Boolean)
      )] as string[];
      setAvailableLanguages(languages);
      
      // Apply query-based filters
      if (parsedQuery.language) {
        setLanguageFilter(parsedQuery.language);
      }
      if (parsedQuery.type) {
        setTypeFilter(parsedQuery.type as FilterType);
      }
      if (parsedQuery.date) {
        setDateFilter(parsedQuery.date as DateFilter);
      }
      
      // Record search in history
      await supabaseHelpers.addSearchHistory(searchQuery, transformedResults.length);
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseSearchQuery = (query: string) => {
    let text = query;
    let language: string | null = null;
    let type: string | null = null;
    let date: string | null = null;
    let favorite = false;
    
    // Extract language filter
    const langMatch = query.match(/language:(\w+)/);
    if (langMatch) {
      language = langMatch[1];
      text = text.replace(/language:\w+\s?/, '').trim();
    }
    
    // Extract type filter
    const typeMatch = query.match(/type:(file|snippet)s?/);
    if (typeMatch) {
      type = typeMatch[1];
      text = text.replace(/type:(file|snippet)s?\s?/, '').trim();
    }
    
    // Extract tag filter
    const tagMatch = query.match(/tag:(\w+)/);
    if (tagMatch) {
      text = `${text} ${tagMatch[1]}`.trim();
    }
    
    // Extract date filter
    const dateMatch = query.match(/created:(today|week|month)/);
    if (dateMatch) {
      date = dateMatch[1];
      text = text.replace(/created:(today|week|month)\s?/, '').trim();
    }
    
    // Extract favorite filter
    if (query.includes('is:favorite')) {
      favorite = true;
      text = text.replace(/is:favorite\s?/, '').trim();
    }
    
    return { text, language, type, date, favorite };
  };

  const applyFilters = () => {
    // Filters are applied on the client side for performance
    // In a production app, you might want to do this server-side
  };

  const getFilteredResults = () => {
    let filtered = results;
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }
    
    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(r => r.language === languageFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (dateFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(r => new Date(r.created_at) >= cutoff);
    }
    
    return filtered;
  };

  const handleNewSearch = (newQuery: string) => {
    if (newQuery.trim()) {
      setSearchQuery(newQuery);
      performSearch(newQuery);
    }
  };

  const handleResultPress = (item: SearchResultItem) => {
    if (item.type === 'file' && item.file) {
(navigation as any).navigate('Files', {
        screen: 'FileDetail',
        params: {
          fileId: item.file.id,
          fileName: item.file.title
        }
      });
    } else if (item.type === 'snippet' && item.snippet) {
(navigation as any).navigate('Files', {
        screen: 'SnippetDetail',
        params: {
          snippetId: item.snippet.id,
          fileId: item.snippet.file_id
        }
      });
    }
  };

  const renderResult = ({ item }: { item: SearchResultItem }) => {
    if (item.type === 'file' && item.file) {
      return (
        <FileCard
          file={item.file}
          onPress={() => handleResultPress(item)}
          showOptions={false}
        />
      );
    } else if (item.type === 'snippet' && item.snippet) {
      return (
        <CodeSnippetCard
          snippet={item.snippet}
          onPress={() => handleResultPress(item)}
          showActions={false}
        />
      );
    }
    return null;
  };

  const filteredResults = getFilteredResults();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState message="Searching..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <StyledView className="px-lg pt-md pb-sm border-b border-gray-100">
        <StyledView className="flex-row items-center mb-sm">
          <StyledTouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-md p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </StyledTouchableOpacity>
          
          <StyledView className="flex-1">
            <SearchBar
              placeholder="Search files and snippets..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={handleNewSearch}
              autoFocus={false}
            />
          </StyledView>
        </StyledView>
        
        {/* Results count and filters */}
        <StyledView className="flex-row items-center justify-between">
          <StyledText className="text-footnote font-sf-pro text-gray-600">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{query}"
          </StyledText>
          
          <StyledTouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center p-1"
          >
            <Ionicons name="filter" size={16} color="#007AFF" />
            <StyledText className="text-footnote font-sf-pro text-systemBlue ml-1">
              Filter
            </StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        
        {/* Filter Bar */}
        {showFilters && (
          <StyledView className="mt-sm">
            {/* Type Filter */}
            <StyledView className="flex-row mb-2">
              {(['all', 'files', 'snippets'] as FilterType[]).map((type) => (
                <Tag
                  key={type}
                  label={type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  selected={typeFilter === type}
                  onPress={() => setTypeFilter(type)}
                  size="small"
                  style={{ marginRight: 8 }}
                />
              ))}
            </StyledView>
            
            {/* Language Filter */}
            {availableLanguages.length > 0 && (
              <StyledView className="flex-row flex-wrap">
                <Tag
                  label="All Languages"
                  selected={languageFilter === 'all'}
                  onPress={() => setLanguageFilter('all')}
                  size="small"
                  style={{ marginRight: 8, marginBottom: 4 }}
                />
                {availableLanguages.map((lang) => (
                  <Tag
                    key={lang}
                    label={lang}
                    selected={languageFilter === lang}
                    onPress={() => setLanguageFilter(lang)}
                    size="small"
                    style={{ marginRight: 8, marginBottom: 4 }}
                  />
                ))}
              </StyledView>
            )}
          </StyledView>
        )}
      </StyledView>

      {/* Results */}
      {filteredResults.length > 0 ? (
        <StyledFlatList
          data={filteredResults}
          renderItem={renderResult}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <StyledView className="h-2" />}
        />
      ) : (
        <EmptyState
          icon={<Ionicons name="search" size={64} color="#C7C7CC" />}
          title="No results found"
          description={`No files or snippets match "${query}". Try adjusting your search terms or filters.`}
        />
      )}
    </SafeAreaView>
  );
};