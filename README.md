# OfferMate 求职匹配 Demo

OfferMate 是一个面向学生求职场景的求职匹配 Demo。它展示真实学生简历、同一公司多岗位匹配、登录分权、PDF 简历解析、历史记录、HR 候选人查看，以及可解释评分与简历优化建议。

## Run Locally

后端接口依赖 Cloudflare Pages Functions 和 D1，本地预览请使用 Wrangler：

```bash
npx wrangler pages dev . --port 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

初始化或更新 D1 表结构：

```bash
npx wrangler d1 execute offermate_visits --file=db/schema.sql
```

生产环境建议设置独立加密密钥，避免使用本地开发默认值：

```bash
npx wrangler secret put OFFERMATE_ENCRYPTION_KEY
```

可选：启用 DeepSeek 简历结构化解析。不要把 API key 写进代码或提交到仓库，使用 Cloudflare secret：

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

可选：启用 OpenAI PDF OCR。当 PDF 文本提取为空、疑似乱码，或整份简历被挤成一长段时，会自动调用 OCR/视觉模型重新抽取简历文本：

```bash
npx wrangler secret put OPENAI_API_KEY
```

如需单独给 OCR 使用另一把 key，也可以设置 `OCR_OPENAI_API_KEY`；模型默认 `gpt-4o-mini`，可通过 `OPENAI_OCR_MODEL` 覆盖。默认是自动判断是否需要 OCR；演示时如果想让所有 PDF 都走 OCR，可以设置 `OCR_MODE=always`。

## Test

```bash
npm test
```
