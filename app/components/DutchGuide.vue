<script setup lang="ts">
import { usePlayWordAudio } from '@/core/hooks/sound'
const speak = usePlayWordAudio()
useSeoMeta({ title: 'Type Dutch · 学习指南' })
const notes = [
  { title: '把冠词和名词当成一个词学', example: 'de fiets · het huis · de kinderen', text: '词库中的名词保留 de / het，输入时也要打出冠词和空格。复数名词使用 de；单数指小词使用 het，例如 het huisje。不要只记中文意思。' },
  { title: '动词常常在第二个句子成分', example: 'Ik leer Nederlands. Vandaag leer ik Nederlands.', text: '普通陈述句中，限定动词通常放在第二个句子成分。时间放到句首时，主语跟在动词后面。' },
  { title: 'half negen 是八点半', example: 'Het is half negen.', text: '荷兰语的 half 指向下一个整点。half negen = 08:30，half tien = 09:30。' },
  { title: '注意长短元音', example: 'de man · de maan', text: '元音长度可能改变词义。man 是男人，maan 是月亮。先试听，再模仿，最后输入。' },
  { title: '特殊字母也是单词的一部分', example: 'één · tweeën · ideeën · café', text: 'é、ë 等符号需要保留。输入时可使用系统国际键盘或字符输入功能；één 的重音用于强调数量“一”，不等于普通不定冠词 een 的读音。' },
  { title: '分开动词，要连起来理解', example: 'aankomen → We komen om negen uur aan.', text: '一些动词的前缀在句子里会分开。记单词时一起记，读例句时留意句尾，例如 aankomen（到达）和 overstappen（换乘）。' },
]
</script>
<template>
  <main class="guide"><NuxtLink to="/" class="back">← 回到学习首页</NuxtLink><div class="kicker">EEN GOED BEGIN</div><h1>带着 B1 目标，安排你的练习。</h1><p class="lead">词汇是起点，目标是在真实场景中理解信息、说明理由、叙述经历并写连贯短文。</p><section><h2>使用新的 B1 学习中心</h2><p>首页现有 36 组主题词库、1,080 条词汇与搭配。A2→B1 进阶页包含 900 条新内容；基础复习页保留原来的 180 词和学习进度。B1 学习中心另有 16 个语法单元、12 篇长阅读、12 个写作任务及 12 个口语任务。</p><p>先读荷兰语、做阅读题，再查看中文。写作先完成自己的 100–150 词草稿，再对照范文；口语先准备 30 秒，再表达 90 秒。选择题有答案反馈，写作与口语使用自检清单，不进行自动能力评定。</p><NuxtLink class="action" to="/b1">打开 B1 学习路线 →</NuxtLink></section>
    <section><h2>每天 10 个词，四步练习</h2><ol><li><strong>选择主题。</strong>在首页选择一组词库，然后在单词页开始学习。每天默认学习 10 个新词。</li><li><strong>先听再跟写。</strong>点击喇叭听荷兰语发音，输入词语；完整输入后按空格继续。名词连同冠词一起输入。</li><li><strong>尝试听写与默写。</strong>在单词页选择听写或默写模式。忘记时用提示，再尝试一次。</li><li><strong>回来复习。</strong>错词会自动记录；学习后的复习计划由原项目的间隔复习机制安排。也可以练习生活对话。</li></ol><NuxtLink class="action" to="/words">前往单词练习 →</NuxtLink></section>
    <section><h2>点击就能听荷兰语</h2><p>内置词汇、例句和 B1 课程使用随网站提供的荷兰标准语音频，无需安装语音包。点击喇叭即可播放，也可到「设置 → 音效设置」调整音量和语速。</p><p>自己添加的文本会使用设备提供的 nl-NL 或 nl-BE 荷兰语语音。点击查词时，课程词库优先显示中文释义；外部入口固定使用荷兰语，可查看中文翻译或荷兰语释义。</p><button class="action" @click="speak('Hallo! Ik leer Nederlands. Hoe gaat het met je?')">试听荷兰语 ↗</button> <NuxtLink class="action secondary" to="/setting?index=4">打开语音设置 →</NuxtLink></section>
    <section><h2>六个值得记住的小习惯</h2><article v-for="(note,index) in notes" :key="note.title"><span class="number">0{{ index + 1 }}</span><div><h3>{{ note.title }}</h3><button class="example" lang="nl" @click="speak(note.example)" :aria-label="'试听：' + note.example">{{ note.example }} <span>♪</span></button><p>{{ note.text }}</p></div></article></section>
    <section><h2>保存、备份和添加内容</h2><p>词库选择、练习进度和错词保存在当前浏览器中。GitHub 保存网站源码，不会自动同步个人学习进度。换设备、换浏览器或清理浏览器数据前，请到「设置」导出备份，在新设备上导入。</p><p>你可以在词典和文章列表中添加自己的学习内容。内置释义、例句与训练任务来自本项目原创的学习材料；词条级别用于学习路线参考，并非官方考试词表。自定义文章请同时填写中文译文，当前版本不提供在线自动翻译。</p><NuxtLink class="action" to="/setting">打开设置与备份 →</NuxtLink></section>
    <footer>Type Dutch 是 <a href="https://github.com/zyronon/TypeWords" target="_blank" rel="noopener noreferrer">TypeWords</a> 的荷兰语改编版，按 GPL-3.0 开源。<a href="https://github.com/KoalaLaw/Dutch" target="_blank" rel="noopener noreferrer">查看源码 ↗</a></footer>
  </main>
</template>
<style scoped>
.guide{box-sizing:border-box;max-width:850px;margin:auto;padding:40px 35px 70px;color:var(--color-main-text);line-height:1.9;overflow:auto;height:100%;font-family:"Segoe UI","Microsoft YaHei",sans-serif}.back{color:#89937e;font-size:12px}.kicker{font-size:10px;letter-spacing:3px;color:#95a184;margin-top:35px}h1{font-size:34px;font-weight:600;letter-spacing:-1px;margin:12px 0}.lead{color:#8c967f;font-size:14px}section{border-top:1px solid #a4ac912d;margin-top:30px;padding-top:20px}h2{font-size:20px;font-weight:600}h3{font-size:15px;margin:0 0 7px}p,li{font-size:13px;color:#849078}li{margin:12px 0}ol{padding-left:20px}.action{display:inline-block;background:#dc653b;border:0;color:white;padding:9px 16px;border-radius:6px;text-decoration:none;font-size:12px;cursor:pointer}.secondary{background:#8a9d78}article{display:flex;gap:20px;margin:26px 0}.number{font-family:Georgia,serif;color:#ca8c65;font-size:22px}.example{background:transparent;border:0;border-bottom:1px dashed #c1c9af;text-align:left;font:italic 16px Georgia,serif;padding:3px 0 8px;color:#80916e;cursor:pointer}.example span{padding-left:12px}.guide footer{border-top:1px solid #a4ac912d;padding-top:22px;margin-top:30px;font-size:11px;color:#929c85}.guide footer a{color:#b77855;margin-left:5px}@media(max-width:600px){.guide{padding:25px 20px 50px}h1{font-size:27px}.action{margin-bottom:8px}}
</style>
