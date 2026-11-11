# Type Dutch · 每天敲一点荷兰语

面向中文使用者的荷兰语学习网站。基于 [zyronon/TypeWords](https://github.com/zyronon/TypeWords) 改编，保留其打字练习、错词记录与间隔复习机制。

## 面向 B1 目标的学习内容

- 中文界面，2,160 条原创荷兰语词汇与搭配，72 个主题，每主题 30 条；保留全部原有内容与稳定词条 ID。
- 每词含中文释义、荷兰语例句和例句中文翻译。名词连同 de / het 一起学习。
- 保留 8 段基础双语对话，新增 12 篇 B1 训练阅读（每篇约 180–220 词）与 36 道阅读题。
- B1 学习中心：16 个语法单元与 48 道选择题、12 个写作任务与范文、12 个口语任务与表达示范。
- 写作草稿、阅读/语法答案和自评记录保存在原有学习数据的 noteData 中，可随备份导出；无需新账号或服务器。
- 保留跟写、听写、默写、自测、错词本与复习。
- 内置内容播放随网站发布的 Fenna 荷兰语音频；自定义文本使用设备提供的 nl-NL / nl-BE 语音。
- 本地保存学习数据，支持原项目的备份导入导出。
- GitHub Pages 自动部署，兼容 /Dutch/ 子目录与刷新后的页面导航。

A1 / A2 / B1 是内容学习路线参考，不是官方考试词表，也不以词数或练习完成数认证语言能力。写作和口语采用自检，不进行自动评分。B1 能力方向参考 [Nederlandse Taalunie 的 ERK 描述](https://erk-nederlands.taalunie.org/erk-niveau/b1/)。原项目文档保存在 [docs/README.upstream.md](docs/README.upstream.md)。

## 本地运行

需要 Node.js 24 与 pnpm 11.25.0。

    pnpm install --frozen-lockfile
    pnpm dev

打开终端显示的本地地址（默认端口 5567）。

## 部署到 KoalaLaw/Dutch

1. 将本项目推送到 [KoalaLaw/Dutch](https://github.com/KoalaLaw/Dutch) 的 main 或 master 分支。
2. 打开仓库 Settings → Pages，将 Build and deployment → Source 设为 GitHub Actions。
3. 打开 Actions → Deploy Type Dutch to GitHub Pages，运行或等待工作流。
4. 部署成功后使用工作流返回的地址。默认预期地址为 https://koalalaw.github.io/Dutch/ （以实际部署结果为准）。

工作流先运行测试、生成静态文件并校验内容，再发布到 Pages。基路径和域名从 Pages 配置读取。私有仓库能否使用 Pages 取决于 GitHub 账号方案。

应用使用哈希路由，例如 /Dutch/#/words；刷新时由同一个 index.html 加载页面，无需服务器重写规则。

## 检查生产构建

PowerShell 示例：

    $env:NUXT_APP_BASE_URL = '/Dutch/'
    pnpm generate
    node scripts/check-static.mjs
    pnpm preview:static

访问 http://127.0.0.1:5570/Dutch/ 。静态文件在 .output/public。

测试：

    pnpm test

自动测试覆盖词库完整性与去重、原有学习 ID 稳定性、双语阅读结构、语法答案、范文字数、自评限制与草稿恢复、荷兰语语音筛选、特殊字符、冠词和重音输入、GitHub Pages 资源前缀。

## 每日学习路线

`/plan` 是每天 20–30 分钟的 36 周、252 天路线：每周 6 个学习日（5 分钟旧词复习、10 个新词、约 8 分钟能力练习），第 7 天做词汇回顾、表达整理和自检。72 个主题各拆成 3 个 10 词小节，216 个词汇学习日完整覆盖 2,160 条内容。基础 9 周、A2 衔接 12 周、B1 应用 15 周，按完成进度继续，不按日历强行跳课。

48 节基础微课先讲基本句型与日常听说，再进入已有 B1 语法、阅读、写作和口语。写作分提纲、初稿和修订；B1 草稿与完成记录沿用原存储，原词典游标、原练习缓存不被日计划改写。每日任务与词条回忆记录保存在原 `noteData` 备份范围中的 `__type_dutch_daily_v1__`；完整词条的 FSRS 复习记录继续共用。

周末和阶段检查属于自评，不是官方 B1 认证。该路线是材料与练习安排，达标还需要真实听说读写。新词汇主题库在 `/vocabulary`，可搜索中文/荷兰语、看词表、选小节或进入原自由练习。

## 更新学习材料

内容来源：

- content/dutch-course.mjs：保留的 180 条基础词汇与 8 段对话。
- content/b1-vocabulary-a.mjs 与 content/b1-vocabulary-b.mjs：900 条进阶词汇与搭配。
- content/b1-readings.mjs：12 篇原创阅读、逐句译文、理解题和表达任务。
- content/b1-skills.mjs：原有 B1 语法、写作与口语内容。
- content/daily-vocabulary-a.mjs、daily-vocabulary-b.mjs：新增 36 个主题、1,080 条词汇与搭配。
- content/daily-skills.mjs：48 节基础与 A2 衔接微课。
- scripts/generate-daily-plan.mjs：36 周的主题顺序、每日词汇切片与能力任务映射。

词条字段依次为 荷兰语|中文释义|荷兰语例句|中文例句。修改后运行：

    pnpm course:generate
    pnpm test

更新荷兰语文本后，还需按 public/audio/nl/ATTRIBUTION.md 中的方法重新生成课程音频；生成器会复用未变更的音频。测试会检查课程文本和可点读单词的音频覆盖，以及所有 MP3 文件是否完整。

请同时提交生成的 app/data 和 public/dicts、public/list、public/audio/nl 文件。原项目的英语资源作为上游文件保留，但荷兰语版的课程列表只加载 nl 资源。

## 发音与数据

内置课程使用 Microsoft Edge 的 `nl-NL-FennaNeural` 生成并随网站发布的荷兰标准语 MP3，优先播放同源音频，不依赖系统语音包或在线 TTS 接口。生成音频使用 scripts/generate-dutch-audio-edge.py；生成时需要联网，学习时直接播放静态文件。音频生成方法和归属见 public/audio/nl/ATTRIBUTION.md；音频索引为 app/data/dutch-audio.json，音源信息为 app/data/dutch-audio-source.json。播放失败会尝试设备的荷兰语语音，仍无法播放时显示可重试的提示。

语音名称与地区依据 [Microsoft 的语音列表](https://learn.microsoft.com/azure/ai-services/speech-service/language-support)。文件解码、非静音和播放检查只验证技术完整性，不等同于逐字发音准确性审核；发现个别词读音有误时，需要核对具体文本与读音。

额外添加的自定义文本使用浏览器提供的荷兰语语音。在「设置 → 音效设置」可试听课程发音，或为自定义内容选择荷兰语系统语音。

学习记录保存在当前浏览器的 IndexedDB 中，GitHub 不会同步个人进度。换设备、换浏览器或清理数据前请导出备份。当前版本不提供在线自动翻译，自定义文章需手动填写译文。全部内置词库支持本地查词；外部查词固定使用荷兰语：Google 翻译明确设置 sl=nl、tl=zh-CN，Woorden.org 提供荷兰语释义，WikiWoordenboek 跳至 Nederlands 部分。外部网站在新窗口打开。

## 许可证与归属

上游：zyronon/TypeWords，GPL-3.0。许可证保留于 LICENSE，上游文档保留于 docs/README.upstream.md。此仓库是独立荷兰语改编版，与上游官方服务无关联。修改内容包括荷兰语课程与首页、浏览器荷兰语语音、Unicode 分词、本地查词和 GitHub Pages 工作流。改编于 2026-11-10，继续按 GPL-3.0 发布。

部署说明依据 [GitHub Pages 官方工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

上游基础版本：[1bcc2a2](https://github.com/zyronon/TypeWords/tree/1bcc2a2c0a169b37bea26b73f5a46a91d803558f)。此仓库以独立初始提交导入改编源码。
