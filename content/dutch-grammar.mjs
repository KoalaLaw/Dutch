// Type Dutch grammar annotations. POS follows the meaning taught in this course.
// Verb principal parts are maintained separately, with their source attribution.
export const posLabels = {
 noun: ['名词', 'zelfstandig naamwoord'], verb: ['动词', 'werkwoord'],
 adjective: ['形容词', 'bijvoeglijk naamwoord'], adverb: ['副词', 'bijwoord'],
 pronoun: ['人称代词', 'persoonlijk voornaamwoord'], preposition: ['介词', 'voorzetsel'],
 conjunction: ['连词', 'voegwoord'], interjection: ['感叹词 / 交际用语', 'tussenwerpsel'],
 numeral: ['数词', 'telwoord'], expression: ['固定表达 / 句型', 'vaste uitdrukking'],
 adjectivePhrase: ['形容词短语', 'bijvoeglijke woordgroep'],
 adverbPhrase: ['副词 / 介词短语', 'bijwoordelijke woordgroep'],
 nounPhrase: ['名词短语', 'naamwoordelijke woordgroep'],
}
const words = text => new Set(text.trim().split(/\s*\|\s*/))
export const posGroups = {
 interjection: words('hallo|goedemorgen|goedemiddag|goedenavond|dag|alsjeblieft|alstublieft|bedankt|sorry|ja|nee|welkom'),
 pronoun: words('ik|jij|u|wij'),
 numeral: words('half|eerste|laatste'),
 noun: words('maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|deeltijd|voltijd'),
 preposition: words('in|op|aan|onder|boven|voor|achter|naast|tussen|tegenover|bij|uit|naar|langs|door|over|binnen|buiten'),
 conjunction: words('omdat|doordat|aangezien|hoewel|maar|terwijl|zodra|totdat|nadat|voordat|als|tenzij|mits|zodat'),
 adverb: words('misschien|graag|samen|thuis|links|rechts|rechtdoor|dichtbij|vandaag|morgen|gisteren|nu|straks|altijd|vaak|soms|nooit|waarschijnlijk|rechtstreeks|destijds|toen|voorheen|vroeger|sindsdien|opeens|gaandeweg|achteraf|daarom|daardoor|dus|toch|desondanks|echter|bovendien|daarnaast|vervolgens|bijvoorbeeld|namelijk|enerzijds|anderzijds|vermoedelijk|blijkbaar|kennelijk|nauwelijks|bijna|ongeveer|precies|minstens|hoogstens|regelmatig|geleidelijk|vooral|eigenlijk|immers|overigens|daarentegen|inmiddels|onmiddellijk|voortdurend|opnieuw|gedeeltelijk|uitvoerig|uitsluitend|eventueel|meestal|zelden|tamelijk|behoorlijk|ondertussen|stipt|tijdig|overmorgen|eergisteren|vroeg|laat|omhoog|omlaag|hier|daar|ergens|nergens|overal'),
 adjective: words('groot|klein|nieuw|oud|schoon|lekker|duur|goedkoop|ver|koud|warm|moe|ziek|gezond|belangrijk|duidelijk|onduidelijk|eenvoudig|ingewikkeld|geschikt|ongeschikt|beschikbaar|bezet|mogelijk|onmogelijk|onwaarschijnlijk|noodzakelijk|onnodig|voldoende|onvoldoende|redelijk|betrouwbaar|verantwoordelijk|zelfstandig|afhankelijk|tevreden|ontevreden|handig|onhandig|dringend|tijdelijk|permanent|persoonlijk|gezamenlijk|gemeubileerd|ruim|betaalbaar|gemotiveerd|breekbaar|trots|blij|verdrietig|boos|bang|bezorgd|verbaasd|teleurgesteld|opgelucht|zenuwachtig|enthousiast|eenzaam|geduldig|eerlijk|toegankelijk|vrijwillig|geldig|volledig|maandelijks|inbegrepen|defect|beschadigd|verkeerd|duurzaam|herbruikbaar|biologisch|milieuvriendelijk|verkeersveilig|volgeboekt|uitverkocht|rauw|rijp|voedzaam|evenwichtig|plantaardig|getrouwd|ongetrouwd|gescheiden|alleenstaand|mannelijk|vrouwelijk|nuchter|verhinderd|afwezig|aanwezig|hartelijk|beleefd|onbeleefd|gezellig|spontaan|contant|onveilig|gewond|bewusteloos|bespreekbaar'),
 expression: words('tot ziens|dank je wel|ik ben van mening dat|dat lijkt me verstandig|ik zie dat anders|voor zover ik weet|voordat het zover was|het hangt ervan af|eet smakelijk'),
 adjectivePhrase: words('goed bereikbaar|afhankelijk van|tevreden over|trots op|bang voor|benieuwd naar|geschikt voor|verantwoordelijk voor|bezorgd over|bekend met|gewend aan|afkomstig uit'),
 adverbPhrase: words('op loopafstand|stap voor stap|buiten het seizoen|volgens mij|naar mijn mening|op dat moment|in de tussentijd|vanaf dat moment|ten slotte|in plaats van|in tegenstelling tot|op zoek naar|tot nu toe|met mate|op recept|zonder recept|te laat|te vroeg|op tijd|inclusief ontbijt|op naam van'),
 nounPhrase: words('een tafel voor twee|eerste hulp'),
}

