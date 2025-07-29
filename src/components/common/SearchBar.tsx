import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, ViewStyle } from 'react-native';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value = '',
  onChangeText,
  onSearch,
  onClear,
  autoFocus = false,
  style
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback((text: string) => {
    setSearchQuery(text);
    onChangeText?.(text);
  }, [onChangeText]);

  const handleSearch = useCallback(() => {
    onSearch?.(searchQuery);
  }, [onSearch, searchQuery]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    onChangeText?.('');
    onClear?.();
  }, [onChangeText, onClear]);

  return (
    <StyledView 
      className={`
        flex-row items-center bg-gray-50 rounded-md px-md py-sm min-h-[44px]
        ${isFocused ? 'border border-systemBlue' : 'border border-transparent'}
      `}
      style={style}
    >
      <Ionicons 
        name="search" 
        size={20} 
        color={isFocused ? '#007AFF' : '#8E8E93'} 
        style={{ marginRight: 8 }}
      />
      
      <StyledTextInput
        className="flex-1 text-body font-sf-pro text-gray-900"
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        value={searchQuery}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSearch}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never" // We'll handle this manually
      />
      
      {searchQuery.length > 0 && (
        <StyledTouchableOpacity
          onPress={handleClear}
          className="ml-sm p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color="#8E8E93" />
        </StyledTouchableOpacity>
      )}
    </StyledView>
  );
};