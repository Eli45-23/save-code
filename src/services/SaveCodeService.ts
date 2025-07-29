import { ocrService } from './OCRService';
import { TopicClassifierService } from './TopicClassifierService';
import { ContentSimilarityService } from './ContentSimilarityService';
import { CodeSequenceDetector } from './CodeSequenceDetector';
import { ContentGroupingService } from './ContentGroupingService';
import { AutoMergeService } from './AutoMergeService';
import { FileOrganizationService } from './FileOrganizationService';
import { supabaseHelpers, supabase } from '../lib/supabase';
import { uploadWithFallbacks } from '../lib/supabase-storage-solutions';
import { OCRResult, ClassificationResult, Database } from '../types/database';
import * as FileSystem from 'expo-file-system';

export interface SaveCodeResult {
  fileId: string;
  snippetId: string;
  title: string;
  extractedText: string;
  classification: ClassificationResult;
  isNewFile: boolean;
  organizationSuggestions?: {
    mergeCandidates: Array<{
      targetFileId: string;
      confidence: number;
      reason: string;
    }>;
    groupSuggestions: Array<{
      groupName: string;
      confidence: number;
      relatedItems: string[];
    }>;
    smartFileNames: Array<{
      name: string;
      confidence: number;
      reason: string;
    }>;
  };
}

export interface SaveCodeOptions {
  forceNewFile?: boolean;
  customTitle?: string;
  customTags?: string[];
  enableIntelligentOrganization?: boolean;
  organizationStrategy?: 'aggressive' | 'conservative' | 'balanced';
  autoMerge?: boolean;
}

/**
 * Complete service for saving code screenshots with OCR and classification
 */
export class SaveCodeService {
  
