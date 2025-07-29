import { ContentSimilarityService, SimilarityResult } from './ContentSimilarityService';
import { CodeSequenceDetector, CodeSequence } from './CodeSequenceDetector';
import { Database } from '../types/database';

export interface MergeCandidate {
  sourceId: string;
  targetId: string;
  type: 'append' | 'prepend' | 'replace' | 'interleave' | 'consolidate';
  confidence: number;
  reason: string;
  conflicts: MergeConflict[];
  previewContent: string;
}

export interface MergeConflict {
  type: 'duplicate_content' | 'conflicting_logic' | 'different_style' | 'version_mismatch';
  severity: 'low' | 'medium' | 'high';
  location: string;
  description: string;
  resolution: 'auto' | 'manual' | 'skip';
  suggestions: string[];
}

export interface MergeResult {
  success: boolean;
  mergedContent: string;
  preservedMetadata: any;
  appliedResolutions: Array<{
    conflict: MergeConflict;
    resolution: string;
  }>;
  warnings: string[];
}

export interface MergeStrategy {
  name: string;
  applicability: (source: any, target: any) => number;
  execute: (source: any, target: any) => MergeResult;
}

/**
 * Intelligent auto-merge service for code content
 * Handles conflict detection and resolution
 */
export class AutoMergeService {
  
  private static readonly MERGE_STRATEGIES: MergeStrategy[] = [
    {
      name: 'sequence_continuation',
      applicability: (source, target) => AutoMergeService.evaluateSequenceContinuation(source, target),
      execute: (source, target) => AutoMergeService.executeSequenceMerge(source, target)
    },
    {
      name: 'semantic_consolidation',
      applicability: (source, target) => AutoMergeService.evaluateSemanticConsolidation(source, target),
      execute: (source, target) => AutoMergeService.executeSemanticMerge(source, target)
    },
    {
      name: 'dependency_integration',
      applicability: (source, target) => AutoMergeService.evaluateDependencyIntegration(source, target),
      execute: (source, target) => AutoMergeService.executeDependencyMerge(source, target)
    },
    {
      name: 'evolution_replacement',
      applicability: (source, target) => AutoMergeService.evaluateEvolutionReplacement(source, target),
      execute: (source, target) => AutoMergeService.executeEvolutionMerge(source, target)
    },
    {
      name: 'feature_integration',
      applicability: (source, target) => AutoMergeService.evaluateFeatureIntegration(source, target),
      execute: (source, target) => AutoMergeService.executeFeatureMerge(source, target)
    }
  ];
  
  /**
   * Find merge candidates for given content
   */
  static async findMergeCandidates(
    sourceItem: {
      id: string;
      content: string;
      metadata: any;
      timestamp: Date;
    },
    targetItems: Array<{
      id: string;
      content: string;
      metadata: any;
      timestamp: Date;
    }>
  ): Promise<MergeCandidate[]> {
    const candidates: MergeCandidate[] = [];
    
    for (const targetItem of targetItems) {
      if (targetItem.id === sourceItem.id) continue;
      
      // Evaluate each merge strategy
      const strategyEvaluations = this.MERGE_STRATEGIES.map(strategy => ({
        strategy,
        score: strategy.applicability(sourceItem, targetItem)
      })).filter(evaluation => evaluation.score > 0.3);
      
      if (strategyEvaluations.length > 0) {
        // Use the best strategy
        const bestStrategy = strategyEvaluations.reduce((best, current) => 
          current.score > best.score ? current : best
        );
        
        const candidate = await this.createMergeCandidate(
          sourceItem,
          targetItem,
          bestStrategy.strategy,
          bestStrategy.score
        );
        
        candidates.push(candidate);
      }
    }
    
    // Sort by confidence and return top candidates
    return candidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Limit to top 5 candidates
  }
  
