# OfferMate 研究与设计记录

## 研究结论

本项目没有把第三方产品的分数当成行业标准。Jobscan 和 Rezi 都把分数定位成求职者的优化反馈；Greenhouse Talent Matching 则公开采用可校准的多信号匹配，并把精确/相似命中和证据展示给招聘方。因此 OfferMate 的分数是“本项目的可解释证据分”，不是 ATS 通过率、面试概率或雇主系统分数。

技能标准化参考了 [ESCO classification](https://esco.ec.europa.eu/en/classification)、[ESCO Web Service API](https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api) 和 [O*NET Content Model](https://www.onetcenter.org/content.html) 的思路：先把别名归并到 canonical skill，再做一次计分，避免 SQL/MySQL 或 Excel/VLOOKUP 重复计分。

信息检索研究（[TF-IDF](https://nlp.stanford.edu/IR-book/html/htmledition/tf-idf-weighting-1.html)、[BM25](https://nlp.stanford.edu/IR-book/html/htmledition/okapi-bm25-a-non-binary-model-1.html)、[Sentence-BERT](https://aclanthology.org/D19-1410/)）说明关键词覆盖、语义相似和证据强度是不同信号。本版本保持无外部向量服务的确定性本地规则：硬技能证据、软技能经历、语言、项目证据、地点与兴趣分别计分；未来可把 embedding/cross-encoder 作为候选召回或相似度辅助，不能替代硬性要求判断。

解析与安全设计参考了 [SkillSpan](https://aclanthology.org/2022.naacl-main.366/)、[NLP4HR survey](https://aclanthology.org/2024.nlp4hr-1.1/)、[NIST GenAI risk](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=958388)、[OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 和 [OpenAI structured outputs guidance](https://developers.openai.com/api/docs/guides/structured-outputs#handling-user-generated-input)：模型输出必须回到简历原文校验；无法定位的技能、经历、数字和成果会被丢弃；简历文本按不可信数据处理。

隐私边界参考 [GDPR principles](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/principles-gdpr/overview-principles/what-data-can-we-process-and-under-which-conditions_en)、[OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) 和 [Cloudflare D1 security](https://developers.cloudflare.com/d1/reference/data-security/)：生产环境必须提供强加密密钥；模型 Responses 请求设置 `store:false`；用户可以删除自己的简历及其匹配历史；日志和界面不主动铺开完整简历。

## 当前评分策略

基础维度仍保持产品中的 100 分结构：硬技能 50、软技能 15、语言 5、经历证据 10、地点 10、兴趣 10。硬技能分项先按 JD 要求等级和简历证据来源计算，再按唯一 canonical skill 汇总。经历证据只有出现在项目/经历中的能力才贡献高分，技能列表单独出现会被降权。

JD 硬技能要求额外带有 `required`、`preferred` 或 `unclear` 优先级。缺失必备证据不会被表述为“候选人不会”，而是“简历中未找到证据”；必备覆盖不足时总分有上限（覆盖率低于 50% 上限 59；存在缺失必备项上限 74；部分覆盖上限 84）。结果页同时展示 requirement ledger、JD 片段、简历证据、状态和封顶原因。

简历建议只重排原始经历文本。没有可定位事实时，系统给出“补充真实经历”的提示，禁止新增工具、数字、学历、成果或职责。

## 已知局限与下一步

- 当前技能词典是轻量本地词典，不等同于完整 ESCO/O*NET ontology；跨语言实体链接和任职年限抽取仍需独立模块。
- `required/preferred` 依赖 JD 句法触发词；含糊 JD 会标为 `unclear`，需要用户人工确认。
- 评分尚未使用岗位级校准数据，不能用于自动淘汰候选人。
- OCR 与结构化画像仍是可选外部服务；没有密钥时使用 PDF 文本和本地规则。
- 下一步可加入用户确认/修正技能、岗位版本比较、年限与学历条件结构化、结果下载以及包含校准样本的离线评测集。
