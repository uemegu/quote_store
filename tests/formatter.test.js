import { getQuoteByIndex, formatQuoteForDisplay } from '../public/js/formatter.js';

describe('Frontend format logic', () => {
  describe('getQuoteByIndex', () => {
    it('returns null for empty array or invalid inputs', () => {
      expect(getQuoteByIndex([], 0)).toBeNull();
      expect(getQuoteByIndex(null, 0)).toBeNull();
    });

    it('returns null for out of bound index', () => {
      const arr = [{ id: 1 }, { id: 2 }];
      expect(getQuoteByIndex(arr, -1)).toBeNull();
      expect(getQuoteByIndex(arr, 2)).toBeNull();
    });

    it('returns correct element', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(getQuoteByIndex(arr, 1)).toEqual({ id: 2 });
    });
  });

  describe('formatQuoteForDisplay', () => {
    it('returns default fallback when input is null', () => {
      const res = formatQuoteForDisplay(null);
      expect(res.text).toContain('まだ格言がありません');
      expect(res.author).toBe('System');
      expect(res.author_en).toBe('System');
    });

    it('formats existing quote correctly', () => {
      const res = formatQuoteForDisplay({
        text: 'こんにちは',
        english: 'Hello',
        author: '田中',
        author_en: 'Tanaka',
        image_path: 'img.png'
      });
      expect(res.text).toBe('こんにちは');
      expect(res.english).toBe('Hello');
      expect(res.author).toBe('田中');
      expect(res.author_en).toBe('Tanaka');
      expect(res.image_path).toBe('img.png');
    });

    it('fallbacks missing fields', () => {
      const res = formatQuoteForDisplay({ text: 'テスト' });
      expect(res.text).toBe('テスト');
      expect(res.english).toBe('No words');
      expect(res.author).toBe('不明');
      expect(res.author_en).toBe('Unknown');
    });
  });
});