  /**
   * Execute merge between two items
   */
  static async executeMerge(
    mergeCandidate: MergeCandidate,
    sourceItem: any,
    targetItem: any
  ): Promise<MergeResult> {
    // Find the appropriate strategy
    const strategy = this.MERGE_STRATEGIES.find(s => 
      s.name === this.inferStrategyFromCandidate(mergeCandidate)
    );
    
    if (!strategy) {
      return {
        success: false,
        mergedContent: '',
        preservedMetadata: {},
        appliedResolutions: [],
        warnings: ['No suitable merge strategy found']
      };
    }
    
    try {
      // Pre-merge conflict analysis
      const conflicts = await this.analyzeConflicts(sourceItem, targetItem);
      
      // Apply automatic conflict resolutions
      const resolvedConflicts = this.applyAutoResolutions(conflicts);
      
      // Check if manual intervention is needed
      const manualConflicts = resolvedConflicts.filter(c => c.resolution === 'manual');
      if (manualConflicts.length > 0) {
        return {
          success: false,
          mergedContent: '',
          preservedMetadata: {},
          appliedResolutions: [],
          warnings: [`Manual intervention required for ${manualConflicts.length} conflicts`]
        };
      }
      
      // Execute the merge
      const result = strategy.execute(sourceItem, targetItem);
      
      // Post-merge validation
      const validationResult = this.validateMergedContent(result.mergedContent);
      if (!validationResult.isValid) {
        return {
          success: false,
          mergedContent: '',
          preservedMetadata: {},
          appliedResolutions: [],
          warnings: validationResult.errors
        };
      }
      
      return {
        ...result,
        appliedResolutions: resolvedConflicts.map(conflict => ({
          conflict,
          resolution: conflict.suggestions[0] || 'auto-resolved'
        }))
      };
      
    } catch (error) {
      return {
        success: false,
        mergedContent: '',
        preservedMetadata: {},
        appliedResolutions: [],
        warnings: [`Merge execution failed: ${error}`]
      };
    }
  }
  
  /**
   * Batch merge multiple related items
   */
  static async batchMerge(
    items: Array<{
      id: string;
      content: string;
      metadata: any;
      timestamp: Date;
    }>
  ): Promise<{
    mergedItems: Array<{ originalIds: string[]; mergedContent: string; metadata: any }>;
    unmergedItems: Array<{ id: string; reason: string }>;
  }> {
    const mergedItems: Array<{ originalIds: string[]; mergedContent: string; metadata: any }> = [];
    const unmergedItems: Array<{ id: string; reason: string }> = [];
    const processed = new Set<string>();
    
    // Analyze sequence relationships
    const sequence = CodeSequenceDetector.analyzeSequence(items);
    
    // Group items by merge potential
    const mergeGroups = this.identifyMergeGroups(sequence);
    
    for (const group of mergeGroups) {
      if (group.length < 2) {
        // Single item, cannot merge
        unmergedItems.push({
          id: group[0].id,
          reason: 'No suitable merge candidates'
        });
        continue;
      }
      
      try {
        // Merge items in the group
        const mergeResult = await this.mergeGroup(group);
        
        if (mergeResult.success) {
          mergedItems.push({
            originalIds: group.map(item => item.id),
            mergedContent: mergeResult.mergedContent,
            metadata: mergeResult.preservedMetadata
          });
          
          // Mark as processed
          group.forEach(item => processed.add(item.id));
        } else {
          // Add individual items as unmerged
          group.forEach(item => {
            unmergedItems.push({
              id: item.id,
              reason: mergeResult.warnings.join('; ')
            });
          });
        }
      } catch (error) {
        group.forEach(item => {
          unmergedItems.push({
            id: item.id,
            reason: `Merge failed: ${error}`
          });
        });
      }
    }
    
    // Add any unprocessed items
    items.forEach(item => {
      if (!processed.has(item.id)) {
        unmergedItems.push({
          id: item.id,
          reason: 'Not included in any merge group'
        });
      }
    });
    
    return { mergedItems, unmergedItems };
  }
  
  /**
   * Create merge candidate
   */
  private static async createMergeCandidate(
    sourceItem: any,
    targetItem: any,
    strategy: MergeStrategy,
    confidence: number
  ): Promise<MergeCandidate> {
    const conflicts = await this.analyzeConflicts(sourceItem, targetItem);
    const mergeType = this.determineMergeType(sourceItem, targetItem, strategy);
    const previewContent = this.generateMergePreview(sourceItem, targetItem, mergeType);
    
    return {
      sourceId: sourceItem.id,
      targetId: targetItem.id,
      type: mergeType,
      confidence,
      reason: this.generateMergeReason(strategy, confidence),
      conflicts,
      previewContent
    };
  }
  
