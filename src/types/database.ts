// Generated types based on enhanced Supabase schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          language: string | null
          tags: string[]
          snippet_count: number
          sequence_number: number | null
          last_accessed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          language?: string | null
          tags?: string[]
          snippet_count?: number
          sequence_number?: number | null
          last_accessed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          language?: string | null
          tags?: string[]
          snippet_count?: number
          sequence_number?: number | null
          last_accessed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      snippets: {
        Row: {
          id: string
          file_id: string
          user_id: string
          screenshot_url: string | null
          extracted_text: string
          ocr_confidence: number | null
          language: string | null
          position_in_file: number
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          file_id: string
          user_id: string
          screenshot_url?: string | null
          extracted_text: string
          ocr_confidence?: number | null
          language?: string | null
          position_in_file?: number
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          user_id?: string
          screenshot_url?: string | null
          extracted_text?: string
          ocr_confidence?: number | null
          language?: string | null
          position_in_file?: number
          is_favorite?: boolean
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          usage_count?: number
          created_at?: string
        }
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          results_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          results_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          results_count?: number
          created_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_content: {
        Args: {
          search_query: string
          user_uuid?: string
          limit_count?: number
        }
        Returns: {
          type: string
          id: string
          title: string
          content: string
          language: string | null
          created_at: string
          rank: number
        }[]
      }
      find_similar_files: {
        Args: {
          content_text: string
          user_uuid?: string
          similarity_threshold?: number
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          similarity: number
        }[]
      }
      get_user_files_ordered: {
        Args: {
          user_uuid?: string
          order_by?: string
          order_direction?: string
        }
        Returns: {
          id: string
          user_id: string
          title: string
          description: string | null
          language: string | null
          tags: string[]
          snippet_count: number
          sequence_number: number | null
          last_accessed_at: string
          created_at: string
          updated_at: string
        }[]
      }
      reorder_file_sequence: {
        Args: {
          file_uuid: string
          new_sequence: number
          user_uuid?: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type FileWithSnippets = Database['public']['Tables']['files']['Row'] & {
  snippets: Database['public']['Tables']['snippets']['Row'][]
}

export type SnippetWithFile = Database['public']['Tables']['snippets']['Row'] & {
  file: Database['public']['Tables']['files']['Row']
}

export type SearchResult = {
  type: 'file' | 'snippet'
  id: string
  title: string
  content: string
  language: string | null
  created_at: string
  rank: number
}

export type SimilarFile = {
  id: string
  title: string
  similarity: number
}

// App-specific interfaces
export interface OCRResult {
  text: string
  confidence: number
  words?: any[]
  lines?: any[]
}

export interface ClassificationResult {
  language: {
    language: string
    confidence: number
    allScores: Record<string, number>
  }
  topic: {
    primaryTopic: string
    confidence: number
    allTopics: Record<string, number>
    suggestedTags: string[]
  }
  similarFiles: SimilarFile[]
  suggestedName: string
  shouldAppendToExisting: boolean
}

export type AppFile = Database['public']['Tables']['files']['Row'] & {
  snippets?: Database['public']['Tables']['snippets']['Row'][]
}

export type AppSnippet = Database['public']['Tables']['snippets']['Row'] & {
  file?: Database['public']['Tables']['files']['Row']
}