// Phrase | verb lemma | object/adverbial before the final verb | trailing prepositional phrase.
// {r} is replaced by me/je/zich/ons/je/zich, so it never stays "zich" for every person.
export const verbPhrases = Object.fromEntries(`
ervaring opdoen|opdoen|ervaring|
akkoord gaan met|gaan|akkoord|met …
rekening houden met|houden|rekening|met …
op de hoogte houden|houden|je op de hoogte|
tot een oplossing komen|komen|tot een oplossing|
zich concentreren op|concentreren|{r}|op …
last hebben van|hebben|last|van …
zich zorgen maken over|maken|{r} zorgen|over …
zich voelen|voelen|{r}|
begrip tonen|tonen|begrip|
contact houden|houden|contact|
elkaar helpen|helpen|elkaar|
een afspraak maken|maken|een afspraak|
deelnemen aan|deelnemen||aan …
bijdragen aan|bijdragen||aan …
aanmelden voor|aanmelden|{r}|voor …
kennismaken met|kennismaken||met …
klagen over|klagen||over …
in aanmerking komen voor|komen|in aanmerking|voor …
toestemming geven|geven|toestemming|
een bestand herstellen|herstellen|een bestand|
verbinding maken|maken|verbinding|
afval scheiden|scheiden|afval|
energie besparen|besparen|energie|
zuinig omgaan met|omgaan|zuinig|met …
afval voorkomen|voorkomen|afval|
voorrang verlenen|verlenen|voorrang|
zich aan de regels houden|houden|{r} aan de regels|
een kamer boeken|boeken|een kamer|
een reservering wijzigen|wijzigen|een reservering|
gelijk hebben|hebben|gelijk|
een standpunt verdedigen|verdedigen|een standpunt|
een mening onderbouwen|onderbouwen|een mening|
een voorbeeld geven|geven|een voorbeeld|
een compromis sluiten|sluiten|een compromis|
een ervaring delen|delen|een ervaring|
terugkijken op|terugkijken||op …
een verhaal vertellen|vertellen|een verhaal|
interesse hebben in|hebben|interesse|in …
behoefte hebben aan|hebben|behoefte|aan …
zin hebben in|hebben|zin|in …
moeite hebben met|hebben|moeite|met …
vertrouwen op|vertrouwen||op …
rekenen op|rekenen||op …
wennen aan|wennen||aan …
zorgen voor|zorgen||voor …
denken aan|denken||aan …
wachten op|wachten||op …
belang hechten aan|hechten|belang|aan …
leiden tot|leiden||tot …
bestaan uit|bestaan||uit …
vergelijken met|vergelijken|…|met …
omgaan met|omgaan||met …
aandacht besteden aan|besteden|aandacht|aan …
beschikken over|beschikken||over …
op de hoogte zijn van|zijn|op de hoogte|van …
in contact blijven met|blijven|in contact|met …
een afspraak afzeggen|afzeggen|een afspraak|
een vergadering uitstellen|uitstellen|een vergadering|
een formulier invullen|invullen|een formulier|
informatie opzoeken|opzoeken|informatie|
een bericht doorgeven|doorgeven|een bericht|
een pakket ophalen|ophalen|een pakket|
een kind wegbrengen|wegbrengen|een kind|
een aankoop terugbrengen|terugbrengen|een aankoop|
een plan uitwerken|uitwerken|een plan|
een cursus uitzoeken|uitzoeken|een cursus|
een document opslaan|opslaan|een document|
een woord uitspreken|uitspreken|een woord|
een regel uitleggen|uitleggen|een regel|
een voorstel afwijzen|afwijzen|een voorstel|
een oplossing aandragen|aandragen|een oplossing|
een fout toegeven|toegeven|een fout|
een bedrag terugkrijgen|terugkrijgen|een bedrag|
een reservering omboeken|omboeken|een reservering|
een gesprek voortzetten|voortzetten|een gesprek|
een jas aantrekken|aantrekken|een jas|
schoenen uittrekken|uittrekken|schoenen|
een lamp aanzetten|aanzetten|een lamp|
een kamer opruimen|opruimen|een kamer|
een vriend uitnodigen|uitnodigen|een vriend|
een aanvraag indienen|indienen|een aanvraag|
een verzoek afhandelen|afhandelen|een verzoek|
een afspraak nakomen|nakomen|een afspraak|
een hobby oppakken|oppakken|een hobby|
zich voorstellen|voorstellen|{r}|
zich aanmelden|aanmelden|{r}|
zich afmelden|afmelden|{r}|
zich inschrijven|inschrijven|{r}|
zich voorbereiden op|voorbereiden|{r}|op …
zich aanpassen aan|aanpassen|{r}|aan …
zich vergissen|vergissen|{r}|
zich herinneren|herinneren|{r}|
zich realiseren|realiseren|{r}|
zich afvragen|afvragen|{r}|
zich zorgen maken|maken|{r} zorgen|
zich ergeren aan|ergeren|{r}|aan …
zich vervelen|vervelen|{r}|
zich ontspannen|ontspannen|{r}|
zich haasten|haasten|{r}|
zich richten op|richten|{r}|op …
zich interesseren voor|interesseren|{r}|voor …
zich schamen voor|schamen|{r}|voor …
zich gedragen|gedragen|{r}|
zich bevinden|bevinden|{r}|
zich verheugen op|verheugen|{r}|op …
zich aankleden|aankleden|{r}|
zich uitkleden|uitkleden|{r}|
zich wassen|wassen|{r}|
zich omdraaien|omdraaien|{r}|
zich verplaatsen|verplaatsen|{r}|
zich ontwikkelen|ontwikkelen|{r}|
zich inzetten voor|inzetten|{r}|voor …
elkaar ontmoeten|ontmoeten|elkaar|
elkaar ondersteunen|ondersteunen|elkaar|
voldoende bewegen|bewegen|voldoende|
op tijd naar bed gaan|gaan|op tijd naar bed|
een gewoonte veranderen|veranderen|een gewoonte|
hulp inschakelen|inschakelen|hulp|
een storing melden|melden|een storing|
iemand waarschuwen|waarschuwen|iemand|
een veilige plek zoeken|zoeken|een veilige plek|
bronnen controleren|controleren|bronnen|
wakker worden|worden|wakker|
boodschappen doen|doen|boodschappen|
in de rij staan|staan|in de rij|
apart betalen|betalen|apart|
uit eten gaan|gaan|uit eten|
eropuit gaan|gaan|eropuit|
op pad gaan|gaan|op pad|
recht hebben op|hebben|recht|op …
bezwaar maken|maken|bezwaar|
zich beroepen op|beroepen|{r}|op …
zich verstaanbaar maken|maken|{r} verstaanbaar|
een aansluiting missen|missen|een aansluiting|
zich excuseren|excuseren|{r}|
afscheid nemen van|nemen|afscheid|van …
de afspraak nakomen|nakomen|de afspraak|
de voortgang bijhouden|bijhouden|de voortgang|
de bestelling annuleren|annuleren|de bestelling|
de verwarming lager zetten|zetten|de verwarming lager|
de route uitstippelen|uitstippelen|de route|
het eens zijn met|zijn|het eens|met …
het oneens zijn met|zijn|het oneens|met …
de administratie bijhouden|bijhouden|de administratie|
de televisie uitzetten|uitzetten|de televisie|
de weg vrijhouden|vrijhouden|de weg|
de rekening splitsen|splitsen|de rekening|
`.trim().split('\n').map(line => {
 const [word,lemma,object,after] = line.split('|')
 return [word,{lemma,object,after}]
}))