  /**
   * Analyze potential conflicts between two items
   */
  private static async analyzeConflicts(sourceItem: any, targetItem: any): Promise<MergeConflict[]> {
    const conflicts: MergeConflict[] = [];
    
    // Check for duplicate content
    const duplicateConflict = this.checkDuplicateContent(sourceItem.content, targetItem.content);
    if (duplicateConflict) conflicts.push(duplicateConflict);
    
    // Check for conflicting logic
    const logicConflict = this.checkConflictingLogic(sourceItem.content, targetItem.content);
    if (logicConflict) conflicts.push(logicConflict);
    
    // Check for different coding styles
    const styleConflict = this.checkDifferentStyles(sourceItem.content, targetItem.content);
    if (styleConflict) conflicts.push(styleConflict);
    
    // Check for version mismatches
    const versionConflict = this.checkVersionMismatch(sourceItem, targetItem);
    if (versionConflict) conflicts.push(versionConflict);
    
    return conflicts;
  }
  
  /**
   * Strategy evaluation methods
   */
  private static evaluateSequenceContinuation(source: any, target: any): number {
    const sequence = CodeSequenceDetector.analyzeSequence([source, target]);
    const overallPattern = sequence.overallPattern;
    
    if (overallPattern.type === 'continuation') {
      return overallPattern.confidence * 0.9;
    }
    
    return 0;
  }
  
  private static evaluateSemanticConsolidation(source: any, target: any): number {
    const similarity = ContentSimilarityService.calculateSimilarity(
      source.content,
      target.content
    );
    
    if (similarity.type === 'high_similarity' || similarity.type === 'related') {
      return similarity.score * 0.8;
    }
    
    return 0;
  }
  
  private static evaluateDependencyIntegration(source: any, target: any): number {
    const sourceDeps = this.extractDependencies(source.content);
    const targetDeps = this.extractDependencies(target.content);
    
    // Check if source depends on target or vice versa
    const sourceUsesTarget = sourceDeps.some(dep => target.content.includes(dep));
    const targetUsesSource = targetDeps.some(dep => source.content.includes(dep));
    
    if (sourceUsesTarget || targetUsesSource) {
      return 0.7;
    }
    
    return 0;
  }
  
  private static evaluateEvolutionReplacement(source: any, target: any): number {
    const timeDiff = Math.abs(source.timestamp.getTime() - target.timestamp.getTime());
    const isRecent = timeDiff < 86400000; // 24 hours
    
    if (isRecent) {
      const similarity = ContentSimilarityService.calculateSimilarity(
        source.content,
        target.content
      );
      
      // High similarity with recent timestamps suggests evolution
      if (similarity.score > 0.6) {
        const hasImprovements = this.hasImprovementIndicators(
          source.timestamp > target.timestamp ? source.content : target.content
        );
        
        return hasImprovements ? 0.8 : 0.4;
      }
    }
    
    return 0;
  }
  
  private static evaluateFeatureIntegration(source: any, target: any): number {
    const sourceHasNewFeature = this.hasNewFeatureIndicators(source.content);
    const targetHasNewFeature = this.hasNewFeatureIndicators(target.content);
    
    // If one has new features and they're related
    if (sourceHasNewFeature || targetHasNewFeature) {
      const similarity = ContentSimilarityService.calculateSimilarity(
        source.content,
        target.content
      );
      
      if (similarity.score > 0.4) {
        return 0.6;
      }
    }
    
    return 0;
  }
  
  /**
   * Strategy execution methods
   */
  private static executeSequenceMerge(source: any, target: any): MergeResult {
    // Determine order based on sequence analysis
    const sequence = CodeSequenceDetector.analyzeSequence([source, target]);
    const orderedItems = sequence.snippets.sort((a, b) => a.order - b.order);
    
    const mergedContent = orderedItems.map(item => item.content).join('\n\n');
    
    return {
      success: true,
      mergedContent,
      preservedMetadata: this.mergeMetadata(source.metadata, target.metadata),
      appliedResolutions: [],
      warnings: []
    };
  }
  
