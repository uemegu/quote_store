import { jest } from '@jest/globals';

// GoogleGenAIのモック
jest.unstable_mockModule('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({
              text: 'テストの格言',
              english: 'Test quote',
              author: 'テスト太郎',
              author_en: 'Test Taro'
            }),
            candidates: [
              {
                content: {
                  parts: [
                    { inlineData: { data: 'YmFzZTY0dGVzdA==' } }
                  ]
                }
              }
            ]
          })
        }
      };
    })
  };
});

describe('Generator Scripts', () => {
  const MOCK_API_KEY = 'test_key';

  it('generates a quote correctly', async () => {
    // Dynamic import to ensure module is loaded after mock
    const { generateQuote } = await import('../scripts/generate-quote.js');
    const result = await generateQuote(MOCK_API_KEY);
    expect(result).toHaveProperty('text', 'テストの格言');
    expect(result).toHaveProperty('english', 'Test quote');
    expect(result).toHaveProperty('author', 'テスト太郎');
    expect(result).toHaveProperty('author_en', 'Test Taro');
  });
  
  it('throws an error if API key is missing', async () => {
    const { generateQuote } = await import('../scripts/generate-quote.js');
    await expect(generateQuote('')).rejects.toThrow('GEMINI_API_KEY is not set');
  });
});