  /**
   * Main function to process screenshot and save with classification
   */
  static async processAndSave(
    imageUri: string,
    userId: string,
    options: SaveCodeOptions = {}
  ): Promise<SaveCodeResult> {
    try {
      // Step 1: Extract text using OCR
      const ocrResult = await ocrService.extractCodeFromScreenshot(imageUri);
      
      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        throw new Error('No text could be extracted from the image');
      }

      // Step 2: Classify the content
      const classification = await TopicClassifierService.classifyContent(
        ocrResult.text,
        userId
      );

      // Step 2.5: Intelligent organization analysis (if enabled)
      let organizationSuggestions;
      if (options.enableIntelligentOrganization !== false) {
        organizationSuggestions = await this.generateOrganizationSuggestions(
          ocrResult.text,
          userId,
          classification
        );
      }

      // Step 3: Determine target file with intelligent assistance
      let fileId: string;
      let isNewFile: boolean;
      let title: string;

      // Log classification decision for debugging
      console.log('Classification decision:', {
        shouldAppend: classification.shouldAppendToExisting,
        similarFiles: classification.similarFiles.map(f => ({ 
          title: f.title, 
          similarity: f.similarity 
        })),
        forceNewFile: options.forceNewFile
      });
      
      if (options.forceNewFile || (!classification.shouldAppendToExisting && !this.shouldAutoMerge(organizationSuggestions, options))) {
        // Create new file
        const newFile = await this.createNewFile(
          userId,
          options.customTitle || classification.suggestedName,
          classification,
          options.customTags
        );
        fileId = newFile.id;
        title = newFile.title;
        isNewFile = true;
      } else {
        // Use existing file (with intelligent selection)
        const targetFile = this.selectBestTargetFile(
          classification.similarFiles,
          organizationSuggestions
        );
        fileId = targetFile.id;
        title = targetFile.title;
        isNewFile = false;
        
        // Update the file's updated_at timestamp
        await supabase
          .from('files')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', fileId);
      }

      // Step 4: Upload screenshot to storage with multiple fallback solutions
      let screenshotUrl: string | null = null;
      try {
        const fileName = `screenshot-${Date.now()}.jpg`;
        const uploadResult = await uploadWithFallbacks(imageUri, fileName, userId, 'B'); // Start with database storage for reliability
        screenshotUrl = uploadResult.publicUrl;
        console.log('✅ Screenshot uploaded successfully using fallback system');
      } catch (uploadError) {
        console.warn('Screenshot upload failed with all fallback methods, continuing without image:', uploadError);
      }

      // Step 5: Save snippet
      const snippet = await this.saveSnippet({
        fileId,
        userId,
        screenshotUrl,
        extractedText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        language: classification.language.language
      });

      // Step 6: Record analytics
      await supabaseHelpers.recordAnalytics('code_saved', {
        fileId,
        snippetId: snippet.id,
        language: classification.language.language,
        topic: classification.topic.primaryTopic,
        ocrConfidence: ocrResult.confidence,
        isNewFile,
        hasScreenshot: screenshotUrl !== null
      });

      const result: SaveCodeResult = {
        fileId,
        snippetId: snippet.id,
        title,
        extractedText: ocrResult.text,
        classification,
        isNewFile
      };

      // Add organization suggestions if available
      if (organizationSuggestions) {
        result.organizationSuggestions = organizationSuggestions;
      }

      // Auto-execute organization actions if enabled
      if (options.enableIntelligentOrganization && options.autoMerge) {
        await this.executeAutoOrganization(result, userId, options.organizationStrategy);
      }

      return result;

    } catch (error) {
      console.error('Save code process failed:', error);
      
      // Enhanced error reporting with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') || error.message.includes('No user session')) {
          throw new Error('Please sign in to save code snippets.');
        } else if (error.message.includes('foreign key') || error.message.includes('user reference')) {
          throw new Error('Account synchronization issue detected. Please sign out and sign back in to resolve this.');
        } else if (error.message.includes('row-level security') || error.message.includes('permission')) {
          throw new Error('Permission error: Unable to save due to security policy. Please check your account status.');
        } else if (error.message.includes('No text could be extracted')) {
          throw new Error('No readable text found in the image. Please try with a clearer screenshot.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Create a new file with classification metadata - Enhanced with robust error handling
   */
  private static async createNewFile(
    userId: string,
    title: string,
    classification: ClassificationResult,
    customTags?: string[]
  ): Promise<Database['public']['Tables']['files']['Row']> {
    try {
      const tags = customTags || [
        classification.language.language,
        classification.topic.primaryTopic,
        ...classification.topic.suggestedTags
      ].filter(Boolean).slice(0, 5); // Limit to 5 tags

      console.log('Creating file with userId:', userId, 'title:', title);

      // Enhanced error logging for debugging
      const currentUser = await supabase.auth.getUser();
      console.log('Current auth user:', currentUser.data?.user?.id, 'vs provided userId:', userId);

      // Strategy 1: Use bulletproof database function
      try {
        console.log('🚀 Trying bulletproof database function...');
        const { data: fileId, error } = await supabase
          .rpc('create_file_bulletproof', {
            p_title: title,
            p_description: `${classification.language.language} code for ${classification.topic.primaryTopic}`,
            p_language: classification.language.language,
            p_tags: tags
          });

        if (!error && fileId) {
          console.log('✅ Success with create_file_bulletproof:', fileId);
          
          // Get the created file data
          const { data: fileData, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();

          if (!fetchError && fileData) {
            await this.updateTagsUsage(userId, tags);
            return fileData;
          }
        }
        
        console.warn('❌ create_file_bulletproof failed:', error);
      } catch (bulletproofError) {
        console.warn('❌ create_file_bulletproof exception:', bulletproofError);
      }

      // Strategy 2: Try the simple insert function
      try {
        console.log('🔄 Trying simple insert fallback...');
        const { data: simpleFileId, error: simpleError } = await supabase
          .rpc('insert_file_simple', {
            p_title: title,
            p_description: `${classification.language.language} code for ${classification.topic.primaryTopic}`,
            p_language: classification.language.language
          });

        if (!simpleError && simpleFileId) {
          console.log('✅ Success with insert_file_simple:', simpleFileId);
          
          const { data: fileData, error: fetchError } = await supabase
            .from('files')
            .select('*')
            .eq('id', simpleFileId)
            .single();

          if (!fetchError && fileData) {
            await this.updateTagsUsage(userId, tags);
            return fileData;
          }
        }
        
        console.warn('❌ insert_file_simple failed:', simpleError);
      } catch (simpleException) {
        console.warn('❌ insert_file_simple exception:', simpleException);
      }

      // Strategy 3: Emergency fallback to backup table
      try {
        console.log('🚨 Using emergency fallback...');
        const { data: emergencyFileId, error: emergencyError } = await supabase
          .rpc('emergency_create_file', {
            p_title: title,
            p_user_id: userId
          });

        if (!emergencyError && emergencyFileId) {
          console.log('✅ Emergency fallback succeeded:', emergencyFileId);
          // Create a mock file data object for consistency
          const mockFileData = {
            id: emergencyFileId,
            user_id: userId,
            title: title,
            description: `${classification.language.language} code for ${classification.topic.primaryTopic}`,
            language: classification.language.language,
            tags: tags || [],
            snippet_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          };

          console.warn('⚠️ File saved to backup table due to database issues');
          return mockFileData as any;
        }
      } catch (emergencyException) {
        console.error('❌ Emergency fallback failed:', emergencyException);
      }

      // Strategy 4: Final error - all methods failed
      console.error('🔥 All database methods failed!');
      throw new Error('Unable to save your code snippet. Please check your internet connection and try again. If the problem persists, please contact support.');

    } catch (error) {
      console.error('createNewFile comprehensive error:', error);
      
      // Provide helpful error context
      if (error instanceof Error) {
        if (error.message.includes('foreign key')) {
          throw new Error(`Database user reference error: The user account may not be properly initialized. Please try signing out and back in. Details: ${error.message}`);
        } else if (error.message.includes('row-level security')) {
          throw new Error(`Database permission error: Unable to create file due to security policy. Please check your account status. Details: ${error.message}`);
        } else if (error.message.includes('authentication')) {
          throw new Error(`Authentication error: ${error.message}. Please sign in again.`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Save a snippet to the database - Enhanced with robust error handling
   */
  private static async saveSnippet(snippetData: {
    fileId: string;
    userId: string;
    screenshotUrl: string | null;
    extractedText: string;
    ocrConfidence: number;
    language: string;
  }): Promise<Database['public']['Tables']['snippets']['Row']> {
    try {
      console.log('Saving snippet for file:', snippetData.fileId, 'user:', snippetData.userId);
      
      // Enhanced error logging
      const currentUser = await supabase.auth.getUser();
      console.log('Current auth user for snippet:', currentUser.data?.user?.id, 'vs provided userId:', snippetData.userId);

      // Strategy 1: Use the enhanced safe database function
      try {
        const { data: snippetId, error } = await supabase
          .rpc('create_snippet_safe', {
            p_file_id: snippetData.fileId,
            p_extracted_text: snippetData.extractedText,
            p_screenshot_url: snippetData.screenshotUrl,
            p_ocr_confidence: snippetData.ocrConfidence,
            p_language: snippetData.language,
            p_position_in_file: 0,
            p_is_favorite: false
          });

        if (!error && snippetId) {
          console.log('✅ Success with create_snippet_safe:', snippetId);
          
          // Get the created snippet data
          const { data: createdSnippet, error: fetchError } = await supabase
            .from('snippets')
            .select('*')
            .eq('id', snippetId)
            .single();

          if (!fetchError && createdSnippet) {
            return createdSnippet;
          }
        }
        
        console.warn('create_snippet_safe failed:', error);
      } catch (safeError) {
        console.warn('create_snippet_safe exception:', safeError);
      }

      // Strategy 2: Enhanced direct insert with authenticated user verification
      try {
        console.log('Trying enhanced direct snippet insert...');
        
        // Get fresh authenticated user session
        const { data: userSession, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !userSession?.user) {
          throw new Error(`Authentication error: ${sessionError?.message || 'No user session'}`);
        }
        
        const authenticatedUserId = userSession.user.id;
        console.log('Using authenticated user ID for snippet:', authenticatedUserId);
        
        // Verify file exists and belongs to user
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('id, user_id')
          .eq('id', snippetData.fileId)
          .single();
          
        if (fileError) {
          throw new Error(`File verification failed: ${fileError.message}`);
        }
        
        if (fileData.user_id !== authenticatedUserId) {
          throw new Error(`File ownership mismatch: File belongs to ${fileData.user_id}, user is ${authenticatedUserId}`);
        }
        
        // Insert snippet with verified data
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('snippets')
          .insert({
            file_id: snippetData.fileId,
            user_id: authenticatedUserId, // Use authenticated user ID
            screenshot_url: snippetData.screenshotUrl,
            extracted_text: snippetData.extractedText,
            ocr_confidence: snippetData.ocrConfidence,
            language: snippetData.language,
            position_in_file: 0,
            is_favorite: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!fallbackError && fallbackData) {
          console.log('✅ Success with enhanced direct snippet insert:', fallbackData.id);
          
          // Update file snippet count
          try {
            // Note: Increment would need to be done server-side or with RPC function
            // For now, we'll skip the snippet count update
            await supabase
              .from('files')
              .update({ 
                updated_at: new Date().toISOString() 
              })
              .eq('id', snippetData.fileId);
          } catch (updateError) {
            console.warn('Failed to update file snippet count:', updateError);
          }
          
          return fallbackData;
        }
        
        console.error('Enhanced direct snippet insert failed:', fallbackError);
        throw new Error(`Snippet creation failed: ${fallbackError?.message || 'Unknown error'}`);
        
      } catch (enhancedError) {
        console.error('Enhanced snippet insert exception:', enhancedError);
        throw enhancedError;
      }

    } catch (error) {
      console.error('saveSnippet comprehensive error:', error);
      
      // Provide helpful error context
      if (error instanceof Error) {
        if (error.message.includes('foreign key')) {
          throw new Error(`Database reference error: The file or user reference is invalid. Please try refreshing and trying again. Details: ${error.message}`);
        } else if (error.message.includes('row-level security')) {
          throw new Error(`Database permission error: Unable to create snippet due to security policy. Details: ${error.message}`);
        } else if (error.message.includes('authentication')) {
          throw new Error(`Authentication error: ${error.message}. Please sign in again.`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Upload screenshot to Supabase storage
   */
  private static async uploadScreenshot(
    imageUri: string,
    userId: string
  ): Promise<{ publicUrl: string; path: string }> {
    try {
      // Read the image file
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `screenshot-${timestamp}.jpg`;
      
      // Upload to Supabase storage
      const result = await supabaseHelpers.uploadScreenshot(blob, fileName, userId);
      
      return {
        publicUrl: result.publicUrl,
        path: result.path
      };
    } catch (error) {
      console.error('Screenshot upload error:', error);
      throw new Error('Failed to upload screenshot');
    }
  }

  /**
   * Update tag usage counts - Enhanced with better error handling
   */
  private static async updateTagsUsage(userId: string, tags: string[]): Promise<void> {
    try {
      // Get authenticated user to ensure we're using the correct user ID
      const { data: userSession, error: sessionError } = await supabase.auth.getUser();
      const authenticatedUserId = userSession?.user?.id || userId;
      
      if (sessionError) {
        console.warn('Session error in updateTagsUsage, using provided userId:', sessionError);
      }
      
      for (const tagName of tags) {
        try {
          await supabaseHelpers.upsertTag({
            user_id: authenticatedUserId,
            name: tagName.toLowerCase(),
            color: this.getTagColor(tagName),
            usage_count: 1 // This will be incremented by the upsert
          });
        } catch (tagError) {
          console.warn(`Failed to update tag "${tagName}":`, tagError);
          // Continue with other tags
        }
      }
    } catch (error) {
      console.warn('Failed to update tag usage:', error);
      // Don't throw - this is not critical for the main operation
    }
  }

  /**
   * Get color for tag based on type
   */
  private static getTagColor(tagName: string): string {
    const colors: Record<string, string> = {
      // Languages
      'javascript': '#F7DF1E',
      'typescript': '#3178C6',
      'python': '#3776AB',
      'swift': '#FA7343',
      'java': '#ED8B00',
      'kotlin': '#7F52FF',
      'go': '#00ADD8',
      'rust': '#000000',
      'cpp': '#00599C',
      'csharp': '#239120',
      
      // Topics
      'mobile-development': '#FF6B6B',
      'web-development': '#4ECDC4',
      'backend-development': '#45B7D1',
      'database': '#96CEB4',
      'authentication': '#FFEAA7',
      'ui-components': '#DDA0DD',
      'api-integration': '#98D8C8',
      'testing': '#F7DC6F',
      
      // Default
      'default': '#3B82F6'
    };

    return colors[tagName.toLowerCase()] || colors.default;
  }

  /**
   * Batch process multiple images
   */
  static async processBatch(
    imageUris: string[],
    userId: string,
    options: SaveCodeOptions = {}
  ): Promise<SaveCodeResult[]> {
    const results: SaveCodeResult[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      try {
        console.log(`Processing image ${i + 1} of ${imageUris.length}`);
        const result = await this.processAndSave(imageUris[i], userId, {
          ...options,
          forceNewFile: true // Each batch item gets its own file
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        // Continue with other images
      }
    }
    
    return results;
  }

  /**
   * Update existing snippet with new OCR result
   */
  static async updateSnippet(
    snippetId: string,
    imageUri: string,
    userId: string
  ): Promise<SaveCodeResult> {
    try {
      // Get existing snippet
      const { data: existingSnippet, error: fetchError } = await supabase
        .from('snippets')
        .select('*, file:files(*)')
        .eq('id', snippetId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existingSnippet) {
        throw new Error('Snippet not found');
      }

      // Re-run OCR
      const ocrResult = await ocrService.extractCodeFromScreenshot(imageUri);
      
      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        throw new Error('No text could be extracted from the updated image');
      }

      // Re-classify
      const classification = await TopicClassifierService.classifyContent(
        ocrResult.text,
        userId
      );

      // Upload new screenshot using fallback system
      let screenshotUrl: string | null = null;
      try {
        const fileName = `screenshot-${Date.now()}.jpg`;
        const uploadResult = await uploadWithFallbacks(imageUri, fileName, userId, 'B');
        screenshotUrl = uploadResult.publicUrl;
        
        // Delete old screenshot if exists (skip for database-stored images)
        if (existingSnippet.screenshot_url && !existingSnippet.screenshot_url.startsWith('data:')) {
          const oldFileName = existingSnippet.screenshot_url.split('/').pop();
          if (oldFileName) {
            try {
              await supabaseHelpers.deleteScreenshot(oldFileName);
            } catch (deleteError) {
              console.warn('Failed to delete old screenshot:', deleteError);
            }
          }
        }
        console.log('✅ Screenshot updated successfully using fallback system');
      } catch (uploadError) {
        console.warn('Screenshot upload failed:', uploadError);
      }

      // Update snippet
      const { data: updatedSnippet, error: updateError } = await supabase
        .from('snippets')
        .update({
          screenshot_url: screenshotUrl,
          extracted_text: ocrResult.text,
          ocr_confidence: ocrResult.confidence,
          language: classification.language.language
        })
        .eq('id', snippetId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update snippet: ${updateError.message}`);
      }

      return {
        fileId: existingSnippet.file_id,
        snippetId: updatedSnippet.id,
        title: (existingSnippet as any).file.title,
        extractedText: updatedSnippet.extracted_text,
        classification,
        isNewFile: false
      };

    } catch (error) {
      console.error('Update snippet failed:', error);
      throw error;
    }
  }

  /**
   * Generate intelligent organization suggestions
   */
  private static async generateOrganizationSuggestions(
    extractedText: string,
    userId: string,
    classification: ClassificationResult
  ) {
    try {
      // Get user's existing files and snippets
      const files = await supabaseHelpers.getUserFiles(userId);
      const snippets = await supabaseHelpers.getUserSnippets(userId);

      // Generate merge candidates using advanced similarity
      const mergeCandidates = await this.findAdvancedMergeCandidates(
        extractedText,
        files,
        snippets
      );

      // Generate smart file name suggestions
      const smartFileNames = FileOrganizationService.generateSmartFileNames(
        extractedText,
        files
      );

      // Generate grouping suggestions
      const groupSuggestions = await this.generateGroupSuggestions(
        extractedText,
        files,
        snippets,
        classification
      );

      return {
        mergeCandidates,
        smartFileNames,
        groupSuggestions
      };
    } catch (error) {
      console.warn('Failed to generate organization suggestions:', error);
      return undefined;
    }
  }

  /**
   * Find advanced merge candidates using content similarity
   */
  private static async findAdvancedMergeCandidates(
    extractedText: string,
    files: Database['public']['Tables']['files']['Row'][],
    snippets: Database['public']['Tables']['snippets']['Row'][]
  ) {
    const candidates: Array<{
      targetFileId: string;
      confidence: number;
      reason: string;
    }> = [];

    // Analyze files for merge potential
    for (const file of files) {
      const fileContent = file.description || file.title;
      const similarity = ContentSimilarityService.calculateSimilarity(
        extractedText,
        fileContent
      );

      if (similarity.score > 0.6) {
        candidates.push({
          targetFileId: file.id,
          confidence: similarity.score,
          reason: similarity.reasons.join(', ')
        });
      }
    }

    // Analyze snippets for sequence continuation
    const relatedSnippets = snippets.filter(snippet => {
      const similarity = ContentSimilarityService.calculateSimilarity(
        extractedText,
        snippet.extracted_text
      );
      return similarity.score > 0.5;
    });

    if (relatedSnippets.length > 0) {
      const sequence = CodeSequenceDetector.analyzeSequence([
        {
          id: 'new',
          content: extractedText,
          timestamp: new Date()
        },
        ...relatedSnippets.map(snippet => ({
          id: snippet.id,
          content: snippet.extracted_text,
          timestamp: new Date(snippet.created_at)
        }))
      ]);

      if (sequence.overallPattern.confidence > 0.7) {
        const targetSnippet = relatedSnippets[0];
        candidates.push({
          targetFileId: targetSnippet.file_id,
          confidence: sequence.overallPattern.confidence,
          reason: `Code sequence continuation: ${sequence.overallPattern.type}`
        });
      }
    }

    return candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Generate smart grouping suggestions
   */
  private static async generateGroupSuggestions(
    extractedText: string,
    files: Database['public']['Tables']['files']['Row'][],
    snippets: Database['public']['Tables']['snippets']['Row'][],
    classification: ClassificationResult
  ) {
    const suggestions: Array<{
      groupName: string;
      confidence: number;
      relatedItems: string[];
    }> = [];

    // Find files with similar topics
    const relatedFiles = files.filter(file => 
      file.tags.some(tag => 
        classification.topic.suggestedTags.includes(tag)
      ) || file.language === classification.language.language
    );

    if (relatedFiles.length > 0) {
      suggestions.push({
        groupName: `${classification.topic.primaryTopic} Components`,
        confidence: 0.8,
        relatedItems: relatedFiles.map(f => f.id)
      });
    }

    // Project-based grouping
    const projectIndicators = this.extractProjectIndicators(extractedText);
    if (projectIndicators.length > 0) {
      const projectFiles = files.filter(file => 
        projectIndicators.some(indicator => 
          file.title.toLowerCase().includes(indicator.toLowerCase()) ||
          file.description?.toLowerCase().includes(indicator.toLowerCase())
        )
      );

      if (projectFiles.length > 0) {
        suggestions.push({
          groupName: `${projectIndicators[0]} Project`,
          confidence: 0.7,
          relatedItems: projectFiles.map(f => f.id)
        });
      }
    }

    return suggestions.slice(0, 2);
  }

  /**
   * Extract project indicators from content
   */
  private static extractProjectIndicators(content: string): string[] {
    const indicators: string[] = [];
    
    // Look for app/project names
    const patterns = [
      /(?:app|project|component)\s*['"]?([a-zA-Z][\w-]+)['"]?/gi,
      /import.*from\s+['"]([^'"/]+)/gi,
      /package\s*['"]([^'"]+)['"]?/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        indicators.push(match[1]);
      }
    });
    
    return [...new Set(indicators)].slice(0, 3);
  }

  /**
   * Determine if auto-merge should be used
   */
  private static shouldAutoMerge(
    organizationSuggestions: any,
    options: SaveCodeOptions
  ): boolean {
    if (!organizationSuggestions || !options.autoMerge) {
      return false;
    }

    const highConfidenceCandidates = organizationSuggestions.mergeCandidates?.filter(
      (candidate: any) => candidate.confidence > 0.8
    );

    return highConfidenceCandidates && highConfidenceCandidates.length > 0;
  }

  /**
   * Select best target file for appending
   */
  private static selectBestTargetFile(
    similarFiles: any[],
    organizationSuggestions: any
  ) {
    // If we have intelligent suggestions, use them
    if (organizationSuggestions?.mergeCandidates?.length > 0) {
      const bestCandidate = organizationSuggestions.mergeCandidates[0];
      const targetFile = similarFiles.find(file => file.id === bestCandidate.targetFileId);
      if (targetFile) {
        return targetFile;
      }
    }

    // Fallback to original logic
    return similarFiles[0];
  }

  /**
   * Execute auto-organization based on suggestions
   */
  private static async executeAutoOrganization(
    result: SaveCodeResult,
    userId: string,
    strategy: 'aggressive' | 'conservative' | 'balanced' = 'balanced'
  ) {
    try {
      if (!result.organizationSuggestions) return;

      const files = await supabaseHelpers.getUserFiles(userId);
      const snippets = await supabaseHelpers.getUserSnippets(userId);

      // Execute auto-organization with the specified strategy
      const organizationResult = await FileOrganizationService.autoOrganize(
        files,
        snippets,
        strategy
      );

      if (organizationResult.success) {
        console.log('✅ Auto-organization completed:', organizationResult.metrics);
        
        // Record analytics for organization
        await supabaseHelpers.recordAnalytics('auto_organization', {
          strategy,
          filesProcessed: organizationResult.metrics.filesProcessed,
          mergesPerformed: organizationResult.metrics.mergesPerformed,
          groupsCreated: organizationResult.metrics.groupsCreated,
          organizationScore: organizationResult.metrics.organizationScore
        });
      }
    } catch (error) {
      console.warn('Auto-organization failed:', error);
    }
  }

  /**
   * Batch process and intelligently organize multiple screenshots
   */
  static async batchProcessAndOrganize(
    imageUris: string[],
    userId: string,
    options: SaveCodeOptions = {}
  ): Promise<{
    results: SaveCodeResult[];
    organizationSummary: {
      totalProcessed: number;
      successfulMerges: number;
      groupsCreated: number;
      recommendations: string[];
    };
  }> {
    const results: SaveCodeResult[] = [];
    const enabledOptions = { ...options, enableIntelligentOrganization: true };

    // Process all images first
    for (const imageUri of imageUris) {
      try {
        const result = await this.processAndSave(imageUri, userId, enabledOptions);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process image ${imageUri}:`, error);
      }
    }

    // Perform intelligent batch organization
    try {
      const files = await supabaseHelpers.getUserFiles(userId);
      const snippets = await supabaseHelpers.getUserSnippets(userId);
      
      const organizationResult = await FileOrganizationService.autoOrganize(
        files,
        snippets,
        options.organizationStrategy || 'balanced'
      );

      return {
        results,
        organizationSummary: {
          totalProcessed: results.length,
          successfulMerges: organizationResult.metrics.mergesPerformed,
          groupsCreated: organizationResult.metrics.groupsCreated,
          recommendations: organizationResult.recommendations
        }
      };
    } catch (error) {
      console.warn('Batch organization failed:', error);
      return {
        results,
        organizationSummary: {
          totalProcessed: results.length,
          successfulMerges: 0,
          groupsCreated: 0,
          recommendations: ['Batch organization failed - manual review recommended']
        }
      };
    }
  }

  /**
   * Simplified interface for ReviewAndSaveScreen compatibility
   */
  static async saveCodeFromScreenshot(params: {
    imageUri: string;
    extractedText: string;
    userId: string;
    title: string;
    description: string;
    customTags: string[];
    ocrConfidence: number;
  }): Promise<{ fileId: string; wasAppended: boolean }> {
    try {
      // Create classification result from params
      const mockClassification: ClassificationResult = {
        language: {
          language: 'javascript', // Default, could be detected from extractedText
          confidence: 0.8
        },
        topic: {
          primaryTopic: params.title,
          confidence: 0.8,
          suggestedTags: params.customTags,
          frameworks: []
        },
        shouldAppendToExisting: false,
        similarFiles: []
      };

      // Step 1: Check if should create new file or append to existing
      let fileId: string;
      let wasAppended = false;

      // For now, always create new file (can be enhanced later for smart appending)
      const newFile = await this.createNewFile(
        params.userId,
        params.title,
        mockClassification,
        params.customTags
      );
      fileId = newFile.id;

      // Step 2: Upload screenshot if provided using fallback system
      let screenshotUrl: string | null = null;
      try {
        const fileName = `screenshot-${Date.now()}.jpg`;
        const uploadResult = await uploadWithFallbacks(params.imageUri, fileName, params.userId, 'B');
        screenshotUrl = uploadResult.publicUrl;
        console.log('✅ Screenshot uploaded successfully for saveCodeFromScreenshot');
      } catch (uploadError) {
        console.warn('Screenshot upload failed, continuing without image:', uploadError);
      }

      // Step 3: Save snippet
      const snippet = await this.saveSnippet({
        fileId,
        userId: params.userId,
        screenshotUrl,
        extractedText: params.extractedText,
        ocrConfidence: params.ocrConfidence,
        language: mockClassification.language.language
      });

      // Step 4: Record analytics
      await supabaseHelpers.recordAnalytics('code_saved', {
        fileId,
        snippetId: snippet.id,
        language: mockClassification.language.language,
        topic: params.title,
        ocrConfidence: params.ocrConfidence,
        isNewFile: !wasAppended,
        hasScreenshot: screenshotUrl !== null
      });

      return { fileId, wasAppended };

    } catch (error) {
      console.error('Save code from screenshot failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const saveCodeService = SaveCodeService;