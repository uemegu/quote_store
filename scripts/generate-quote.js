import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini APIを利用してクスッとする格言を生成する
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<{text: string, english: string, author?: string}>}
 */
export async function generateQuote(apiKey) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // 要件で指定されたモデル名
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
ちょっとクスッとする格言を**1個だけ**作って下さい。
渾身のネタでお願いします。過去にバズったXの投稿が参考になるかもしれません。

例）
・昨日の自分を超えようとしたが、昨日の自分は意外と足が速かった。
・靴下が片方見つからなければ両方脱げば良い。

ただし、出力はJSON形式のみとし、マークダウンの装飾(\`\`\`json など)は付けずに生のJSONを出力してください。
以下のキーを含めてください:
- text: 日本語の格言
- english: 英語の格言
- author: 架空の作者名 (日本語)
`.trim();

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();

  // もしマークダウンブロックがあれば除去
  responseText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();

  try {
    const data = JSON.parse(responseText);
    return {
      text: data.text || '謎の格言が生成されました',
      english: data.english || 'A mysterious quote was generated',
      author: data.author || '不明'
    };
  } catch (error) {
    console.error('Failed to parse quote JSON:', responseText);
    throw new Error('Invalid JSON format returned from Gemini');
  }
}
