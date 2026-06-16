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

演示账号：

```text
求职者：davide@example.com / davide123
HR：hr@davide.tech / hr123
```

初始化或更新 D1 表结构：

```bash
npx wrangler d1 execute offermate_visits --file=db/schema.sql
```

## Test

```bash
npm test
```