// Separable prefixes are explicit, not guessed from the beginning of a word.
export const separablePrefixes = Object.fromEntries(Object.entries({
 aan:'aankomen aannemen aanvullen aanpassen aanvragen aanmaken aanspreken aanbieden aangeven aankruisen aandragen aantrekken aanzetten aanmelden aankleden',
 af:'afspreken afronden afwijzen afschrijven afremmen afwegen afrekenen afhalen afdrogen afgieten afkoelen afruimen afwassen aflossen afstemmen afzeggen afhandelen afmelden afvragen',
 bij:'bijhouden bijdragen bijwerken bijboeken bijpraten',
 door:'doorgeven doorsturen doorreizen',
 in:'inrichten inwerken inpakken indienen invullen inloggen inchecken inhalen innemen inplannen instappen inleveren invriezen inschrijven inzetten inschakelen',
 uit:'uitvoeren uitstellen uitpakken uitleggen uitgeven uitloggen uitwijken uitchecken uitstappen uitslapen uitnodigen uitspreken uitwerken uitzoeken uittrekken uitkleden uitzetten uitstippelen',
 op:'opzeggen opslaan optreden opstaan opladen opvouwen opwarmen opscheppen opnemen opsporen opdoen opzoeken ophalen opruimen oppakken',
 over:'overstappen oversteken overmaken',
 mee:'meedoen meerijden meebrengen meebetalen',
 na:'nalopen navragen nakomen', om:'omreizen omgaan omboeken omdraaien',
 terug:'terugbetalen terugbrengen terugkomen terugsturen terugvinden terugkijken terugkrijgen',
 toe:'toestaan toelichten toevoegen toegeven',
 voor:'voorstellen voorschieten voorbereiden', vooruit:'vooruitgaan', voort:'voortzetten',
 samen:'samenvatten samenwerken', vast:'vaststellen vastzitten', los:'loszitten',
 vrij:'vrijhouden', weg:'wegrennen wegbrengen', thuis:'thuiskomen',
 dicht:'dichtplakken', hard:'hardlopen', adem:'ademhalen', kennis:'kennismaken',
 gerust:'geruststellen', kwijt:'kwijtraken', langs:'langskomen', goed:'goedkeuren', achter:'achterlopen', deel:'deelnemen',
}).flatMap(([prefix,list])=>list.split(' ').map(lemma=>[lemma,prefix])))

