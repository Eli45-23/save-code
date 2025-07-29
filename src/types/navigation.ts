import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: NavigatorScreenParams<ModalStackParamList>;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EmailConfirmation: {
    email: string;
  };
};

// Main Tab Navigator
export type MainTabParamList = {
  Files: NavigatorScreenParams<FilesStackParamList>;
  Add: NavigatorScreenParams<AddStackParamList>;
  Search: NavigatorScreenParams<SearchStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Files Stack Navigator
export type FilesStackParamList = {
  FilesList: undefined;
  FileDetail: {
    fileId: string;
    fileName: string;
  };
  SnippetDetail: {
    snippetId: string;
    fileId: string;
  };
};

// Add Stack Navigator
export type AddStackParamList = {
  Camera: undefined;
  PhotoLibrary: undefined;
  MultiImagePicker: undefined;
  ProcessImage: {
    imageUri: string;
  };
  ReviewAndSave: {
    imageUri?: string;
    imageUris?: string[];
    extractedText?: string;
    ocrResult?: any;
    classification?: any;
    ocrConfidence?: number;
    isMultiImage?: boolean;
  };
};

// Search Stack Navigator
export type SearchStackParamList = {
  SearchHome: undefined;
  SearchResults: {
    query: string;
  };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  About: undefined;
  EditProfile: undefined;
};

// Modal Stack Navigator
export type ModalStackParamList = {
  EditSnippet: {
    snippetId: string;
  };
  EditFile: {
    fileId: string;
  };
  FileOptions: {
    fileId: string;
  };
  TagManager: undefined;
};

// Screen prop types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

export type FilesStackScreenProps<T extends keyof FilesStackParamList> = 
  NativeStackScreenProps<FilesStackParamList, T>;

export type AddStackScreenProps<T extends keyof AddStackParamList> = 
  NativeStackScreenProps<AddStackParamList, T>;

export type SearchStackScreenProps<T extends keyof SearchStackParamList> = 
  NativeStackScreenProps<SearchStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;

export type ModalStackScreenProps<T extends keyof ModalStackParamList> = 
  NativeStackScreenProps<ModalStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}