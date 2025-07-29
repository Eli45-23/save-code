export interface SequencePattern {
  type: 'continuation' | 'dependency' | 'evolution' | 'refactor' | 'feature_addition';
  confidence: number;
  evidence: string[];
  suggestedOrder: number;
}

export interface CodeSequence {
  snippets: Array<{
    id: string;
    content: string;
    timestamp: Date;
    order: number;
    pattern: SequencePattern;
  }>;
  overallPattern: SequencePattern;
  timeline: 'linear' | 'branched' | 'convergent';
}

/**
 * Intelligent code sequence detection service
 * Detects code continuation patterns and proper ordering
 */
export class CodeSequenceDetector {
  
  /**
   * Analyze and order code snippets in logical sequence
   */
  static analyzeSequence(snippets: Array<{
    id: string;
    content: string;
    timestamp: Date;
  }>): CodeSequence {
    const analyzedSnippets = snippets.map(snippet => ({
      ...snippet,
      order: 0,
      pattern: this.detectPattern(snippet.content, snippets)
    }));
    
    // Determine optimal ordering
    const orderedSnippets = this.orderSnippets(analyzedSnippets);
    
    // Analyze overall pattern
    const overallPattern = this.analyzeOverallPattern(orderedSnippets);
    
    // Determine timeline type
    const timeline = this.determineTimeline(orderedSnippets);
    
    return {
      snippets: orderedSnippets,
      overallPattern,
      timeline
    };
  }
  
  /**
   * Detect specific pattern for a code snippet
   */
  private static detectPattern(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): SequencePattern {
    const patterns = [
      this.detectContinuationPattern(content, allSnippets),
      this.detectDependencyPattern(content, allSnippets),
      this.detectEvolutionPattern(content, allSnippets),
      this.detectRefactorPattern(content, allSnippets),
      this.detectFeatureAdditionPattern(content, allSnippets)
    ];
    
    // Return pattern with highest confidence
    return patterns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }
  
  /**
   * Detect code continuation patterns
   */
  private static detectContinuationPattern(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): SequencePattern {
    const evidence: string[] = [];
    let confidence = 0;
    
    // Check for incomplete structures
    const incompleteBraces = this.countIncompleteBraces(content);
    if (incompleteBraces > 0) {
      evidence.push(`Incomplete braces: ${incompleteBraces}`);
      confidence += 0.3;
    }
    
    // Check for incomplete function definitions
    if (this.hasIncompleteFunction(content)) {
      evidence.push('Incomplete function definition');
      confidence += 0.4;
    }
    
    // Check for hanging statements
    if (this.hasHangingStatements(content)) {
      evidence.push('Hanging statements or incomplete logic');
      confidence += 0.2;
    }
    
    // Check for "to be continued" comments
    if (this.hasContinuationComments(content)) {
      evidence.push('Continuation comments found');
      confidence += 0.5;
    }
    
    // Check for incomplete imports/dependencies
    if (this.hasIncompleteImports(content)) {
      evidence.push('Incomplete import statements');
      confidence += 0.3;
    }
    
    return {
      type: 'continuation',
      confidence: Math.min(confidence, 1.0),
      evidence,
      suggestedOrder: this.calculateContinuationOrder(content, allSnippets)
    };
  }
  
  /**
   * Detect dependency patterns
   */
  private static detectDependencyPattern(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): SequencePattern {
    const evidence: string[] = [];
    let confidence = 0;
    
    // Extract dependencies (imports, function calls, variable references)
    const dependencies = this.extractDependencies(content);
    
    // Check if other snippets define these dependencies
    const definedDependencies = allSnippets.filter(snippet => 
      dependencies.some(dep => this.definesDependency(snippet.content, dep))
    );
    
    if (definedDependencies.length > 0) {
      evidence.push(`Depends on ${definedDependencies.length} other snippets`);
      confidence += 0.6;
    }
    
    // Check for interface/type dependencies
    const interfaceDependencies = this.extractInterfaceDependencies(content);
    if (interfaceDependencies.length > 0) {
      evidence.push(`Interface dependencies: ${interfaceDependencies.join(', ')}`);
      confidence += 0.4;
    }
    
    // Check for setup/configuration dependencies
    if (this.hasSetupDependencies(content)) {
      evidence.push('Requires setup or configuration');
      confidence += 0.3;
    }
    
    return {
      type: 'dependency',
      confidence: Math.min(confidence, 1.0),
      evidence,
      suggestedOrder: this.calculateDependencyOrder(content, allSnippets)
    };
  }
  
