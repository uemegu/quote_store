import { GoogleGenAI } from '@google/genai';
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

  const ai = new GoogleGenAI({ apiKey });
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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: '9:16'
        }
      }
    });
    
    // API仕様に基づき、partsを走査して画像データ(base64)を抽出
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(savePath, buffer);
        console.log("Image saved as", savePath);
        return savePath;
      }
    }

    throw new Error('Image data not found in response parts');
  } catch (error) {
    console.error('Failed to generate image:', error.message);
    throw error;
  }
}
