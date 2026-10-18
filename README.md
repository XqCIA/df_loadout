# 三角洲配装 Skill

按地图、难度和整套预算生成猛攻、鼠鼠、花来修脚、以小博大、航天堵桥五个板块。v0.2.0 沿用经过女娲在线复测的 V16 规则，同步 V18 动态价格逻辑；在本地执行，无需女娲账号、远程数据库或单独的模型 API Key。

## 使用

需要 Node.js 22 或更新版本。项目没有 npm 依赖，无需 `npm install`。

### Codex

用 Codex 打开整个仓库。技能位于 `.agents/skills/delta-loadout`，可直接输入：

> 使用 $delta-loadout，长弓溪谷机密，整套40万，不用特殊物品，接受破损防具。

也可以把这个技能目录完整复制到个人技能目录。Codex 官方当前列出的用户目录是 `~/.agents/skills`；若客户端未立即识别，重启后再选技能。

### WorkBuddy

下载 `delta-loadout-skill.zip`，通过“技能 → 添加技能 → 上传技能”导入。ZIP 根目录即 `SKILL.md`，不需要另套一层目录。运行环境需要可调用 Node.js 22+ 和本地文件；聊天由 WorkBuddy 自身模型完成。

此包依据 WorkBuddy 的本地技能导入接口准备，尚未在本机 WorkBuddy 客户端完成导入验证，也未提交其开放平台技能市场。

### 直接运行

在仓库根目录执行：

```sh
node .agents/skills/delta-loadout/scripts/loadout.mjs generate --request examples/request.json --out outputs/demo
```

打开 `outputs/demo/report.html`。完整结构化结果在 `result.json`，价格来源和时间在 `prices.json`。以上是确定性规则方案，不调用外部模型。

默认通过公开接口 `https://moligod.com/api/armory/prices` 获取来源最新报价，重算枪械全部配件、装备、弹药和补给。请求最多等待15秒；接口异常、数据超过30分钟或覆盖不足时，整套回退到2026-10-13快照并标注原因。使用最新报价时，缺价物品和改装方案不参与选择，避免混用新旧价格。这是第三方来源报价，并非游戏内逐笔实时成交价。

完全离线核算时，在命令末尾加 `--prices snapshot`。此时不会请求价格接口；HTML中的远程图片仍需联网加载。

需要宿主模型选装时，先运行 `prepare` 生成候选与提案模板，再让模型编辑 `proposal.json`，最后用 `generate --proposal` 回填真实价格并校验。两次执行都会取价；价格变动可能使原提案超预算，脚本会重新校验并明确回退到合规备选或报告无可行方案。需要离线复现时，两次均加 `--prices snapshot`。输入输出格式见技能入口。

## 范围

- 五个板块各自受同一预算上限约束，不是五套总价相加。
- 总价包含枪械及配件、头甲、胸挂背包、弹药和补给；入场价值另算。
- 机密猛攻150万起至少五级弹；机密金修与增益针按预算选配；绝密保留金血包。
- 花来为修脚路线；以小博大头甲合计不超过预算20%且20万封顶；堵桥只在航天基地适用。
- HTML 无需网站服务器，正文与完整配件离线可读；远程图片需要联网，不可用时仍保留名称和价格。
- 物品目录与改枪方案基于2026-10-13快照；动态取价不会自动增加新物品或更新改枪方案。地图门槛是用户提供的S6参考。候选搜索有剪枝，不宣称数学上的最优方案。

## 维护和验证

```sh
node --test tests/*.test.mjs
python scripts/package_skill.py
```

`tests/fixtures/online-v16.json` 保留六组线上结果，测试重放其26套适用方案，并检查错误ID、预算、弹药与医疗等约束。动态价格测试检查逐项核价、报价缺失、过期和离线回退。`dist/` 是生成物，不纳入源码。

数据、引擎、宿主选装与报告分别放在技能目录的 `data/`、`scripts/lib/`、`references/` 中。历史女娲导出、平台账号信息和调试日志不属于本仓库。更新快照时应同时更新来源日期、图片索引与测试，不能只改展示日期。

## 上传 GitHub

1. 解压 `delta-loadout-github.zip`，得到完整的 `delta-loadout-skill` 文件夹。
2. 在 GitHub 创建空仓库。在解压文件夹里使用 GitHub Desktop 的“添加本地仓库”，创建仓库后发布，或用 Git 推送。必须保留隐藏目录 `.agents`，它包含技能、引擎和数据。
3. 可将 `delta-loadout-skill.zip` 与 `SHA256SUMS` 作为 GitHub Release 附件，供其他用户直接下载导入。

源码包包含 README、示例、完整技能、规则、数据、测试和打包脚本；技能包根目录直接包含 `SKILL.md`。打包脚本只收录明确列出的源码目录，不包含输出报告、聊天记录、女娲导出、账号配置或本地 Git 历史。

## 许可证与数据

这是可运行的本地发布候选，尚未推送 GitHub，尚未选定开源许可证。公开发布前由作者确定仓库归属、许可证及数据分发范围，参见 [数据来源说明](DATA-NOTICE.txt)。不要把整个原始研究目录直接上传。

接入依据：[Codex 技能文档](https://learn.chatgpt.com/docs/build-skills)、[WorkBuddy 本地技能导入](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)。