  /**
   * Detect code evolution patterns
   */
  private static detectEvolutionPattern(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): SequencePattern {
    const evidence: string[] = [];
    let confidence = 0;
    
    // Check for version indicators
    if (this.hasVersionIndicators(content)) {
      evidence.push('Version indicators found');
      confidence += 0.4;
    }
    
    // Check for improvement patterns
    if (this.hasImprovementPatterns(content)) {
      evidence.push('Code improvement patterns detected');
      confidence += 0.3;
    }
    
    // Check for optimization markers
    if (this.hasOptimizationMarkers(content)) {
      evidence.push('Optimization markers found');
      confidence += 0.3;
    }
    
    // Check for progressive complexity
    const complexity = this.calculateComplexity(content);
    const avgComplexity = allSnippets.reduce((sum, s) => 
      sum + this.calculateComplexity(s.content), 0) / allSnippets.length;
    
    if (complexity > avgComplexity * 1.2) {
      evidence.push('Higher complexity suggests evolution');
      confidence += 0.2;
    }
    
    return {
      type: 'evolution',
      confidence: Math.min(confidence, 1.0),
      evidence,
      suggestedOrder: this.calculateEvolutionOrder(content, allSnippets)
    };
  }
  
  /**
   * Detect refactoring patterns
   */
  private static detectRefactorPattern(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): SequencePattern {
    const evidence: string[] = [];
    let confidence = 0;
    
    // Check for refactoring keywords
    if (this.hasRefactoringKeywords(content)) {
      evidence.push('Refactoring keywords found');
      confidence += 0.5;
    }
    
    // Check for structural changes
    const structuralChanges = this.detectStructuralChanges(content, allSnippets);
    if (structuralChanges > 0) {
      evidence.push(`Structural changes detected: ${structuralChanges}`);
      confidence += 0.4;
    }
    
    // Check for naming improvements
    if (this.hasNamingImprovements(content)) {
      evidence.push('Naming improvements detected');
      confidence += 0.3;
    }
    
    // Check for code organization changes
    if (this.hasOrganizationChanges(content)) {
      evidence.push('Code organization improvements');
      confidence += 0.2;
    }
    
    return {
      type: 'refactor',
      confidence: Math.min(confidence, 1.0),
      evidence,
      suggestedOrder: this.calculateRefactorOrder(content, allSnippets)
    };
  }
  
  /**
   * Detect feature addition patterns
   */
  private static detectFeatureAdditionPattern(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): SequencePattern {
    const evidence: string[] = [];
    let confidence = 0;
    
    // Check for new functionality indicators
    if (this.hasNewFunctionalityIndicators(content)) {
      evidence.push('New functionality indicators found');
      confidence += 0.4;
    }
    
    // Check for feature flags or conditional code
    if (this.hasFeatureFlags(content)) {
      evidence.push('Feature flags or conditional code');
      confidence += 0.3;
    }
    
    // Check for new API endpoints or methods
    if (this.hasNewApiEndpoints(content)) {
      evidence.push('New API endpoints or methods');
      confidence += 0.4;
    }
    
    // Check for new components or modules
    if (this.hasNewComponents(content)) {
      evidence.push('New components or modules');
      confidence += 0.3;
    }
    
    return {
      type: 'feature_addition',
      confidence: Math.min(confidence, 1.0),
      evidence,
      suggestedOrder: this.calculateFeatureOrder(content, allSnippets)
    };
  }
  
