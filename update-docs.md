# Auto-Update Documentation

Automatically analyze code changes and update all README files, documentation files, and CLAUDE.md with relevant information about the changes.

## Process

1. **Detect Recent Changes**
   - Look for recently modified code files
   - Analyze the nature of changes (new features, bug fixes, refactoring)
   - Identify which documentation might need updates

2. **Analyze Code Structure**
   - Scan the codebase for:
     - New functions, classes, or modules
     - Changed APIs or interfaces
     - Modified dependencies
     - Updated configuration options

3. **Update Documentation Files**
   - **README files**: Update with new features, installation steps, or usage examples
   - **API documentation**: Update method signatures, parameters, and return types
   - **CLAUDE.md**: Update with new context about the codebase structure and patterns
   - **Other .md files**: Update relevant sections based on code changes

4. **Documentation Update Strategy**
   - Preserve existing documentation structure and style
   - Add new sections for new features
   - Update existing sections for modified features
   - Maintain consistency in formatting and tone
   - Include code examples where appropriate

5. **File Detection**
   - Find all .md files in the project
   - Prioritize files based on relevance to changes
   - Skip vendor/node_modules directories

## Execution

When invoked, this command will:
1. Analyze recent code changes
2. Identify documentation files that need updates
3. Generate appropriate updates for each file
4. Apply the updates while preserving existing content
5. Provide a summary of all documentation updates made