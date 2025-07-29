import { supabaseHelpers } from '../lib/supabase';
import { ClassificationResult, SimilarFile } from '../types/database';
import { ContentSimilarityService } from './ContentSimilarityService';
import { CodeSequenceDetector } from './CodeSequenceDetector';

/**
 * Language detection patterns and scoring
 */
interface LanguageConfig {
  patterns: RegExp[];
  keywords: string[];
  extensions: string[];
  frameworks?: string[];
  weight: number;
}

interface LanguageResult {
  language: string;
  confidence: number;
  allScores: Record<string, number>;
  frameworks: string[];
}

interface TopicResult {
  primaryTopic: string;
  confidence: number;
  allTopics: Record<string, number>;
  suggestedTags: string[];
}

/**
 * Advanced topic classification service for code snippets
 */
export class TopicClassifierService {
  private static readonly LANGUAGE_PATTERNS: Record<string, LanguageConfig> = {
    javascript: {
      patterns: [
        /(?:function|const|let|var|=>)/gi,
        /(?:console\.log|document\.|window\.)/gi,
        /(?:npm|yarn|package\.json)/gi,
        /(?:import.*from|export.*)/gi,
      ],
      keywords: ['function', 'const', 'let', 'var', 'console', 'document', 'window', 'import', 'export'],
      extensions: ['.js', '.jsx', '.mjs'],
      frameworks: ['react', 'vue', 'angular', 'node', 'express'],
      weight: 1.0
    },
    typescript: {
      patterns: [
        /(?:interface|type|enum)/gi,
        /(?::\s*\w+|as\s+\w+)/gi,
        /(?:import.*from.*['"].*\.ts)/gi,
        /(?:public|private|protected)\s+/gi,
      ],
      keywords: ['interface', 'type', 'enum', 'implements', 'extends', 'public', 'private'],
      extensions: ['.ts', '.tsx'],
      frameworks: ['angular', 'nest', 'typeorm'],
      weight: 1.0
    },
    python: {
      patterns: [
        /(?:def|import|from|print)/gi,
        /(?:if __name__|\.py)/gi,
        /(?:class\s+\w+.*:)/gi,
        /(?:pip install|requirements\.txt)/gi,
      ],
      keywords: ['def', 'import', 'from', 'print', 'class', 'if', 'elif', 'else'],
      extensions: ['.py', '.pyw'],
      frameworks: ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
      weight: 1.0
    },
    swift: {
      patterns: [
        /(?:func|var|let|import UIKit)/gi,
        /(?:@IBOutlet|@IBAction)/gi,
        /(?:override|extension)/gi,
        /(?:class\s+\w+:\s*UIViewController)/gi,
      ],
      keywords: ['func', 'var', 'let', 'override', 'extension', 'class', 'struct'],
      extensions: ['.swift'],
      frameworks: ['uikit', 'swiftui', 'combine', 'core data'],
      weight: 1.0
    },
    java: {
      patterns: [
        /(?:public class|public static void)/gi,
        /(?:System\.out|import java)/gi,
        /(?:@Override|extends|implements)/gi,
        /(?:ArrayList|HashMap)/gi,
      ],
      keywords: ['public', 'class', 'static', 'void', 'extends', 'implements'],
      extensions: ['.java'],
      frameworks: ['spring', 'hibernate', 'android'],
      weight: 1.0
    },
    kotlin: {
      patterns: [
        /(?:fun|val|var|class)/gi,
        /(?:import.*kotlin)/gi,
        /(?:override|companion object)/gi,
        /(?:data class)/gi,
      ],
      keywords: ['fun', 'val', 'var', 'class', 'override', 'companion'],
      extensions: ['.kt', '.kts'],
      frameworks: ['android', 'spring boot'],
      weight: 1.0
    },
    go: {
      patterns: [
        /(?:func|package|import)/gi,
        /(?:fmt\.Print|go mod)/gi,
        /(?:interface\{\}|struct\{)/gi,
        /(?:goroutine|channel)/gi,
      ],
      keywords: ['func', 'package', 'import', 'var', 'const', 'type'],
      extensions: ['.go'],
      frameworks: ['gin', 'echo', 'fiber'],
      weight: 1.0
    },
    rust: {
      patterns: [
        /(?:fn|let|mut|struct)/gi,
        /(?:cargo|Cargo\.toml)/gi,
        /(?:impl|trait|enum)/gi,
        /(?:println!|vec!)/gi,
      ],
      keywords: ['fn', 'let', 'mut', 'struct', 'impl', 'trait', 'enum'],
      extensions: ['.rs'],
      frameworks: ['actix', 'tokio', 'serde'],
      weight: 1.0
    },
    cpp: {
      patterns: [
        /(?:#include|using namespace)/gi,
        /(?:int main|cout|cin)/gi,
        /(?:class|public:|private:)/gi,
        /(?:std::|vector<)/gi,
      ],
      keywords: ['include', 'using', 'namespace', 'class', 'public', 'private'],
      extensions: ['.cpp', '.cc', '.cxx'],
      frameworks: ['qt', 'boost'],
      weight: 1.0
    },
    csharp: {
      patterns: [
        /(?:using System|namespace)/gi,
        /(?:public class|static void Main)/gi,
        /(?:Console\.WriteLine)/gi,
        /(?:var|string|int|bool)/gi,
      ],
      keywords: ['using', 'namespace', 'public', 'class', 'static', 'void'],
      extensions: ['.cs'],
      frameworks: ['.net', 'asp.net', 'blazor'],
      weight: 1.0
    }
  };

  private static readonly TOPIC_PATTERNS = {
    'mobile-development': {
      patterns: [
        /(?:React Native|Expo|iOS|Android)/gi,
        /(?:UIKit|SwiftUI|Kotlin|Flutter)/gi,
        /(?:@react-navigation|expo-|react-native-)/gi,
      ],
      weight: 5,
      relatedTopics: ['ui-components', 'navigation']
    },
    'web-development': {
      patterns: [
        /(?:HTML|CSS|DOM|fetch|axios)/gi,
        /(?:addEventListener|querySelector|getElementById)/gi,
        /(?:http|api|endpoint|rest)/gi,
      ],
      weight: 4,
      relatedTopics: ['api-integration', 'frontend']
    },
    'backend-development': {
      patterns: [
        /(?:server|express|api|route)/gi,
        /(?:database|sql|mongodb|postgres)/gi,
        /(?:middleware|auth|jwt)/gi,
      ],
      weight: 4,
      relatedTopics: ['database', 'api-integration', 'authentication']
    },
    'database': {
      patterns: [
        /(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)/gi,
        /(?:database|table|query|schema|migration)/gi,
        /(?:supabase|postgres|mysql|mongodb)/gi,
      ],
      weight: 4,
      relatedTopics: ['backend-development']
    },
    'authentication': {
      patterns: [
        /(?:auth|login|signup|password|token)/gi,
        /(?:JWT|session|cookie|oauth)/gi,
        /(?:signIn|signUp|signOut|authenticate)/gi,
      ],
      weight: 4,
      relatedTopics: ['security', 'backend-development']
    },
    'ui-components': {
      patterns: [
        /(?:component|props|useState|useEffect)/gi,
        /(?:button|input|form|modal|card)/gi,
        /(?:styling|css|tailwind|styled)/gi,
      ],
      weight: 3,
      relatedTopics: ['frontend', 'mobile-development']
    },
    'data-processing': {
      patterns: [
        /(?:map|filter|reduce|forEach|sort)/gi,
        /(?:JSON|parse|stringify|transform)/gi,
        /(?:array|object|data|algorithm)/gi,
      ],
      weight: 3,
      relatedTopics: ['algorithms']
    },
    'api-integration': {
      patterns: [
        /(?:fetch|axios|api|endpoint|rest)/gi,
        /(?:GET|POST|PUT|DELETE|PATCH)/gi,
        /(?:async|await|promise|response)/gi,
      ],
      weight: 4,
      relatedTopics: ['web-development', 'backend-development']
    },
    'testing': {
      patterns: [
        /(?:test|spec|jest|mocha|cypress)/gi,
        /(?:expect|describe|it|should|mock)/gi,
        /(?:unit test|integration test|e2e)/gi,
      ],
      weight: 3,
      relatedTopics: ['quality-assurance']
    },
    'algorithms': {
      patterns: [
        /(?:sort|search|binary|recursion)/gi,
        /(?:big o|complexity|optimize)/gi,
        /(?:data structure|linked list|tree|graph)/gi,
      ],
      weight: 3,
      relatedTopics: ['data-processing']
    }
  };

  /**
   * Detect programming language from code text
   */
  static detectLanguage(text: string): LanguageResult {
    const scores: Record<string, number> = {};
    const detectedFrameworks: string[] = [];
    
    for (const [language, config] of Object.entries(this.LANGUAGE_PATTERNS)) {
      let score = 0;
      
      // Pattern matching with weighted scoring
      for (const pattern of config.patterns) {
        const matches = text.match(pattern);
        score += matches ? matches.length * 3 * config.weight : 0;
      }
      
      // Keyword density analysis
      const words = text.toLowerCase().split(/\W+/);
      const keywordCount = words.filter(word => 
        config.keywords.includes(word)
      ).length;
      score += keywordCount * 2 * config.weight;
      
      // File extension detection
      for (const ext of config.extensions) {
        if (text.includes(ext)) {
          score += 5 * config.weight;
        }
      }
      
      // Framework detection
      if (config.frameworks) {
        for (const framework of config.frameworks) {
          const frameworkPattern = new RegExp(framework, 'gi');
          if (frameworkPattern.test(text)) {
            score += 3 * config.weight;
            detectedFrameworks.push(framework);
          }
        }
      }
      
      scores[language] = score;
    }
    
    const sortedLanguages = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    const topLanguage = sortedLanguages[0];
    
    return {
      language: topLanguage?.[0] || 'unknown',
      confidence: topLanguage?.[1] || 0,
      allScores: scores,
      frameworks: [...new Set(detectedFrameworks)]
    };
  }

  /**
   * Classify topic/domain from code text
   */
  static classifyTopic(text: string): TopicResult {
    const scores: Record<string, number> = {};
    const suggestedTags: string[] = [];
    
    for (const [topic, config] of Object.entries(this.TOPIC_PATTERNS)) {
      let score = 0;
      
      for (const pattern of config.patterns) {
        const matches = text.match(pattern);
        score += matches ? matches.length * config.weight : 0;
      }
      
      scores[topic] = score;
    }
    
    const sortedTopics = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    // Get primary topic and related topics as tags
    const primaryTopic = sortedTopics[0];
    if (primaryTopic) {
      const topicConfig = this.TOPIC_PATTERNS[primaryTopic[0] as keyof typeof this.TOPIC_PATTERNS];
      suggestedTags.push(primaryTopic[0]);
      
      if (topicConfig.relatedTopics) {
        suggestedTags.push(...topicConfig.relatedTopics);
      }
    }
    
    // Add other high-scoring topics as tags
    sortedTopics.slice(1, 3).forEach(([topic]) => {
      if (!suggestedTags.includes(topic)) {
        suggestedTags.push(topic);
      }
    });
    
    return {
      primaryTopic: primaryTopic?.[0] || 'general',
      confidence: primaryTopic?.[1] || 0,
      allTopics: scores,
      suggestedTags: suggestedTags.slice(0, 5) // Limit to 5 tags
    };
  }

  /**
   * Find similar files using keyword similarity
   */
  static async findSimilarFiles(
    text: string, 
    userId: string, 
    threshold: number = 0.4
  ): Promise<SimilarFile[]> {
    try {
      // Use Supabase function for similarity search
      const similarFiles = await supabaseHelpers.findSimilarFiles(text, threshold);
      return similarFiles;
    } catch (error) {
      console.error('Error finding similar files:', error);
      
      // Fallback to keyword-based similarity
      return await this.fallbackSimilaritySearch(text, userId, threshold);
    }
  }

  /**
   * Fallback similarity search using keyword matching
   */
  private static async fallbackSimilaritySearch(
    text: string, 
    userId: string, 
    threshold: number
  ): Promise<SimilarFile[]> {
    try {
      const files = await supabaseHelpers.getUserFiles(userId);
      
      const similarities = files.map(file => {
        const fileText = `${file.title} ${file.description || ''} ${file.tags.join(' ')}`;
        const similarity = this.calculateKeywordSimilarity(text, fileText);
        
        return {
          id: file.id,
          title: file.title,
          similarity
        };
      }).filter(file => file.similarity > threshold)
        .sort((a, b) => b.similarity - a.similarity);

      return similarities;
    } catch (error) {
      console.error('Fallback similarity search error:', error);
      return [];
    }
  }

  /**
   * Calculate keyword similarity using Jaccard index
   */
  private static calculateKeywordSimilarity(text1: string, text2: string): number {
    const getKeywords = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !this.STOP_WORDS.has(word));
    };

    const keywords1 = new Set(getKeywords(text1));
    const keywords2 = new Set(getKeywords(text2));
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate intelligent file name from content
   */
  static generateFileName(text: string, language?: string): string {
    // Extract meaningful keywords
    const keywords = this.extractKeywords(text);
    
    // Ensure we have a language (use 'code' as fallback)
    const lang = language && language !== 'unknown' ? language : 'code';
    
    // Generate base name from keywords
    let baseName = keywords.slice(0, 3).join('-');
    
    // ALWAYS add language prefix
    if (baseName && baseName.length > 2) {
      baseName = `${lang}-${baseName}`;
    } else {
      // Fallback to generic name with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      baseName = `${lang}-snippet-${timestamp}`;
    }
    
    return this.sanitizeFileName(baseName);
  }

  /**
   * Extract meaningful keywords from text
   */
  private static extractKeywords(text: string): string[] {
    // Split into words and filter
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.STOP_WORDS.has(word) &&
        !/^\d+$/.test(word) // Remove pure numbers
      );

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return most frequent words
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Sanitize filename for cross-platform compatibility
   */
  private static sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limit length
  }

  /**
   * Perform complete classification of text content with contextual awareness
   */
  static async classifyContent(
    text: string,
    userId: string
  ): Promise<ClassificationResult> {
    try {
      // Detect programming language with enhanced analysis
      const languageResult = await this.detectLanguageWithContext(text, userId);
      
      // Classify topic with contextual awareness
      const topicResult = await this.classifyTopicWithContext(text, userId);
      
      // Find similar existing files with advanced similarity
      const similarFiles = await this.findSimilarFilesAdvanced(text, userId, 0.4);
      
      // Generate suggested file name with intelligence
      const suggestedName = this.generateIntelligentFileName(text, languageResult, topicResult, similarFiles);
      
      // Determine if content should be appended with advanced logic
      const shouldAppendToExisting = await this.shouldAppendToExisting(text, similarFiles, userId);

      return {
        language: languageResult,
        topic: topicResult,
        similarFiles,
        suggestedName,
        shouldAppendToExisting
      };
    } catch (error) {
      console.error('Classification error:', error);
      throw error;
    }
  }

  /**
   * Enhanced language detection with user context
   */
  private static async detectLanguageWithContext(
    text: string,
    userId: string
  ): Promise<{
    language: string;
    confidence: number;
    allScores: Record<string, number>;
    frameworks: string[];
  }> {
    const baseResult = this.detectLanguage(text);
    
    try {
      // Get user's historical language preferences
      const userFiles = await supabaseHelpers.getUserFiles(userId);
      const languageFrequency = userFiles.reduce((freq, file) => {
        if (file.language) {
          freq[file.language] = (freq[file.language] || 0) + 1;
        }
        return freq;
      }, {} as Record<string, number>);
      
      // Boost confidence for frequently used languages
      if (languageFrequency[baseResult.language]) {
        const boost = Math.min(0.2, languageFrequency[baseResult.language] / userFiles.length);
        baseResult.confidence += boost;
      }
      
      // Detect framework context from user's recent files
      const recentFiles = userFiles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      const contextualFrameworks = this.detectContextualFrameworks(text, recentFiles);
      baseResult.frameworks.push(...contextualFrameworks);
      
    } catch (error) {
      console.warn('Failed to apply language context:', error);
    }
    
    return baseResult;
  }

  /**
   * Enhanced topic classification with contextual awareness
   */
  private static async classifyTopicWithContext(
    text: string,
    userId: string
  ): Promise<{
    primaryTopic: string;
    confidence: number;
    allTopics: Record<string, number>;
    suggestedTags: string[];
    frameworks: string[];
  }> {
    const baseResult = this.classifyTopic(text);
    
    try {
      // Get user's topic preferences from history
      const userFiles = await supabaseHelpers.getUserFiles(userId);
      const userTags = userFiles.flatMap(file => file.tags);
      const tagFrequency = userTags.reduce((freq, tag) => {
        freq[tag] = (freq[tag] || 0) + 1;
        return freq;
      }, {} as Record<string, number>);
      
      // Enhance suggested tags with user's frequent tags
      const frequentTags = Object.entries(tagFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);
      
      // Add contextually relevant tags
      const contextualTags = this.findContextualTags(text, frequentTags);
      baseResult.suggestedTags.push(...contextualTags);
      
      // Remove duplicates and limit
      baseResult.suggestedTags = [...new Set(baseResult.suggestedTags)].slice(0, 8);
      
      // Detect project context
      const projectContext = await this.detectProjectContext(text, userFiles);
      if (projectContext) {
        baseResult.suggestedTags.unshift(projectContext);
      }
      
    } catch (error) {
      console.warn('Failed to apply topic context:', error);
    }
    
    return {
      ...baseResult,
      frameworks: [] // Will be populated by language detection
    };
  }

  /**
   * Advanced similar files detection using multiple algorithms
   */
  private static async findSimilarFilesAdvanced(
    text: string,
    userId: string,
    threshold: number = 0.3
  ): Promise<SimilarFile[]> {
    try {
      // Get all user content
      const [files, snippets] = await Promise.all([
        supabaseHelpers.getUserFiles(userId),
        supabaseHelpers.getUserSnippets(userId)
      ]);
      
      const allContent = [
        ...files.map(file => ({
          id: file.id,
          title: file.title,
          content: `${file.title} ${file.description || ''} ${file.tags.join(' ')}`,
          type: 'file' as const,
          metadata: file
        })),
        ...snippets.map(snippet => ({
          id: snippet.id,
          title: `Snippet from ${snippet.file_id}`,
          content: snippet.extracted_text,
          type: 'snippet' as const,
          metadata: snippet
        }))
      ];
      
      // Use advanced similarity analysis
      const similarities = ContentSimilarityService.findSimilarContent(
        text,
        allContent.map(item => ({
          id: item.id,
          content: item.content,
          metadata: item
        }))
      );
      
      // Convert to expected format and filter by threshold
      return similarities
        .filter(sim => sim.similarity.score > threshold)
        .map(sim => ({
          id: sim.id,
          title: sim.metadata.title || `Snippet from ${sim.metadata.file_id}`,
          similarity: sim.similarity.score,
          description: sim.similarity.reasons.join(', '),
          language: sim.metadata.language,
          tags: sim.metadata.tags || []
        }))
        .slice(0, 10); // Limit results
        
    } catch (error) {
      console.error('Advanced similarity search failed:', error);
      return await this.fallbackSimilaritySearch(text, userId, threshold);
    }
  }

  /**
   * Generate intelligent file names with context
   */
  private static generateIntelligentFileName(
    text: string,
    languageResult: any,
    topicResult: any,
    similarFiles: SimilarFile[]
  ): string {
    // Extract semantic elements
    const semanticElements = this.extractSemanticElements(text);
    
    // Get language (ensure it's always included)
    const language = languageResult.language !== 'unknown' ? languageResult.language : 'code';
    
    // Generate base name variations
    const nameVariations = [];
    
    // Method 1: Based on main functionality (always include language)
    if (semanticElements.mainFunction) {
      nameVariations.push(`${language}-${semanticElements.mainFunction}`);
    }
    
    // Method 2: Language + primary topic (prioritize this format)
    const topicName = topicResult.primaryTopic.replace(/-/g, ' ').replace(/\s+/g, '-');
    nameVariations.push(`${language}-${topicName}`);
    
    // Method 3: Based on detected patterns (include language)
    if (semanticElements.patterns.length > 0) {
      nameVariations.push(`${language}-${semanticElements.patterns[0]}`);
    }
    
    // Method 4: Sequential naming if similar files exist
    if (similarFiles.length > 0) {
      const baseName = similarFiles[0].title.replace(/\d+$/, '').replace(/-$/, '').trim();
      const nextNumber = this.getNextSequentialNumber(baseName, similarFiles);
      
      // Ensure language is in the base name
      if (!baseName.includes(language)) {
        nameVariations.push(`${language}-${baseName}-${nextNumber}`);
      } else {
        nameVariations.push(`${baseName}-${nextNumber}`);
      }
    }
    
    // Method 5: Language + keyword-based fallback
    const fallbackName = this.generateFileName(text, language);
    nameVariations.push(fallbackName);
    
    // Select best name (prefer language-prefixed ones)
    const bestName = nameVariations.find(name => 
      name.startsWith(language) && name.length > 10 && name.length < 50
    ) || nameVariations.find(name => name.length > 10 && name.length < 50) 
      || nameVariations[1] // Prefer language-topic format
      || fallbackName;
    
    return this.sanitizeFileName(bestName);
  }

  /**
   * Advanced logic to determine if content should be appended
   */
  private static async shouldAppendToExisting(
    text: string,
    similarFiles: SimilarFile[],
    userId: string
  ): Promise<boolean> {
    if (similarFiles.length === 0) {
      return false;
    }
    
    const topSimilar = similarFiles[0];
    
    // Special case: Exact topic match - always append
    const textLower = text.toLowerCase();
    const titleLower = topSimilar.title.toLowerCase();
    
    // Extract core topic from both
    const extractCoreTopic = (str: string) => {
      // Remove language prefixes and numbers
      return str.replace(/^(javascript|typescript|python|swift|java|kotlin|go|rust|cpp|csharp)-/, '')
                .replace(/-\d+$/, '')
                .trim();
    };
    
    const textTopic = extractCoreTopic(titleLower);
    const fileTopic = extractCoreTopic(topSimilar.title.toLowerCase());
    
    // If exact topic match (e.g., both are "ui-components"), always append
    if (textTopic === fileTopic && textTopic.length > 0) {
      console.log(`Exact topic match found: "${textTopic}" - auto-appending`);
      return true;
    }
    
    // High similarity threshold for auto-append
    if (topSimilar.similarity > 0.5) {
      return true;
    }
    
    // Check for code sequence continuation
    try {
      const snippets = await supabaseHelpers.getUserSnippets(userId);
      const relatedSnippets = snippets.filter(s => s.file_id === topSimilar.id);
      
      if (relatedSnippets.length > 0) {
        const sequenceAnalysis = CodeSequenceDetector.analyzeSequence([
          {
            id: 'new',
            content: text,
            timestamp: new Date()
          },
          ...relatedSnippets.map(s => ({
            id: s.id,
            content: s.extracted_text,
            timestamp: new Date(s.created_at)
          }))
        ]);
        
        // If it's a clear continuation, suggest appending
        if (sequenceAnalysis.overallPattern.type === 'continuation' && 
            sequenceAnalysis.overallPattern.confidence > 0.7) {
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to analyze sequence for append decision:', error);
    }
    
    // Default threshold for medium similarity
    return topSimilar.similarity > 0.4;
  }

  /**
   * Extract semantic elements from code
   */
  private static extractSemanticElements(text: string): {
    mainFunction: string | null;
    keyElements: string[];
    patterns: string[];
  } {
    const result = {
      mainFunction: null as string | null,
      keyElements: [] as string[],
      patterns: [] as string[]
    };
    
    // Extract main function
    const functionMatches = text.match(/(?:function|const|let)\s+(\w+)/g);
    if (functionMatches && functionMatches.length > 0) {
      result.mainFunction = functionMatches[0].replace(/^(?:function|const|let)\s+/, '');
    }
    
    // Extract key elements (classes, components, etc.)
    const elementPatterns = [
      /class\s+(\w+)/g,
      /interface\s+(\w+)/g,
      /type\s+(\w+)/g,
      /const\s+(\w+Component)/g
    ];
    
    elementPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        result.keyElements.push(match[1]);
      }
    });
    
    // Extract patterns
    const patternIndicators = [
      { pattern: /useState|useEffect|useCallback/g, name: 'react-hooks' },
      { pattern: /router\.|app\.(get|post)/g, name: 'api-routes' },
      { pattern: /describe\(|it\(|test\(/g, name: 'testing' },
      { pattern: /async|await|Promise/g, name: 'async-patterns' }
    ];
    
    patternIndicators.forEach(({ pattern, name }) => {
      if (pattern.test(text)) {
        result.patterns.push(name);
      }
    });
    
    return result;
  }

  /**
   * Detect contextual frameworks based on recent files
   */
  private static detectContextualFrameworks(
    text: string,
    recentFiles: any[]
  ): string[] {
    const frameworks: string[] = [];
    
    // Analyze recent files for framework patterns
    const recentFrameworks = recentFiles.flatMap(file => {
      const content = `${file.title} ${file.description || ''}`;
      return this.extractFrameworksFromContent(content);
    });
    
    // If current text has similar patterns, include those frameworks
    recentFrameworks.forEach(framework => {
      if (this.hasFrameworkPatterns(text, framework)) {
        frameworks.push(framework);
      }
    });
    
    return [...new Set(frameworks)];
  }

  /**
   * Find contextually relevant tags
   */
  private static findContextualTags(text: string, frequentTags: string[]): string[] {
    return frequentTags.filter(tag => {
      // Simple relevance check - tag appears in content or is semantically related
      return text.toLowerCase().includes(tag.toLowerCase()) ||
             this.isSemanticallySimilar(text, tag);
    }).slice(0, 3);
  }

  /**
   * Detect project context from user files
   */
  private static async detectProjectContext(
    text: string,
    userFiles: any[]
  ): Promise<string | null> {
    // Look for project indicators in text
    const projectPatterns = [
      /import.*from\s+['"]([^'"/]+)/g,
      /package\s*['"]([^'"]+)['"]?/g,
      /@([\w-]+)\/([\w-]+)/g
    ];
    
    const indicators: string[] = [];
    projectPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        indicators.push(match[1]);
      }
    });
    
    // Find matching projects in user files
    for (const indicator of indicators) {
      const matchingFiles = userFiles.filter(file => 
        file.title.toLowerCase().includes(indicator.toLowerCase()) ||
        file.description?.toLowerCase().includes(indicator.toLowerCase()) ||
        file.tags.some((tag: string) => tag.toLowerCase().includes(indicator.toLowerCase()))
      );
      
      if (matchingFiles.length > 1) {
        return indicator;
      }
    }
    
    return null;
  }

  /**
   * Get next sequential number for similar files
   */
  private static getNextSequentialNumber(baseName: string, similarFiles: SimilarFile[]): number {
    const numbers = similarFiles
      .map(file => {
        // Match both "name-2" and "name 2" patterns
        const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
          new RegExp(`${escapedBaseName}-(\\d+)$`),
          new RegExp(`${escapedBaseName}\\s+(\\d+)$`),
          new RegExp(`${escapedBaseName}(\\d+)$`)
        ];
        
        for (const pattern of patterns) {
          const match = file.title.match(pattern);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
        
        // Check if this is the base file itself (no number)
        if (file.title === baseName || file.title === `${baseName}-1`) {
          return 1;
        }
        
        return 0;
      })
      .filter(num => num > 0);
    
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 2;
  }

  /**
   * Helper methods
   */
  private static extractFrameworksFromContent(content: string): string[] {
    const frameworks: string[] = [];
    
    const frameworkPatterns = {
      'react': /react|jsx|useState|useEffect/i,
      'vue': /vue|@vue|composition/i,
      'angular': /angular|@angular|ng-/i,
      'express': /express|app\.get|app\.post/i,
      'nestjs': /@nestjs|@Injectable|@Controller/i,
      'nextjs': /next|getServerSideProps|getStaticProps/i
    };
    
    Object.entries(frameworkPatterns).forEach(([framework, pattern]) => {
      if (pattern.test(content)) {
        frameworks.push(framework);
      }
    });
    
    return frameworks;
  }

  private static hasFrameworkPatterns(text: string, framework: string): boolean {
    const patterns: Record<string, RegExp> = {
      'react': /react|jsx|useState|useEffect|component/i,
      'vue': /vue|@vue|composition|ref\(/i,
      'angular': /angular|@angular|ng-|component/i,
      'express': /express|app\.|router\./i,
      'nestjs': /@nestjs|@Injectable|@Controller/i,
      'nextjs': /next|getServerSideProps|getStaticProps/i
    };
    
    const pattern = patterns[framework];
    return pattern ? pattern.test(text) : false;
  }

  private static isSemanticallySimilar(text: string, tag: string): boolean {
    // Simple semantic similarity check
    const semanticGroups = {
      'auth': ['login', 'signin', 'authentication', 'user', 'password'],
      'api': ['request', 'response', 'endpoint', 'fetch', 'http'],
      'ui': ['component', 'interface', 'view', 'screen', 'layout'],
      'database': ['query', 'model', 'schema', 'table', 'data']
    };
    
    for (const [group, keywords] of Object.entries(semanticGroups)) {
      if (tag.includes(group) || keywords.includes(tag)) {
        return keywords.some(keyword => text.toLowerCase().includes(keyword));
      }
    }
    
    return false;
  }

  /**
   * Common stop words to filter out
   */
  private static readonly STOP_WORDS = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their'
  ]);
}

// Singleton instance
export const topicClassifier = new TopicClassifierService();

// Enhanced classification result interface
export interface EnhancedClassificationResult extends ClassificationResult {
  contextualInfo: {
    userLanguagePreference: string[];
    projectContext: string | null;
    sequenceContinuation: boolean;
    frameworksDetected: string[];
  };
  organizationSuggestions: {
    groupWithSimilar: boolean;
    suggestedMergeTarget: string | null;
    confidenceScore: number;
  };
}