  /**
   * Order snippets based on detected patterns
   */
  private static orderSnippets(snippets: Array<{
    id: string;
    content: string;
    timestamp: Date;
    order: number;
    pattern: SequencePattern;
  }>): Array<{
    id: string;
    content: string;
    timestamp: Date;
    order: number;
    pattern: SequencePattern;
  }> {
    // Sort by pattern-based order, then by timestamp
    return snippets
      .map((snippet, index) => ({
        ...snippet,
        order: snippet.pattern.suggestedOrder || index
      }))
      .sort((a, b) => {
        // Primary sort by pattern order
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        
        // Secondary sort by timestamp
        return a.timestamp.getTime() - b.timestamp.getTime();
      })
      .map((snippet, index) => ({
        ...snippet,
        order: index
      }));
  }
  
  /**
   * Analyze overall pattern across all snippets
   */
  private static analyzeOverallPattern(snippets: Array<{
    pattern: SequencePattern;
  }>): SequencePattern {
    const patternCounts = snippets.reduce((counts, snippet) => {
      counts[snippet.pattern.type] = (counts[snippet.pattern.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const dominantPattern = Object.entries(patternCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const avgConfidence = snippets.reduce((sum, snippet) => 
      sum + snippet.pattern.confidence, 0) / snippets.length;
    
    const allEvidence = snippets.flatMap(snippet => snippet.pattern.evidence);
    
    return {
      type: dominantPattern[0] as SequencePattern['type'],
      confidence: avgConfidence,
      evidence: [...new Set(allEvidence)], // Remove duplicates
      suggestedOrder: 0
    };
  }
  
  /**
   * Determine timeline type
   */
  private static determineTimeline(snippets: Array<{
    timestamp: Date;
    pattern: SequencePattern;
  }>): CodeSequence['timeline'] {
    const timeSpan = snippets.length > 1 ? 
      snippets[snippets.length - 1].timestamp.getTime() - snippets[0].timestamp.getTime() : 0;
    
    // If snippets are close in time, likely linear development
    if (timeSpan < 3600000) { // 1 hour
      return 'linear';
    }
    
    // Check for branching patterns (multiple different approaches)
    const patternTypes = new Set(snippets.map(s => s.pattern.type));
    if (patternTypes.size > 2) {
      return 'branched';
    }
    
    // Check for convergent patterns (multiple snippets leading to one solution)
    const evolutionCount = snippets.filter(s => s.pattern.type === 'evolution').length;
    if (evolutionCount > snippets.length * 0.6) {
      return 'convergent';
    }
    
    return 'linear';
  }
  
  // Helper methods for pattern detection
  
  private static countIncompleteBraces(content: string): number {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    return Math.abs(openBraces - closeBraces);
  }
  
  private static hasIncompleteFunction(content: string): boolean {
    const functionStarts = content.match(/function\s+\w+\s*\(/g);
    const functionBodies = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
    
    return functionStarts ? 
      (functionStarts.length > (functionBodies?.length || 0)) : false;
  }
  
  private static hasHangingStatements(content: string): boolean {
    const lines = content.split('\n').map(line => line.trim());
    const lastLine = lines[lines.length - 1];
    
    return lastLine.length > 0 && 
           !lastLine.endsWith(';') && 
           !lastLine.endsWith('}') && 
           !lastLine.startsWith('//') &&
           !lastLine.startsWith('/*');
  }
  
  private static hasContinuationComments(content: string): boolean {
    const continuationMarkers = [
      /\/\/.*continue/i,
      /\/\/.*todo/i,
      /\/\/.*more/i,
      /\/\*.*continue.*\*\//i,
      /\/\*.*todo.*\*\//i
    ];
    
    return continuationMarkers.some(marker => marker.test(content));
  }
  
  private static hasIncompleteImports(content: string): boolean {
    const importLines = content.split('\n').filter(line => 
      line.trim().startsWith('import') && !line.includes('from')
    );
    
    return importLines.length > 0;
  }
  
  private static extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Function calls
    const functionCalls = content.match(/(\w+)\s*\(/g);
    if (functionCalls) {
      dependencies.push(...functionCalls.map(call => call.replace(/\s*\(/, '')));
    }
    
    // Variable references
    const variableRefs = content.match(/(?:^|[^.\w])([a-zA-Z_]\w*)/g);
    if (variableRefs) {
      dependencies.push(...variableRefs.map(ref => ref.replace(/^[^a-zA-Z_]*/, '')));
    }
    
    // Import statements
    const imports = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
    if (imports) {
      dependencies.push(...imports);
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }
  
  private static definesDependency(content: string, dependency: string): boolean {
    const definitionPatterns = [
      new RegExp(`function\\s+${dependency}\\s*\\(`),
      new RegExp(`const\\s+${dependency}\\s*=`),
      new RegExp(`let\\s+${dependency}\\s*=`),
      new RegExp(`var\\s+${dependency}\\s*=`),
      new RegExp(`class\\s+${dependency}\\s*\\{`),
      new RegExp(`interface\\s+${dependency}\\s*\\{`),
      new RegExp(`type\\s+${dependency}\\s*=`)
    ];
    
    return definitionPatterns.some(pattern => pattern.test(content));
  }
  
  private static extractInterfaceDependencies(content: string): string[] {
    const interfaces: string[] = [];
    
    // TypeScript interfaces
    const interfaceRefs = content.match(/:\s*(\w+)/g);
    if (interfaceRefs) {
      interfaces.push(...interfaceRefs.map(ref => ref.replace(/:\s*/, '')));
    }
    
    // Generic type parameters
    const generics = content.match(/<(\w+)>/g);
    if (generics) {
      interfaces.push(...generics.map(gen => gen.replace(/[<>]/g, '')));
    }
    
    return [...new Set(interfaces)];
  }
  
  private static hasSetupDependencies(content: string): boolean {
    const setupKeywords = [
      'config', 'setup', 'init', 'configure', 'initialize',
      'bootstrap', 'install', 'require', 'import'
    ];
    
    return setupKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
  }
  
  private static hasVersionIndicators(content: string): boolean {
    const versionPatterns = [
      /v\d+\.\d+/i,
      /version\s*[:=]\s*['"][\d.]+['"]/i,
      /\/\/.*v\d/i,
      /update/i,
      /upgrade/i
    ];
    
    return versionPatterns.some(pattern => pattern.test(content));
  }
  
  private static hasImprovementPatterns(content: string): boolean {
    const improvementKeywords = [
      'improve', 'enhance', 'optimize', 'better', 'refine',
      'streamline', 'simplify', 'cleanup'
    ];
    
    return improvementKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
  }
  
  private static hasOptimizationMarkers(content: string): boolean {
    const optimizationPatterns = [
      /performance/i,
      /optimize/i,
      /efficient/i,
      /faster/i,
      /cache/i,
      /memoiz/i
    ];
    
    return optimizationPatterns.some(pattern => pattern.test(content));
  }
  
  private static calculateComplexity(content: string): number {
    let complexity = 0;
    
    // Cyclomatic complexity indicators
    const complexityIndicators = [
      /if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g
    ];
    
    complexityIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      complexity += matches ? matches.length : 0;
    });
    
    // Line count factor
    complexity += content.split('\n').length * 0.1;
    
    return complexity;
  }
  
  private static hasRefactoringKeywords(content: string): boolean {
    const refactorKeywords = [
      'refactor', 'restructure', 'reorganize', 'cleanup',
      'extract', 'inline', 'rename', 'move'
    ];
    
    return refactorKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
  }
  
  private static detectStructuralChanges(
    content: string,
    allSnippets: Array<{ content: string }>
  ): number {
    let changes = 0;
    
    // Compare indentation patterns
    const currentIndentation = this.getIndentationPattern(content);
    const otherIndentations = allSnippets.map(s => this.getIndentationPattern(s.content));
    
    const uniqueIndentations = new Set([currentIndentation, ...otherIndentations]);
    changes += uniqueIndentations.size - 1;
    
    return changes;
  }
  
  private static getIndentationPattern(content: string): string {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    return lines.map(line => Math.floor((line.length - line.trimStart().length) / 2))
                .slice(0, 10) // First 10 lines
                .join(',');
  }
  
  private static hasNamingImprovements(content: string): boolean {
    const improvedNamingPatterns = [
      /[a-z][A-Z]/g, // camelCase
      /[A-Z][a-z]/g, // PascalCase
      /_[a-z]/g, // snake_case
      /is[A-Z]/g, // boolean naming
      /get[A-Z]/g, // getter methods
      /set[A-Z]/g  // setter methods
    ];
    
    return improvedNamingPatterns.some(pattern => 
      (content.match(pattern) || []).length > 3
    );
  }
  
  private static hasOrganizationChanges(content: string): boolean {
    const organizationMarkers = [
      /\/\/\s*#region/i,
      /\/\/\s*section/i,
      /\/\*\*[\s\S]*\*\//g, // JSDoc comments
      /\/\/\s*===/g, // Section dividers
      /export\s*\{/g // Module exports
    ];
    
    return organizationMarkers.some(pattern => pattern.test(content));
  }
  
  private static hasNewFunctionalityIndicators(content: string): boolean {
    const newFunctionalityKeywords = [
      'new', 'add', 'create', 'implement', 'feature',
      'functionality', 'capability', 'support'
    ];
    
    return newFunctionalityKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
  }
  
  private static hasFeatureFlags(content: string): boolean {
    const featureFlagPatterns = [
      /if\s*\(\s*feature/i,
      /feature.*flag/i,
      /enable.*feature/i,
      /toggle/i,
      /experiment/i
    ];
    
    return featureFlagPatterns.some(pattern => pattern.test(content));
  }
  
  private static hasNewApiEndpoints(content: string): boolean {
    const apiPatterns = [
      /router\./g,
      /app\.(get|post|put|delete)/g,
      /api\//g,
      /endpoint/i,
      /route/g
    ];
    
    return apiPatterns.some(pattern => pattern.test(content));
  }
  
  private static hasNewComponents(content: string): boolean {
    const componentPatterns = [
      /export\s+(default\s+)?function\s+[A-Z]/g, // React functional components
      /export\s+(default\s+)?class\s+[A-Z]/g, // Class components
      /const\s+[A-Z]\w*\s*=\s*\(/g, // Arrow function components
      /component/i,
      /module/i
    ];
    
    return componentPatterns.some(pattern => pattern.test(content));
  }
  
  // Order calculation methods
  
  private static calculateContinuationOrder(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): number {
    // Continuation should come after the incomplete code
    const incompleteness = this.countIncompleteBraces(content);
    return incompleteness > 0 ? 1 : 0;
  }
  
  private static calculateDependencyOrder(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): number {
    const dependencies = this.extractDependencies(content);
    const dependencyCount = dependencies.filter(dep => 
      allSnippets.some(snippet => this.definesDependency(snippet.content, dep))
    ).length;
    
    return dependencyCount; // Higher dependency count = later in sequence
  }
  
  private static calculateEvolutionOrder(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): number {
    const complexity = this.calculateComplexity(content);
    const avgComplexity = allSnippets.reduce((sum, s) => 
      sum + this.calculateComplexity(s.content), 0) / allSnippets.length;
    
    return complexity > avgComplexity ? 1 : 0;
  }
  
  private static calculateRefactorOrder(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): number {
    // Refactored code usually comes after the original
    return this.hasRefactoringKeywords(content) ? 1 : 0;
  }
  
  private static calculateFeatureOrder(
    content: string,
    allSnippets: Array<{ content: string; timestamp: Date }>
  ): number {
    // New features typically come after base functionality
    return this.hasNewFunctionalityIndicators(content) ? 1 : 0;
  }
}

export const codeSequenceDetector = new CodeSequenceDetector();