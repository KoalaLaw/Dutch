import { readFile, writeFile } from 'node:fs/promises'
const json = async file => JSON.parse(await readFile(new URL('../' + file, import.meta.url), 'utf8'))
const curriculum = await json('app/data/dutch-curriculum.json')
const micro = await json('app/data/daily-skills.json')
const skills = await json('app/data/b1-skills.json')
const readings = await json('app/data/b1-readings.json')
const dialogues = await json('public/dicts/nl/article/nl-dialogues.json')
const pairs = [
 ['foundation','初次见面与自我介绍','nl-basics','nl-a1-profile'],
 ['foundation','一天的生活与家人','nl-a1-routines','nl-home'],
 ['foundation','从房间走进厨房','nl-a1-rooms','nl-a1-kitchen'],
 ['foundation','吃什么，买什么','nl-food','nl-a1-produce'],
 ['foundation','在超市与衣柜前','nl-a1-supermarket','nl-a1-clothing'],
 ['foundation','时间、月份与季节','nl-time','nl-a1-calendar'],
 ['foundation','照顾自己，说明位置','nl-a1-care','nl-a1-directions'],
 ['foundation','出门与认识周围','nl-travel','nl-a1-nature'],
 ['foundation','学校与在荷兰的生活','nl-a1-school','nl-life'],
 ['bridge','说清动作，继续学习','nl-b1-verbs','nl-a2-classroom'],
 ['bridge','描述变化与兴趣','nl-b1-describing','nl-a2-hobbies'],
 ['bridge','饮食习惯与运动','nl-b1-habits','nl-a2-sports'],
 ['bridge','点餐与招待朋友','nl-a2-dining','nl-a2-hosting'],
 ['bridge','手机沟通与邮寄','nl-a2-phone','nl-a2-post'],
 ['bridge','城市设施与找路','nl-a2-facilities','nl-a2-geography'],
 ['bridge','搭车和短途出游','nl-a2-transit','nl-a2-outings'],
 ['bridge','住宿和预约安排','nl-a2-hotel','nl-a2-appointments'],
 ['bridge','药房沟通与安全表达','nl-a2-pharmacy','nl-a2-safety'],
 ['bridge','租房与维修细节','nl-b1-maintenance','nl-a2-renting'],
 ['bridge','邀请与庆祝','nl-a2-social','nl-a2-celebrations'],
 ['bridge','账单与处理小意外','nl-a2-payments','nl-a2-lost'],
 ['b1','住房与合住协商','nl-b1-housing','nl-b1-housemates'],
 ['b1','求职与职场沟通','nl-b1-employment','nl-b1-workplace'],
 ['b1','项目计划与交付','nl-b1-projects','nl-b1-logistics'],
 ['b1','学习、成长与融入','nl-b1-education','nl-b1-integration'],
 ['b1','身体感受与情绪','nl-b1-health','nl-b1-feelings'],
 ['b1','社区参与与办事','nl-b1-community','nl-b1-administration'],
 ['b1','预算与消费选择','nl-b1-finance','nl-b1-consumer'],
 ['b1','线上工具与信息判断','nl-b1-digital','nl-b1-media'],
 ['b1','环境与自然景观','nl-b1-environment','nl-b1-landscape'],
 ['b1','交通与旅行安排','nl-b1-traffic','nl-b1-accommodation'],
 ['b1','文化生活与规则','nl-b1-culture','nl-b1-rights'],
 ['b1','观点、理由与连接','nl-b1-opinions','nl-b1-connectors'],
 ['b1','把经历讲得连贯','nl-b1-narrative','nl-b1-adverbs'],
 ['b1','动词在真实句子里','nl-b1-separable','nl-b1-reflexive'],
 ['b1','综合应用与 B1 自检','nl-b1-prepositions','nl-b1-services'],
]
const phases = [
 { id:'foundation', label:'01 · 打好基础', level:'A1–A2', firstWeek:1,lastWeek:9,firstDay:1,lastDay:63,
   goal:'能介绍自己、说明时间与地点，处理购物、点餐和简单问答。',
   criteria:['不看范文介绍自己、家人和一天安排。','能听懂简短问候、价格、时间与方向。','用完整短句提问，并使用常见冠词和动词。','写出 5 句有关自己生活的荷兰语。'] },
 { id:'bridge',label:'02 · 连起句子',level:'A2→B1',firstWeek:10,lastWeek:21,firstDay:64,lastDay:147,
   goal:'能叙述过去、说明计划和理由，完成日常电话、预约与短消息。',
   criteria:['用过去时或完成时讲述昨天发生的事。','能在预约、租房或购物情境中说明需要。','听完短对话后说出人物、时间与主要信息。','能写 60–80 词、有开头和结尾的生活消息。'] },
 { id:'b1',label:'03 · 走向 B1 应用',level:'B1',firstWeek:22,lastWeek:36,firstDay:148,lastDay:252,
   goal:'理解主要信息，连贯讲述经历、给出理由，并写清真实情境中的事情。',
   criteria:['读完约 180–220 词的材料，说明主旨和两个细节。','不看范文连续说约 90 秒，给出理由和例子。','独立写出 100–150 词、意思连贯的邮件或短文。','在真实交流中能追问、澄清和回应不同意见。'] },
]
const byId = new Map(curriculum.map(pack => [pack.id,pack]))
const allWords = await json('public/dicts/nl/word/all.json')
const weeks = [], days = []
const writingOrder = [1,0,6,8,2,10,3,9,7,5,4,11,6,9,11]
const speakingOrder = [4,3,10,8,5,6,1,11,2,7,9,0,8,10,11]
for (const [index, [stage,title,...packIds]] of pairs.entries()) {
  for (const id of packIds) if (!byId.has(id)) throw Error('Missing weekly topic '+id)
  const phase = phases.find(item => item.id === stage)
  const phaseWeek = index + 1 - phase.firstWeek
  const units = micro.filter(item=>item.stage===stage)
  const week = { number:index+1,stage,title,packIds,dayIds:[],checkpoint:[9,21,36].includes(index+1),criteria:phase.criteria }
  for (let weekday=1;weekday<=7;weekday++) {
    const review=weekday===7
    const packId=review ? '' : packIds[weekday<=3 ? 0 : 1]
    const offset=review ? 0 : ((weekday-1)%3)*10
    let skill
    if (stage==='b1') {
      const writing=skills.writingTasks[writingOrder[phaseWeek]], speaking=skills.speakingTasks[speakingOrder[phaseWeek]]
      const grammar=skills.grammarUnits[Math.min(phaseWeek,15)]
      skill = weekday===1 ? {kind:'grammar',id:grammar.id}
        : weekday===2 ? {kind:'reading',id:readings[phaseWeek%readings.length].id}
        : weekday===3 ? {kind:'writing',id:writing.id,step:'outline'}
        : weekday===4 ? {kind:'speaking',id:speaking.id,step:'prepare'}
        : weekday===5 ? {kind:'writing',id:writing.id,step:'draft'}
        : weekday===6 && phaseWeek===14 ? {kind:'grammar',id:skills.grammarUnits[15].id}
        : weekday===6 ? {kind:'speaking',id:speaking.id,step:'speak'}
        : {kind:'writing',id:writing.id,step:'revise'}
    } else if (weekday<=4) skill={kind:'micro',id:units[(phaseWeek*4+weekday-1)%units.length].id}
    else if (weekday===5 && stage==='bridge' && phaseWeek>=6) skill={kind:'grammar',id:skills.grammarUnits[phaseWeek-6].id}
    else if (weekday===5) skill={kind:'dialogue',id:dialogues[phaseWeek%dialogues.length].id}
    else {
      const speaking=units.filter(item=>item.kind==='speaking')
      skill={kind:'micro',id:speaking[phaseWeek%speaking.length].id}
    }
    const resource = [...micro,...skills.grammarUnits,...skills.writingTasks,...skills.speakingTasks,...readings,...dialogues].find(item=>item.id===skill.id)
    const skillLabels={micro:'短练习',grammar:'语法',reading:'阅读',dialogue:'听说对话',writing:'写作',speaking:'口语'}
    const stepLabels={outline:'列提纲',draft:'写初稿',revise:'修改定稿',prepare:'准备要点',speak:'开口练习'}
    skill.title=`${skillLabels[skill.kind]} · ${resource?.titleTranslate||resource?.title||skill.id}${skill.step?' · '+stepLabels[skill.step]:''}`
    const wordIds=allWords.filter(word=>word.id.startsWith(packId+'-')).slice(offset,offset+10).map(word=>word.id)
    const number=days.length+1, id='d'+String(number).padStart(3,'0')
    const day={id,number,week:index+1,weekday,stage,review,packId,offset,wordIds,
      title:review ? '本周复习与能力自检' : `${byId.get(packId).title} · 第${offset/10+1}小节`,
      minutes:review ? 25 : 23,skill}
    if (!review && wordIds.length!==10) throw Error('Incomplete daily words '+id)
    days.push(day);week.dayIds.push(id)
  }
  weeks.push(week)
}
const planned = days.flatMap(day=>day.wordIds)
if (days.length!==252 || planned.length!==2160 || new Set(planned).size!==2160 || new Set(pairs.flatMap(row=>row.slice(2))).size!==72) throw Error('The daily route does not cover every topic exactly once')
for(const phase of phases) { phase.packCount=curriculum.filter(pack=>pack.stage===phase.id).length;phase.wordCount=phase.packCount*30 }
const plan={version:1,minutes:'20–30',days,weeks,phases,dayCount:days.length,weekCount:weeks.length,wordCount:planned.length,packCount:curriculum.length}
await writeFile(new URL('../app/data/daily-plan.json',import.meta.url),JSON.stringify(plan,null,2)+'\n')
console.log('Generated 36 weeks / 252 days, 216 daily word lessons and 36 weekly reviews.')
