import { ContentSimilarityService, SimilarityResult } from './ContentSimilarityService';
import { CodeSequenceDetector, CodeSequence } from './CodeSequenceDetector';
import { Database } from '../types/database';

export interface ContentGroup {
  id: string;
  title: string;
  description: string;
  type: 'project' | 'feature' | 'component' | 'utility' | 'tutorial' | 'experiment';
  confidence: number;
  items: Array<{
    id: string;
    type: 'file' | 'snippet';
    content: string;
    metadata: any;
    groupRelevance: number;
    suggestedPosition: number;
  }>;
  relationships: Array<{
    targetGroupId: string;
    type: 'depends_on' | 'extends' | 'implements' | 'refactors' | 'supersedes';
    strength: number;
  }>;
  tags: string[];
  suggestedActions: Array<{
    action: 'merge' | 'split' | 'reorder' | 'archive' | 'promote';
    reason: string;
    confidence: number;
  }>;
}

export interface GroupingStrategy {
  name: string;
  weight: number;
  processor: (items: any[]) => ContentGroup[];
}

/**
 * Intelligent content grouping service
 * Groups related content using multiple strategies
 */
export class ContentGroupingService {
  
  private static readonly GROUPING_STRATEGIES: GroupingStrategy[] = [
    {
      name: 'semantic_similarity',
      weight: 0.3,
      processor: (items) => ContentGroupingService.groupBySemantic(items)
    },
    {
      name: 'temporal_clustering',
      weight: 0.2,
      processor: (items) => ContentGroupingService.groupByTemporal(items)
    },
    {
      name: 'project_detection',
      weight: 0.25,
      processor: (items) => ContentGroupingService.groupByProject(items)
    },
    {
      name: 'dependency_analysis',
      weight: 0.15,
      processor: (items) => ContentGroupingService.groupByDependency(items)
    },
    {
      name: 'topic_classification',
      weight: 0.1,
      processor: (items) => ContentGroupingService.groupByTopic(items)
    }
  ];
  
  /**
   * Main grouping function that applies all strategies
   */
  static async groupContent(
    files: Database['public']['Tables']['files']['Row'][],
    snippets: Database['public']['Tables']['snippets']['Row'][]
  ): Promise<ContentGroup[]> {
    // Combine files and snippets into unified items
    const items = [
      ...files.map(file => ({
        id: file.id,
        type: 'file' as const,
        title: file.title,
        content: file.description || '',
        language: file.language,
        tags: file.tags,
        timestamp: new Date(file.created_at),
        metadata: file
      })),
      ...snippets.map(snippet => ({
        id: snippet.id,
        type: 'snippet' as const,
        title: `Snippet from ${snippet.file_id}`,
        content: snippet.extracted_text,
        language: snippet.language,
        tags: [],
        timestamp: new Date(snippet.created_at),
        metadata: snippet
      }))
    ];
    
    // Apply all grouping strategies
    const strategyResults = await Promise.all(
      this.GROUPING_STRATEGIES.map(async strategy => ({
        strategy,
        groups: await strategy.processor(items)
      }))
    );
    
    // Merge and weight the results
    const mergedGroups = this.mergeStrategyResults(strategyResults);
    
    // Post-process for optimization
    const optimizedGroups = this.optimizeGroups(mergedGroups);
    
    // Generate relationships between groups
    const groupsWithRelationships = this.generateRelationships(optimizedGroups);
    
    return groupsWithRelationships;
  }
  
  /**
   * Group by semantic similarity
   */
  private static groupBySemantic(items: any[]): ContentGroup[] {
    const groups: ContentGroup[] = [];
    const processed = new Set<string>();
    
    for (const item of items) {
      if (processed.has(item.id)) continue;
      
      // Find similar items
      const similarItems = items.filter(other => {
        if (other.id === item.id || processed.has(other.id)) return false;
        
        const similarity = ContentSimilarityService.calculateSimilarity(
          item.content,
          other.content
        );
        
        return similarity.score > 0.6; // High similarity threshold
      });
      
      if (similarItems.length > 0) {
        // Create group for similar items
        const groupItems = [item, ...similarItems];
        const group = this.createSemanticGroup(groupItems);
        groups.push(group);
        
        // Mark items as processed
        groupItems.forEach(groupItem => processed.add(groupItem.id));
      }
    }
    
    return groups;
  }
  
