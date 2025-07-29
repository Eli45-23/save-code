import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../../components/common/SearchBar';
import { Tag } from '../../components/common/Tag';
import { ListItem } from '../../components/common/ListItem';
import { LoadingState } from '../../components/common/LoadingState';
import { SearchStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { supabaseHelpers, supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

type RecentSearch = Database['public']['Tables']['search_history']['Row'];
type UserTag = Database['public']['Tables']['tags']['Row'];

type SearchHomeScreenProps = SearchStackScreenProps<'SearchHome'>;

export const SearchHomeScreen: React.FC<SearchHomeScreenProps> = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [popularTags, setPopularTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSearchData();
    }
  }, [user]);

  const loadSearchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load recent searches
      const { data: searches, error: searchError } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!searchError && searches) {
        setRecentSearches(searches);
      }
      
      // Load popular tags
      const tags = await supabaseHelpers.getUserTags(user.id);
      setPopularTags(tags.slice(0, 10)); // Top 10 tags
      
    } catch (error) {
      console.error('Error loading search data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigation.navigate('SearchResults', { query: query.trim() });
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleTagPress = (tagName: string) => {
    const query = `tag:${tagName}`;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleFilterPress = (filter: string) => {
    setSearchQuery(filter);
    handleSearch(filter);
  };

  const clearRecentSearches = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);
      
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const suggestedFilters = [
    { label: 'Favorites', query: 'is:favorite', icon: 'heart' },
    { label: 'This week', query: 'created:week', icon: 'calendar' },
    { label: 'JavaScript', query: 'language:javascript', icon: 'code' },
    { label: 'Python', query: 'language:python', icon: 'code' },
    { label: 'Swift', query: 'language:swift', icon: 'code' },
    { label: 'High confidence', query: 'confidence:>80', icon: 'checkmark-circle' },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState message="Loading search..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <StyledView className="px-lg pt-lg pb-md">
          <StyledText className="text-title1 font-sf-pro-display text-gray-900 font-bold mb-md">
            Search
          </StyledText>
          
          {/* Search Bar */}
          <SearchBar
            placeholder="Search files and snippets..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
            autoFocus={false}
          />
        </StyledView>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <StyledView className="px-lg mb-xl">
            <StyledView className="flex-row items-center justify-between mb-md">
              <StyledText className="text-headline font-sf-pro text-gray-900 font-semibold">
                Recent Searches
              </StyledText>
              <StyledTouchableOpacity onPress={clearRecentSearches}>
                <StyledText className="text-footnote font-sf-pro text-systemBlue">
                  Clear
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>
            
            {recentSearches.map((search) => (
              <ListItem
                key={search.id}
                title={search.query}
                subtitle={`${search.results_count} result${search.results_count !== 1 ? 's' : ''}`}
                leftIcon={
                  <Ionicons name="time-outline" size={20} color="#8E8E93" />
                }
                onPress={() => handleRecentSearchPress(search.query)}
                variant="default"
              />
            ))}
          </StyledView>
        )}

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <StyledView className="px-lg mb-xl">
            <StyledText className="text-headline font-sf-pro text-gray-900 font-semibold mb-md">
              Popular Tags
            </StyledText>
            
            <StyledView className="flex-row flex-wrap">
              {popularTags.map((tag) => (
                <Tag
                  key={tag.id}
                  label={tag.name}
                  color={tag.color}
                  variant="outlined"
                  size="small"
                  onPress={() => handleTagPress(tag.name)}
                  style={{ marginRight: 8, marginBottom: 8 }}
                />
              ))}
            </StyledView>
          </StyledView>
        )}

        {/* Suggested Filters */}
        <StyledView className="px-lg mb-xl">
          <StyledText className="text-headline font-sf-pro text-gray-900 font-semibold mb-md">
            Quick Filters
          </StyledText>
          
          <StyledView className="flex-row flex-wrap">
            {suggestedFilters.map((filter, index) => (
              <StyledTouchableOpacity
                key={index}
                className="flex-row items-center bg-gray-50 rounded-md px-md py-sm mr-sm mb-sm active:bg-gray-100 min-h-[44px]"
                onPress={() => handleFilterPress(filter.query)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={16} 
                  color="#6B7280" 
                  style={{ marginRight: 4 }} 
                />
                <StyledText className="text-footnote font-sf-pro text-gray-700">
                  {filter.label}
                </StyledText>
              </StyledTouchableOpacity>
            ))}
          </StyledView>
        </StyledView>

        {/* Search Tips */}
        <StyledView className="px-lg pb-xl">
          <StyledText className="text-headline font-sf-pro text-gray-900 font-semibold mb-md">
            Search Tips
          </StyledText>
          
          <StyledView className="bg-gray-50 rounded-md p-md">
            <StyledText className="text-footnote font-sf-pro text-gray-600 mb-xs">
              • Use quotes for exact phrases: "function getName"
            </StyledText>
            <StyledText className="text-footnote font-sf-pro text-gray-600 mb-xs">
              • Filter by language: language:javascript
            </StyledText>
            <StyledText className="text-footnote font-sf-pro text-gray-600 mb-xs">
              • Search favorites: is:favorite
            </StyledText>
            <StyledText className="text-footnote font-sf-pro text-gray-600">
              • Filter by tag: tag:react
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </SafeAreaView>
  );
};