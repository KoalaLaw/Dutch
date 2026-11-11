# 荷兰语词条语法 · 2026-11-11

课程全部 2,160 条词汇与搭配均有词性；461 个动词词条/搭配对应 394 个原形。展示位置包括每日学习、自由练习及本地查词弹窗，主题词表显示词性标签。

## 内容与数据

- 词性按课程当前中文释义与例句标注。允许名词、动词、形容词、副词、代词、介词、连词、数词及不同短语/固定表达；不宣称一个词在所有语境中只有这一词性。
- 名词沿用原词条的 de / het；显式区分复数、时间名词的省冠词用法，以及常见物质/抽象意义。不机械地给每个名词加 een。冠词规则说明为自行撰写的中文讲解。
- 动词采用固定主要变位数据，不在运行时按词尾猜测强变化。主要变位含现在单数三种人称、过去单/复数及过去分词。复数现在时使用原形。
- 七组主语：ik；jij/je；u；hij/zij/het；wij/we；jullie；zij/ze（复数）。
- 六组表达：现在时 OTT、过去时 OVT、现在完成时 VTT、过去完成时 VVT、zullen 将来表达、zou/zouden 假设或委婉表达。后两者的标签不声称荷兰语只有一种将来表达或把 zou 全部归为过去叙事。
- 可分前缀是显式词表；不把 overleggen（商量）和 voorkomen（防止）按前缀误拆。短语将宾语/副词、反身代词、前缀与介词补语分别存储并按时态排列。
- 动词元数据保存可用的 hebben / zijn。含义可变时展示选择与说明；明确带宾语的“恢复文件”“改变习惯”等搭配限制为 hebben。非人称义项用破折号显示不适用人称，并说明原因。
- 主表采用一种常用形式，提示 u hebt/heeft、jij kunt/kan、jij wilt/wil、wilde/wou、houd/hou 等变体。情态动词说明双不定式现象。

维护文件：

- `content/dutch-grammar.mjs`：词性、名词使用类型、动词短语语序模板和可分前缀。
- `content/dutch-verbs.json`：已选取/修订的主要变位及助动词。
- `scripts/generate-dutch.mjs`：生成完整词库的 `trans.pos` 与统一语法索引。
- `app/core/utils/dutch-grammar.ts`：只读查找、各人称/时态形式与自行撰写的中文使用说明。
- `app/components/word/DutchGrammarPanel.vue`：共用词条语法面板。

运行 `pnpm course:generate`、`pnpm test` 并进行静态构建与浏览器验证。检查源数据时不要直接用未经核对的通用词形数据覆盖修订版本，例如工作应为 werkte/gewerkt，洗漱义的 wassen 应为 waste/wasten/gewassen。

## 进度与发布

不改变已有词条 ID、word、中文释义、例句、音频索引、学习路线或存储键。统一语法索引也可用于已保存的旧词条，避免为了补字段而覆盖学习者数据。回想/听写遮词期间不显示包含原词的语法详情；主动显示提示仍沿用原有“看过提示”记录。

此升级只需发布 GitHub Pages 静态站点；后端账号数据库与服务器配置没有对应迁移。语法索引与页面代码都是公开学习材料，不加入任何账号、邀请码或服务器秘密配置。

## 来源与边界

主要变位选自 Pattern Dutch lexicon，并经过选择、修订与补充。版权 University of Antwerp / CLiPS，BSD-3-Clause 全文及固定版本记录在 `content/grammar/`。没有加入 UniMorph 原始数据或运行时外部依赖。

规则与具体用法核对参考：

- [Taaladvies：jij 的 kunt/kan、wilt/wil 与倒装](https://taaladvies.net/je-wil-zal-kan-of-je-wilt-zult-kunt/)
- [Onze Taal：de / het 的一般规则](https://onzetaal.nl/taalloket/de-het-algemene-regels)
- [VU：冠词、特指/泛指及可数性](https://www.sgw.fsg.vu.nl/nls-online/correctheid/naamwoorden_en_voornaamwoorden/lidwoord.php)
- [Onze Taal：借入英语动词的荷兰语变位，如 swipen](https://onzetaal.nl/taalloket/engelse-werkwoorden)
- [Pattern 的荷兰语模块与数据](https://github.com/clips/pattern/tree/af754685cca3713db0abc4f020f2e94467c19d85/pattern/text/nl)

自动测试验证覆盖率、已选代表词形、各人称语序、前缀/反身代词及数据稳定性。它不能代替语言教师对每个义项与例句的完整审校；发现具体用法疑问应核对该词的语境并维护源数据，不能只修生成文件。
