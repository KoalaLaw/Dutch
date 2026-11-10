// Original Dutch/Chinese learning material, written 2026-11-10 for Type Dutch.
// B1 is a learning-route label, not an official assessment or certification.
// All stories and situations are fictional.
export const b1Readings = [
  {
    id: 'nl-b1-reading-01', title: 'Een nieuwe woning, een nieuwe buurt', titleTranslate: '新家，新街区', topic: '居住与邻里', level: 'B1',
    paragraphs: [
      [
        ['Vorige maand is Lin naar een appartement in een andere wijk verhuisd, omdat haar oude woning te ver van haar werk lag.', '上个月林搬到了另一个街区的一套公寓，因为她原来的住处离工作地点太远。'],
        ['De nieuwe woning is kleiner, maar ze heeft nu een balkon en een rustige plek om te lezen.', '新房子更小，但她现在有一个阳台，也有一个可以安静阅读的地方。'],
        ['Bovendien kan ze in twintig minuten naar kantoor fietsen.', '此外，她骑自行车二十分钟就能到办公室。'],
      ],
      [
        ['Tijdens het eerste weekend nodigde haar buurvrouw haar uit voor een kop koffie in de gezamenlijke tuin.', '第一个周末，女邻居邀请她到公共花园喝杯咖啡。'],
        ['Daar hoorde Lin dat verschillende bewoners op zaterdag samen de planten verzorgen.', '在那里林得知，一些住户会在星期六一起照料植物。'],
        ['Ze besloot mee te helpen, hoewel ze nog niet veel van tuinieren wist.', '虽然她还不太懂园艺，但她决定一起帮忙。'],
      ],
      [
        ['Niet alles ging meteen goed: de buurman boven haar draaide op een avond erg luide muziek.', '并非一切都立即顺利：有天晚上，楼上的男邻居把音乐开得很响。'],
        ['In plaats van een boos bericht te sturen, vertelde ze hem de volgende dag rustig dat ze vroeg moest opstaan.', '她没有发愤怒的消息，而是在第二天平静地告诉他，自己需要早起。'],
        ['Hij begreep het probleem en stelde voor voortaan eerder een koptelefoon te gebruiken.', '他理解了这个问题，并提出以后更早改用耳机。'],
      ],
      [
        ['Na een paar weken voelt Lin zich al meer thuis, omdat ze gezichten en namen begint te herkennen.', '几周后，林已经更有家的感觉，因为她开始认得一些面孔和名字。'],
        ['Volgende maand wil ze zelf een eenvoudige lunch voor haar buren organiseren.', '下个月她想自己为邻居们组织一顿简单的午餐。'],
        ['Volgens haar wordt een buurt prettiger wanneer mensen kleine problemen op tijd bespreken.', '在她看来，大家及时讨论小问题，社区就会变得更加舒适。'],
      ],
    ],
    questions: [
      { stem: 'Waarom is Lin verhuisd?', options: ['Haar oude woning lag ver van haar werk.', 'Ze wilde een grotere tuin voor zichzelf.', 'Haar buurvrouw vroeg haar te verhuizen.', 'Ze wilde niet meer fietsen.'], correctAnswer: ['a'], explanation: '第一段说明旧住处离工作地点太远，因此她搬了家。' },
      { stem: 'Hoe reageerde Lin op de luide muziek?', options: ['Ze belde meteen de politie.', 'Ze stuurde een boos bericht.', 'Ze besprak het probleem de volgende dag rustig.', 'Ze organiseerde dezelfde avond een lunch.'], correctAnswer: ['c'], explanation: '第三段写到，她第二天平静地向邻居说明自己需要早起。' },
      { stem: 'Wat wil Lin volgende maand doen?', options: ['Een andere woning zoeken.', 'Een lunch voor de buren organiseren.', 'De gezamenlijke tuin sluiten.', 'Verder van kantoor gaan wonen.'], correctAnswer: ['b'], explanation: '最后一段明确提到她计划为邻居组织一次简单的午餐。' },
    ],
    writingPrompt: '写一封 100–140 词的邮件邀请邻居参加一次活动。说明活动的时间、地点、安排，并请对方回复。',
    speakingPrompt: '用 90 秒介绍你的居住环境：说出两个优点、一个问题，以及你准备怎样解决这个问题。',
  },
  {
    id: 'nl-b1-reading-02', title: 'Een werkweek met meer evenwicht', titleTranslate: '更平衡的工作周', topic: '居家办公与时间安排', level: 'B1',
    paragraphs: [
      [
        ['Emma werkt sinds een halfjaar twee dagen per week thuis en de andere dagen op kantoor.', '半年来，Emma 每周有两天在家工作，其他工作日在办公室上班。'],
        ['In het begin vond ze thuiswerken ideaal, omdat ze niet hoefde te reizen en later kon ontbijten.', '起初她觉得居家办公非常理想，因为她不用通勤，而且可以晚一点吃早餐。'],
        ['Na een paar weken merkte ze echter dat ze vaak langer doorging dan ze van plan was.', '但几周后，她发现自己经常比原先计划工作得更久。'],
      ],
      [
        ['Haar laptop stond op de keukentafel, waardoor werk en vrije tijd moeilijk te scheiden waren.', '她把笔记本电脑放在厨房的桌上，这让工作和空闲时间难以分开。'],
        ['Zelfs tijdens het avondeten dacht ze aan berichten die ze nog moest beantwoorden.', '即使在吃晚饭时，她也会想着尚未回复的消息。'],
        ['Ook miste ze de korte gesprekken met haar collega’s, die op kantoor vanzelf ontstonden.', '她也想念和同事们的简短交谈，那些交谈在办公室里总是自然发生。'],
      ],
      [
        ['Daarom besprak Emma haar ervaring met haar leidinggevende en maakte ze een duidelijker schema.', '因此，Emma 和主管讨论了自己的经历，并制定了更清晰的时间表。'],
        ['Ze begint nu iedere werkdag op dezelfde tijd, neemt een echte lunchpauze en sluit om vijf uur haar laptop.', '现在她每天在相同的时间开始工作，认真休息吃午饭，并在五点合上电脑。'],
        ['Met haar team heeft ze afgesproken welke vragen dringend zijn en welke tot de volgende dag kunnen wachten.', '她和团队约定了哪些问题紧急，哪些可以等到第二天。'],
      ],
      [
        ['Op thuiswerkdagen kan Emma zich goed concentreren op lange verslagen, terwijl ze teamoverleg liever op kantoor plant.', '在居家办公的日子里，Emma 可以专心写长报告；而团队会议她更愿意安排在办公室进行。'],
        ['Ze vindt de combinatie nu prettiger dan uitsluitend thuis of op kantoor werken.', '现在她觉得混合办公比完全在家或完全在办公室工作更舒适。'],
        ['Volgens haar zijn goede afspraken belangrijker dan de plek waar iemand zit.', '在她看来，良好的约定比一个人坐在哪里更重要。'],
      ],
    ],
    questions: [
      { stem: 'Welk probleem kreeg Emma tijdens het thuiswerken?', options: ['Ze kon haar laptop niet gebruiken.', 'Ze werkte vaak langer dan gepland.', 'Ze moest iedere dag ver reizen.', 'Ze mocht haar collega’s niet spreken.'], correctAnswer: ['b'], explanation: '第一、二段说明她经常延长工作时间，很难区分工作和休息。' },
      { stem: 'Wat heeft Emma met haar team afgesproken?', options: ['Dat iedereen uitsluitend thuiswerkt.', 'Dat er geen lunchpauze meer is.', 'Dat alle vragen direct beantwoord worden.', 'Welke vragen dringend zijn en welke kunnen wachten.'], correctAnswer: ['d'], explanation: '第三段最后一句明确说明团队约定了问题的紧急程度。' },
      { stem: 'Waar plant Emma teamoverleg het liefst?', options: ['Op kantoor.', 'Tijdens het avondeten.', 'In de trein.', 'Altijd aan haar keukentafel.'], correctAnswer: ['a'], explanation: '最后一段说她更愿意把团队会议安排在办公室。' },
    ],
    writingPrompt: '给主管写一封 100–150 词的邮件，提出一项调整工作安排的建议。说明原因、具体安排及对团队的影响。',
    speakingPrompt: '比较居家办公和办公室办公，分别说明一个优点和缺点，最后解释你自己的选择。',
  },
  {
    id: 'nl-b1-reading-03', title: 'Een andere route naar de afspraak', titleTranslate: '换一条路线赴约', topic: '交通变动与解决问题', level: 'B1',
    paragraphs: [
      [
        ['Amir zou op vrijdagochtend met de trein naar een sollicitatiegesprek gaan en had zijn reis zorgvuldig voorbereid.', 'Amir 原计划星期五早上乘火车去参加求职面试，并仔细准备了行程。'],
        ['Hij had het adres opgezocht, zijn documenten in een tas gedaan en een trein gekozen die ruim op tijd aankwam.', '他查好了地址，把资料放进包里，并选了一班到达时间很充裕的火车。'],
        ['Toch liep de ochtend anders dan verwacht.', '然而，这个早晨的发展和预期不同。'],
      ],
      [
        ['Toen hij op het station kwam, zag hij op het informatiebord dat zijn trein niet reed.', '当他到达车站时，他在信息屏上看到原定火车停开了。'],
        ['Een medewerker vertelde dat er een probleem op het spoor was en dat reizigers een andere verbinding moesten zoeken.', '一位工作人员解释说铁路线出了问题，乘客需要寻找其他交通连接。'],
        ['Amir werd zenuwachtig, want hij wilde geen slechte eerste indruk maken.', 'Amir 紧张起来，因为他不想给人留下糟糕的第一印象。'],
      ],
      [
        ['Hij controleerde twee mogelijke routes: een omweg met een extra overstap en een bus naar een ander station.', '他查看了两条可能的路线：绕道并多换乘一次，或者坐公交车去另一个车站。'],
        ['De busroute leek sneller, maar de aansluiting was onzeker, dus koos hij voor de omweg.', '公交路线看起来更快，但能否接上下一班交通工具并不确定，所以他选择了绕行。'],
        ['Daarna belde hij het bedrijf, legde de situatie uit en gaf zijn nieuwe verwachte aankomsttijd door.', '随后他给公司打电话，解释了情况，并告知新的预计到达时间。'],
      ],
      [
        ['De medewerker van het bedrijf reageerde begripvol en verplaatste het gesprek naar een later moment die ochtend.', '公司的工作人员表示理解，并把面试调整到当天上午稍晚的时间。'],
        ['Uiteindelijk kwam Amir rustig genoeg aan om nog een glas water te drinken en zijn aantekeningen te bekijken.', '最终，Amir 到达时还有足够时间喝一杯水，并查看自己的笔记。'],
        ['Hij was blij dat hij niet alleen naar oplossingen had gezocht, maar ook op tijd had laten weten wat er aan de hand was.', '他很庆幸自己不仅寻找了解决办法，也及时告知了对方发生的情况。'],
      ],
    ],
    questions: [
      { stem: 'Waarom reed Amirs trein niet?', options: ['Hij was te laat op het station.', 'Er was een probleem op het spoor.', 'Het sollicitatiegesprek was afgezegd.', 'Zijn tas was verdwenen.'], correctAnswer: ['b'], explanation: '第二段中工作人员说明铁路线出了问题，因此原定列车停开。' },
      { stem: 'Waarom koos Amir niet voor de busroute?', options: ['De bus was altijd duurder.', 'Hij kon het busstation niet vinden.', 'De aansluiting was onzeker.', 'Hij had geen documenten bij zich.'], correctAnswer: ['c'], explanation: '第三段说明虽然公交路线看起来更快，但换乘连接并不确定。' },
      { stem: 'Hoe reageerde het bedrijf op zijn telefoontje?', options: ['Het gesprek werd naar later die ochtend verplaatst.', 'Het bedrijf weigerde hem te ontvangen.', 'De medewerker vroeg hem een taxi te betalen.', 'Zijn sollicitatie werd zonder gesprek afgewezen.'], correctAnswer: ['a'], explanation: '最后一段明确写到，公司理解情况，并把面试改到当天上午稍晚的时候。' },
    ],
    writingPrompt: '写一封 100–140 词的邮件，说明交通问题导致你可能迟到。提供预计到达时间，并提出一个替代安排。',
    speakingPrompt: '讲述一次计划发生变化的经历。说明原计划、遇到的问题、你的处理方式和最终结果。',
  },
  {
    id: 'nl-b1-reading-04', title: 'Goed voorbereid naar de afspraak', titleTranslate: '做好准备再赴约', topic: '就诊沟通', level: 'B1',
    paragraphs: [
      [
        ['Nora merkte dat ze zich de laatste dagen minder fit voelde en besloot haar huisartsenpraktijk te bellen.', 'Nora 注意到自己最近几天状态不太好，于是决定给家庭医生诊所打电话。'],
        ['Ze vond dat lastig, omdat ze aan de telefoon soms moeilijk op Nederlandse woorden kon komen.', '她觉得这有点困难，因为打电话时，她有时想不起合适的荷兰语词语。'],
        ['Voordat ze belde, schreef ze daarom kort op wat ze wilde vertellen en vragen.', '所以打电话前，她简要写下了想说明的事情和想问的问题。'],
      ],
      [
        ['De assistente vroeg sinds wanneer Nora klachten had en wanneer ze beschikbaar was voor een afspraak.', '诊所助理询问 Nora 从什么时候开始感到不适，以及她什么时间有空来预约就诊。'],
        ['Nora antwoordde zo duidelijk mogelijk en vroeg om herhaling wanneer ze een woord niet begreep.', 'Nora 尽可能清楚地回答，遇到听不懂的词时就请对方重复。'],
        ['Samen vonden ze een geschikt moment voor de volgende ochtend.', '她们一起确定了第二天早上的一个合适时间。'],
      ],
      [
        ['Tijdens het gesprek met de huisarts gebruikte Nora haar lijstje, zodat ze geen belangrijke vraag zou vergeten.', '和家庭医生交谈时，Nora 使用了自己列出的清单，以免忘记重要的问题。'],
        ['Ze vertelde wat ze had gemerkt, in welke situaties ze er last van had en welke informatie ze al had.', '她说明了自己的发现、在什么情况下会感到不适，以及自己已经掌握的信息。'],
        ['De huisarts stelde aanvullende vragen en legde uit wat de volgende stap voor Nora was.', '医生进一步提问，并解释了 Nora 接下来要做什么。'],
      ],
      [
        ['Aan het einde herhaalde Nora in haar eigen woorden wat er was afgesproken en vroeg of ze het goed had begrepen.', '结束时，Nora 用自己的话复述了商定的事项，并询问自己的理解是否正确。'],
        ['Ze vond het prettig dat ze niet hoefde te doen alsof ze alles meteen verstond.', '她很高兴，自己不必假装马上就听懂了一切。'],
        ['Voor een volgend gesprek wil ze opnieuw een korte voorbereiding maken, want dat gaf haar meer vertrouwen.', '下次交谈前她还想再次做简短准备，因为这让她更有信心。'],
      ],
    ],
    questions: [
      { stem: 'Waarom maakte Nora vooraf een lijstje?', options: ['Ze wilde tijdens het wachten een verhaal schrijven.', 'De huisarts had haar nog nooit gesproken.', 'Telefoneren in het Nederlands vond ze soms lastig.', 'Ze wilde niet met de assistente praten.'], correctAnswer: ['c'], explanation: '第一段说她在荷兰语电话交流中有时找不到合适的词，所以提前做了记录。' },
      { stem: 'Wat deed Nora als ze een woord niet begreep?', options: ['Ze vroeg om herhaling.', 'Ze beëindigde meteen het gesprek.', 'Ze veranderde zonder uitleg van onderwerp.', 'Ze zei altijd dat ze het begreep.'], correctAnswer: ['a'], explanation: '第二段明确写到她不理解某个词时会请对方重复。' },
      { stem: 'Wat deed Nora aan het einde van de afspraak?', options: ['Ze annuleerde de afspraak voor de volgende ochtend.', 'Ze herhaalde de afspraken in haar eigen woorden.', 'Ze vroeg de arts om haar huiswerk na te kijken.', 'Ze gaf haar lijstje aan een andere patiënt.'], correctAnswer: ['b'], explanation: '第四段说明她用自己的话复述约定，并核对是否理解正确。' },
    ],
    writingPrompt: '写一封 100–140 词的预约邮件。说明你希望讨论的问题、两个可以见面的时间，并请对方确认。这里只练习沟通表达，不需要写治疗建议。',
    speakingPrompt: '模拟一次预约电话：说明来意、描述问题持续了多久、询问时间，并请对方重复一个你没有听清的信息。',
  },
  {
    id: 'nl-b1-reading-05', title: 'Minder afval begint met kleine keuzes', titleTranslate: '减少垃圾从小选择开始', topic: '环境与日常习惯', level: 'B1',
    paragraphs: [
      [
        ['Tijdens een buurtbijeenkomst merkte Ruben dat veel bewoners zich ergerden aan de volle afvalbakken naast het plein.', '在一次社区会议上，Ruben 发现许多住户都对广场旁装满垃圾的垃圾桶感到不满。'],
        ['Sommige mensen wilden extra bakken, terwijl anderen vonden dat de buurt eerst minder afval moest produceren.', '有些人希望增加垃圾桶，另一些人则认为社区首先应该减少垃圾的产生。'],
        ['Ruben besloot thuis een week lang te bekijken wat hij eigenlijk weggooide.', 'Ruben 决定在家观察一周，看看自己到底丢掉了什么。'],
      ],
      [
        ['Hij ontdekte vooral veel verpakkingen en voedsel dat hij had gekocht maar niet op tijd had gebruikt.', '他发现，垃圾中主要是大量包装，以及买来后没能及时吃掉的食物。'],
        ['Daarom maakte hij voor het boodschappen doen een lijstje en keek hij eerst wat er nog in de koelkast lag.', '因此，他在购物前先查看冰箱里还剩什么，再列一张清单。'],
        ['Ook nam hij voortaan een eigen tas en een herbruikbare drinkfles mee.', '从此，他也会自带购物袋和可重复使用的水瓶。'],
      ],
      [
        ['Niet elke verandering was even gemakkelijk: op drukke dagen vergat hij soms zijn voorbereiding en kocht hij te veel.', '并非每个改变都一样容易：忙碌时，他有时会忘记准备，买得过多。'],
        ['In plaats van meteen te stoppen, besprak hij met zijn huisgenoot welke gewoontes wel haalbaar waren.', '他没有立即放弃，而是和室友讨论了哪些习惯切实可行。'],
        ['Ze besloten twee vaste momenten per week te gebruiken om samen hun maaltijden te plannen.', '他们决定每周安排两个固定时间，一起计划膳食。'],
      ],
      [
        ['Een maand later organiseerde de buurt een middag waarop bewoners bruikbare spullen met elkaar konden ruilen.', '一个月后，社区组织了一次午后活动，让住户互相交换仍然可用的物品。'],
        ['Ruben bracht een lamp mee die hij niet meer nodig had en vond zelf een kleine boekenkast.', 'Ruben 带来了一盏自己不再需要的灯，并为自己找到了一只小书架。'],
        ['Hij heeft geleerd dat minder afval niet alleen over scheiden gaat, maar ook over bewuster kopen en langer gebruiken.', '他认识到，减少垃圾不只是分类处理，也包括更有意识地购买以及使用得更久。'],
      ],
    ],
    questions: [
      { stem: 'Wat onderzocht Ruben eerst thuis?', options: ['Hoeveel lampen zijn buren hadden.', 'Welk afval hij weggooide.', 'Welke winkels het dichtstbij waren.', 'Hoe groot het plein precies was.'], correctAnswer: ['b'], explanation: '第一段最后说明，他先观察自己一周内丢弃的东西。' },
      { stem: 'Wat deden Ruben en zijn huisgenoot om hun plan haalbaar te maken?', options: ['Ze kochten iedere dag meer eten.', 'Ze stopten met boodschappen doen.', 'Ze planden op vaste momenten samen hun maaltijden.', 'Ze besloten alle verpakkingen te bewaren.'], correctAnswer: ['c'], explanation: '第三段说明他们每周用两个固定时间共同规划膳食。' },
      { stem: 'Welke conclusie past bij Rubens ervaring?', options: ['Alleen meer afvalbakken kunnen het probleem oplossen.', 'Ruilen heeft niets met afval te maken.', 'Een plan heeft alleen zin als het altijd perfect gaat.', 'Bewuster kopen en spullen langer gebruiken kunnen ook helpen.'], correctAnswer: ['d'], explanation: '最后一句总结，减少垃圾还涉及有意识地购买和延长物品使用时间。' },
    ],
    writingPrompt: '为社区公告栏写 110–150 词的建议，提出两项减少浪费的可行做法。解释原因，并邀请邻居参加一次活动。',
    speakingPrompt: '说明你想改变的一项生活习惯。描述当前情况、改变的理由、可能遇到的困难，以及你准备怎样坚持。',
  },
  {
    id: 'nl-b1-reading-06', title: 'Een paar uur voor de buurt', titleTranslate: '为社区付出几个小时', topic: '志愿服务与社会联系', level: 'B1',
    paragraphs: [
      [
        ['Daan werkte overdag in een magazijn en kende buiten zijn collega’s nog maar weinig mensen in zijn woonplaats.', 'Daan 白天在仓库工作，除了同事，他在居住的地方还不太认识其他人。'],
        ['Toen hij in de bibliotheek een oproep voor vrijwilligers zag, werd hij nieuwsgierig naar het taalcafé in het buurthuis.', '有次他在图书馆看到招募志愿者的启事，便对社区中心的语言交流咖啡活动产生了兴趣。'],
        ['Hij vroeg zich wel af of hij genoeg ervaring had om anderen te helpen.', '不过，他也怀疑自己是否有足够的经验帮助别人。'],
      ],
      [
        ['De coördinator nodigde hem uit om eerst een avond mee te kijken en rustig kennis te maken met de groep.', '协调员邀请他先旁观一次晚间活动，慢慢认识这个小组。'],
        ['Daar ontdekte hij dat vrijwilligers vooral luisterden, vragen stelden en deelnemers de tijd gaven om te antwoorden.', '在那里他发现，志愿者主要负责倾听、提问，并给参与者时间作答。'],
        ['Niemand verwachtte dat hij een docent was of alle grammaticaregels kon uitleggen.', '没有人期待他是教师，或能够解释全部语法规则。'],
      ],
      [
        ['Na die kennismaking besloot Daan twee avonden per maand te helpen, omdat dat goed bij zijn werkrooster paste.', '初次体验后，Daan 决定每月帮忙两个晚上，因为这与他的工作排班很合适。'],
        ['Hij bereidde eenvoudige gespreksonderwerpen voor, bijvoorbeeld reizen, koken of een ervaring op het werk.', '他会准备一些简单的交流话题，例如旅行、做饭或工作中的经历。'],
        ['Als een gesprek vastliep, gaf hij een voorbeeld of stelde hij dezelfde vraag op een andere manier.', '交谈卡住时，他会举一个例子，或换一种方式提出同一个问题。'],
      ],
      [
        ['Inmiddels kijkt hij uit naar de avonden, want hij hoort verhalen die hij anders nooit zou horen.', '现在他很期待这些晚间活动，因为他能听到平时根本不会听到的故事。'],
        ['Een deelnemer vertelde hem onlangs dat ze dankzij de gesprekken meer durfde te zeggen in een winkel.', '最近一位参与者告诉他，多亏这些交流，她现在在商店里更敢开口说话了。'],
        ['Daan merkt dat vrijwilligerswerk hem niet alleen nieuwe contacten geeft, maar ook laat zien wat een klein gebaar kan betekenen.', 'Daan 发现，志愿服务不仅带来新的联系，也让他看到一个小举动能够有多大意义。'],
      ],
    ],
    questions: [
      { stem: 'Waarom twijfelde Daan aanvankelijk?', options: ['Hij wist niet of hij genoeg ervaring had.', 'Hij wilde iedere avond overwerken.', 'Hij kon het buurthuis niet vinden.', 'Hij had geen interesse in andere mensen.'], correctAnswer: ['a'], explanation: '第一段最后一句说，他不确定自己的经验是否足以帮助别人。' },
      { stem: 'Hoe vaak helpt Daan bij de activiteit?', options: ['Iedere werkdag.', 'Eén keer per jaar.', 'Twee avonden per maand.', 'Alleen tijdens zijn lunchpauze.'], correctAnswer: ['c'], explanation: '第三段明确给出频率：每月两个晚上。' },
      { stem: 'Wat vertelde een deelnemer hem onlangs?', options: ['Dat de bibliotheek binnenkort dichtging.', 'Dat zij in een winkel meer durfde te zeggen.', 'Dat iedereen alle grammaticaregels moest leren.', 'Dat de activiteit voortaan in het magazijn was.'], correctAnswer: ['b'], explanation: '最后一段提到，一位参与者因为交流练习而在商店里更敢说话。' },
    ],
    writingPrompt: '给一个志愿者组织写 100–140 词的邮件。介绍你自己、说明想参加的原因、可提供的帮助和空闲时间。',
    speakingPrompt: '介绍一项你愿意参加的志愿活动，解释它对别人和你自己分别有什么帮助，并说明你能投入多少时间。',
  },
  {
    id: 'nl-b1-reading-07', title: 'Hulp bij een digitaal formulier', titleTranslate: '填写电子表格时获得帮助', topic: '办事与数字服务', level: 'B1',
    paragraphs: [
      [
        ['Sara wilde informatie over een dienst van haar gemeente aanvragen en begon met het digitale formulier op de website.', 'Sara 想申请了解当地市政府一项服务的信息，于是打开了网站上的电子表格。'],
        ['Het eerste deel was eenvoudig, maar daarna verscheen er een vraag waarvan ze de betekenis niet goed begreep.', '第一部分很简单，但随后出现了一个她不太理解含义的问题。'],
        ['Ze wilde voorkomen dat ze verkeerde gegevens zou invullen, dus stuurde ze het formulier nog niet op.', '她想避免填写错误信息，因此还没有提交表格。'],
      ],
      [
        ['Op dezelfde pagina vond Sara een telefoonnummer en informatie over een inloopmoment in het wijkcentrum.', 'Sara 在同一个页面上找到了电话号码，以及在社区活动中心可以直接前往咨询的时间信息。'],
        ['Omdat ze haar vraag liever met iemand besprak, besloot ze daar de volgende middag langs te gaan.', '因为她更愿意当面和人讨论自己的问题，她决定第二天下午去那里。'],
        ['Ze schreef op welke stap niet lukte en nam de documenten mee die bij haar vraag hoorden.', '她写下了在哪一步遇到困难，并带上与问题有关的文件。'],
      ],
      [
        ['Een medewerker vroeg haar eerst te laten zien wat ze al had gedaan, zodat hij het probleem beter kon begrijpen.', '一位工作人员先请她展示自己已经做过的步骤，以便更好地理解问题。'],
        ['Hij legde de moeilijke woorden uit en liet Sara vervolgens zelf de juiste informatie invullen.', '他解释了那些难懂的词，然后让 Sara 自己填写正确信息。'],
        ['Voordat ze iets verstuurde, controleerde ze zorgvuldig of haar gegevens en haar vraag duidelijk op het scherm stonden.', '提交之前，她仔细核对了屏幕上的个人信息和问题是否表达清楚。'],
      ],
      [
        ['Sara was opgelucht dat ze hulp had gevraagd in plaats van zomaar een antwoord te kiezen.', 'Sara 很庆幸自己寻求了帮助，而不是随便选择一个答案。'],
        ['Ze schreef de uitleg in haar notitieboek, zodat ze een volgende keer zelfstandiger te werk kon gaan.', '她把解释记在笔记本上，以便下次能够更独立地完成。'],
        ['Volgens haar is een digitale dienst pas echt toegankelijk als mensen ook vragen kunnen stellen wanneer iets onduidelijk is.', '在她看来，只有当人们遇到不清楚的内容时也能提问，数字服务才算真正易于使用。'],
      ],
    ],
    questions: [
      { stem: 'Waarom stuurde Sara het formulier niet meteen op?', options: ['Ze had haar computer verkocht.', 'Ze begreep een vraag niet goed en wilde fouten voorkomen.', 'De medewerker had het formulier al verstuurd.', 'Ze wilde geen informatie meer ontvangen.'], correctAnswer: ['b'], explanation: '第一段说明她担心误解问题后填写错误信息，所以没有立即提交。' },
      { stem: 'Wat deed de medewerker nadat hij de moeilijke woorden had uitgelegd?', options: ['Hij liet Sara zelf de informatie invullen.', 'Hij koos zonder overleg willekeurige antwoorden.', 'Hij vroeg Sara naar een andere gemeente te verhuizen.', 'Hij stuurde haar zonder uitleg naar huis.'], correctAnswer: ['a'], explanation: '第三段明确说明，解释后是 Sara 自己填写正确信息。' },
      { stem: 'Wat vindt Sara belangrijk aan digitale diensten?', options: ['Dat er nooit uitleg op een website staat.', 'Dat mensen altijd dezelfde vraag krijgen.', 'Dat alleen medewerkers formulieren mogen invullen.', 'Dat mensen vragen kunnen stellen als iets onduidelijk is.'], correctAnswer: ['d'], explanation: '最后一句给出她的观点：遇到不清楚的内容时，人们也应能提问。' },
    ],
    writingPrompt: '写一封 100–140 词的求助邮件，说明某张电子表格在哪一步遇到问题、已经尝试了什么，以及希望获得什么帮助。不要填写真实敏感信息。',
    speakingPrompt: '模拟向办事窗口求助：先说明目的，再指出你不理解的一处内容，最后用自己的话确认工作人员的解释。',
  },
  {
    id: 'nl-b1-reading-08', title: 'Een leerplan dat bij je leven past', titleTranslate: '适合自己生活的学习计划', topic: '学习方法与坚持', level: 'B1',
    paragraphs: [
      [
        ['Toen Tomas met Nederlands leren begon, wilde hij iedere avond een heel hoofdstuk uit zijn boek afmaken.', 'Tomas 刚开始学荷兰语时，希望每天晚上都学完书中的整整一章。'],
        ['Na een drukke werkdag had hij daar echter vaak te weinig energie voor en sloeg hij meerdere avonden over.', '但忙碌了一天后，他常常没有足够的精力，连续好几个晚上都跳过学习。'],
        ['Daardoor kreeg hij het gevoel dat hij steeds opnieuw moest beginnen.', '因此，他觉得自己总得从头开始。'],
      ],
      [
        ['Zijn docent stelde voor om niet alleen naar de hoeveelheid leerstof te kijken, maar ook naar een haalbaar ritme.', '他的老师建议，不只关注学习内容的多少，也要关注一个切实可行的节奏。'],
        ['Tomas koos daarom drie korte oefenmomenten tijdens de week en een langer moment op zondagochtend.', '于是 Tomas 选择每周安排三次简短练习，并在星期天早上进行一次较长的学习。'],
        ['Op zijn telefoon noteerde hij welke taak hij tijdens elk moment wilde doen.', '他在手机上记下每次学习时准备完成哪项任务。'],
      ],
      [
        ['Hij oefent nu woorden in zinnen, luistert naar korte berichten en schrijft wekelijks een mail over een herkenbaar onderwerp.', '现在，他把词语放在句子中练习，听简短消息，并每周就一个熟悉的话题写一封邮件。'],
        ['Daarna bespreekt hij zijn tekst met een taalmaatje, dat hem vragen stelt wanneer iets niet duidelijk is.', '之后他和语伴讨论自己的文章；表达不清楚时，语伴会向他提问。'],
        ['Zo ontdekt hij niet alleen fouten, maar ook welke uitleg of voorbeelden nog ontbreken.', '这样，他不仅能发现错误，还能发现哪些解释或例子尚未写出。'],
      ],
      [
        ['Tomas houdt een klein overzicht bij van situaties waarin hij Nederlands durfde te gebruiken, zoals een telefoontje of een gesprek met een buur.', 'Tomas 会简单记录自己敢于使用荷兰语的场景，例如一次电话或一次和邻居的交谈。'],
        ['Hoewel hij nog niet alles begrijpt, ziet hij daardoor beter wat er al vooruitgaat.', '虽然他还不能听懂一切，但这样能更清楚地看到自己已有的进步。'],
        ['Zijn doel blijft hetzelfde, maar zijn plan is nu flexibel genoeg om het ook in een drukke week vol te houden.', '他的目标没有改变，但现在的计划足够灵活，让他在忙碌的一周也能坚持下去。'],
      ],
    ],
    questions: [
      { stem: 'Waarom werkte Tomas’ eerste plan niet goed?', options: ['Hij vond Nederlands helemaal niet interessant.', 'Zijn boek had geen hoofdstukken.', 'Na het werk had hij vaak te weinig energie.', 'Zijn docent wilde geen huiswerk geven.'], correctAnswer: ['c'], explanation: '第一段写到，他工作后常常精力不足，因此无法坚持每天学完一章。' },
      { stem: 'Hoe helpt het taalmaatje Tomas?', options: ['Door bij onduidelijke stukken vragen te stellen.', 'Door al zijn teksten zonder gesprek te verwijderen.', 'Door te eisen dat hij alleen losse woorden leert.', 'Door zijn leerdoel voor hem te veranderen.'], correctAnswer: ['a'], explanation: '第三段说明语伴会针对不清楚的地方提问，帮助他发现表达中缺失的解释和例子。' },
      { stem: 'Wat schrijft Tomas in zijn kleine overzicht?', options: ['Alleen de prijzen van nieuwe studieboeken.', 'Situaties waarin hij Nederlands heeft durven gebruiken.', 'De namen van alle buren in zijn straat.', 'Alleen de woorden die hij nooit wil gebruiken.'], correctAnswer: ['b'], explanation: '第四段提到，他记录自己敢于使用荷兰语的真实场景。' },
    ],
    writingPrompt: '写一篇 110–150 词的学习计划：说明目标、每周安排、一次常见困难，以及遇到困难时的替代方案。',
    speakingPrompt: '介绍一项你正在学习的技能。描述过去的方法、现在的调整，以及你怎样判断自己是否有进步。',
  },
  {
    id: 'nl-b1-reading-09', title: 'Een klacht met een duidelijke oplossing', titleTranslate: '提出投诉，也提出解决办法', topic: '购物与客户沟通', level: 'B1',
    paragraphs: [
      [
        ['Fatima bestelde een klein koffiezetapparaat, omdat het oude apparaat op haar werkplek niet meer goed werkte.', 'Fatima 订购了一台小咖啡机，因为工作场所原来的那台已经不好用了。'],
        ['Toen het pakket aankwam, zag ze dat de buitenkant van de doos beschadigd was en dat een onderdeel ontbrak.', '包裹送到时，她发现外包装箱有破损，而且少了一个零件。'],
        ['Ze controleerde eerst rustig de inhoud en maakte foto’s van wat ze had ontvangen.', '她先平静地检查包裹里的东西，并给收到的物品拍了照。'],
      ],
      [
        ['Daarna schreef ze een bericht aan de winkel met haar bestelnummer, de ontvangstdatum en een korte beschrijving van het probleem.', '然后她给商店写了一条消息，附上订单号、收货日期和对问题的简短描述。'],
        ['Ze voegde de foto’s toe en vroeg of de winkel het ontbrekende onderdeel kon opsturen.', '她附上照片，并询问商店能否寄来缺失的零件。'],
        ['Als dat niet mogelijk was, wilde ze graag weten welke andere oplossing de winkel voorstelde.', '如果无法补寄，她想知道商店可以提出什么其他解决办法。'],
      ],
      [
        ['De volgende dag kreeg Fatima een antwoord waarin de medewerker om een extra foto van het typeplaatje vroeg.', '第二天，Fatima 收到回复，工作人员请她再提供一张型号铭牌的照片。'],
        ['Ze vond het vervelend dat er nog een stap nodig was, maar stuurde de gevraagde informatie toch door.', '她觉得还要多做一步有些麻烦，但仍然发去了所需信息。'],
        ['Daarna bood de winkel aan een compleet vervangend apparaat te sturen en met haar af te spreken hoe het eerste apparaat terug kon.', '之后，商店提出寄送一台完整的替换机器，并和她商量第一台机器如何退回。'],
      ],
      [
        ['Fatima bevestigde de afspraak per mail, zodat beide partijen wisten wat er zou gebeuren.', 'Fatima 通过邮件确认了约定，以便双方都清楚接下来会发生什么。'],
        ['Een paar dagen later ontving ze het vervangende apparaat en liet ze de winkel weten dat het probleem was opgelost.', '几天后，她收到了替换机器，并通知商店问题已经解决。'],
        ['Ze denkt dat een vriendelijke, concrete klacht meer helpt dan alleen schrijven dat alles slecht is.', '她认为，友善而具体的投诉，比仅仅写上一句“一切都很糟糕”更有帮助。'],
      ],
    ],
    questions: [
      { stem: 'Wat was er mis met het ontvangen pakket?', options: ['Er ontbrak een onderdeel en de doos was beschadigd.', 'De winkel had alleen een lege factuur gestuurd.', 'Het apparaat was veel groter dan besteld.', 'Er zaten twee extra apparaten in.'], correctAnswer: ['a'], explanation: '第一段明确写到外包装损坏，并且缺少一个零件。' },
      { stem: 'Welke oplossing vroeg Fatima eerst?', options: ['Dat de winkel haar collega zou bellen.', 'Dat de winkel het ontbrekende onderdeel zou opsturen.', 'Dat de medewerker haar oude apparaat zou kopen.', 'Dat de winkel alle producten van de website zou verwijderen.'], correctAnswer: ['b'], explanation: '第二段说她最初询问商店是否能够寄送缺失零件。' },
      { stem: 'Waarom bevestigde Fatima de afspraak per mail?', options: ['Omdat ze het probleem niet meer wilde bespreken.', 'Omdat ze geen foto’s meer had.', 'Zodat beide partijen wisten wat er zou gebeuren.', 'Zodat ze geen bestelnummer hoefde te noemen.'], correctAnswer: ['c'], explanation: '第四段直接说明，邮件确认能让双方清楚后续安排。' },
    ],
    writingPrompt: '写一封 110–150 词的投诉邮件。描述收到的物品和具体问题，提供虚构订单信息，提出一种解决方案，并礼貌结束。',
    speakingPrompt: '模拟与客服交谈：解释发生了什么、你已经尝试了什么，并比较两种你能接受的解决方案。',
  },
  {
    id: 'nl-b1-reading-10', title: 'Eerst lezen, dan delen', titleTranslate: '先阅读，再转发', topic: '媒体与信息判断', level: 'B1',
    paragraphs: [
      [
        ['Op een ochtend zag Eva in een groepsgesprek een bericht waarin stond dat de brug naar het centrum maandenlang gesloten zou blijven.', '一天早上，Eva 在群聊中看到一条消息，说通往市中心的桥将关闭数月。'],
        ['Veel mensen reageerden boos, omdat zij die brug iedere dag gebruikten om naar hun werk te gaan.', '许多人十分生气，因为他们每天都要经过那座桥去上班。'],
        ['Eva wilde het bericht bijna doorsturen naar haar collega’s, maar besloot eerst de bijgevoegde link te openen.', 'Eva 差点就把消息转给同事，但她决定先打开附带的链接。'],
      ],
      [
        ['Ze ontdekte dat het artikel twee jaar eerder was gepubliceerd en over een andere brug in dezelfde regio ging.', '她发现，那篇文章发表于两年前，讲的是同一地区的另一座桥。'],
        ['In het groepsgesprek was alleen een deel van de titel overgenomen, waardoor belangrijke informatie ontbrak.', '群聊里只引用了标题的一部分，导致重要信息缺失。'],
        ['Op de website van de gemeente vond ze een recente melding over kort onderhoud aan de juiste brug.', '她在市政府网站上找到了一条近期公告，说明相关桥梁只会进行短期维护。'],
      ],
      [
        ['Eva stuurde vervolgens de actuele informatie naar de groep en legde uit waarom het eerdere bericht verwarrend was.', '随后 Eva 把最新信息发到群里，并解释了之前那条消息为什么容易造成误解。'],
        ['Ze probeerde niemand uit te lachen, want ze begreep dat iemand het bericht met goede bedoelingen had gedeeld.', '她尽量不嘲笑任何人，因为她理解，转发那条消息的人原本可能是出于好意。'],
        ['Verschillende deelnemers bedankten haar en pasten hun plannen voor de komende week aan.', '一些群成员向她道谢，并调整了接下来一周的计划。'],
      ],
      [
        ['Sindsdien kijkt Eva bij opvallend nieuws vaker naar de datum, de oorspronkelijke bron en de volledige tekst.', '从那以后，看到引人注目的新闻时，Eva 更常留意日期、原始来源和完整文章。'],
        ['Ze vindt niet dat je elk bericht urenlang hoeft te onderzoeken, maar een korte controle kan al veel misverstanden voorkomen.', '她并不认为每条消息都需要花上几个小时调查，但简单核查已经能避免许多误解。'],
        ['Voor haar is zorgvuldig delen ook een manier om rekening te houden met de tijd en zorgen van anderen.', '对她而言，谨慎转发也是体谅他人时间和担忧的一种方式。'],
      ],
    ],
    questions: [
      { stem: 'Wat ontdekte Eva toen ze het artikel opende?', options: ['Dat haar collega het artikel had geschreven.', 'Dat alle bruggen in de regio gesloten waren.', 'Dat het een oud artikel over een andere brug was.', 'Dat er helemaal geen titel bij het artikel stond.'], correctAnswer: ['c'], explanation: '第二段指出，文章写于两年前，而且讲的是另一座桥。' },
      { stem: 'Hoe reageerde Eva in de groep?', options: ['Ze deelde actuele informatie en gaf rustig uitleg.', 'Ze verwijderde alle deelnemers zonder uitleg.', 'Ze stuurde dezelfde oude titel nog een keer door.', 'Ze vertelde iedereen dat ze hun plannen moesten annuleren.'], correctAnswer: ['a'], explanation: '第三段说明她转发了最新信息并解释误会，也没有嘲笑其他人。' },
      { stem: 'Waar let Eva sindsdien vaker op?', options: ['Alleen op het aantal reacties.', 'Alleen op de foto bij een bericht.', 'Op de naam van degene die het snelst reageert.', 'Op de datum, oorspronkelijke bron en volledige tekst.'], correctAnswer: ['d'], explanation: '最后一段明确列出了她更常检查的三个方面。' },
    ],
    writingPrompt: '写一段 110–150 词的观点文字，谈谈转发网络消息前是否应该核查。提出你的观点、两个理由和一个具体例子。',
    speakingPrompt: '描述一次你看到错误或不完整信息的经历，说明你怎样核查、怎样向别人解释，以及你从中学到了什么。',
  },
  {
    id: 'nl-b1-reading-11', title: 'Samenwerken zonder langs elkaar heen te praten', titleTranslate: '合作时避免各说各话', topic: '团队合作与意见分歧', level: 'B1',
    paragraphs: [
      [
        ['Het team van Milan moest een presentatie voor een nieuwe klant voorbereiden, maar na twee dagen bleef de taakverdeling onduidelijk.', 'Milan 所在的团队需要为一位新客户准备演示，但两天过去后，谁负责什么仍然不清楚。'],
        ['Milan dacht dat zijn collega de cijfers zou controleren, terwijl zij dacht dat hij dat al had gedaan.', 'Milan 以为同事会核对数字，而那位同事以为他已经完成了。'],
        ['Toen ze de eerste versie bekeken, merkten ze dat sommige gegevens niet bij elkaar pasten.', '查看第一版时，他们发现某些数据互相对不上。'],
      ],
      [
        ['In het overleg werd de sfeer even gespannen en begon iedereen uit te leggen waarom het niet zijn of haar fout was.', '会议上气氛一度紧张，大家开始解释为什么这不是自己的错误。'],
        ['Milan stelde voor eerst te beschrijven wat er nog ontbrak, zonder meteen iemand de schuld te geven.', 'Milan 提议先说明还有什么缺失，而不要立刻把责任推给某个人。'],
        ['Daardoor konden ze beter luisteren naar de verschillende verwachtingen die ze hadden gehad.', '这样，他们就能够更好地倾听各自原先的不同预期。'],
      ],
      [
        ['Daarna verdeelden ze de taken opnieuw en schreven ze bij elke taak op wie verantwoordelijk was en wanneer die klaar moest zijn.', '之后，他们重新分配任务，并为每项任务写明负责人和完成时间。'],
        ['Ze spraken ook af om moeilijke vragen meteen te bespreken in plaats van te wachten tot de laatste dag.', '他们还约定，遇到难题就立即讨论，而不是等到最后一天。'],
        ['Een korte gezamenlijke controle aan het einde van de middag hielp om verschillen vroeg te ontdekken.', '下午结束时的一次简短共同检查，有助于及早发现差异。'],
      ],
      [
        ['De presentatie was uiteindelijk op tijd klaar en de klant stelde vragen die het team goed kon beantwoorden.', '最终，演示按时准备完成，团队也能很好地回答客户提出的问题。'],
        ['Milan vond vooral belangrijk dat zijn collega’s na afloop ook bespraken wat ze de volgende keer anders wilden doen.', 'Milan 觉得，尤其重要的是，同事们事后也讨论了下次想做哪些改变。'],
        ['Volgens hem betekent goed samenwerken niet dat je nooit van mening verschilt, maar dat je duidelijke afspraken kunt maken.', '在他看来，良好合作并不意味着永远没有分歧，而是能够达成清晰的约定。'],
      ],
    ],
    questions: [
      { stem: 'Waarom waren sommige cijfers niet goed gecontroleerd?', options: ['De klant had de presentatie al meegenomen.', 'De collega’s hadden verschillende verwachtingen over de taakverdeling.', 'Milan mocht geen cijfers gebruiken.', 'Het team had besloten helemaal niet samen te werken.'], correctAnswer: ['b'], explanation: '第一段说明，Milan 与同事都以为核对数字是对方负责，任务分工存在误会。' },
      { stem: 'Wat stelde Milan voor toen de sfeer gespannen werd?', options: ['Meteen iemand de schuld geven.', 'De klant vragen alle taken te doen.', 'Eerst beschrijven wat er nog ontbrak.', 'De presentatie zonder overleg annuleren.'], correctAnswer: ['c'], explanation: '第二段说明他建议先客观指出缺失之处，不要立即责怪别人。' },
      { stem: 'Welke nieuwe afspraak maakte het team?', options: ['Bij elke taak de verantwoordelijke en het tijdstip van afronding noteren.', 'Moeilijke vragen tot de laatste dag bewaren.', 'Geen gezamenlijke controles meer doen.', 'Na afloop nooit meer over de samenwerking spreken.'], correctAnswer: ['a'], explanation: '第三段说他们为每项任务写明了负责人和完成时间。' },
    ],
    writingPrompt: '给同事写一封 110–150 词的邮件，澄清一个任务安排。说明当前误会，提出新的分工、完成时间和检查方式。',
    speakingPrompt: '表达你对一次团队合作的看法。讲清楚分歧、各方想法、你提出的办法，以及下次准备怎样改进。',
  },
  {
    id: 'nl-b1-reading-12', title: 'Ruimte maken voor wat belangrijk is', titleTranslate: '为重要的事情留出空间', topic: '预算与个人选择', level: 'B1',
    paragraphs: [
      [
        ['Joris wilde in het voorjaar een korte reis maken, maar aan het einde van de maand bleef er meestal weinig geld over.', 'Joris 想在春天进行一次短途旅行，但每到月底，他通常已经没剩多少钱。'],
        ['Hij had niet het gevoel dat hij grote aankopen deed, dus besloot hij een maand lang zijn uitgaven op te schrijven.', '他并不觉得自己买了什么大件物品，于是决定连续一个月记录开销。'],
        ['Hij wilde eerst begrijpen waar zijn geld naartoe ging voordat hij keuzes maakte.', '他希望先弄清钱花到哪里去了，再作选择。'],
      ],
      [
        ['In zijn overzicht zag hij vaste kosten, zoals de huur, maar ook veel kleine bedragen voor koffie, bezorgmaaltijden en abonnementen.', '在记录中，他看到了房租等固定费用，也看到了许多用于咖啡、外卖和订阅的小额开支。'],
        ['Vooral de abonnementen vielen hem op, omdat hij sommige diensten nauwelijks meer gebruikte.', '订阅费用尤其引起他的注意，因为有些服务他已经几乎不用了。'],
        ['Samen met een vriend bekeek hij welke uitgaven hij belangrijk vond en welke hij zonder veel moeite kon verminderen.', '他和一位朋友一起看了看，哪些支出对他重要，哪些可以不费太多力气就减少。'],
      ],
      [
        ['Joris besloot niet alles tegelijk te veranderen, want hij wilde zijn plan ook op lange termijn volhouden.', 'Joris 决定不一次改变所有事情，因为他希望长期坚持这个计划。'],
        ['Hij stopte met twee ongebruikte abonnementen en kookte vaker een extra portie voor de volgende dag.', '他取消了两项不再使用的订阅，并更经常多做一份饭，留到第二天吃。'],
        ['Het maandelijkse etentje met zijn vrienden hield hij juist, omdat dat hem veel plezier en contact gaf.', '而每月和朋友们的聚餐，他反倒保留了，因为那给他带来许多快乐和交流。'],
      ],
      [
        ['Na drie maanden had hij een deel van het bedrag voor zijn reis opzijgezet en wist hij beter welke keuzes bij hem pasten.', '三个月后，他已经为旅行存下了部分费用，也更清楚哪些选择适合自己。'],
        ['Hij controleert zijn overzicht nu iedere zondag, zodat onverwachte uitgaven minder snel uit beeld verdwijnen.', '现在他每个星期天都会查看记录，避免意外支出很快被忽略。'],
        ['Voor hem gaat een budget niet alleen over minder uitgeven, maar ook over bewust ruimte maken voor wat belangrijk is.', '对他而言，预算不只是少花钱，也是有意识地为重要的事情留出空间。'],
      ],
    ],
    questions: [
      { stem: 'Waarom begon Joris zijn uitgaven op te schrijven?', options: ['Hij wilde begrijpen waar zijn geld naartoe ging.', 'Hij had al genoeg geld voor iedere reis.', 'Zijn vriend vroeg hem een winkel te openen.', 'Hij wilde voortaan geen vaste kosten meer betalen.'], correctAnswer: ['a'], explanation: '第一段说明，他先想弄清开销去向，再决定作哪些改变。' },
      { stem: 'Welke uitgave behield Joris bewust?', options: ['Alle ongebruikte abonnementen.', 'Iedere dag een bezorgmaaltijd.', 'Het maandelijkse etentje met vrienden.', 'Een nieuwe grote aankoop per week.'], correctAnswer: ['c'], explanation: '第三段提到，他保留了每月和朋友的聚餐，因为这带来快乐和联系。' },
      { stem: 'Hoe houdt Joris zijn overzicht nu bij?', options: ['Hij bekijkt het alleen voor een vakantie.', 'Hij controleert het iedere zondag.', 'Hij laat het helemaal aan zijn vriend over.', 'Hij schrijft alleen de huur nog op.'], correctAnswer: ['b'], explanation: '最后一段明确写到，他现在每个星期天查看开销记录。' },
    ],
    writingPrompt: '写一篇 110–150 词的个人计划，说明你想实现的一个目标、两项具体调整、你不愿放弃的一项活动及原因。使用虚构金额也可以。',
    speakingPrompt: '比较两种休闲或消费选择。谈谈费用、时间和体验，解释你更愿意选择哪一种，以及为什么。',
  },
]
