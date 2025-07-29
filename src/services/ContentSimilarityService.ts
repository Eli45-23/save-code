import { Database } from '../types/database';

export interface SimilarityResult {
  score: number;
  type: 'exact_match' | 'high_similarity' | 'related' | 'unrelated';
  reasons: string[];
  confidence: number;
}

export interface ContentSignature {
  keywords: Set<string>;
  codePatterns: string[];
  structure: string;
  language: string;
  imports: string[];
  functions: string[];
  classes: string[];
  variables: string[];
}

/**
 * Advanced content similarity detection service
 * Uses multiple algorithms for comprehensive similarity analysis
 */
export class ContentSimilarityService {
  
  /**
   * Calculate comprehensive similarity between two code snippets
   */
  static calculateSimilarity(content1: string, content2: string): SimilarityResult {
    const signature1 = this.generateContentSignature(content1);
    const signature2 = this.generateContentSignature(content2);
    
    const scores = {
      semantic: this.calculateSemanticSimilarity(signature1, signature2),
      structural: this.calculateStructuralSimilarity(signature1, signature2),
      lexical: this.calculateLexicalSimilarity(content1, content2),
      contextual: this.calculateContextualSimilarity(signature1, signature2)
    };
    
    // Weighted average with higher emphasis on semantic and structural
    const overallScore = (
      scores.semantic * 0.35 +
      scores.structural * 0.25 +
      scores.lexical * 0.25 +
      scores.contextual * 0.15
    );
    
    const reasons = this.generateSimilarityReasons(scores, signature1, signature2);
    const type = this.determineSimilarityType(overallScore);
    const confidence = this.calculateConfidence(scores);
    
    return {
      score: overallScore,
      type,
      reasons,
      confidence
    };
  }
  
  /**
   * Generate content signature for advanced analysis
   */
  private static generateContentSignature(content: string): ContentSignature {
    const keywords = this.extractKeywords(content);
    const codePatterns = this.extractCodePatterns(content);
    const structure = this.analyzeStructure(content);
    const language = this.detectLanguage(content);
    
    return {
      keywords: new Set(keywords),
      codePatterns,
      structure,
      language,
      imports: this.extractImports(content),
      functions: this.extractFunctions(content),
      classes: this.extractClasses(content),
      variables: this.extractVariables(content)
    };
  }
  
  /**
   * Calculate semantic similarity based on meaning and purpose
   */
  private static calculateSemanticSimilarity(sig1: ContentSignature, sig2: ContentSignature): number {
    // Keyword similarity with TF-IDF-like weighting
    const keywordSimilarity = this.calculateJaccardSimilarity(sig1.keywords, sig2.keywords);
    
    // Function/class purpose similarity
    const functionalSimilarity = this.calculateFunctionalSimilarity(sig1, sig2);
    
    // Import similarity (related libraries/frameworks)
    const importSimilarity = this.calculateArraySimilarity(sig1.imports, sig2.imports);
    
    return (keywordSimilarity * 0.5 + functionalSimilarity * 0.3 + importSimilarity * 0.2);
  }
  
  /**
   * Calculate structural similarity based on code organization
   */
  private static calculateStructuralSimilarity(sig1: ContentSignature, sig2: ContentSignature): number {
    // Code pattern similarity
    const patternSimilarity = this.calculateArraySimilarity(sig1.codePatterns, sig2.codePatterns);
    
    // Structure similarity
    const structureSimilarity = this.calculateStructuralPatternSimilarity(sig1.structure, sig2.structure);
    
    // Language compatibility
    const languageSimilarity = sig1.language === sig2.language ? 1.0 : 
                              this.getLanguageCompatibility(sig1.language, sig2.language);
    
    return (patternSimilarity * 0.4 + structureSimilarity * 0.4 + languageSimilarity * 0.2);
  }
  
  /**
   * Calculate lexical similarity based on exact text matching
   */
  private static calculateLexicalSimilarity(content1: string, content2: string): number {
    const shingles1 = this.generateShingles(content1, 3);
    const shingles2 = this.generateShingles(content2, 3);
    
    return this.calculateJaccardSimilarity(shingles1, shingles2);
  }
  
  /**
   * Calculate contextual similarity based on usage patterns
   */
  private static calculateContextualSimilarity(sig1: ContentSignature, sig2: ContentSignature): number {
    // Variable usage patterns
    const variableSimilarity = this.calculateArraySimilarity(sig1.variables, sig2.variables);
    
    // Function call patterns
    const functionSimilarity = this.calculateArraySimilarity(sig1.functions, sig2.functions);
    
    // Class usage patterns
    const classSimilarity = this.calculateArraySimilarity(sig1.classes, sig2.classes);
    
    return (variableSimilarity * 0.4 + functionSimilarity * 0.4 + classSimilarity * 0.2);
  }
  
