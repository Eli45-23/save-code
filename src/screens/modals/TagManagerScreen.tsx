import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ModalStackScreenProps } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { TextInput } from '../../components/common/TextInput';
import { Tag } from '../../components/common/Tag';
import { EmptyState } from '../../components/common/EmptyState';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTouchableOpacity = styled(TouchableOpacity);

type TagRow = Database['public']['Tables']['tags']['Row'];

interface EditableTag extends TagRow {
  isEditing?: boolean;
  tempName?: string;
  tempColor?: string;
}

const PRESET_COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange  
  '#FFCC02', // Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#007AFF', // Blue
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#FF2D92', // Pink
  '#8E8E93', // Gray
];

type Props = ModalStackScreenProps<'TagManager'>;

export const TagManagerScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<EditableTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  const loadTags = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      
      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) return;
    
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: newTagName.trim().toLowerCase(),
          color: selectedColor,
          usage_count: 0
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          Alert.alert('Error', 'A tag with this name already exists');
        } else {
          throw error;
        }
        return;
      }
      
      setTags(prev => [data, ...prev]);
      setShowCreateModal(false);
      setNewTagName('');
      setSelectedColor(PRESET_COLORS[0]);
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  const handleEditTag = (tagId: string) => {
    setTags(prev => prev.map(tag => 
      tag.id === tagId 
        ? { ...tag, isEditing: true, tempName: tag.name, tempColor: tag.color }
        : tag
    ));
  };

  const handleSaveEdit = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag || !tag.tempName?.trim()) return;
    
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: tag.tempName.trim().toLowerCase(),
          color: tag.tempColor || tag.color
        })
        .eq('id', tagId);

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Error', 'A tag with this name already exists');
          return;
        }
        throw error;
      }
      
      setTags(prev => prev.map(t => 
        t.id === tagId 
          ? { 
              ...t, 
              name: tag.tempName!.trim().toLowerCase(), 
              color: tag.tempColor || t.color,
              isEditing: false, 
              tempName: undefined, 
              tempColor: undefined 
            }
          : t
      ));
    } catch (error) {
      console.error('Error updating tag:', error);
      Alert.alert('Error', 'Failed to update tag');
    }
  };

  const handleCancelEdit = (tagId: string) => {
    setTags(prev => prev.map(tag => 
      tag.id === tagId 
        ? { ...tag, isEditing: false, tempName: undefined, tempColor: undefined }
        : tag
    ));
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the tag "${tagName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', tagId);

              if (error) throw error;
              
              setTags(prev => prev.filter(tag => tag.id !== tagId));
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert('Error', 'Failed to delete tag');
            }
          }
        }
      ]
    );
  };

  const updateTempName = (tagId: string, name: string) => {
    setTags(prev => prev.map(tag => 
      tag.id === tagId ? { ...tag, tempName: name } : tag
    ));
  };

  const updateTempColor = (tagId: string, color: string) => {
    setTags(prev => prev.map(tag => 
      tag.id === tagId ? { ...tag, tempColor: color } : tag
    ));
  };

  const renderTag = ({ item: tag }: { item: EditableTag }) => {
    if (tag.isEditing) {
      return (
        <StyledView className="bg-white border border-gray-200 rounded-lg p-md mb-sm">
          <TextInput
            value={tag.tempName}
            onChangeText={(text) => updateTempName(tag.id, text)}
            variant="outlined"
            placeholder="Tag name"
            autoFocus
          />
          
          {/* Color Picker */}
          <StyledView className="mt-md">
            <StyledText className="text-subheadline font-sf-pro text-gray-700 mb-sm font-medium">
              Color
            </StyledText>
            <StyledView className="flex-row flex-wrap">
              {PRESET_COLORS.map((color) => (
                <StyledTouchableOpacity
                  key={color}
                  className="w-8 h-8 rounded-full mr-sm mb-sm border-2"
                  style={{ 
                    backgroundColor: color,
                    borderColor: tag.tempColor === color ? '#000000' : 'transparent'
                  }}
                  onPress={() => updateTempColor(tag.id, color)}
                />
              ))}
            </StyledView>
          </StyledView>
          
          <StyledView className="flex-row justify-end mt-md">
            <Button
              title="Cancel"
              variant="ghost"
              size="small"
              onPress={() => handleCancelEdit(tag.id)}
              style={{ marginRight: 8 }}
            />
            <Button
              title="Save"
              variant="primary"
              size="small"
              onPress={() => handleSaveEdit(tag.id)}
              disabled={!tag.tempName?.trim()}
            />
          </StyledView>
        </StyledView>
      );
    }

    return (
      <StyledView className="bg-white border border-gray-100 rounded-lg p-md mb-sm flex-row items-center justify-between">
        <StyledView className="flex-row items-center flex-1">
          <Tag
            label={tag.name}
            color={tag.color}
            variant="filled"
            size="medium"
          />
          <StyledView className="ml-md">
            <StyledText className="text-body font-sf-pro text-gray-900">
              {tag.name}
            </StyledText>
            <StyledText className="text-caption1 font-sf-pro text-gray-500">
              Used {tag.usage_count} time{tag.usage_count !== 1 ? 's' : ''}
            </StyledText>
          </StyledView>
        </StyledView>
        
        <StyledView className="flex-row">
          <StyledTouchableOpacity
            className="p-sm"
            onPress={() => handleEditTag(tag.id)}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </StyledTouchableOpacity>
          <StyledTouchableOpacity
            className="p-sm ml-xs"
            onPress={() => handleDeleteTag(tag.id, tag.name)}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StyledView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <StyledText className="mt-md text-body font-sf-pro text-gray-600">
            Loading tags...
          </StyledText>
        </StyledView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <StyledView className="flex-row items-center justify-between px-lg py-md bg-white border-b border-gray-200">
        <Button
          title="Done"
          variant="ghost"
          size="medium"
          onPress={() => navigation.goBack()}
        />
        <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900">
          Manage Tags
        </StyledText>
        <Button
          title="Add"
          variant="primary"
          size="medium"
          onPress={() => setShowCreateModal(true)}
          leftIcon={<Ionicons name="add" size={16} color="white" />}
        />
      </StyledView>

      {/* Tags List */}
      {tags.length === 0 ? (
        <EmptyState
          icon="pricetag"
          title="No Tags Yet"
          description="Create tags to organize your code snippets better"
          actionText="Create First Tag"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <FlatList
          data={tags}
          renderItem={renderTag}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Tag Modal */}
      {showCreateModal && (
        <StyledView className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center px-lg">
          <StyledView className="bg-white rounded-lg p-lg w-full">
            <StyledText className="text-headline font-sf-pro-display font-semibold text-gray-900 mb-md">
              Create New Tag
            </StyledText>
            
            <TextInput
              value={newTagName}
              onChangeText={setNewTagName}
              variant="outlined"
              placeholder="Enter tag name"
              autoFocus
            />
            
            {/* Color Picker */}
            <StyledView className="mt-md">
              <StyledText className="text-subheadline font-sf-pro text-gray-700 mb-sm font-medium">
                Color
              </StyledText>
              <StyledView className="flex-row flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <StyledTouchableOpacity
                    key={color}
                    className="w-8 h-8 rounded-full mr-sm mb-sm border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: selectedColor === color ? '#000000' : 'transparent'
                    }}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </StyledView>
            </StyledView>
            
            <StyledView className="flex-row justify-end mt-lg">
              <Button
                title="Cancel"
                variant="ghost"
                size="medium"
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTagName('');
                  setSelectedColor(PRESET_COLORS[0]);
                }}
                style={{ marginRight: 12 }}
              />
              <Button
                title="Create"
                variant="primary"
                size="medium"
                loading={creating}
                disabled={!newTagName.trim()}
                onPress={handleCreateTag}
              />
            </StyledView>
          </StyledView>
        </StyledView>
      )}
    </SafeAreaView>
  );
};