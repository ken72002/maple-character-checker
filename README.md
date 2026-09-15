# 楓之谷角色數值健檢 V6.0｜Cloudflare Pages 後端版

## 你現在要做的事情

這個版本已經把：

- OpenAI API Key
- GPT Vision 模型
- Vision Prompt
- JSON Schema

全部放到後端。

瀏覽器只會把 3 張圖片送到 `/api/vision`，後端再呼叫 OpenAI。

## 1. 上傳到 GitHub

建立一個新的 GitHub repository，例如：

`maple-character-checker`

把本資料夾內的檔案放進 repository 根目錄：

```text
index.html
wrangler.toml
.gitignore
functions/
  api/
    vision.js
```

## 2. Cloudflare Pages

使用 Cloudflare Pages 的 Git integration 連接 GitHub。

設定：

- Production branch：`main`
- Build command：`exit 0`
- Build output directory：`.`

因為這個專案是純 HTML + Pages Functions，不需要 npm build。

## 3. 設定 OPENAI_API_KEY

Cloudflare：

Workers & Pages
→ 選擇你的 Pages 專案
→ Settings
→ Variables and Secrets
→ Add

新增：

```text
Name:
OPENAI_API_KEY

Value:
你的 OpenAI API Key

Type:
Secret / Encrypt
```

Production 和 Preview 如果都有要測試，兩個環境都設定。

## 4. 重新部署

設定 Secret 後重新部署。

完成後：

```text
你的網站
   ↓
/api/vision
   ↓
Cloudflare Pages Function
   ↓
OPENAI_API_KEY
   ↓
OpenAI Responses API
```

前端不會看到 API Key。

## 5. 本地測試

不要直接雙擊 index.html。

如果電腦有 Node.js：

```bash
npx wrangler pages dev .
```

然後使用 Wrangler 顯示的 localhost 網址。

本地 Secret 可放 `.dev.vars`，例如：

```text
OPENAI_API_KEY="你的 API Key"
```

`.dev.vars` 已經被 `.gitignore` 排除，絕對不要 commit。

## 重要

不要把真正的 API Key 寫進：

- index.html
- vision.js
- GitHub
- wrangler.toml
- README.md

只放在 Cloudflare Secret。
