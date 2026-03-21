/**
 * 配列から指定インデックスの格言を取得する
 */
export function getQuoteByIndex(quotesArray, index) {
  if (!Array.isArray(quotesArray) || quotesArray.length === 0) {
    return null;
  }
  if (index < 0 || index >= quotesArray.length) {
    return null;
  }
  return quotesArray[index];
}

/**
 * 格言データを表示用にフォーマットする
 */
export function formatQuoteForDisplay(quote) {
  if (!quote) {
    return {
      text: 'まだ格言がありません。明日の更新をお待ちください。',
      english: 'No quotes available yet.',
      author: 'System',
      image_path: ''
    };
  }
  return {
    text: quote.text || '無言',
    english: quote.english || 'No words',
    author: quote.author ? quote.author : '不明',
    image_path: quote.image_path || ''
  };
}
