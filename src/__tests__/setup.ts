// Jest matchers are now built into @testing-library/react-native v12.4+
import React from 'react';
import 'react-native-gesture-handler/jestSetup';

// Global mocks for modules that may not be installed
global.mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve('test-value')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

// Mock AsyncStorage if it exists
jest.mock('@react-native-async-storage/async-storage', () => global.mockAsyncStorage, { virtual: true });

// Mock Expo modules
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestMicrophonePermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    CameraType: {
      back: 'back',
      front: 'front',
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'test-image-uri', width: 100, height: 100 }]
  })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'test-camera-uri', width: 100, height: 100 }]
  })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaType: {
    images: 'images',
    videos: 'videos',
    livePhotos: 'livePhotos',
  },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({
    uri: uri + '-processed',
    width: 1200,
    height: 800
  })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('test content')),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1000 })),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve('test-value')),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Tesseract.js globally
global.mockTesseract = {
  createWorker: jest.fn(() => ({
    loadLanguage: jest.fn(() => Promise.resolve()),
    initialize: jest.fn(() => Promise.resolve()),
    setParameters: jest.fn(() => Promise.resolve()),
    recognize: jest.fn(() => Promise.resolve({
      data: {
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
        ]
      }
    })),
    terminate: jest.fn(() => Promise.resolve()),
  })),
  PSM: {
    SINGLE_BLOCK: 6,
    SINGLE_COLUMN: 4,
  },
  OEM: {
    LSTM_ONLY: 1,
    TESSERACT_LSTM_COMBINED: 3,
  },
};

// Mock Tesseract.js if it exists
jest.mock('tesseract.js', () => global.mockTesseract, { virtual: true });

// Mock Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: null }, 
      error: null 
    })),
    signInWithPassword: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: { access_token: 'test-token' } }, 
      error: null 
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getUser: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    })),
    getSession: jest.fn(() => Promise.resolve({ 
      data: { session: { access_token: 'test-token', user: { id: 'test-user-id' } } }, 
      error: null 
    })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ 
      data: { id: 'test-id', title: 'Test File' }, 
      error: null 
    })),
    order: jest.fn().mockReturnThis(),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ 
        data: { path: 'test-path', fullPath: 'test-full-path' }, 
        error: null 
      })),
      getPublicUrl: jest.fn(() => ({ 
        data: { publicUrl: 'https://test.com/image.jpg' } 
      })),
      remove: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
  rpc: jest.fn(() => Promise.resolve({ 
    data: [{ id: 'test-id', title: 'Test Result' }], 
    error: null 
  })),
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
  supabaseHelpers: {
    getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-user-id' })),
    getUserProfile: jest.fn(() => Promise.resolve({ id: 'test-user-id', username: 'testuser' })),
    upsertProfile: jest.fn(() => Promise.resolve({ id: 'test-user-id', username: 'testuser' })),
    getUserFiles: jest.fn(() => Promise.resolve([
      { id: 'file-1', title: 'Test File 1', snippet_count: 2 },
      { id: 'file-2', title: 'Test File 2', snippet_count: 1 },
    ])),
    getFileWithSnippets: jest.fn(() => Promise.resolve({
      id: 'file-1',
      title: 'Test File',
      snippets: [
        { id: 'snippet-1', extracted_text: 'console.log("test");' }
      ]
    })),
    searchContent: jest.fn(() => Promise.resolve([
      { type: 'snippet', id: 'snippet-1', title: 'Test', content: 'test code' }
    ])),
    findSimilarFiles: jest.fn(() => Promise.resolve([
      { id: 'file-1', title: 'Similar File', similarity: 0.8 }
    ])),
    uploadScreenshot: jest.fn(() => Promise.resolve({
      path: 'test-path',
      publicUrl: 'https://test.com/image.jpg'
    })),
    deleteScreenshot: jest.fn(() => Promise.resolve()),
    recordAnalytics: jest.fn(() => Promise.resolve()),
    addSearchHistory: jest.fn(() => Promise.resolve()),
    getUserTags: jest.fn(() => Promise.resolve([
      { id: 'tag-1', name: 'javascript', color: '#F7DF1E' }
    ])),
    upsertTag: jest.fn(() => Promise.resolve({ id: 'tag-1', name: 'javascript' })),
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
    key: 'test-key',
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: { children: any }) => children,
}));

jest.mock('@react-navigation/native-stack', () => {
  const mockReact = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: any }) => children,
      Screen: ({ children, component: Component }: { children?: any, component?: any }) => {
        return Component ? mockReact.createElement(Component) : children;
      },
    }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const mockReact = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: any }) => children,
      Screen: ({ children, component: Component }: { children?: any, component?: any }) => {
        return Component ? mockReact.createElement(Component) : children;
      },
    }),
  };
});

// Mock NativeWind - simple pass-through approach
jest.mock('nativewind', () => {
  const mockReact = require('react');
  return {
    styled: (Component: any) => {
      // Return a simple wrapper that passes through all props
      const StyledComponent = (props: any) => {
        const { className, tw, baseClassName, baseTw, ...rest } = props;
        return mockReact.createElement(Component, rest);
      };
      StyledComponent.displayName = `Styled(${Component.displayName || Component.name || 'Component'})`;
      return StyledComponent;
    },
  };
});

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: any }) => children,
  SafeAreaView: ({ children }: { children: any }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: any }) => children,
  Swipeable: ({ children }: { children: any }) => children,
}));

// Mock React Native Get Random Values
jest.mock('react-native-get-random-values', () => ({}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

// Global test utilities
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
  })
) as jest.Mock;

// Console warnings that we want to suppress in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('ReactNativeFiberHostComponent') ||
     args[0].includes('Warning: Failed prop type'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});