import { jest } from '@jest/globals';

// GoogleGenerativeAIのモック
jest.unstable_mockModule('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({
                text: 'テストの格言',
                english: 'Test quote',
                author: 'テスト太郎'
              }),
              candidates: [
                {
                  content: {
                    parts: [
                      { inlineData: { mimeType: 'image/png', data: 'YmFzZTY0dGVzdA==' } }
                    ]
                  }
                } // 疑似画像データ
              ]
            }
          })
        })
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
  });
  
  it('throws an error if API key is missing', async () => {
    const { generateQuote } = await import('../scripts/generate-quote.js');
    await expect(generateQuote('')).rejects.toThrow('GEMINI_API_KEY is not set');
  });
});
