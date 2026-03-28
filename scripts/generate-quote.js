import { GoogleGenAI } from '@google/genai';

/**
 * Gemini APIを利用してクスッとする格言を生成する
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<{text: string, english: string, author?: string}>}
 */
export async function generateQuote(apiKey) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
ちょっとクスッとする格言を**1個だけ**作って下さい。
渾身のネタでお願いします。過去にバズったXの投稿が参考になるかもしれません。

ただし、出力はJSON形式のみとし、マークダウンの装飾(\`\`\`json など)は付けずに生のJSONを出力してください。
以下のキーを含めてください:
- text: 日本語の格言
- english: 英語の格言
- author: 架空の作者名 (日本語)
- author_en: 架空の作者名 (英語)
`.trim();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  let responseText = response.text ? response.text.trim() : '';

  // もしマークダウンブロックがあれば除去
  responseText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();

  try {
    const data = JSON.parse(responseText);
    return {
      text: data.text || '謎の格言が生成されました',
      english: data.english || 'A mysterious quote was generated',
      author: data.author || '不明',
      author_en: data.author_en || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to parse quote JSON:', responseText);
    throw new Error('Invalid JSON format returned from Gemini');
  }
}
