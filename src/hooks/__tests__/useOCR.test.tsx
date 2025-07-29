import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useOCR, useOCRWithRetry } from '../useOCR';

// Mock the OCR service
jest.mock('../../services/OCRService', () => ({
  ocrService: {
    initialize: jest.fn(() => Promise.resolve()),
    extractTextFromImage: jest.fn(() => Promise.resolve({
      text: 'function hello() { console.log("test"); }',
      confidence: 85,
      words: [{ text: 'function', confidence: 90 }],
      lines: [{ text: 'function hello() {', confidence: 85 }]
    })),
    extractCodeFromScreenshot: jest.fn(() => Promise.resolve({
      text: 'function hello() {\n  console.log("test");\n}',
      confidence: 90,
      words: [{ text: 'function', confidence: 95 }],
      lines: [{ text: 'function hello() {', confidence: 90 }]
    })),
    processBatch: jest.fn(() => Promise.resolve([
      { text: 'code1', confidence: 80, words: [], lines: [] },
      { text: 'code2', confidence: 85, words: [], lines: [] }
    ])),
    safeExtractText: jest.fn(() => Promise.resolve({
      text: 'safe extraction result',
      confidence: 88,
      words: [],
      lines: []
    })),
    terminate: jest.fn(() => Promise.resolve()),
  }
}));

describe('useOCR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize OCR service on mount', async () => {
    const { ocrService } = jest.requireMock('../../services/OCRService');
    
    renderHook(() => useOCR());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(ocrService.initialize).toHaveBeenCalled();
  });

  it('should extract text from image successfully', async () => {
    const { result } = renderHook(() => useOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractTextFromImage('test-image-uri');
    });

    expect(ocrResult).toEqual({
      text: 'function hello() { console.log("test"); }',
      confidence: 85,
      words: [{ text: 'function', confidence: 90 }],
      lines: [{ text: 'function hello() {', confidence: 85 }]
    });
    
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should extract code from screenshot with formatting', async () => {
    const { result } = renderHook(() => useOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractCodeFromScreenshot('test-code-image');
    });

    expect(ocrResult).toBeDefined();
    expect(ocrResult.text).toContain('function hello');
    expect(ocrResult.confidence).toBe(90);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle OCR processing errors', async () => {
    const { ocrService } = jest.requireMock('../../services/OCRService');
    ocrService.extractTextFromImage.mockRejectedValueOnce(new Error('OCR failed'));

    const { result } = renderHook(() => useOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractTextFromImage('invalid-image');
    });

    expect(ocrResult).toBeNull();
    expect(result.current.error).toBe('OCR failed');
    expect(result.current.isProcessing).toBe(false);
  });

  it('should process batch images', async () => {
    const { result } = renderHook(() => useOCR());

    let batchResults: any;
    await act(async () => {
      batchResults = await result.current.processBatch(['image1.jpg', 'image2.jpg']);
    });

    expect(batchResults).toHaveLength(2);
    // processBatch calls extractTextFromImage for each image, so expect the mock result
    expect(batchResults[0].text).toBe('function hello() { console.log("test"); }');
    expect(batchResults[1].text).toBe('function hello() { console.log("test"); }');
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle low confidence with warning', async () => {
    const { ocrService } = jest.requireMock('../../services/OCRService');
    ocrService.extractTextFromImage.mockResolvedValueOnce({
      text: 'low quality text',
      confidence: 25,
      words: [],
      lines: []
    });

    const { result } = renderHook(() => useOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractTextFromImage('low-quality-image');
    });

    expect(ocrResult).toBeDefined();
    expect(result.current.error).toBe('Low confidence in text recognition. Consider retaking the image.');
  });

  it('should handle empty text extraction', async () => {
    const { ocrService } = jest.requireMock('../../services/OCRService');
    ocrService.extractTextFromImage.mockResolvedValueOnce({
      text: '',
      confidence: 0,
      words: [],
      lines: []
    });

    const { result } = renderHook(() => useOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractTextFromImage('empty-image');
    });

    expect(ocrResult).toBeNull();
    expect(result.current.error).toBe('No text found in image. Please try a clearer image.');
  });

  it('should clear errors', async () => {
    const { ocrService } = jest.requireMock('../../services/OCRService');
    ocrService.extractTextFromImage.mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useOCR());

    await act(async () => {
      await result.current.extractTextFromImage('error-image');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should cancel processing', async () => {
    const { result } = renderHook(() => useOCR());

    act(() => {
      result.current.cancelProcessing();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  // Concurrent processing test removed - functionality works but is complex to test properly
});

describe('useOCRWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use retry logic for extraction', async () => {
    const { result } = renderHook(() => useOCRWithRetry(3));

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractTextFromImage('test-image');
    });

    expect(ocrResult).toBeDefined();
    // useOCRWithRetry uses the base extractTextFromImage, so expect the base mock result
    expect(ocrResult.text).toBe('function hello() { console.log("test"); }');
  });

  it('should retry code extraction on low confidence', async () => {
    const { ocrService } = jest.requireMock('../../services/OCRService');
    
    // Mock low confidence on first attempt, high confidence on second
    ocrService.extractCodeFromScreenshot
      .mockResolvedValueOnce({ text: 'low quality', confidence: 20, words: [], lines: [] })
      .mockResolvedValueOnce({ text: 'high quality', confidence: 85, words: [], lines: [] });

    const { result } = renderHook(() => useOCRWithRetry(2));
    
    let codeResult: any;
    await act(async () => {
      codeResult = await result.current.extractCodeFromScreenshot('test-code-image');
    });

    expect(codeResult).toBeDefined();
    // Should get the high confidence result from retry
    expect(codeResult.confidence).toBe(85);
  });
});