  /**
   * Group by temporal clustering
   */
  private static groupByTemporal(items: any[]): ContentGroup[] {
    const groups: ContentGroup[] = [];
    
    // Sort by timestamp
    const sortedItems = [...items].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Group items created within time windows
    const timeWindows = this.createTimeWindows(sortedItems);
    
    timeWindows.forEach(window => {
      if (window.items.length > 1) {
        const group = this.createTemporalGroup(window);
        groups.push(group);
      }
    });
    
    return groups;
  }
  
  /**
   * Group by project detection
   */
  private static groupByProject(items: any[]): ContentGroup[] {
    const projects = new Map<string, any[]>();
    
    items.forEach(item => {
      const projectIndicators = this.extractProjectIndicators(item.content);
      
      projectIndicators.forEach(indicator => {
        if (!projects.has(indicator)) {
          projects.set(indicator, []);
        }
        projects.get(indicator)!.push(item);
      });
    });
    
    return Array.from(projects.entries())
      .filter(([, items]) => items.length > 1)
      .map(([projectName, projectItems]) => 
        this.createProjectGroup(projectName, projectItems)
      );
  }
  
  /**
   * Group by dependency analysis
   */
  private static groupByDependency(items: any[]): ContentGroup[] {
    const dependencyMap = new Map<string, Set<string>>();
    
    // Build dependency graph
    items.forEach(item => {
      const dependencies = this.extractDependencies(item.content);
      dependencyMap.set(item.id, new Set(dependencies));
    });
    
    // Find connected components
    const components = this.findConnectedComponents(dependencyMap);
    
    return components
      .filter(component => component.size > 1)
      .map(component => {
        const componentItems = items.filter(item => component.has(item.id));
        return this.createDependencyGroup(componentItems);
      });
  }
  
  /**
   * Group by topic classification
   */
  private static groupByTopic(items: any[]): ContentGroup[] {
    const topicGroups = new Map<string, any[]>();
    
    items.forEach(item => {
      const topics = this.classifyTopics(item.content);
      
      topics.forEach(topic => {
        if (!topicGroups.has(topic)) {
          topicGroups.set(topic, []);
        }
        topicGroups.get(topic)!.push(item);
      });
    });
    
    return Array.from(topicGroups.entries())
      .filter(([, items]) => items.length > 1)
      .map(([topic, topicItems]) => 
        this.createTopicGroup(topic, topicItems)
      );
  }
  
