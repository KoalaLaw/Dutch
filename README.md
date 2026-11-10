# Type Dutch · 每天敲一点荷兰语

面向中文使用者的荷兰语学习网站。基于 [zyronon/TypeWords](https://github.com/zyronon/TypeWords) 改编，保留其打字练习、错词记录与间隔复习机制。

## 第一版内容

- 中文界面，180 个原创荷兰语主题词条，分为 6 组，每组 30 个。
- 每词含中文释义、荷兰语例句和例句中文翻译。名词连同 de / het 一起学习。
- 8 段原创双语生活对话，涵盖介绍、点餐、出行、预约与工作。
- 保留跟写、听写、默写、自测、错词本与复习。
- 使用设备提供的 nl-NL / nl-BE 语音；不会回退到英语发音。没有荷兰语语音时会提示。
- 本地保存学习数据，支持原项目的备份导入导出。
- GitHub Pages 自动部署，兼容 /Dutch/ 子目录与刷新后的页面导航。

A1 / A2 是入门学习路线参考，并非官方考试分级或完整考试词表。内容见 [content/dutch-course.mjs](content/dutch-course.mjs)。原项目文档保存在 [docs/README.upstream.md](docs/README.upstream.md)。

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

测试覆盖完整词库与双语对话、荷兰语语音筛选、特殊字符分词、冠词和重音输入、GitHub Pages 资源前缀。

## 更新学习材料

编辑 content/dutch-course.mjs，每个词条依次包含 荷兰语|中文释义|荷兰语例句|中文例句。然后运行：

    pnpm course:generate
    pnpm test

请同时提交生成的 app/data 和 public/dicts、public/list 文件。原项目的英语资源作为上游文件保留，但荷兰语版的课程列表只加载 nl 资源。

## 发音与数据

浏览器的可用语音随设备变化。在「设置 → 音效设置」选择并试听荷兰语语音；列表为空时可添加系统荷兰语语音包或尝试 Edge。语音提供方可能需要联网。

学习记录保存在当前浏览器的 IndexedDB 中，GitHub 不会同步个人进度。换设备、换浏览器或清理数据前请导出备份。当前版本不提供在线自动翻译，自定义文章需手动填写译文。基础词库支持本地查词，词库外的内容需手动添加。

## 许可证与归属

上游：zyronon/TypeWords，GPL-3.0。许可证保留于 LICENSE，上游文档保留于 docs/README.upstream.md。此仓库是独立荷兰语改编版，与上游官方服务无关联。修改内容包括荷兰语课程与首页、浏览器荷兰语语音、Unicode 分词、本地查词和 GitHub Pages 工作流。改编于 2026-11-10，继续按 GPL-3.0 发布。

部署说明依据 [GitHub Pages 官方工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

上游基础版本：[1bcc2a2](https://github.com/zyronon/TypeWords/tree/1bcc2a2c0a169b37bea26b73f5a46a91d803558f)。此仓库以独立初始提交导入改编源码。
