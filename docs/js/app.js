import { getQuoteByIndex, formatQuoteForDisplay } from './formatter.js';

class App {
  constructor() {
    this.quotes = [];
    this.currentIndex = 0;

    // DOM Elements
    this.ui = {
      card: document.getElementById('quote-card'),
      controls: document.getElementById('controls'),
      textJa: document.getElementById('quote-ja'),
      textEn: document.getElementById('quote-en'),
      author: document.getElementById('quote-author'),
      dateText: document.getElementById('quote-date'),
      img: document.getElementById('quote-image'),
      imgPlaceholder: document.getElementById('image-placeholder'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      pageIndicator: document.getElementById('page-indicator')
    };

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.fetchQuotes();
    this.render();
  }

  bindEvents() {
    this.ui.btnPrev.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.render();
      }
    });

    this.ui.btnNext.addEventListener('click', () => {
      if (this.currentIndex < this.quotes.length - 1) {
        this.currentIndex++;
        this.render();
      }
    });
  }

  async fetchQuotes() {
    try {
      // キャッシュを避けるためにタイムスタンプを付与（本番運用では設定次第で調整）
      const response = await fetch(`quotes.json?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        this.quotes = data;
        this.currentIndex = data.length - 1; // Show latest
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
      // 空の配列のまま処理を続行し、エラー表示にする
    }
  }

  render() {
    const rawQuote = getQuoteByIndex(this.quotes, this.currentIndex);
    const displayData = formatQuoteForDisplay(rawQuote);

    // アニメーション用にいったん非表示クラスを適用
    this.ui.card.classList.add('hidden');

    setTimeout(() => {
      // データの流し込み
      this.ui.textJa.textContent = displayData.text;
      this.ui.textEn.textContent = displayData.english;
      this.ui.author.textContent = `- ${displayData.author} (${displayData.author_en}) -`;

      if (displayData.date) {
        this.ui.dateText.textContent = displayData.date;
        this.ui.dateText.style.display = 'block';
      } else {
        this.ui.dateText.style.display = 'none';
      }

      // 画像のハンドリング
      if (displayData.image_path) {
        this.ui.img.src = displayData.image_path;
        this.ui.img.onload = () => {
          this.ui.img.classList.remove('hidden');
          this.ui.imgPlaceholder.style.display = 'none';
        };
        this.ui.img.onerror = () => {
          this.ui.img.classList.add('hidden');
          this.ui.imgPlaceholder.style.display = 'block';
        };
      } else {
        this.ui.img.classList.add('hidden');
        this.ui.imgPlaceholder.style.display = 'block';
      }

      // コントロールの更新
      if (this.quotes.length > 0) {
        this.ui.controls.classList.remove('hidden');
        this.ui.pageIndicator.textContent = `${this.currentIndex + 1} / ${this.quotes.length}`;
        this.ui.btnPrev.disabled = this.currentIndex === 0;
        this.ui.btnNext.disabled = this.currentIndex === this.quotes.length - 1;
      }

      // カード表示
      this.ui.card.classList.remove('hidden');
    }, 300); // 遷移のためのわずかな遅延
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
