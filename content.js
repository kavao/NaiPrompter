function getPromptField() {
  // 複数のセレクタを試行
  const selectors = [
    'textarea[placeholder="プロンプトを入力し、理想の画像を生成しましょう"]',
    'textarea.sc-a2d0901c-45.kyIdtk',
    'div.sc-6557a36d-2.kIdzcn textarea',
    // NovelAIの最新の構造に基づいて、他の可能性のあるセレクタを追加
  ];

  for (let selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  console.error('Prompt field not found');
  return null;
}
  
function getExcludeField() {
  // 複数のセレクタを試行
  const selectors = [
    'textarea[placeholder="除外したい要素を入力してください"]',
    'textarea.sc-a2d0901c-45.kyIdtk:nth-child(2)',
    // NovelAIの最新の構造に基づいて、他の可能性のあるセレクタを追加
  ];

  for (let selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  console.error('Exclude field not found');
  return null;
}
  
function injectPrompt(prompt, exclude) {
  const promptField = getPromptField();
  const excludeField = getExcludeField();

  if (!promptField) {
    console.error('Prompt field not found');
    return { success: false, error: 'プロンプトフィールドが見つかりません' };
  }

  promptField.value = prompt || '';
  promptField.dispatchEvent(new Event('input', { bubbles: true }));

  if (excludeField && exclude) {
    excludeField.value = exclude;
    excludeField.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (!excludeField && exclude) {
    console.warn('Exclude field not found, but exclude text was provided');
  }

  return { success: true };
}

function fetchPrompt() {
  const promptField = getPromptField();
  const excludeField = getExcludeField();
  if (promptField) {
    return {
      prompt: promptField.value,
      exclude: excludeField ? excludeField.value : ''
    };
  } else {
    console.error('Prompt field not found');
    return { prompt: '', exclude: '' };
  }
}

async function findButton(selectors, maxAttempts = 5, interval = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const selector of selectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button.textContent.includes('１枚のみ生成') || button.textContent.includes('Generate')) {
          return button;
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return null;
}

async function generateSingle() {
  const selectors = [
    'button.kXFbYD.cNNljL',
    'button.sc-d72450af-1.sc-581ceff0-3',
    'button',  // 全てのボタンを検索
  ];

  console.log('Searching for generate button...');
  const generateButton = await findButton(selectors);

  if (generateButton) {
    console.log(`Button found: ${generateButton.outerHTML}`);
    if (generateButton.disabled) {
      console.warn('Generate button is disabled');
      return { success: false, error: '生成ボタンが無効になっています' };
    }
    generateButton.click();
    console.log('Generate button clicked');
    return { success: true };
  } else {
    console.error('Generate button not found');
    return { success: false, error: '生成ボタンが見つかりません' };
  }
}

async function generateMultiple(count) {
  try {
    for (let i = 0; i < count; i++) {
      await generateSingle();
      if (i < count - 1) {
        const delay = Math.floor(Math.random() * (6000 - 2000 + 1)) + 12000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error in generateMultiple:', error);
    return { success: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "injectPrompt") {
    console.log('Received injectPrompt request:', request);
    const result = injectPrompt(request.prompt, request.exclude);
    console.log('Injection result:', result);
    sendResponse(result);
  } else if (request.action === "fetchPrompt") {
    const result = fetchPrompt();
    sendResponse(result);
  } else if (request.action === "clearPrompts") {
    const promptField = getPromptField();
    const excludeField = getExcludeField();
    
    if (promptField) {
      promptField.value = null;
      promptField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (excludeField) {
      excludeField.value = null;
      excludeField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    sendResponse({success: true});
  } else if (request.action === "generateSingle") {
    console.log('Received generateSingle request');
    generateSingle().then(result => {
      console.log('Generation result:', result);
      sendResponse(result);
    });
  } else   if (request.action === "generateMultiple") {
    console.log('Received generateMultiple request');
    generateMultiple(request.count).then(result => {
      console.log('Generation result:', result);
      sendResponse(result);
    }).catch(error => {
      console.error('Error in generateMultiple:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // 非同期レスポンスを示す
  }

  return true;  // 非同期レスポンスのために必要
});

console.log('NovelAI Prompt Manager content script loaded');