export const pluralNouns = words('de boodschappen|de hersenen|de kosten|de inkomsten|de uitgaven|de ouders|de kleren|de kledingstukken|de notulen|de gegevens|de persoonsgegevens|de contactgegevens|de openingstijden|de arbeidsvoorwaarden|de voorzieningen|de omstandigheden|de verkiezingen|de omwonenden|de buurtbewoners|de gewoonten|de goede voornemens|de verloren voorwerpen|de mobiele data|de spullen|de mensen|de kinderen|de medicijnen|de klachten|de bijwerkingen')
export const massNouns = words('het water|het brood|de melk|de koffie|de thee|het geld|het weer|het nieuws|de informatie|de hulp|het advies|de rijst|het zout|de suiker|de kaas|de boter|de olie|het vlees|de vis|de kip|het fruit|de groente|het afval|het verkeer|het vervoer|het openbaar vervoer|het onderwijs|de energie|de elektriciteit|het gas|de lucht|de regen|de sneeuw|het ijs|het zand|de natuur|de muziek|het werk|de kleding|de ervaring|het onderzoek|de aandacht|de toestemming|het vertrouwen|het begrip|de haast|het geduld|de veiligheid|de gezondheid|de zorg|de huisvesting|de administratie|het bewijs|het gedrag|het openbaar groen|het wederzijds begrip|de vrije tijd|het ontbijt|de lunch|het avondeten|het avondmaal|de warmte|de kou|de schade|de overlast|de mist|de brandstof|het verkeer|het internet|de post|de reclame|de discriminatie|de werkloosheid|het personeel|het nieuwsbericht|de bevolking|de publieke opinie')

export function annotateWord(word, verbs) {
 const phrase = verbPhrases[word]
 if (phrase) return {kind:'verb',pos:'动词短语',posNl:'werkwoordelijke uitdrukking',...phrase,...(['een bestand herstellen','een gewoonte veranderen','voldoende bewegen'].includes(word)?{auxiliary:['hebben']}:{})}
 for (const [kind,group] of Object.entries(posGroups)) if(group.has(word)) {
  const [pos,posNl]=posLabels[kind]
  const result={kind,pos,posNl}
  if(kind==='noun'){result.bare=true;result.lemma=word}
  return result
 }
 if(/^(de|het) /.test(word)) {
  const [article,...rest]=word.split(' ')
  return {kind:'noun',pos:'名词',posNl:'zelfstandig naamwoord',article,lemma:rest.join(' '),
   number:pluralNouns.has(word)||['de verzendkosten','de wegwerkzaamheden','de koolhydraten','de ingrediënten','de oogdruppels','de servicekosten'].includes(word)?'plural':'singular',countability:massNouns.has(word)&&!['het advies','het onderzoek','het nieuwsbericht','de ervaring','het bewijs','de vis','de kip','de bevolking'].includes(word)?'mass':'unspecified'}
 }
 if(verbs[word]) return {kind:'verb',pos:'动词',posNl:'werkwoord',lemma:word,object:'',after:''}
 throw Error('Missing explicit part of speech: '+word)
}
