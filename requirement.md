quote_storeにはgithub actionsで1日1回、格言と画像を生成して格納していきたいと思います

＃要件
・github pagesで格言と画像を公開する
・github actionsで格言と画像を生成する
・格言と画像を生成したらgithub pagesで公開されるディレクトリに保存する
・格言はJSON形式で表現する
・格言JSONには格言のID、日本語、英語、画像のパスが書かれている
・github actionsで毎日1レコード、JSONが追記されていく

＃詳細
・格言と画像はGeminiで生成する
・格言はgemini-3-flash-preview, 画像はgemini-3.1-flash-image-previewで生成する
・格言のプロンプトは以下。ただし、出力はJSON形式とし、日本語と英語を出力するように拡張させること
````
ちょっとクスッとする格言を**1個だけ**作って下さい。
渾身のネタでお願いします。過去にバズったXの投稿が参考になるかもしれません。

例）
・昨日の自分を超えようとしたが、昨日の自分は意外と足が速かった。
・靴下が片方見つからなければ両方脱げば良い。
````
・画像生成のプロンプトは以下
````
格言にあわせた画像を作ってください 。

注意：
・格言を含む**文字**は画像に入れないでください。
・フォトリアルな画像にしてください。

# 格言
{格言}
````

#参考
以前似たものを作ったことがあるので参考までに記載します。
これは参考なので要件は今回の要件にあわせてください。

````yaml
name: Add Quote with Gemini

on:
  workflow_dispatch: # 手動実行
  schedule:
    - cron: "0 23 * 12 *"

permissions:
  contents: write

jobs:
  add-quote:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22" # 好きなバージョンでOK

      - name: Install dependencies
        run: npm ci

      - name: Add quote using Gemini
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: npm run add:quote

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # 変更が無い場合は commit でコケるのでフォロー
          git add docs/quotes.json public/quotes.json
          git diff --cached --quiet && echo "No changes to commit" && exit 0

          git commit -m "chore: add quote from Gemini"

      - name: Push to main
        run: |
          git push origin HEAD:main
````
````
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const quotesPath = path.join(__dirname, "..", "docs", "quotes.json");
const publicQuotesPath = path.join(__dirname, "..", "public", "quotes.json");

function loadQuotes() {
  const json = fs.readFileSync(quotesPath, "utf-8");
  const data = JSON.parse(json);

  if (!Array.isArray(data)) {
    throw new Error("quotes.json が配列じゃないっぽい…形式チェックしてみて！");
  }
  return data;
}

/**
 * Gemini 2.5 Pro を 2回呼び出して
 * - 1回目: 格言を5個生成
 * - 2回目: 5個を笑える順に並べて3番目だけ返す
 */
async function generateQuoteWithTwoCalls() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("環境変数 GEMINI_API_KEY が設定されてないよ");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // ──────────────────────────────
  // ① 5個の格言を生成
  // ──────────────────────────────
  const prompt1 = `
以下のような意味がわかるようでわからない格言を5個生成してください
笑えるやつが良いです

「朝焼けを見て、夕焼けを語るな。」
「右手に持つ水は、左手で飲むべからず。」
「石を積む者は、石を積む。」
「靴下が片方ないなら、両方脱げ。」
「夜中のコンビニで牛乳を買う男に嘘はない。」
「傘を貸したら帰りは走れ。」
`.trim();

  const result1 = await model.generateContent(prompt1);
  const text1 = result1.response.text().trim();

  // text1 の例想定：
  // 1. 「〜〜〜」
  // 2. 「〜〜〜」
  // みたいな感じ。フォーマットはあまりガチガチにパースしないで、
  // そのまま次のプロンプトに渡すスタイルにしてる。

  // ──────────────────────────────
  // ② 5個を笑える順に並べて3番目だけ出力してもらう
  // ──────────────────────────────
  const prompt2 = `
以下はあなたが生成した5つの格言です。

${text1}

生成した格言を笑える順に並べてください。その中から3番目の格言を選び、その格言と、その格言に合う架空の作者名をJSON形式で出力してください。
例: {"text": "石を積む者は、石を積む。", "author": "積田 積"}
`.trim();

  const result2 = await model.generateContent(prompt2);
  let responseText = result2.response.text().trim();

  // 応答テキストからJSONオブジェクトを抽出する
  const jsonStartIndex = responseText.indexOf("{");
  const jsonEndIndex = responseText.lastIndexOf("}");

  if (
    jsonStartIndex !== -1 &&
    jsonEndIndex !== -1 &&
    jsonEndIndex > jsonStartIndex
  ) {
    responseText = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
  } else {
    // JSONが見つからない場合、warnを出して元のresponseTextをそのまま使う（フォールバック）
    console.warn(
      "Gemini のレスポンスに有効なJSONオブジェクトが見つからなかったよ:",
      result2.response.text().trim()
    );
    // フォールバック処理のために元のresponseTextを保持
    // ただし、以前の ``` ガードは不要になるため削除
  }

  try {
    const parsed = JSON.parse(responseText);
    if (parsed.text && parsed.author) {
      return { text: parsed.text, author: parsed.author };
    }
  } catch (e) {
    console.warn(
      "Gemini のレスポンスをJSONとしてパースできなかったよ:",
      responseText
    );
  }

  // JSONパースに失敗した場合のフォールバック
  // 以前のロジックをベースに格言だけを抽出
  let proverb = responseText;
  proverb = proverb.replace(/^\s*\d+[\.\u3001\)]\s*/, "");
  return { text: proverb, author: "Unknown" };
}

async function main() {
  const quotes = loadQuotes();
  const newQuoteData = await generateQuoteWithTwoCalls();

  const nextIdNum = quotes.length + 1;
  const newId = `q-${String(nextIdNum).padStart(3, "0")}`;

  quotes.push({
    id: newId,
    text: newQuoteData.text,
    author: newQuoteData.author,
  });

  fs.writeFileSync(quotesPath, JSON.stringify(quotes, null, 2) + "\n", "utf-8");
  fs.writeFileSync(
    publicQuotesPath,
    JSON.stringify(quotes, null, 2) + "\n",
    "utf-8"
  );

  console.log("新しい格言を追加したよ:", newQuoteData.text);
  console.log("作者:", newQuoteData.author);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
````

