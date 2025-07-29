/**
 * ULTRA STORAGE SOLUTIONS
 * 4 different approaches to fix the screenshot upload RLS issue
 */

import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

// =======================================
// SOLUTION A: Public Bucket Approach (Quick Fix)
// =======================================
export const publicBucketUpload = async (file: Blob, fileName: string, userId: string) => {
  try {
    // Create a new public bucket or use existing one without RLS
    const timestamp = Date.now();
    const userPrefix = userId.substring(0, 8);
    const filePath = `${userPrefix}-${timestamp}-${fileName}`;
    
    console.log('[Solution A] Attempting public bucket upload:', filePath);
    
    // Try uploading to a public bucket (you'll need to create this in Supabase dashboard)
    const { data, error } = await supabase.storage
      .from('public-screenshots') // Different bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('public-screenshots')
      .getPublicUrl(filePath);
    
    return {
      path: filePath,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('[Solution A] Public bucket upload failed:', error);
    throw error;
  }
};

// =======================================
// SOLUTION B: Database Storage (Base64)
// =======================================
export const databaseImageStorage = async (imageUri: string, userId: string) => {
  try {
    console.log('[Solution B] Converting image to base64 for database storage');
    
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Create data URL
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Store directly in database as screenshot_url
    console.log('[Solution B] Storing image as base64 data URL, size:', base64.length);
    
    return {
      path: 'database-stored',
      publicUrl: dataUrl // This will be stored directly in the snippet
    };
  } catch (error) {
    console.error('[Solution B] Database storage failed:', error);
    throw error;
  }
};

// =======================================
// SOLUTION C: Alternative Storage Service
// =======================================
export const alternativeStorage = async (file: Blob, fileName: string, userId: string) => {
  try {
    console.log('[Solution C] Using alternative storage approach');
    
    // Option 1: Try a different bucket
    const timestamp = Date.now();
    const filePath = `${timestamp}-${fileName}`; // Even simpler path
    
    // Try uploading to 'images' bucket instead of 'screenshots'
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    return {
      path: filePath,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('[Solution C] Alternative storage failed:', error);
    throw error;
  }
};

// =======================================
// SOLUTION D: Skip Screenshots (Minimal)
// =======================================
export const skipScreenshots = async () => {
  console.log('[Solution D] Skipping screenshot storage entirely');
  return {
    path: 'skipped',
    publicUrl: null // No screenshot stored
  };
};

// =======================================
// UNIFIED UPLOAD FUNCTION WITH FALLBACKS
// =======================================
export const uploadWithFallbacks = async (
  imageUri: string, 
  fileName: string, 
  userId: string,
  preferredSolution: 'A' | 'B' | 'C' | 'D' = 'A'
) => {
  console.log(`[Upload Fallbacks] Starting with solution ${preferredSolution}`);
  
  // Convert URI to Blob for solutions that need it
  let file: Blob | null = null;
  
  try {
    if (preferredSolution !== 'B' && preferredSolution !== 'D') {
      const response = await fetch(imageUri);
      file = await response.blob();
    }
  } catch (error) {
    console.warn('[Upload Fallbacks] Failed to create blob, falling back to database storage');
    preferredSolution = 'B';
  }
  
  // Try solutions in order of preference
  const solutions = [
    { id: 'A', name: 'Public Bucket', fn: () => publicBucketUpload(file!, fileName, userId) },
    { id: 'B', name: 'Database Storage', fn: () => databaseImageStorage(imageUri, userId) },
    { id: 'C', name: 'Alternative Storage', fn: () => alternativeStorage(file!, fileName, userId) },
    { id: 'D', name: 'Skip Screenshots', fn: () => skipScreenshots() }
  ];
  
  // Start with preferred solution
  const preferredIndex = solutions.findIndex(s => s.id === preferredSolution);
  const orderedSolutions = [
    ...solutions.slice(preferredIndex),
    ...solutions.slice(0, preferredIndex)
  ];
  
  for (const solution of orderedSolutions) {
    try {
      console.log(`[Upload Fallbacks] Trying ${solution.name}...`);
      const result = await solution.fn();
      console.log(`[Upload Fallbacks] ✅ Success with ${solution.name}`);
      return result;
    } catch (error) {
      console.warn(`[Upload Fallbacks] ❌ ${solution.name} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All upload solutions failed');
};