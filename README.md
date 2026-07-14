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

同一把 `OPENAI_API_KEY` 也会用于 OCR 后的结构化简历画像解析；如果同时配置了 `DEEPSEEK_API_KEY`，系统会优先用 DeepSeek 做结构化解析。OCR 模型默认 `gpt-4o-mini`，可通过 `OPENAI_OCR_MODEL` 覆盖；结构化解析模型可通过 `OPENAI_PROFILE_MODEL` 覆盖。演示时如果想让所有 PDF 都走 OCR，可以设置 `OCR_MODE=always`。

简历上传约束：

- 仅支持 `.pdf` 文件，空白 PDF 会在上传阶段直接拒绝。
- 原始 PDF 仅在 700KB 以内时随简历记录保存用于 HR 下载；更大的 PDF 仍会继续做文本提取与匹配，但不会保留原文件二进制内容。

## Test

```bash
npm test
```
