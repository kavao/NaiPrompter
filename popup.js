// 初期スタイルデータを定義
const initialStyles = [
  {
    title: "シンプルモード",
    prompt: "ページの内容を簡潔に要約してください。",
    excludeElements: ["header", "footer", "nav"]
  },
  {
    title: "詳細モード",
    prompt: "ページの内容を詳細に分析し、重要なポイントを箇条書きでまとめてください。",
    excludeElements: ["aside", "comments"]
  },
  {
    title: "クリエイティブモード",
    prompt: "ページの内容を元に、創造的な視点で新しいアイデアを提案してください。",
    excludeElements: ["ads", "related-posts"]
  }
];

// ページ読み込み時に実行される関数
document.addEventListener('DOMContentLoaded', async () => {
  // 既存のスタイルを取得
  let savedStyles = await chrome.storage.sync.get('savedStyles');
  
  // 保存されたスタイルがない場合、初期スタイルを設定
  if (!savedStyles.savedStyles || savedStyles.savedStyles.length === 0) {
    await chrome.storage.sync.set({ savedStyles: initialStyles });
    savedStyles = { savedStyles: initialStyles };
  }
  
  // スタイルリストを表示する処理
  displaySavedStyles(savedStyles.savedStyles);
});