  /**
   * Create semantic similarity group
   */
  private static createSemanticGroup(items: any[]): ContentGroup {
    const mainItem = items[0];
    const keywords = this.extractGroupKeywords(items);
    
    return {
      id: `semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Similar to ${mainItem.title}`,
      description: `Content with similar functionality and structure`,
      type: 'component',
      confidence: 0.8,
      items: items.map((item, index) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        groupRelevance: 1 - (index * 0.1), // Decreasing relevance
        suggestedPosition: index
      })),
      relationships: [],
      tags: keywords.slice(0, 5),
      suggestedActions: this.generateSemanticActions(items)
    };
  }
  
  /**
   * Create temporal group
   */
  private static createTemporalGroup(window: { 
    startTime: Date; 
    endTime: Date; 
    items: any[] 
  }): ContentGroup {
    const duration = window.endTime.getTime() - window.startTime.getTime();
    const sessionType = duration < 3600000 ? 'session' : 'project'; // 1 hour threshold
    
    return {
      id: `temporal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${sessionType === 'session' ? 'Coding Session' : 'Development Period'} - ${window.startTime.toLocaleDateString()}`,
      description: `Content created during ${this.formatDuration(duration)}`,
      type: sessionType === 'session' ? 'experiment' : 'project',
      confidence: 0.6,
      items: window.items.map((item, index) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        groupRelevance: 0.8,
        suggestedPosition: index
      })),
      relationships: [],
      tags: this.extractTemporalTags(window.items),
      suggestedActions: this.generateTemporalActions(window.items, duration)
    };
  }
  
  /**
   * Create project group
   */
  private static createProjectGroup(projectName: string, items: any[]): ContentGroup {
    return {
      id: `project_${projectName.replace(/\W/g, '_')}_${Date.now()}`,
      title: `Project: ${projectName}`,
      description: `Components and code related to the ${projectName} project`,
      type: 'project',
      confidence: 0.9,
      items: items.map((item, index) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        groupRelevance: 0.9,
        suggestedPosition: index
      })),
      relationships: [],
      tags: [projectName, ...this.extractProjectTags(items)],
      suggestedActions: this.generateProjectActions(items)
    };
  }
  
  /**
   * Create dependency group
   */
  private static createDependencyGroup(items: any[]): ContentGroup {
    return {
      id: `dependency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Related Components',
      description: 'Code components with interdependencies',
      type: 'component',
      confidence: 0.7,
      items: items.map((item, index) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        groupRelevance: 0.8,
        suggestedPosition: this.calculateDependencyOrder(item, items)
      })),
      relationships: [],
      tags: this.extractDependencyTags(items),
      suggestedActions: this.generateDependencyActions(items)
    };
  }
  
  /**
   * Create topic group
   */
  private static createTopicGroup(topic: string, items: any[]): ContentGroup {
    return {
      id: `topic_${topic.replace(/\W/g, '_')}_${Date.now()}`,
      title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Code`,
      description: `Code snippets and files related to ${topic}`,
      type: this.mapTopicToGroupType(topic),
      confidence: 0.6,
      items: items.map((item, index) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        groupRelevance: 0.7,
        suggestedPosition: index
      })),
      relationships: [],
      tags: [topic, ...this.extractTopicTags(items)],
      suggestedActions: this.generateTopicActions(items, topic)
    };
  }
  
  /**
   * Merge results from different strategies
   */
  private static mergeStrategyResults(
    strategyResults: Array<{ strategy: GroupingStrategy; groups: ContentGroup[] }>
  ): ContentGroup[] {
    const allGroups: ContentGroup[] = [];
    const itemGroupMap = new Map<string, ContentGroup[]>();
    
    // Collect all groups and track which items appear in which groups
    strategyResults.forEach(({ strategy, groups }) => {
      groups.forEach(group => {
        // Weight the group confidence by strategy weight
        group.confidence *= strategy.weight;
        allGroups.push(group);
        
        // Track item memberships
        group.items.forEach(item => {
          if (!itemGroupMap.has(item.id)) {
            itemGroupMap.set(item.id, []);
          }
          itemGroupMap.get(item.id)!.push(group);
        });
      });
    });
    
    // Merge overlapping groups
    const mergedGroups = this.mergeOverlappingGroups(allGroups, itemGroupMap);
    
    return mergedGroups;
  }
  
  /**
   * Merge overlapping groups
   */
  private static mergeOverlappingGroups(
    groups: ContentGroup[],
    itemGroupMap: Map<string, ContentGroup[]>
  ): ContentGroup[] {
    const mergedGroups: ContentGroup[] = [];
    const processedGroups = new Set<string>();
    
    groups.forEach(group => {
      if (processedGroups.has(group.id)) return;
      
      // Find overlapping groups
      const overlappingGroups = this.findOverlappingGroups(group, groups, itemGroupMap);
      
      if (overlappingGroups.length > 1) {
        // Merge the groups
        const mergedGroup = this.mergeTwoGroups(overlappingGroups);
        mergedGroups.push(mergedGroup);
        
        // Mark all as processed
        overlappingGroups.forEach(g => processedGroups.add(g.id));
      } else {
        mergedGroups.push(group);
        processedGroups.add(group.id);
      }
    });
    
    return mergedGroups;
  }
  
  /**
   * Find overlapping groups
   */
  private static findOverlappingGroups(
    targetGroup: ContentGroup,
    allGroups: ContentGroup[],
    itemGroupMap: Map<string, ContentGroup[]>
  ): ContentGroup[] {
    const overlapping = new Set<ContentGroup>([targetGroup]);
    
    targetGroup.items.forEach(item => {
      const itemGroups = itemGroupMap.get(item.id) || [];
      itemGroups.forEach(group => {
        const overlapRatio = this.calculateOverlapRatio(targetGroup, group);
        if (overlapRatio > 0.3) { // 30% overlap threshold
          overlapping.add(group);
        }
      });
    });
    
    return Array.from(overlapping);
  }
  
  /**
   * Calculate overlap ratio between two groups
   */
  private static calculateOverlapRatio(group1: ContentGroup, group2: ContentGroup): number {
    const items1 = new Set(group1.items.map(item => item.id));
    const items2 = new Set(group2.items.map(item => item.id));
    
    const intersection = new Set([...items1].filter(x => items2.has(x)));
    const union = new Set([...items1, ...items2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Merge two groups
   */
  private static mergeTwoGroups(groups: ContentGroup[]): ContentGroup {
    const primaryGroup = groups.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    const allItems = new Map<string, any>();
    const allTags = new Set<string>();
    let totalConfidence = 0;
    
    groups.forEach(group => {
      group.items.forEach(item => {
        if (!allItems.has(item.id)) {
          allItems.set(item.id, item);
        }
      });
      
      group.tags.forEach(tag => allTags.add(tag));
      totalConfidence += group.confidence;
    });
    
    return {
      ...primaryGroup,
      id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${primaryGroup.title} (Merged)`,
      confidence: totalConfidence / groups.length,
      items: Array.from(allItems.values()),
      tags: Array.from(allTags).slice(0, 8),
      suggestedActions: [
        ...primaryGroup.suggestedActions,
        {
          action: 'merge' as const,
          reason: `Merged ${groups.length} related groups`,
          confidence: 0.8
        }
      ]
    };
  }
  
  /**
   * Optimize groups for better organization
   */
  private static optimizeGroups(groups: ContentGroup[]): ContentGroup[] {
    // Remove groups with low confidence or few items
    const filteredGroups = groups.filter(group => 
      group.confidence > 0.3 && group.items.length > 1
    );
    
    // Sort groups by importance (confidence * item count)
    const sortedGroups = filteredGroups.sort((a, b) => {
      const scoreA = a.confidence * a.items.length;
      const scoreB = b.confidence * b.items.length;
      return scoreB - scoreA;
    });
    
    // Limit to reasonable number of groups
    return sortedGroups.slice(0, 20);
  }
  
  /**
   * Generate relationships between groups
   */
  private static generateRelationships(groups: ContentGroup[]): ContentGroup[] {
    return groups.map(group => ({
      ...group,
      relationships: this.findGroupRelationships(group, groups)
    }));
  }
  
  /**
   * Find relationships between groups
   */
  private static findGroupRelationships(
    targetGroup: ContentGroup,
    allGroups: ContentGroup[]
  ): ContentGroup['relationships'] {
    const relationships: ContentGroup['relationships'] = [];
    
    allGroups.forEach(otherGroup => {
      if (otherGroup.id === targetGroup.id) return;
      
      const relationship = this.analyzeGroupRelationship(targetGroup, otherGroup);
      if (relationship) {
        relationships.push(relationship);
      }
    });
    
    return relationships.slice(0, 5); // Limit relationships
  }
  
  /**
   * Analyze relationship between two groups
   */
  private static analyzeGroupRelationship(
    group1: ContentGroup,
    group2: ContentGroup
  ): ContentGroup['relationships'][0] | null {
    // Check for dependency relationships
    const group1Content = group1.items.map(item => item.content).join(' ');
    const group2Content = group2.items.map(item => item.content).join(' ');
    
    const dependencies1 = this.extractDependencies(group1Content);
    const dependencies2 = this.extractDependencies(group2Content);
    
    // Check if group1 depends on group2
    const dependsOn = dependencies1.some(dep => 
      group2Content.includes(dep) || group2.tags.includes(dep)
    );
    
    if (dependsOn) {
      return {
        targetGroupId: group2.id,
        type: 'depends_on',
        strength: 0.7
      };
    }
    
    // Check for extension relationships
    const extends1 = this.hasExtensionPattern(group1Content, group2Content);
    if (extends1) {
      return {
        targetGroupId: group2.id,
        type: 'extends',
        strength: 0.6
      };
    }
    
    // Check for refactoring relationships
    const refactors = this.hasRefactoringPattern(group1Content, group2Content);
    if (refactors) {
      return {
        targetGroupId: group2.id,
        type: 'refactors',
        strength: 0.8
      };
    }
    
    return null;
  }
  
  // Helper methods
  
  private static createTimeWindows(items: any[]): Array<{
    startTime: Date;
    endTime: Date;
    items: any[];
  }> {
    const windows: Array<{ startTime: Date; endTime: Date; items: any[] }> = [];
    const windowSize = 3600000; // 1 hour
    
    let currentWindow: { startTime: Date; endTime: Date; items: any[] } | null = null;
    
    items.forEach(item => {
      if (!currentWindow || 
          item.timestamp.getTime() - currentWindow.endTime.getTime() > windowSize) {
        // Start new window
        currentWindow = {
          startTime: item.timestamp,
          endTime: item.timestamp,
          items: [item]
        };
        windows.push(currentWindow);
      } else {
        // Add to current window
        currentWindow.endTime = item.timestamp;
        currentWindow.items.push(item);
      }
    });
    
    return windows.filter(window => window.items.length > 1);
  }
  
  private static extractProjectIndicators(content: string): string[] {
    const indicators: string[] = [];
    
    // Look for project names in imports
    const importMatches = content.match(/from\s+['"]([^'"\/]+)/g);
    if (importMatches) {
      indicators.push(...importMatches.map(match => 
        match.replace(/from\s+['"]/, '').replace(/['"].*/, '')
      ));
    }
    
    // Look for package.json project names
    const packageMatches = content.match(/"name":\s*"([^"]+)"/);
    if (packageMatches) {
      indicators.push(packageMatches[1]);
    }
    
    // Look for common project patterns
    const projectPatterns = [
      /app/i, /component/i, /service/i, /util/i, /helper/i,
      /config/i, /setup/i, /main/i, /index/i
    ];
    
    projectPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        indicators.push(pattern.source.replace(/[^a-zA-Z]/g, ''));
      }
    });
    
    return [...new Set(indicators)];
  }
  
  private static extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract imports
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (imports) {
      dependencies.push(...imports.map(imp => 
        imp.replace(/.*from\s+['"]/, '').replace(/['"].*/, '')
      ));
    }
    
    // Extract function calls
    const functionCalls = content.match(/(\w+)\s*\(/g);
    if (functionCalls) {
      dependencies.push(...functionCalls.map(call => 
        call.replace(/\s*\(/, '')
      ));
    }
    
    return [...new Set(dependencies)];
  }
  
  private static findConnectedComponents(
    dependencyMap: Map<string, Set<string>>
  ): Set<string>[] {
    const visited = new Set<string>();
    const components: Set<string>[] = [];
    
    dependencyMap.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        const component = new Set<string>();
        this.dfsComponent(nodeId, dependencyMap, visited, component);
        if (component.size > 1) {
          components.push(component);
        }
      }
    });
    
    return components;
  }
  
  private static dfsComponent(
    nodeId: string,
    dependencyMap: Map<string, Set<string>>,
    visited: Set<string>,
    component: Set<string>
  ) {
    visited.add(nodeId);
    component.add(nodeId);
    
    const dependencies = dependencyMap.get(nodeId) || new Set();
    dependencies.forEach(depId => {
      if (!visited.has(depId) && dependencyMap.has(depId)) {
        this.dfsComponent(depId, dependencyMap, visited, component);
      }
    });
  }
  
  private static classifyTopics(content: string): string[] {
    const topics: string[] = [];
    
    const topicPatterns = {
      'authentication': /auth|login|signup|password|token/i,
      'database': /database|sql|query|table|schema/i,
      'api': /api|endpoint|request|response|fetch/i,
      'ui': /component|button|input|form|style/i,
      'testing': /test|spec|mock|expect|describe/i,
      'configuration': /config|setting|environment|setup/i
    };
    
    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(content)) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
  
  private static extractGroupKeywords(items: any[]): string[] {
    const allContent = items.map(item => item.content).join(' ');
    const words = allContent.toLowerCase().match(/\b\w{3,}\b/g) || [];
    
    const wordCount = words.reduce((count, word) => {
      count[word] = (count[word] || 0) + 1;
      return count;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  private static formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
  
  private static extractTemporalTags(items: any[]): string[] {
    const languages = new Set(items.map(item => item.language).filter(Boolean));
    const commonKeywords = this.extractGroupKeywords(items);
    
    return [...Array.from(languages), ...commonKeywords.slice(0, 3)];
  }
  
  private static extractProjectTags(items: any[]): string[] {
    return this.extractGroupKeywords(items).slice(0, 5);
  }
  
  private static extractDependencyTags(items: any[]): string[] {
    const allDependencies = items.flatMap(item => 
      this.extractDependencies(item.content)
    );
    
    const dependencyCount = allDependencies.reduce((count, dep) => {
      count[dep] = (count[dep] || 0) + 1;
      return count;
    }, {} as Record<string, number>);
    
    return Object.entries(dependencyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([dep]) => dep);
  }
  
  private static extractTopicTags(items: any[]): string[] {
    return this.extractGroupKeywords(items).slice(0, 3);
  }
  
  private static calculateDependencyOrder(item: any, allItems: any[]): number {
    const itemDeps = this.extractDependencies(item.content);
    const depCount = itemDeps.filter(dep => 
      allItems.some(other => other.content.includes(dep))
    ).length;
    
    return depCount; // Items with more dependencies come later
  }
  
  private static mapTopicToGroupType(topic: string): ContentGroup['type'] {
    const typeMap: Record<string, ContentGroup['type']> = {
      'authentication': 'feature',
      'database': 'component',
      'api': 'component',
      'ui': 'component',
      'testing': 'utility',
      'configuration': 'utility'
    };
    
    return typeMap[topic] || 'component';
  }
  
  private static hasExtensionPattern(content1: string, content2: string): boolean {
    return /extends|implements|inherit/i.test(content1) && 
           content1.includes(content2.slice(0, 50));
  }
  
  private static hasRefactoringPattern(content1: string, content2: string): boolean {
    const similarity = ContentSimilarityService.calculateSimilarity(content1, content2);
    return similarity.score > 0.5 && 
           /refactor|improve|optimize|cleanup/i.test(content1);
  }
  
  // Action generation methods
  
  private static generateSemanticActions(items: any[]): ContentGroup['suggestedActions'] {
    const actions: ContentGroup['suggestedActions'] = [];
    
    if (items.length > 3) {
      actions.push({
        action: 'merge',
        reason: 'Multiple similar items could be consolidated',
        confidence: 0.7
      });
    }
    
    return actions;
  }
  
  private static generateTemporalActions(
    items: any[], 
    duration: number
  ): ContentGroup['suggestedActions'] {
    const actions: ContentGroup['suggestedActions'] = [];
    
    if (duration < 1800000 && items.length > 2) { // 30 minutes
      actions.push({
        action: 'merge',
        reason: 'Items created in quick succession could be related',
        confidence: 0.6
      });
    }
    
    return actions;
  }
  
  private static generateProjectActions(items: any[]): ContentGroup['suggestedActions'] {
    const actions: ContentGroup['suggestedActions'] = [];
    
    if (items.length > 5) {
      actions.push({
        action: 'promote',
        reason: 'Large project could benefit from dedicated organization',
        confidence: 0.8
      });
    }
    
    return actions;
  }
  
  private static generateDependencyActions(items: any[]): ContentGroup['suggestedActions'] {
    const actions: ContentGroup['suggestedActions'] = [];
    
    actions.push({
      action: 'reorder',
      reason: 'Items should be ordered by dependency hierarchy',
      confidence: 0.9
    });
    
    return actions;
  }
  
  private static generateTopicActions(
    items: any[], 
    topic: string
  ): ContentGroup['suggestedActions'] {
    const actions: ContentGroup['suggestedActions'] = [];
    
    if (items.length > 4) {
      actions.push({
        action: 'split',
        reason: `Large ${topic} group could be split into sub-topics`,
        confidence: 0.6
      });
    }
    
    return actions;
  }
}

export const contentGroupingService = new ContentGroupingService();