  /**
   * Extract meaningful keywords from content
   */
  private static extractKeywords(content: string): string[] {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has'
    ]);
    
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word))
      .slice(0, 50); // Limit for performance
  }
  
  /**
   * Extract code patterns for structural analysis
   */
  private static extractCodePatterns(content: string): string[] {
    const patterns = [
      // Control structures
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      
      // Function patterns
      /function\s+\w+/g,
      /const\s+\w+\s*=/g,
      /let\s+\w+\s*=/g,
      /var\s+\w+\s*=/g,
      
      // Object/class patterns
      /class\s+\w+/g,
      /interface\s+\w+/g,
      /type\s+\w+/g,
      
      // React patterns
      /useState\(/g,
      /useEffect\(/g,
      /useCallback\(/g,
      /useMemo\(/g,
      
      // API patterns
      /fetch\(/g,
      /axios\./g,
      /async\s+function/g,
      /await\s+/g
    ];
    
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const patternMatches = content.match(pattern);
      if (patternMatches) {
        matches.push(...patternMatches);
      }
    });
    
    return matches;
  }
  
  /**
   * Analyze code structure
   */
  private static analyzeStructure(content: string): string {
    const structure = [];
    
    // Indentation patterns
    const lines = content.split('\n');
    const indentationPattern = lines
      .filter(line => line.trim().length > 0)
      .map(line => Math.floor((line.length - line.trimStart().length) / 2))
      .slice(0, 20) // Limit for performance
      .join(',');
    
    structure.push(`indent:${indentationPattern}`);
    
    // Block structure
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    structure.push(`braces:${openBraces}-${closeBraces}`);
    
    // Line count
    structure.push(`lines:${lines.length}`);
    
    return structure.join('|');
  }
  
  /**
   * Detect programming language
   */
  private static detectLanguage(content: string): string {
    const indicators = {
      typescript: [/interface\s+\w+/g, /type\s+\w+\s*=/g, /:\s*\w+/g],
      javascript: [/function\s+\w+/g, /const\s+\w+/g, /=>/g],
      python: [/def\s+\w+/g, /import\s+\w+/g, /if\s+__name__/g],
      swift: [/func\s+\w+/g, /var\s+\w+/g, /let\s+\w+/g],
      java: [/public\s+class/g, /public\s+static/g, /System\.out/g]
    };
    
    let maxScore = 0;
    let detectedLanguage = 'unknown';
    
    Object.entries(indicators).forEach(([language, patterns]) => {
      let score = 0;
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        score += matches ? matches.length : 0;
      });
      
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = language;
      }
    });
    
    return detectedLanguage;
  }
  
  /**
   * Extract import statements
   */
  private static extractImports(content: string): string[] {
    const importPatterns = [
      /import\s+.*from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /#include\s*<([^>]+)>/g,
      /using\s+([^;]+);/g
    ];
    
    const imports: string[] = [];
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });
    
    return imports;
  }
  
  /**
   * Extract function names
   */
  private static extractFunctions(content: string): string[] {
    const functionPatterns = [
      /function\s+(\w+)/g,
      /const\s+(\w+)\s*=\s*\(/g,
      /let\s+(\w+)\s*=\s*\(/g,
      /(\w+)\s*:\s*\(/g, // TypeScript method signatures
      /def\s+(\w+)/g, // Python
      /func\s+(\w+)/g // Swift
    ];
    
    const functions: string[] = [];
    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    });
    
    return functions;
  }
  
  /**
   * Extract class names
   */
  private static extractClasses(content: string): string[] {
    const classPatterns = [
      /class\s+(\w+)/g,
      /interface\s+(\w+)/g,
      /type\s+(\w+)/g
    ];
    
    const classes: string[] = [];
    classPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        classes.push(match[1]);
      }
    });
    
    return classes;
  }
  
  /**
   * Extract variable names
   */
  private static extractVariables(content: string): string[] {
    const variablePatterns = [
      /(?:const|let|var)\s+(\w+)/g,
      /(\w+)\s*:/g // Object properties and TypeScript types
    ];
    
    const variables: string[] = [];
    variablePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        variables.push(match[1]);
      }
    });
    
    return variables.slice(0, 30); // Limit for performance
  }
  
  /**
   * Calculate Jaccard similarity between two sets
   */
  private static calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  /**
   * Calculate similarity between two arrays
   */
  private static calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    return this.calculateJaccardSimilarity(set1, set2);
  }
  
  /**
   * Calculate functional similarity based on purpose
   */
  private static calculateFunctionalSimilarity(sig1: ContentSignature, sig2: ContentSignature): number {
    const functionSimilarity = this.calculateArraySimilarity(sig1.functions, sig2.functions);
    const classSimilarity = this.calculateArraySimilarity(sig1.classes, sig2.classes);
    
    return (functionSimilarity + classSimilarity) / 2;
  }
  
  /**
   * Calculate structural pattern similarity
   */
  private static calculateStructuralPatternSimilarity(struct1: string, struct2: string): number {
    if (struct1 === struct2) return 1.0;
    
    const parts1 = struct1.split('|');
    const parts2 = struct2.split('|');
    
    let similarity = 0;
    let count = 0;
    
    // Compare each structural component
    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) {
        similarity += 1;
      } else if (parts1[i].startsWith('indent:') && parts2[i].startsWith('indent:')) {
        // Compare indentation patterns
        const indent1 = parts1[i].substring(7);
        const indent2 = parts2[i].substring(7);
        similarity += this.calculateStringSequenceSimilarity(indent1, indent2);
      }
      count++;
    }
    
    return count > 0 ? similarity / count : 0;
  }
  
  /**
   * Get language compatibility score
   */
  private static getLanguageCompatibility(lang1: string, lang2: string): number {
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      javascript: { typescript: 0.8, node: 0.7 },
      typescript: { javascript: 0.8, node: 0.6 },
      python: { django: 0.9, flask: 0.8 },
      swift: { objective_c: 0.6 },
      java: { kotlin: 0.7, android: 0.8 },
      kotlin: { java: 0.7, android: 0.9 }
    };
    
    return compatibilityMatrix[lang1]?.[lang2] || 0;
  }
  
  /**
   * Generate n-grams (shingles) for text comparison
   */
  private static generateShingles(text: string, n: number): Set<string> {
    const shingles = new Set<string>();
    const cleanText = text.toLowerCase().replace(/\s+/g, ' ');
    
    for (let i = 0; i <= cleanText.length - n; i++) {
      shingles.add(cleanText.substring(i, i + n));
    }
    
    return shingles;
  }
  
  /**
   * Calculate sequence similarity for strings
   */
  private static calculateStringSequenceSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }
  
  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Generate similarity reasons for explanation
   */
  private static generateSimilarityReasons(
    scores: Record<string, number>,
    sig1: ContentSignature,
    sig2: ContentSignature
  ): string[] {
    const reasons: string[] = [];
    
    if (scores.semantic > 0.7) {
      reasons.push('High semantic similarity - similar purpose and functionality');
    }
    
    if (scores.structural > 0.7) {
      reasons.push('Similar code structure and patterns');
    }
    
    if (scores.lexical > 0.5) {
      reasons.push('Shared code snippets or similar implementation');
    }
    
    if (sig1.language === sig2.language) {
      reasons.push(`Same programming language: ${sig1.language}`);
    }
    
    const commonFunctions = sig1.functions.filter(f => sig2.functions.includes(f));
    if (commonFunctions.length > 0) {
      reasons.push(`Shared functions: ${commonFunctions.slice(0, 3).join(', ')}`);
    }
    
    const commonImports = sig1.imports.filter(imp => sig2.imports.includes(imp));
    if (commonImports.length > 0) {
      reasons.push(`Common dependencies: ${commonImports.slice(0, 3).join(', ')}`);
    }
    
    return reasons;
  }
  
  /**
   * Determine similarity type based on score
   */
  private static determineSimilarityType(score: number): SimilarityResult['type'] {
    if (score >= 0.9) return 'exact_match';
    if (score >= 0.7) return 'high_similarity';
    if (score >= 0.4) return 'related';
    return 'unrelated';
  }
  
  /**
   * Calculate confidence in similarity assessment
   */
  private static calculateConfidence(scores: Record<string, number>): number {
    const variance = Object.values(scores).reduce((acc, score, _, arr) => {
      const mean = arr.reduce((sum, s) => sum + s, 0) / arr.length;
      return acc + Math.pow(score - mean, 2);
    }, 0) / Object.values(scores).length;
    
    // Lower variance = higher confidence
    return Math.max(0, 1 - Math.sqrt(variance));
  }
  
  /**
   * Find similar content in a collection
   */
  static findSimilarContent(
    targetContent: string,
    contentCollection: Array<{ id: string; content: string; metadata?: any }>
  ): Array<{ id: string; similarity: SimilarityResult; metadata?: any }> {
    return contentCollection
      .map(item => ({
        id: item.id,
        similarity: this.calculateSimilarity(targetContent, item.content),
        metadata: item.metadata
      }))
      .filter(item => item.similarity.score > 0.3)
      .sort((a, b) => b.similarity.score - a.similarity.score);
  }
}

export const contentSimilarityService = new ContentSimilarityService();