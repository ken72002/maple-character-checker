# 楓之谷角色數值健檢 V6.2

Cloudflare Workers + Static Assets + GPT Vision。

## V6.2 更新
- STEP 2 保留「自動裁切＋3×放大」。
- 自動裁切後，每張圖片提供「手動調整裁切」與「重新自動裁切」。
- 手動裁切使用可拖曳、可縮放的裁切框，套用後重新輸出 3× 放大圖片。
- GPT Vision 改成兩階段辨識：第一次完整辨識；若有「未辨識」欄位，第二次只針對漏掉的欄位補漏。
- 圖 2 / 圖 3 的重複欄位（最小傷害倍率、最大傷害倍率、經驗值獲得量）會先做交叉補值：其中一張成功、另一張未辨識時，直接使用已成功辨識的同一角色數值。
- API Key 與模型維持在 Cloudflare Worker Secret / backend，前端不暴露 API Key。

## 部署
```bash
npm install
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```
