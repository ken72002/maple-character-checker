# 楓之谷角色數值健檢 V6.0 — Cloudflare Workers

這個版本是 **Cloudflare Workers + Workers Static Assets** 架構。

## 專案結構

```text
maple-character-checker/
├─ public/
│  └─ index.html
├─ src/
│  ├─ index.js
│  └─ vision.js
├─ wrangler.jsonc
├─ package.json
└─ .gitignore
```

## Cloudflare Workers Builds 設定

- Project name: `maple-character-checker`
- Build command: `exit 0`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

## OpenAI API Key

Cloudflare Dashboard → Workers & Pages → `maple-character-checker`
→ Settings → Variables and Secrets

新增：

- Type: Secret
- Variable name: `OPENAI_API_KEY`
- Value: 你的 OpenAI API Key

不要把 API Key 寫進 `public/index.html`、GitHub 或任何前端 JavaScript。

## 模型

模型固定在後端：

`gpt-5.6-luna`

前端不再顯示 API Key 輸入框，也不讓使用者修改模型。

## API

前端呼叫：

`POST /api/vision`

Worker 收到 3 張 data URL 圖片後，從 `OPENAI_API_KEY` Secret 呼叫 OpenAI Responses API。

OpenAI 的原始回應不會回傳給瀏覽器，只回傳解析後的辨識 JSON 與 usage。

## 本機測試

```bash
npm install
npx wrangler dev
```

如果本機測試，需要在專案根目錄建立 `.dev.vars`：

```text
OPENAI_API_KEY="你的 OpenAI API Key"
```

`.dev.vars` 已加入 `.gitignore`，不要提交到 GitHub。
