import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../../contexts/AuthContext';

interface CustomRenderOptions extends RenderOptions {
  withNavigation?: boolean;
  withAuth?: boolean;
  withSafeArea?: boolean;
  withGestureHandler?: boolean;
}

const AllTheProviders: React.FC<{
  children: React.ReactNode;
  options?: CustomRenderOptions;
}> = ({ children, options = {} }) => {
  const {
    withNavigation = true,
    withAuth = true,
    withSafeArea = true,
    withGestureHandler = true
  } = options;

  let wrappedChildren = children;

  if (withGestureHandler) {
    wrappedChildren = (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {wrappedChildren}
      </GestureHandlerRootView>
    );
  }

  if (withSafeArea) {
    wrappedChildren = (
      <SafeAreaProvider>
        {wrappedChildren}
      </SafeAreaProvider>
    );
  }

  if (withAuth) {
    wrappedChildren = (
      <AuthProvider>
        {wrappedChildren}
      </AuthProvider>
    );
  }

  if (withNavigation) {
    wrappedChildren = (
      <NavigationContainer>
        {wrappedChildren}
      </NavigationContainer>
    );
  }

  return <>{wrappedChildren}</>;
};

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { withNavigation, withAuth, withSafeArea, withGestureHandler, ...renderOptions } = options;

  if (withNavigation || withAuth || withSafeArea || withGestureHandler) {
    return render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders options={options}>
          {children}
        </AllTheProviders>
      ),
      ...renderOptions
    });
  }

  return render(ui, renderOptions);
};

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: null,
  preferences: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockFile = (overrides = {}) => ({
  id: 'test-file-id',
  user_id: 'test-user-id',
  title: 'Test File',
  description: 'Test description',
  language: 'javascript',
  tags: ['react', 'javascript'],
  snippet_count: 3,
  last_accessed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockSnippet = (overrides = {}) => ({
  id: 'test-snippet-id',
  file_id: 'test-file-id',
  user_id: 'test-user-id',
  screenshot_url: 'https://example.com/image.jpg',
  extracted_text: 'console.log("Hello World");',
  ocr_confidence: 85,
  language: 'javascript',
  position_in_file: 0,
  is_favorite: false,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockOCRResult = (overrides = {}) => ({
  text: 'function hello() {\n  console.log("Hello World");\n}',
  confidence: 85,
  words: [
    { text: 'function', confidence: 90 },
    { text: 'hello', confidence: 85 },
    { text: 'console', confidence: 88 },
  ],
  lines: [
    { text: 'function hello() {', confidence: 87 },
    { text: '  console.log("Hello World");', confidence: 83 },
    { text: '}', confidence: 95 },
  ],
  ...overrides
});

export const createMockClassificationResult = (overrides = {}) => ({
  language: {
    language: 'javascript',
    confidence: 85,
    allScores: { javascript: 85, python: 10 },
    frameworks: ['react']
  },
  topic: {
    primaryTopic: 'ui-components',
    confidence: 75,
    allTopics: { 'ui-components': 75, 'web-development': 45 },
    suggestedTags: ['ui-components', 'react', 'javascript']
  },
  similarFiles: [
    { id: 'similar-file-1', title: 'Similar File', similarity: 0.8 }
  ],
  suggestedName: 'javascript-ui-components',
  shouldAppendToExisting: false,
  ...overrides
});

// Test utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const mockNavigationProp = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(() => 'test-id'),
  getState: jest.fn(() => ({ routes: [], index: 0 })),
  getParent: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
};

export const mockRouteProp = {
  key: 'test-key',
  name: 'TestScreen' as const,
  params: {},
  path: undefined,
};

// Custom matchers (if needed)
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});