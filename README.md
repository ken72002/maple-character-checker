# Maple Character Checker V6.3

Cloudflare Workers + GPT Vision.

V6.3: 保留自動裁切＋手動裁切；第 2 階段補漏改為針對「未辨識欄位」從處理後面板擷取單列局部圖片，再 4× 放大後送 GPT Vision，避免單純重送完整面板造成同樣的漏讀。