  private static executeSemanticMerge(source: any, target: any): MergeResult {
    // Merge similar content by removing duplicates and combining unique parts
    const sourceLines = source.content.split('\n');
    const targetLines = target.content.split('\n');
    
    const mergedLines = [...sourceLines];
    
    // Add unique lines from target
    targetLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !sourceLines.some(sourceLine => 
        this.areLinesSemanticallySimilar(sourceLine.trim(), trimmedLine)
      )) {
        mergedLines.push(line);
      }
    });
    
    return {
      success: true,
      mergedContent: mergedLines.join('\n'),
      preservedMetadata: this.mergeMetadata(source.metadata, target.metadata),
      appliedResolutions: [],
      warnings: []
    };
  }
  
  private static executeDependencyMerge(source: any, target: any): MergeResult {
    // Order by dependency hierarchy
    const sourceDeps = this.extractDependencies(source.content);
    const targetDeps = this.extractDependencies(target.content);
    
    const sourceUsesTarget = sourceDeps.some(dep => target.content.includes(dep));
    
    // Place dependency first
    const mergedContent = sourceUsesTarget ? 
      `${target.content}\n\n${source.content}` :
      `${source.content}\n\n${target.content}`;
    
    return {
      success: true,
      mergedContent,
      preservedMetadata: this.mergeMetadata(source.metadata, target.metadata),
      appliedResolutions: [],
      warnings: []
    };
  }
  
  private static executeEvolutionMerge(source: any, target: any): MergeResult {
    // Keep the newer/improved version
    const newer = source.timestamp > target.timestamp ? source : target;
    const older = source.timestamp > target.timestamp ? target : source;
    
    // Add comment about evolution
    const mergedContent = `// Evolved from previous version\n${newer.content}\n\n// Previous version:\n// ${older.content.split('\n').join('\n// ')}`;
    
    return {
      success: true,
      mergedContent,
      preservedMetadata: newer.metadata,
      appliedResolutions: [],
      warnings: [`Replaced older version with evolved content`]
    };
  }
  
  private static executeFeatureMerge(source: any, target: any): MergeResult {
    // Intelligently combine features
    const baseContent = this.extractBaseContent(source.content, target.content);
    const sourceFeatures = this.extractFeatures(source.content);
    const targetFeatures = this.extractFeatures(target.content);
    
    const allFeatures = [...sourceFeatures, ...targetFeatures];
    const mergedContent = `${baseContent}\n\n${allFeatures.join('\n\n')}`;
    
    return {
      success: true,
      mergedContent,
      preservedMetadata: this.mergeMetadata(source.metadata, target.metadata),
      appliedResolutions: [],
      warnings: []
    };
  }
  
  // Helper methods
  
  private static extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract imports
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (imports) {
      dependencies.push(...imports);
    }
    
    // Extract function calls
    const functionCalls = content.match(/(\w+)\s*\(/g);
    if (functionCalls) {
      dependencies.push(...functionCalls.map(call => call.replace(/\s*\(/, '')));
    }
    
    return [...new Set(dependencies)];
  }
  
  private static hasImprovementIndicators(content: string): boolean {
    const improvementKeywords = [
      'improve', 'optimize', 'enhance', 'refactor', 'cleanup',
      'better', 'efficient', 'performance', 'fix', 'update'
    ];
    
    return improvementKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
  }
  
  private static hasNewFeatureIndicators(content: string): boolean {
    const featureKeywords = [
      'new', 'add', 'feature', 'implement', 'create',
      'support', 'enable', 'introduce'
    ];
    
    return featureKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
  }
  
  private static checkDuplicateContent(content1: string, content2: string): MergeConflict | null {
    const lines1 = content1.split('\n').map(line => line.trim()).filter(line => line);
    const lines2 = content2.split('\n').map(line => line.trim()).filter(line => line);
    
    const duplicateLines = lines1.filter(line => lines2.includes(line));
    
    if (duplicateLines.length > Math.min(lines1.length, lines2.length) * 0.3) {
      return {
        type: 'duplicate_content',
        severity: 'medium',
        location: 'throughout',
        description: `${duplicateLines.length} duplicate lines found`,
        resolution: 'auto',
        suggestions: ['Remove duplicate lines', 'Keep unique content only']
      };
    }
    
    return null;
  }
  
  private static checkConflictingLogic(content1: string, content2: string): MergeConflict | null {
    // Simple heuristic: look for contradictory statements
    const contradictions = [
      { pattern1: /if\s*\(\s*(\w+)\s*\)/, pattern2: /if\s*\(\s*!\s*\1\s*\)/ },
      { pattern1: /return true/i, pattern2: /return false/i },
      { pattern1: /enable/i, pattern2: /disable/i }
    ];
    
    for (const contradiction of contradictions) {
      const match1 = content1.match(contradiction.pattern1);
      const match2 = content2.match(contradiction.pattern2);
      
      if (match1 && match2) {
        return {
          type: 'conflicting_logic',
          severity: 'high',
          location: 'logic statements',
          description: 'Contradictory logic found between contents',
          resolution: 'manual',
          suggestions: ['Review logic and choose appropriate version', 'Combine with conditional logic']
        };
      }
    }
    
    return null;
  }
  
  private static checkDifferentStyles(content1: string, content2: string): MergeConflict | null {
    const style1 = this.analyzeCodeStyle(content1);
    const style2 = this.analyzeCodeStyle(content2);
    
    const differences: string[] = [];
    
    if (style1.indentation !== style2.indentation) {
      differences.push('indentation');
    }
    
    if (style1.quotingStyle !== style2.quotingStyle) {
      differences.push('quoting style');
    }
    
    if (style1.namingConvention !== style2.namingConvention) {
      differences.push('naming convention');
    }
    
    if (differences.length > 0) {
      return {
        type: 'different_style',
        severity: 'low',
        location: 'code style',
        description: `Different ${differences.join(', ')} detected`,
        resolution: 'auto',
        suggestions: ['Normalize to consistent style', 'Apply auto-formatting']
      };
    }
    
    return null;
  }
  
  private static checkVersionMismatch(source: any, target: any): MergeConflict | null {
    const sourceVersion = this.extractVersion(source.content);
    const targetVersion = this.extractVersion(target.content);
    
    if (sourceVersion && targetVersion && sourceVersion !== targetVersion) {
      return {
        type: 'version_mismatch',
        severity: 'medium',
        location: 'version declarations',
        description: `Version mismatch: ${sourceVersion} vs ${targetVersion}`,
        resolution: 'manual',
        suggestions: ['Use newer version', 'Update dependencies', 'Review compatibility']
      };
    }
    
    return null;
  }
  
  private static analyzeCodeStyle(content: string): any {
    const lines = content.split('\n').filter(line => line.trim());
    
    // Analyze indentation
    const indentations = lines.map(line => {
      const leadingSpaces = line.length - line.trimStart().length;
      return leadingSpaces;
    }).filter(indent => indent > 0);
    
    const avgIndentation = indentations.length > 0 ? 
      Math.round(indentations.reduce((sum, indent) => sum + indent, 0) / indentations.length) : 2;
    
    // Analyze quoting style
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    const quotingStyle = singleQuotes > doubleQuotes ? 'single' : 'double';
    
    // Analyze naming convention
    const camelCaseMatches = content.match(/[a-z][A-Z]/g) || [];
    const snakeCaseMatches = content.match(/[a-z]_[a-z]/g) || [];
    const namingConvention = camelCaseMatches.length > snakeCaseMatches.length ? 'camelCase' : 'snake_case';
    
    return {
      indentation: avgIndentation,
      quotingStyle,
      namingConvention
    };
  }
  
  private static extractVersion(content: string): string | null {
    const versionPatterns = [
      /"version":\s*"([^"]+)"/,
      /version\s*[:=]\s*['"]([^'"]+)['"]/,
      /v(\d+\.\d+\.\d+)/
    ];
    
    for (const pattern of versionPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }
  
  private static applyAutoResolutions(conflicts: MergeConflict[]): MergeConflict[] {
    return conflicts.map(conflict => {
      if (conflict.resolution === 'auto') {
        // Apply automatic resolution logic
        return {
          ...conflict,
          resolution: 'auto'
        };
      }
      return conflict;
    });
  }
  
  private static validateMergedContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for basic syntax issues
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched braces in merged content');
    }
    
    // Check for orphaned imports
    const imports = content.match(/import.*from/g) || [];
    const usages = content.match(/\b\w+\b/g) || [];
    
    imports.forEach(importStatement => {
      const importedName = importStatement.match(/import\s+(\w+)/)?.[1];
      if (importedName && !usages.includes(importedName)) {
        errors.push(`Unused import: ${importedName}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private static inferStrategyFromCandidate(candidate: MergeCandidate): string {
    // Infer strategy based on merge type and reason
    if (candidate.reason.includes('continuation')) {
      return 'sequence_continuation';
    }
    if (candidate.reason.includes('similar')) {
      return 'semantic_consolidation';
    }
    if (candidate.reason.includes('dependency')) {
      return 'dependency_integration';
    }
    if (candidate.reason.includes('evolution')) {
      return 'evolution_replacement';
    }
    if (candidate.reason.includes('feature')) {
      return 'feature_integration';
    }
    
    return 'semantic_consolidation'; // Default
  }
  
  private static determineMergeType(source: any, target: any, strategy: MergeStrategy): MergeCandidate['type'] {
    switch (strategy.name) {
      case 'sequence_continuation':
        return 'append';
      case 'semantic_consolidation':
        return 'consolidate';
      case 'dependency_integration':
        return 'interleave';
      case 'evolution_replacement':
        return 'replace';
      case 'feature_integration':
        return 'append';
      default:
        return 'consolidate';
    }
  }
  
  private static generateMergePreview(source: any, target: any, type: MergeCandidate['type']): string {
    const sourcePreview = source.content.slice(0, 100) + '...';
    const targetPreview = target.content.slice(0, 100) + '...';
    
    switch (type) {
      case 'append':
        return `${sourcePreview}\n\n${targetPreview}`;
      case 'prepend':
        return `${targetPreview}\n\n${sourcePreview}`;
      case 'replace':
        return sourcePreview;
      case 'consolidate':
        return `Merged content combining both sources...`;
      default:
        return `${sourcePreview}\n\n${targetPreview}`;
    }
  }
  
  private static generateMergeReason(strategy: MergeStrategy, confidence: number): string {
    const reasons = {
      'sequence_continuation': 'Code appears to be a continuation sequence',
      'semantic_consolidation': 'High semantic similarity detected',
      'dependency_integration': 'Dependency relationship found',
      'evolution_replacement': 'Evolution of existing code detected',
      'feature_integration': 'Feature integration opportunity'
    };
    
    return `${reasons[strategy.name as keyof typeof reasons]} (${Math.round(confidence * 100)}% confidence)`;
  }
  
  private static identifyMergeGroups(sequence: CodeSequence): Array<Array<any>> {
    const groups: Array<Array<any>> = [];
    let currentGroup: Array<any> = [];
    
    sequence.snippets.forEach((snippet, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(snippet);
      } else {
        const lastSnippet = currentGroup[currentGroup.length - 1];
        const similarity = ContentSimilarityService.calculateSimilarity(
          snippet.content,
          lastSnippet.content
        );
        
        if (similarity.score > 0.5 || snippet.pattern.type === lastSnippet.pattern.type) {
          currentGroup.push(snippet);
        } else {
          // Start new group
          if (currentGroup.length > 0) {
            groups.push(currentGroup);
          }
          currentGroup = [snippet];
        }
      }
    });
    
    // Add final group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }
  
  private static async mergeGroup(group: Array<any>): Promise<MergeResult> {
    if (group.length === 1) {
      return {
        success: true,
        mergedContent: group[0].content,
        preservedMetadata: group[0].metadata,
        appliedResolutions: [],
        warnings: []
      };
    }
    
    // Start with first item and progressively merge others
    let current = group[0];
    const warnings: string[] = [];
    const appliedResolutions: any[] = [];
    
    for (let i = 1; i < group.length; i++) {
      const mergeResult = await this.executeMerge(
        {
          sourceId: group[i].id,
          targetId: current.id,
          type: 'consolidate',
          confidence: 0.8,
          reason: 'Group merge',
          conflicts: [],
          previewContent: ''
        },
        group[i],
        current
      );
      
      if (mergeResult.success) {
        current = {
          ...current,
          content: mergeResult.mergedContent,
          metadata: mergeResult.preservedMetadata
        };
        warnings.push(...mergeResult.warnings);
        appliedResolutions.push(...mergeResult.appliedResolutions);
      } else {
        return mergeResult;
      }
    }
    
    return {
      success: true,
      mergedContent: current.content,
      preservedMetadata: current.metadata,
      appliedResolutions,
      warnings
    };
  }
  
  private static mergeMetadata(metadata1: any, metadata2: any): any {
    return {
      ...metadata1,
      ...metadata2,
      merged_at: new Date().toISOString(),
      original_items: [metadata1.id, metadata2.id].filter(Boolean)
    };
  }
  
  private static areLinesSemanticallySimilar(line1: string, line2: string): boolean {
    // Remove whitespace and punctuation for comparison
    const normalize = (line: string) => line.replace(/\s+/g, '').replace(/[^\w]/g, '');
    return normalize(line1) === normalize(line2);
  }
  
  private static extractBaseContent(content1: string, content2: string): string {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    
    // Find common lines at the beginning
    const commonLines: string[] = [];
    const minLength = Math.min(lines1.length, lines2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (this.areLinesSemanticallySimilar(lines1[i], lines2[i])) {
        commonLines.push(lines1[i]);
      } else {
        break;
      }
    }
    
    return commonLines.join('\n');
  }
  
  private static extractFeatures(content: string): string[] {
    const lines = content.split('\n');
    const features: string[] = [];
    
    // Look for function definitions, class definitions, etc.
    lines.forEach(line => {
      if (/^\s*(function|class|const|let|var)\s+/.test(line)) {
        features.push(line);
      }
    });
    
    return features;
  }
}

export const autoMergeService = new AutoMergeService();