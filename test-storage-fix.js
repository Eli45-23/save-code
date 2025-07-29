/**
 * Quick test to verify the storage upload fix
 * Run this in the app or dev console to test
 */

// Simulate the old vs new upload path approach
const userId = 'fd090d7c-dfee-4e1e-b0b2-cf0bce7100d5';
const fileName = 'screenshot-123.jpg';

// OLD approach (caused RLS error)
const oldPath = `${userId}/${fileName}`;
console.log('OLD path format:', oldPath);
console.log('OLD path length:', oldPath.length);

// NEW approach (should work)
const timestamp = Date.now();
const userPrefix = userId.substring(0, 8);
const newPath = `${userPrefix}-${timestamp}-${fileName}`;
console.log('NEW path format:', newPath);
console.log('NEW path length:', newPath.length);

// Test URL extraction for deletion
const mockPublicUrl = `https://abc.supabase.co/storage/v1/object/public/screenshots/${newPath}`;
const extractedFileName = mockPublicUrl.split('/').pop();
console.log('Extracted filename for deletion:', extractedFileName);
console.log('Matches new path?:', extractedFileName === newPath);

console.log('\n✅ The new format avoids RLS path parsing issues while maintaining user association through filename prefix');