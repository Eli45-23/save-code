# Save Code - iOS App

A React Native (Expo) application that allows users to capture screenshots of code, extract text using OCR, and organize it with AI-powered classification.

## 🚀 Features

- **📸 Screenshot Capture**: Take photos of code from any source
- **🔍 OCR Text Extraction**: Automatic text extraction with Tesseract.js
- **🤖 AI Classification**: Smart language detection and topic classification
- **📁 Smart Organization**: Automatically categorize and organize code snippets
- **🔍 Powerful Search**: Full-text search across all saved code
- **📱 iOS-Native UI**: Beautiful interface following Apple's design guidelines
- **☁️ Cloud Sync**: Supabase backend with real-time synchronization

## 🛠️ Tech Stack

### Frontend
- **React Native** with Expo SDK
- **TypeScript** for type safety
- **NativeWind** for Tailwind-style styling
- **React Navigation** for navigation

### Backend
- **Supabase** for database, authentication, and storage
- **PostgreSQL** with full-text search and RLS
- **Row Level Security** for data protection

### AI/ML
- **Tesseract.js** for OCR text extraction
- **Custom Classification** for programming language detection
- **Topic Classification** for smart categorization

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Card, etc.)
│   └── features/       # Feature-specific components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── files/         # File management screens
│   ├── add/           # Code capture screens
│   ├── search/        # Search screens
│   ├── profile/       # Profile screens
│   └── modals/        # Modal screens
├── navigation/         # Navigation configuration
├── services/          # Business logic services
│   ├── OCRService.ts         # OCR processing
│   ├── TopicClassifierService.ts  # AI classification
│   └── SaveCodeService.ts    # Main app logic
├── hooks/             # Custom React hooks
├── contexts/          # React contexts (Auth, etc.)
├── lib/               # External service integrations
├── types/             # TypeScript type definitions
└── __tests__/         # Test files
```

## 🗄️ Database Schema

### Core Tables
- **profiles** - User profile information
- **files** - Code file containers
- **snippets** - Individual code snippets with OCR data
- **tags** - User-defined tags for organization
- **search_history** - Search query history
- **user_analytics** - App usage analytics

### Key Features
- **Row Level Security (RLS)** for data isolation
- **Full-text search** with PostgreSQL
- **Similar file detection** using trigram similarity
- **Automatic tag management** with usage tracking

## 🧪 Testing

Comprehensive test coverage including:

- **Unit Tests** for services and utilities
- **Component Tests** for UI components
- **Hook Tests** for custom React hooks
- **Integration Tests** for user workflows

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (for development)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd save-code-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Create the 'screenshots' storage bucket
   - Update `src/lib/supabase.ts` with your credentials

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on iOS**
   ```bash
   npm run ios
   ```

## 🔧 Configuration

### Supabase Setup
1. **Database Schema**: Run `supabase/schema.sql` in your Supabase SQL editor
2. **Storage**: Create a 'screenshots' bucket with appropriate policies
3. **Authentication**: Configure email authentication
4. **RLS**: Ensure Row Level Security is enabled on all tables

### Environment Variables
Update the Supabase configuration in `src/lib/supabase.ts`:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## 🎨 Design System

The app follows iOS Human Interface Guidelines with:

- **SF Pro** font family
- **iOS system colors** (systemBlue, systemRed, etc.)
- **Consistent spacing** using 4px grid system
- **Rounded corners** following iOS standards
- **Native navigation patterns**

### Key Components
- `Button` - iOS-style buttons with variants
- `Card` - Container component with shadows
- `TextInput` - Form inputs with validation
- `SearchBar` - iOS-style search interface
- `Tag` - Colored labels for categorization

## 🔍 OCR & Classification

### OCR Processing
- **Image preprocessing** for better accuracy
- **Confidence scoring** for quality assessment
- **Code-specific formatting** and cleanup
- **Batch processing** support

### AI Classification
- **Language detection** for 10+ programming languages
- **Topic classification** for different code domains
- **Similarity matching** to find related files
- **Smart file naming** based on content

## 📱 Key Features

### File Management
- **Smart categorization** by programming language
- **Topic-based organization** (UI, Database, API, etc.)
- **Tag system** for custom organization
- **Search and filter** capabilities

### Code Capture
- **Camera integration** with Expo Camera
- **Photo library access** for existing images
- **Image preprocessing** for better OCR results
- **Real-time processing** feedback

### Search & Discovery
- **Full-text search** across all content
- **Filter by language** and topic
- **Search history** tracking
- **Recent files** quick access

## 🔒 Security

- **Row Level Security** in Supabase
- **User data isolation** with proper policies
- **Secure file storage** with signed URLs
- **Input validation** and sanitization

## 📈 Analytics

Built-in analytics tracking:
- **User activity** patterns
- **Feature usage** statistics
- **Search queries** and results
- **OCR performance** metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Tesseract.js** for OCR capabilities
- **Supabase** for backend infrastructure
- **Expo** for React Native development platform
- **NativeWind** for styling system

---

Built with ❤️ using React Native, Expo, and Supabase.