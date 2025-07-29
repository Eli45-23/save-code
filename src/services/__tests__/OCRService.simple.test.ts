import { OCRService, ocrService } from '../OCRService';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => 
    Promise.resolve({ uri: 'mock-processed-uri' })
  ),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' }
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
}));

describe('OCRService - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state between tests
    (ocrService as any)['isInitialized'] = false;
  });

  describe('initialization', () => {
    it('should initialize the OCR service', async () => {
      await ocrService.initialize();
      
      expect(ocrService.isReady()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await ocrService.initialize();
      const firstInit = ocrService.isReady();
      
      await ocrService.initialize();
      const secondInit = ocrService.isReady();
      
      expect(firstInit).toBe(true);
      expect(secondInit).toBe(true);
    });
  });

  describe('extractTextFromImage', () => {
    it('should extract text from image successfully', async () => {
      const result = await ocrService.extractTextFromImage('test-image-uri');
      
      expect(result).toEqual({
        text: expect.any(String),
        confidence: expect.any(Number),
        words: expect.any(Array),
        lines: expect.any(Array),
      });
      
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(80);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should initialize service if not already initialized', async () => {
      expect(ocrService.isReady()).toBe(false);
      
      const result = await ocrService.extractTextFromImage('test-image-uri');
      
      expect(ocrService.isReady()).toBe(true);
      expect(result.text).toBeDefined();
    });

    it('should preprocess image before OCR', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      
      await ocrService.extractTextFromImage('test-image-uri');
      
      expect(manipulateAsync).toHaveBeenCalledWith(
        'test-image-uri',
        expect.any(Array),
        expect.objectContaining({
          compress: expect.any(Number),
          format: expect.any(String),
        })
      );
    });
  });

  describe('extractCodeFromScreenshot', () => {
    it('should extract and format code text from screenshot', async () => {
      const result = await ocrService.extractCodeFromScreenshot('test-code-image');
      
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(80);
      expect(typeof result.text).toBe('string');
      expect(result.words).toBeInstanceOf(Array);
      expect(result.lines).toBeInstanceOf(Array);
    });

    it('should use PNG format for code screenshots', async () => {
      const { manipulateAsync } = require('expo-image-manipulator');
      
      await ocrService.extractCodeFromScreenshot('test-code-image');
      
      expect(manipulateAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          format: 'png',
        })
      );
    });
  });

  describe('processBatch', () => {
    it('should process multiple images', async () => {
      const imageUris = ['image1.jpg', 'image2.jpg'];
      const results = await ocrService.processBatch(imageUris);
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('words');
        expect(result).toHaveProperty('lines');
      });
    });

    it('should handle empty batch', async () => {
      const results = await ocrService.processBatch([]);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('terminate', () => {
    it('should terminate the service', async () => {
      await ocrService.initialize();
      expect(ocrService.isReady()).toBe(true);
      
      await ocrService.terminate();
      
      expect(ocrService.isReady()).toBe(false);
    });

    it('should handle termination when not initialized', async () => {
      expect(ocrService.isReady()).toBe(false);
      
      await expect(ocrService.terminate()).resolves.not.toThrow();
    });
  });

  describe('mock OCR behavior', () => {
    it('should return different mock code examples', async () => {
      const results = await Promise.all([
        ocrService.extractTextFromImage('image1'),
        ocrService.extractTextFromImage('image2'),
        ocrService.extractTextFromImage('image3'),
      ]);

      // Results should be valid OCR results
      results.forEach(result => {
        expect(result.text).toBeDefined();
        expect(result.confidence).toBeGreaterThan(80);
        expect(result.words.length).toBeGreaterThan(0);
        expect(result.lines.length).toBeGreaterThan(0);
      });
    });

    it('should generate realistic word and line bounding boxes', async () => {
      const result = await ocrService.extractTextFromImage('test-image');
      
      result.words.forEach(word => {
        expect(word.bbox).toHaveProperty('x0');
        expect(word.bbox).toHaveProperty('y0');
        expect(word.bbox).toHaveProperty('x1');
        expect(word.bbox).toHaveProperty('y1');
        expect(word.confidence).toBeGreaterThan(0);
      });

      result.lines.forEach(line => {
        expect(line.bbox).toHaveProperty('x0');
        expect(line.bbox).toHaveProperty('y0');
        expect(line.bbox).toHaveProperty('x1');
        expect(line.bbox).toHaveProperty('y1');
        expect(line.confidence).toBeGreaterThan(0);
      });
    });
  });
});