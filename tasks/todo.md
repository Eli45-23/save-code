# MultiImagePicker Screen Implementation Plan

## Task: Create MultiImagePicker screen for selecting multiple screenshots

### Requirements Analysis:
- Create new screen at `/Users/eli/save-code/src/screens/add/MultiImagePickerScreen.tsx`
- Add to Add stack navigation
- Use expo-image-picker for multiple image selection
- Display selected images in responsive grid (2-3 columns)
- Show image count
- Allow removing individual images with X button
- Add reorder functionality
- "Continue" button enabled when 2+ images selected
- "Add More" button to add additional images
- Follow iOS design patterns with NativeWind styling
- Navigate to ReviewAndSave with multiple imageUris array
- Include proper TypeScript types and error handling

### Todo Items:

- [ ] 1. Update navigation types to support MultiImagePicker and multiple imageUris in ReviewAndSave
- [ ] 2. Add MultiImagePicker screen to AddStackNavigator
- [ ] 3. Create the MultiImagePicker screen component with:
  - [ ] 3.1. Permission handling for photo library access
  - [ ] 3.2. Multiple image selection using expo-image-picker
  - [ ] 3.3. Responsive grid layout (2-3 columns based on screen size)
  - [ ] 3.4. Image count display
  - [ ] 3.5. Individual image removal with X button overlay
  - [ ] 3.6. Reorder functionality (using drag & drop or up/down arrows)
  - [ ] 3.7. "Continue" button (enabled when 2+ images)
  - [ ] 3.8. "Add More" button for additional images
  - [ ] 3.9. iOS design patterns and proper styling
  - [ ] 3.10. Navigation to ReviewAndSave with multiple imageUris
- [ ] 4. Update ReviewAndSave screen to handle multiple images (if needed)
- [ ] 5. Add navigation from PhotoLibrary screen to MultiImagePicker
- [ ] 6. Test the complete flow

### Implementation Strategy:
- Keep changes minimal and focused
- Reuse existing components where possible
- Follow existing app patterns and styling
- Use TypeScript for type safety
- Include proper error handling and loading states

### Review:
- [ ] All functionality working as expected
- [ ] TypeScript types are correct
- [ ] Error handling is in place
- [ ] UI follows iOS design patterns
- [ ] Navigation flows correctly
- [ ] Code is clean and maintainable