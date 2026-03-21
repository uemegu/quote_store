import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

/**
 * Gemini APIを利用して格言に合わせた画像を生成し、ファイルに保存する
 * @param {string} apiKey - Gemini API Key
 * @param {string} quoteText - 画像生成の元となる格言テキスト
 * @param {string} savePath - 画像の保存先パス（拡張子含む）
 * @returns {Promise<string>} 生成結果（画像のパス等）
 */
export async function generateImage(apiKey, quoteText, savePath) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // 要件で指定されたモデル名。画像生成用
  const modelName = 'gemini-3.1-flash-image-preview';
  
  const prompt = `
格言にあわせた画像を作ってください 。

注意：
・格言を含む**文字**は画像に入れないでください。
・フォトリアルな画像にしてください。

# 格言
${quoteText}
  `.trim();

  try {
    // Generative AI SDKに画像生成専用メソッドがあればそれを使用し、なければ一般的なgenerateContentを使用する
    // 現在のSDKの使用感としては modelに対して直接呼び出す想定
    const model = genAI.getGenerativeModel({ model: modelName });

    // Node.js SDKの新しい画像生成APIを想定
    // generateImagesが未実装のSDKバージョンの場合は、通常のgenerateContentで画像のベース64を受け取る想定
    if (typeof model.generateImages === 'function') {
      const response = await model.generateImages({ prompt, numberOfImages: 1, outputMimeType: 'image/png' });
      const base64Image = response.images[0].image.base64;
      if (base64Image) {
        fs.writeFileSync(savePath, Buffer.from(base64Image, 'base64'));
        return savePath;
      }
    }

    // fallback to normal generateContent
    const result = await model.generateContent(prompt);
    
    // レスポンスから画像パートを検索
    const candidate = result.response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));

    if (imagePart && imagePart.inlineData) {
      const base64Data = imagePart.inlineData.data;
      fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
      return savePath;
    } else {
      console.warn('レスポンス内にインライン画像データが見つかりませんでした。テキストとして保存を試みます（Base64文字列等）。');
      let text = result.response.text().trim();
      // もしテキストのみ返ってきて、そこがBase64ならば
      if (text && text.length > 100 && !text.includes(' ') && !text.includes('\\n')) {
          fs.writeFileSync(savePath, Buffer.from(text, 'base64'));
          return savePath;
      }
      throw new Error('Image data not found in response');
    }
  } catch (error) {
    console.error('Failed to generate image:', error.message);
    throw error;
  }
}
