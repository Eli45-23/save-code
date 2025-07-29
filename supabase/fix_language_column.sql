-- =======================================
-- 🚨 CRITICAL FIX: Add Missing Language Column to Snippets Table
-- =======================================
-- This script safely adds the missing 'language' column to the snippets table
-- that is causing "column snippets_1.language does not exist" errors

DO $$ 
BEGIN
  -- First check if snippets table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'snippets') THEN
    -- Add language column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'language') THEN
      ALTER TABLE public.snippets ADD COLUMN language TEXT;
      
      -- Create index for performance
      CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
      
      RAISE NOTICE '✅ FIXED: Added language column to snippets table with index';
    ELSE
      RAISE NOTICE '⚠️ language column already exists in snippets table - no action needed';
    END IF;
  ELSE
    RAISE NOTICE '❌ ERROR: snippets table does not exist. Please run the main schema.sql first.';
  END IF;
END $$;

-- =======================================
-- ✅ COMPLETION MESSAGE
-- =======================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '🎉 LANGUAGE COLUMN FIX APPLIED!';
  RAISE NOTICE '🎉 ================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed: "column snippets_1.language does not exist" error';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Your app should now be able to query the language column!';
  RAISE NOTICE '';
END $$;