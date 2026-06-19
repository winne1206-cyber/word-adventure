const state = {
  activeChildId: "jim",
  activeCategory: "animals",
  wordIndex: 0,
  quizWord: null,
  quizMode: null,
  currentQuiz: null,
  quizCategoryId: null,
  parentUnlocked: false
};

const wordDataCache = {
  version: 0,
  activeKey: "",
  activeStages: null,
  allKey: "",
  allWords: null
};

const GARDEN_LEVELS = [
  { level: 1, points: 0, name: "\u7a7a\u5730", icon: "\u2b1c", item: null },
  { level: 2, points: 20, name: "\u5c0f\u8349", icon: "\ud83c\udf31", item: "\u5c0f\u8349" },
  { level: 3, points: 50, name: "\u5c0f\u82bd", icon: "\ud83c\udf3f", item: "\u5c0f\u82bd" },
  { level: 4, points: 100, name: "\u5c0f\u82b1", icon: "\ud83c\udf37", item: "\u5c0f\u82b1" },
  { level: 5, points: 180, name: "\u82b1\u53e2", icon: "\ud83c\udf38\ud83c\udf3c", item: "\u82b1\u53e2" },
  { level: 6, points: 300, name: "\u5c0f\u6a39", icon: "\ud83c\udf33", item: "\u5c0f\u6a39" },
  { level: 7, points: 450, name: "\u8774\u8776", icon: "\ud83e\udd8b", item: "\u8774\u8776" },
  { level: 8, points: 650, name: "\u6c60\u5858", icon: "\ud83c\udf33\ud83d\udca7", item: "\u6c60\u5858" },
  { level: 9, points: 900, name: "\u5f69\u8679", icon: "\ud83c\udf08", item: "\u5f69\u8679" },
  { level: 10, points: 1200, name: "\u7955\u5bc6\u82b1\u5712\u5b8c\u6210", icon: "\ud83c\udf08\ud83c\udf33\ud83c\udf38\ud83c\udfe1", item: "\u7955\u5bc6\u5c0f\u5c4b" }
];

const QUIZ_MODES = {
  choice_en_to_zh: {
    id: "choice_en_to_zh",
    label: "看英文選中文",
    helper: "看英文單字，選出正確中文意思。",
    icon: "A",
    type: "choice",
    questionLabel: "請選中文意思",
    question: (word) => word.en,
    answer: (word) => getMeaning(word),
    option: (word) => getMeaning(word)
  },
  choice_zh_to_en: {
    id: "choice_zh_to_en",
    label: "看中文選英文",
    helper: "看中文意思，選出正確英文單字。",
    icon: "中",
    type: "choice",
    questionLabel: "請選英文單字",
    question: (word) => getMeaning(word),
    answer: (word) => word.en,
    option: (word) => word.en
  },
  choice_picture_to_en: {
    id: "choice_picture_to_en",
    label: "看圖選英文",
    helper: "看圖片，選出正確英文單字。",
    icon: "🖼️",
    type: "choice",
    questionLabel: "這是什麼英文？",
    question: (word) => word.emoji,
    answer: (word) => word.en,
    option: (word) => word.en
  },
  listening_choice: {
    id: "listening_choice",
    label: "\u807d\u767c\u97f3\u9078\u82f1\u6587",
    helper: "\u6309\u767c\u97f3\uff0c\u9078\u51fa\u807d\u5230\u7684\u82f1\u6587\u55ae\u5b57\u3002",
    icon: "🔊",
    type: "choice",
    questionLabel: "\u807d\u767c\u97f3\uff0c\u9078\u82f1\u6587\u55ae\u5b57",
    question: (word) => word.en,
    answer: (word) => word.en,
    option: (word) => word.en
  },
  spelling: {
    id: "spelling",
    label: "拼字測驗",
    helper: "看中文與圖片，拼出英文單字。",
    icon: "abc",
    type: "spelling"
  }
};

const LEGACY_CHILD_ID_MAP = {
  older: "jim",
  younger: "ethan"
};

const LEGACY_QUIZ_MODE_MAP = {
  enToZh: "choice_en_to_zh",
  zhToEn: "choice_zh_to_en",
  imageToEn: "choice_picture_to_en",
  spelling: "spelling"
};

const DEFAULT_REWARD_STORE_ITEMS = [
  { id: "sticker", name: "貼紙", costDiamonds: 1, type: "physical", icon: "⭐" },
  { id: "snack", name: "小零食", costDiamonds: 3, type: "physical", icon: "🍪" },
  { id: "english_bonus_10", name: "10 元英文獎勵金", costDiamonds: 5, type: "money", icon: "💰" },
  { id: "small_gift", name: "小禮物", costDiamonds: 10, type: "physical", icon: "🎁" },
  { id: "big_gift", name: "大禮物 / 特別活動", costDiamonds: 20, type: "activity", icon: "🏆" }
];

function defaultRewardStoreItems() {
  return DEFAULT_REWARD_STORE_ITEMS.map((item) => ({ ...item }));
}


const DISPLAY_CATEGORY_GROUPS = {
  adventure_animals: {
    zh: "\u52d5\u7269\u81ea\u7136",
    icon: "\ud83d\udc3e",
    color: "green",
    categories: ["animals", "nature"]
  },
  daily_food_home: {
    zh: "\u98df\u7269\u751f\u6d3b",
    icon: "\ud83c\udf5a",
    color: "orange",
    categories: ["foods", "tableware", "home"]
  },
  people_body: {
    zh: "\u4eba\u7269\u8eab\u9ad4",
    icon: "\ud83d\ude0a",
    color: "pink",
    categories: ["body", "family", "people", "titles", "jobs", "health"]
  },
  school_words: {
    zh: "\u5b78\u6821\u6587\u5177",
    icon: "\ud83d\udcda",
    color: "blue",
    categories: ["school"]
  },
  numbers_time: {
    zh: "\u6578\u5b57\u6642\u9593",
    icon: "\ud83d\udd22",
    color: "purple",
    categories: ["numbers", "time", "money"]
  },
  colors_sizes: {
    zh: "\u984f\u8272\u5927\u5c0f",
    icon: "\ud83c\udfa8",
    color: "pink",
    categories: ["colors", "sizeMeasurement"]
  },
  places_play: {
    zh: "\u5730\u65b9\u73a9\u6a02",
    icon: "\ud83d\ude97",
    color: "mint",
    categories: ["hobbies", "clothes", "transportation", "places", "geography", "holidays"]
  },
  useful_words: {
    zh: "\u5be6\u7528\u55ae\u5b57",
    icon: "\u2b50",
    color: "gold",
    categories: ["others", "prepositions", "auxiliaries", "conjunctions", "interjections", "traits", "determiners", "pronouns", "questionWords"]
  }
};

const DISPLAY_CATEGORY_LOOKUP = Object.entries(DISPLAY_CATEGORY_GROUPS).reduce((lookup, [groupId, group]) => {
  group.categories.forEach((categoryId) => {
    lookup[categoryId.toLowerCase()] = groupId;
  });
  return lookup;
}, {});

const WORD_EMOJI_OVERRIDES = {
  "animals:animal": "\u{1F43E}",
  "animals:bear": "\u{1F43B}",
  "animals:bee": "\u{1F41D}",
  "animals:bird": "\u{1F426}",
  "animals:bite": "\u{1F9B7}",
  "animals:butterfly": "\u{1F98B}",
  "animals:cat": "\u{1F431}",
  "animals:chicken": "\u{1F414}",
  "animals:cow": "\u{1F404}",
  "animals:dog": "\u{1F436}",
  "animals:duck": "\u{1F986}",
  "animals:elephant": "\u{1F418}",
  "animals:fish": "\u{1F41F}",
  "animals:frog": "\u{1F438}",
  "animals:hippo": "\u{1F99B}",
  "animals:horse": "\u{1F434}",
  "animals:koala": "\u{1F428}",
  "animals:lion": "\u{1F981}",
  "animals:mice": "\u{1F42D}",
  "animals:monkey": "\u{1F435}",
  "animals:mouse": "\u{1F42D}",
  "animals:panda": "\u{1F43C}",
  "animals:pet": "\u{1F43E}",
  "animals:pig": "\u{1F437}",
  "animals:rabbit": "\u{1F430}",
  "animals:sheep": "\u{1F411}",
  "animals:snake": "\u{1F40D}",
  "animals:spider": "\u{1F577}\uFE0F",
  "animals:tiger": "\u{1F42F}",
  "animals:turtle": "\u{1F422}",
  "animals:whale": "\u{1F433}",
  "animals:zebra": "\u{1F993}",
  "foods:apple": "\u{1F34E}",
  "foods:banana": "\u{1F34C}",
  "foods:beef": "\u{1F969}",
  "foods:bread": "\u{1F35E}",
  "foods:breakfast": "\u{1F373}",
  "foods:cake": "\u{1F370}",
  "foods:candy": "\u{1F36C}",
  "foods:chicken": "\u{1F357}",
  "foods:chocolate": "\u{1F36B}",
  "foods:coffee": "\u{2615}",
  "foods:coke": "\u{1F964}",
  "foods:cookies": "\u{1F36A}",
  "foods:cook": "\u{1F373}",
  "foods:dinner": "\u{1F37D}\uFE0F",
  "foods:drink": "\u{1F964}",
  "foods:duck": "\u{1F986}",
  "foods:dumpling": "\u{1F95F}",
  "foods:egg": "\u{1F95A}",
  "foods:fish": "\u{1F41F}",
  "foods:food": "\u{1F37D}\uFE0F",
  "foods:french fries": "\u{1F35F}",
  "foods:fruit": "\u{1F34E}",
  "foods:grape": "\u{1F347}",
  "foods:hamburger": "\u{1F354}",
  "foods:ice cream": "\u{1F366}",
  "foods:juice": "\u{1F9C3}",
  "foods:lemon": "\u{1F34B}",
  "foods:lunch": "\u{1F371}",
  "foods:meal": "\u{1F37D}\uFE0F",
  "foods:milk": "\u{1F95B}",
  "foods:noodles": "\u{1F35C}",
  "foods:orange": "\u{1F34A}",
  "foods:peach": "\u{1F351}",
  "foods:pie": "\u{1F967}",
  "foods:pizza": "\u{1F355}",
  "foods:pork": "\u{1F969}",
  "foods:pumpkin": "\u{1F383}",
  "foods:rice": "\u{1F35A}",
  "foods:salad": "\u{1F957}",
  "foods:sandwich": "\u{1F96A}",
  "foods:soup": "\u{1F372}",
  "foods:steak": "\u{1F969}",
  "foods:tea": "\u{1F375}",
  "foods:tomato": "\u{1F345}",
  "foods:water": "\u{1F4A7}",
  "tableware:chopsticks": "\u{1F962}",
  "tableware:cup": "\u{1F964}",
  "tableware:dish": "\u{1F37D}\uFE0F",
  "tableware:fork": "\u{1F374}",
  "tableware:glass": "\u{1F95B}",
  "tableware:knife": "\u{1F52A}",
  "tableware:spoon": "\u{1F944}",
  "colors:black": "\u{26AB}",
  "colors:blue": "\u{1F535}",
  "colors:brown": "\u{1F7E4}",
  "colors:color": "\u{1F3A8}",
  "colors:gray": "\u{1FA76}",
  "colors:green": "\u{1F7E2}",
  "colors:orange": "\u{1F7E0}",
  "colors:pink": "\u{1FA77}",
  "colors:purple": "\u{1F7E3}",
  "colors:red": "\u{1F534}",
  "colors:white": "\u{26AA}",
  "colors:yellow": "\u{1F7E1}",
  "body:arm": "\u{1F4AA}",
  "body:back": "\u{1F9CD}",
  "body:ear": "\u{1F442}",
  "body:eye": "\u{1F441}\uFE0F",
  "body:face": "\u{1F642}",
  "body:feet": "\u{1F9B6}",
  "body:foot": "\u{1F9B6}",
  "body:hair": "\u{1F487}",
  "body:hand": "\u{270B}",
  "body:head": "\u{1F642}",
  "body:leg": "\u{1F9B5}",
  "body:mouth": "\u{1F444}",
  "body:nose": "\u{1F443}",
  "body:teeth": "\u{1F9B7}",
  "body:tooth": "\u{1F9B7}",
  "clothes:bag": "\u{1F392}",
  "clothes:cap": "\u{1F9E2}",
  "clothes:clothes": "\u{1F455}",
  "clothes:coat": "\u{1F9E5}",
  "clothes:dress": "\u{1F457}",
  "clothes:glasses": "\u{1F453}",
  "clothes:hat": "\u{1F452}",
  "clothes:jacket": "\u{1F9E5}",
  "clothes:pants": "\u{1F456}",
  "clothes:pocket": "\u{1F455}",
  "clothes:shirt": "\u{1F455}",
  "clothes:shoes": "\u{1F45F}",
  "clothes:shorts": "\u{1FA73}",
  "clothes:skirt": "\u{1F457}",
  "clothes:socks": "\u{1F9E6}",
  "clothes:sweater": "\u{1F9F6}",
  "clothes:t-shirt": "\u{1F455}",
  "clothes:umbrella": "\u{2602}\uFE0F",
  "family:aunt": "\u{1F469}",
  "family:brother": "\u{1F466}",
  "family:cousin": "\u{1F9D2}",
  "family:dad": "\u{1F468}",
  "family:daddy": "\u{1F468}",
  "family:daughter": "\u{1F467}",
  "family:family": "\u{1F46A}",
  "family:father": "\u{1F468}",
  "family:grandfather": "\u{1F474}",
  "family:grandma": "\u{1F475}",
  "family:grandmother": "\u{1F475}",
  "family:grandpa": "\u{1F474}",
  "family:mom": "\u{1F469}",
  "family:mommy": "\u{1F469}",
  "family:mother": "\u{1F469}",
  "family:parent": "\u{1F46A}",
  "family:sister": "\u{1F467}",
  "family:son": "\u{1F466}",
  "family:uncle": "\u{1F468}",
  "people:baby": "\u{1F476}",
  "people:boy": "\u{1F466}",
  "people:girl": "\u{1F467}",
  "people:kid": "\u{1F9D2}",
  "people:man": "\u{1F468}",
  "people:men": "\u{1F468}",
  "people:people": "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
  "people:person": "\u{1F9D1}",
  "people:woman": "\u{1F469}",
  "people:women": "\u{1F469}",
  "geography:beach": "\u{1F3D6}\uFE0F",
  "geography:lake": "\u{1F3DE}\uFE0F",
  "geography:mountain": "\u{26F0}\uFE0F",
  "geography:river": "\u{1F30A}",
  "geography:sea": "\u{1F30A}",
  "nature:cloudy": "\u{2601}\uFE0F",
  "nature:cold": "\u{2744}\uFE0F",
  "nature:cool": "\u{1F32C}\uFE0F",
  "nature:hot": "\u{1F525}",
  "nature:moon": "\u{1F319}",
  "nature:rain": "\u{1F327}\uFE0F",
  "nature:rainbow": "\u{1F308}",
  "nature:rainy": "\u{1F327}\uFE0F",
  "nature:sky": "\u{1F30C}",
  "nature:snow": "\u{2744}\uFE0F",
  "nature:star": "\u{2B50}",
  "nature:sun": "\u{2600}\uFE0F",
  "nature:sunny": "\u{2600}\uFE0F",
  "nature:typhoon": "\u{1F300}",
  "nature:warm": "\u{2600}\uFE0F",
  "nature:weather": "\u{1F324}\uFE0F",
  "nature:wet": "\u{1F4A7}",
  "nature:wind": "\u{1F32C}\uFE0F",
  "nature:windy": "\u{1F32C}\uFE0F",
  "hobbies:ball": "\u{26BD}",
  "hobbies:baseball": "\u{26BE}",
  "hobbies:basketball": "\u{1F3C0}",
  "hobbies:card": "\u{1F0CF}",
  "hobbies:climb": "\u{1F9D7}",
  "hobbies:dance": "\u{1F483}",
  "hobbies:doll": "\u{1F9F8}",
  "hobbies:drum": "\u{1F941}",
  "hobbies:fish": "\u{1F3A3}",
  "hobbies:football": "\u{1F3C8}",
  "hobbies:game": "\u{1F3AE}",
  "hobbies:hike": "\u{1F97E}",
  "hobbies:kite": "\u{1FA81}",
  "hobbies:movie": "\u{1F3AC}",
  "hobbies:paint": "\u{1F3A8}",
  "hobbies:piano": "\u{1F3B9}",
  "hobbies:run": "\u{1F3C3}",
  "hobbies:sing": "\u{1F3A4}",
  "hobbies:soccer": "\u{26BD}",
  "hobbies:song": "\u{1F3B5}",
  "hobbies:sport": "\u{26BD}",
  "hobbies:swim": "\u{1F3CA}",
  "hobbies:toy": "\u{1F9F8}",
  "hobbies:trip": "\u{1F9F3}",
  "hobbies:yo-yo": "\u{1FA80}",
  "home:bathroom": "\u{1F6BD}",
  "home:bed": "\u{1F6CF}\uFE0F",
  "home:bedroom": "\u{1F6CF}\uFE0F",
  "home:chair": "\u{1FA91}",
  "home:clean": "\u{1F9FC}",
  "home:computer": "\u{1F4BB}",
  "home:desk": "\u{1FA91}",
  "home:dining room": "\u{1F37D}\uFE0F",
  "home:door": "\u{1F6AA}",
  "home:fan": "\u{1FAAD}",
  "home:floor": "\u{1F9F9}",
  "home:fridge": "\u{1F9CA}",
  "home:garden": "\u{1FAB4}",
  "home:home": "\u{1F3E0}",
  "home:house": "\u{1F3E0}",
  "home:key": "\u{1F511}",
  "home:kitchen": "\u{1F373}",
  "home:lamp": "\u{1F4A1}",
  "home:living room": "\u{1F6CB}\uFE0F",
  "home:mop": "\u{1F9F9}",
  "home:refrigerator": "\u{1F9CA}",
  "home:shelf": "\u{1F4DA}",
  "home:shower": "\u{1F6BF}",
  "home:sofa": "\u{1F6CB}\uFE0F",
  "home:street": "\u{1F6E3}\uFE0F",
  "home:table": "\u{1FA91}",
  "home:telephone": "\u{260E}\uFE0F",
  "home:television": "\u{1F4FA}",
  "home:towel": "\u{1F9FB}",
  "home:tv": "\u{1F4FA}",
  "home:wall": "\u{1F9F1}",
  "home:window": "\u{1FA9F}",
  "jobs:actor": "\u{1F3AD}",
  "jobs:actress": "\u{1F3AD}",
  "jobs:cook": "\u{1F9D1}\u200D\u{1F373}",
  "jobs:doctor": "\u{1F9D1}\u200D\u2695\uFE0F",
  "jobs:driver": "\u{1F697}",
  "jobs:farmer": "\u{1F9D1}\u200D\u{1F33E}",
  "jobs:mailman": "\u{1F4EE}",
  "jobs:nurse": "\u{1F469}\u200D\u2695\uFE0F",
  "jobs:police officer": "\u{1F46E}",
  "jobs:singer": "\u{1F3A4}",
  "jobs:soldier": "\u{1F482}",
  "jobs:waiter": "\u{1F37D}\uFE0F",
  "jobs:waitress": "\u{1F37D}\uFE0F",
  "health:cold": "\u{1F927}",
  "health:headache": "\u{1F915}",
  "health:sick": "\u{1F912}",
  "health:strong": "\u{1F4AA}",
  "health:tired": "\u{1F62A}",
  "health:toothache": "\u{1F9B7}",
  "health:well": "\u{1F642}",
  "money:buy": "\u{1F6D2}",
  "money:dollar": "\u{1F4B5}",
  "money:money": "\u{1F4B0}",
  "time:may": "\u{1F4C5}",
  "numbers:zero": "0\uFE0F\u20E3",
  "numbers:one": "1\uFE0F\u20E3",
  "numbers:two": "2\uFE0F\u20E3",
  "numbers:three": "3\uFE0F\u20E3",
  "numbers:four": "4\uFE0F\u20E3",
  "numbers:five": "5\uFE0F\u20E3",
  "numbers:six": "6\uFE0F\u20E3",
  "numbers:seven": "7\uFE0F\u20E3",
  "numbers:eight": "8\uFE0F\u20E3",
  "numbers:nine": "9\uFE0F\u20E3",
  "numbers:ten": "\u{1F51F}",
  "others:birthday": "\u{1F382}",
  "others:bottle": "\u{1F37C}",
  "others:box": "\u{1F4E6}",
  "others:brush": "\u{1FAA5}",
  "others:call": "\u{1F4DE}",
  "others:can": "\u{1F96B}",
  "others:cellphone": "\u{1F4F1}",
  "others:close": "\u{1F6AA}",
  "others:come": "\u{1F6B6}",
  "others:cool": "\u{1F9CA}",
  "others:cry": "\u{1F622}",
  "others:different": "\u{1F500}",
  "others:dirty": "\u{1F9FC}",
  "others:do": "\u{1F6E0}\uFE0F",
  "others:dream": "\u{1F4AD}",
  "others:easy": "\u{1F642}",
  "others:email": "\u{2709}\uFE0F",
  "others:enjoy": "\u{1F60A}",
  "others:fall": "\u{2B07}\uFE0F",
  "others:favorite": "\u{2764}\uFE0F",
  "others:feel": "\u{1F4AD}",
  "others:find": "\u{1F50D}",
  "others:fine": "\u{1F44D}",
  "others:flower": "\u{1F338}",
  "others:fun": "\u{1F389}",
  "others:get": "\u{1F932}",
  "others:gift": "\u{1F381}",
  "others:give": "\u{1F381}",
  "others:go": "\u{27A1}\uFE0F",
  "others:great": "\u{1F44D}",
  "others:hard": "\u{1F9E9}",
  "others:have": "\u{1F932}",
  "others:help": "\u{1F91D}",
  "others:hit": "\u{1F44A}",
  "others:hope": "\u{1F64F}",
  "others:hot": "\u{1F525}",
  "others:hurry": "\u{1F3C3}",
  "others:hurt": "\u{1F915}",
  "others:interesting": "\u{1F914}",
  "others:jump": "\u{2B06}\uFE0F",
  "others:know": "\u{1F9E0}",
  "others:laugh": "\u{1F602}",
  "others:let's": "\u{1F91D}",
  "others:letter": "\u{2709}\uFE0F",
  "others:like": "\u{1F44D}",
  "others:look": "\u{1F440}",
  "others:love": "\u{2764}\uFE0F",
  "others:mail": "\u{2709}\uFE0F",
  "others:make": "\u{1F6E0}\uFE0F",
  "others:maybe": "\u{1F914}",
  "others:meet": "\u{1F91D}",
  "others:miss": "\u{1F4AD}",
  "others:need": "\u{1F64B}",
  "others:never": "\u{1F6AB}",
  "others:new": "\u{2728}",
  "others:no": "\u{274C}",
  "others:not": "\u{1F6AB}",
  "others:ok": "\u{1F44C}",
  "others:only": "\u{261D}\uFE0F",
  "others:open": "\u{1F6AA}",
  "others:other": "\u{2795}",
  "others:party": "\u{1F389}",
  "others:phone": "\u{1F4F1}",
  "others:photo": "\u{1F4F7}",
  "others:pick up": "\u{2B06}\uFE0F",
  "others:put": "\u{1F4E5}",
  "others:quiet": "\u{1F92B}",
  "others:ready": "\u{2705}",
  "others:really": "\u{2705}",
  "others:right": "\u{2705}",
  "others:robot": "\u{1F916}",
  "others:sale": "\u{1F3F7}\uFE0F",
  "others:see": "\u{1F440}",
  "others:show": "\u{1F440}",
  "others:sit": "\u{1FA91}",
  "others:sleep": "\u{1F634}",
  "others:smell": "\u{1F443}",
  "others:so": "\u{27A1}\uFE0F",
  "others:sometimes": "\u{1F552}",
  "others:sorry": "\u{1F647}",
  "others:stand": "\u{1F9CD}",
  "others:start": "\u{1F3C1}",
  "others:still": "\u{23F8}\uFE0F",
  "others:stop": "\u{1F6D1}",
  "others:sure": "\u{2705}",
  "others:take": "\u{1F932}",
  "others:tell": "\u{1F5E3}\uFE0F",
  "others:thank": "\u{1F64F}",
  "others:then": "\u{27A1}\uFE0F",
  "others:thing": "\u{1F4E6}",
  "others:ticket": "\u{1F39F}\uFE0F",
  "others:together": "\u{1F91D}",
  "others:too": "\u{2795}",
  "others:touch": "\u{1F446}",
  "others:trash": "\u{1F5D1}\uFE0F",
  "others:tree": "\u{1F333}",
  "others:try": "\u{1F4AA}",
  "others:usually": "\u{1F552}",
  "others:very": "\u{2757}",
  "others:wait": "\u{23F3}",
  "others:wake": "\u{23F0}",
  "others:walk": "\u{1F6B6}",
  "others:want": "\u{1F64B}",
  "others:watch": "\u{1F440}",
  "others:way": "\u{1F6E3}\uFE0F",
  "others:welcome": "\u{1F44B}",
  "others:wet": "\u{1F4A7}",
  "others:wonderful": "\u{1F31F}",
  "others:word": "\u{1F524}",
  "others:worry": "\u{1F61F}",
  "others:yes": "\u{2705}",
  "places:bank": "\u{1F3E6}",
  "places:back": "\u{1F519}",
  "places:bookstore": "\u{1F4DA}",
  "places:department store": "\u{1F3EC}",
  "places:fire station": "\u{1F692}",
  "places:hospital": "\u{1F3E5}",
  "places:japan": "\u{1F5FE}",
  "places:market": "\u{1F6D2}",
  "places:movie theater": "\u{1F3A6}",
  "places:museum": "\u{1F3DB}\uFE0F",
  "places:office": "\u{1F3E2}",
  "places:park": "\u{1F3DE}\uFE0F",
  "places:police station": "\u{1F46E}",
  "places:post office": "\u{1F3E4}",
  "places:restaurant": "\u{1F37D}\uFE0F",
  "places:restroom": "\u{1F6BB}",
  "places:left": "\u{2B05}\uFE0F",
  "places:right": "\u{27A1}\uFE0F",
  "places:shop": "\u{1F6D2}",
  "places:store": "\u{1F3EA}",
  "places:supermarket": "\u{1F6D2}",
  "places:taiwan": "\u{1F5FE}",
  "places:uk": "\u{1F1EC}\u{1F1E7}",
  "places:usa": "\u{1F1FA}\u{1F1F8}",
  "places:zoo": "\u{1F981}",
  "school:answer": "\u{2705}",
  "school:art": "\u{1F3A8}",
  "school:blackboard": "\u{1F4CB}",
  "school:book": "\u{1F4D6}",
  "school:chinese": "\u{1F1E8}\u{1F1F3}",
  "school:class": "\u{1F3EB}",
  "school:classroom": "\u{1F3EB}",
  "school:draw": "\u{270F}\uFE0F",
  "school:english": "\u{1F520}",
  "school:eraser": "\u{1F9FD}",
  "school:friend": "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
  "school:glue": "\u{1F9F4}",
  "school:homework": "\u{1F4DD}",
  "school:library": "\u{1F4DA}",
  "school:listen": "\u{1F442}",
  "school:marker": "\u{1F58A}\uFE0F",
  "school:math": "\u{1F9EE}",
  "school:music": "\u{1F3B5}",
  "school:paper": "\u{1F4C4}",
  "school:pe": "\u{26BD}",
  "school:pen": "\u{1F58A}\uFE0F",
  "school:pencil": "\u{270F}\uFE0F",
  "school:picture": "\u{1F5BC}\uFE0F",
  "school:question": "\u{2753}",
  "school:read": "\u{1F4D6}",
  "school:ruler": "\u{1F4CF}",
  "school:say": "\u{1F5E3}\uFE0F",
  "school:school": "\u{1F3EB}",
  "school:science": "\u{1F52C}",
  "school:speak": "\u{1F5E3}\uFE0F",
  "school:spell": "\u{1F524}",
  "school:story": "\u{1F4D6}",
  "school:student": "\u{1F9D1}\u200D\u{1F393}",
  "school:study": "\u{1F4D6}",
  "school:talk": "\u{1F5E3}\uFE0F",
  "school:teacher": "\u{1F9D1}\u200D\u{1F3EB}",
  "school:test": "\u{1F4DD}",
  "school:vacation": "\u{1F3D6}\uFE0F",
  "school:write": "\u{270F}\uFE0F",
  "determiners:a": "\u{0031}\uFE0F\u20E3",
  "determiners:an": "\u{0031}\uFE0F\u20E3",
  "determiners:every": "\u{1F501}",
  "determiners:her": "\u{1F467}",
  "determiners:his": "\u{1F466}",
  "determiners:its": "\u{1F43E}",
  "determiners:my": "\u{1F64B}",
  "determiners:our": "\u{1F46A}",
  "determiners:that": "\u{1F449}",
  "determiners:the": "\u{261D}\uFE0F",
  "determiners:their": "\u{1F46A}",
  "determiners:these": "\u{1F447}",
  "determiners:this": "\u{1F448}",
  "determiners:those": "\u{1F449}",
  "determiners:your": "\u{1F449}",
  "pronouns:he": "\u{1F466}",
  "pronouns:her": "\u{1F467}",
  "pronouns:him": "\u{1F466}",
  "pronouns:it": "\u{1F4E6}",
  "pronouns:me": "\u{1F64B}",
  "pronouns:nothing": "\u{1F6AB}",
  "pronouns:she": "\u{1F467}",
  "pronouns:them": "\u{1F46A}",
  "pronouns:they": "\u{1F46A}",
  "pronouns:us": "\u{1F46A}",
  "pronouns:we": "\u{1F46A}",
  "pronouns:you": "\u{1F449}",
  "questionWords:how": "\u{2753}",
  "questionWords:what": "\u{2753}",
  "questionWords:when": "\u{1F552}",
  "questionWords:where": "\u{1F4CD}",
  "questionWords:which": "\u{261D}\uFE0F",
  "questionWords:who": "\u{1F9D1}",
  "questionWords:whose": "\u{1F4DB}",
  "questionWords:why": "\u{2753}",
  "prepositions:about": "\u{1F4AC}",
  "prepositions:after": "\u{23E9}",
  "prepositions:at": "\u{1F4CD}",
  "prepositions:before": "\u{23EA}",
  "prepositions:behind": "\u{2B05}\uFE0F",
  "prepositions:by": "\u{2194}\uFE0F",
  "prepositions:for": "\u{1F381}",
  "prepositions:from": "\u{2B05}\uFE0F",
  "prepositions:in": "\u{1F4E5}",
  "prepositions:in front of": "\u{27A1}\uFE0F",
  "prepositions:inside": "\u{1F4E5}",
  "prepositions:near": "\u{1F9F2}",
  "prepositions:next to": "\u{2194}\uFE0F",
  "prepositions:of": "\u{1F517}",
  "prepositions:off": "\u{1F44B}",
  "prepositions:on": "\u{2B06}\uFE0F",
  "prepositions:out": "\u{1F4E4}",
  "prepositions:outside": "\u{1F4E4}",
  "prepositions:over": "\u{2B06}\uFE0F",
  "prepositions:than": "\u{2696}\uFE0F",
  "prepositions:to": "\u{27A1}\uFE0F",
  "prepositions:under": "\u{2B07}\uFE0F",
  "prepositions:up": "\u{2B06}\uFE0F",
  "prepositions:with": "\u{1F91D}",
  "conjunctions:and": "\u{1F517}",
  "conjunctions:because": "\u{1F4AC}",
  "conjunctions:but": "\u{1F504}",
  "interjections:bye": "\u{1F44B}",
  "interjections:excuse me": "\u{1F64B}",
  "interjections:goodbye": "\u{1F44B}",
  "interjections:hello": "\u{1F44B}",
  "interjections:hi": "\u{1F44B}",
  "interjections:please": "\u{1F64F}",
  "titles:miss": "\u{1F469}",
  "sizeMeasurement:big": "\u{2B06}\uFE0F",
  "sizeMeasurement:heavy": "\u{1F3CB}\uFE0F",
  "sizeMeasurement:high": "\u{2B06}\uFE0F",
  "sizeMeasurement:light": "\u{1FAB6}",
  "sizeMeasurement:long": "\u{1F4CF}",
  "sizeMeasurement:short": "\u{2195}\uFE0F",
  "sizeMeasurement:small": "\u{2B07}\uFE0F",
  "time:afternoon": "\u{1F324}\uFE0F",
  "time:clock": "\u{1F552}",
  "time:day": "\u{2600}\uFE0F",
  "time:evening": "\u{1F306}",
  "time:fall": "\u{1F342}",
  "time:morning": "\u{1F305}",
  "time:night": "\u{1F319}",
  "time:season": "\u{1F343}",
  "time:spring": "\u{1F33C}",
  "time:summer": "\u{2600}\uFE0F",
  "time:time": "\u{1F552}",
  "time:today": "\u{1F4C5}",
  "time:tomorrow": "\u{1F4C6}",
  "time:watch": "\u{231A}",
  "time:week": "\u{1F4C5}",
  "time:winter": "\u{2744}\uFE0F",
  "traits:angry": "\u{1F620}",
  "traits:bad": "\u{1F44E}",
  "traits:beautiful": "\u{1F338}",
  "traits:bored": "\u{1F971}",
  "traits:boring": "\u{1F971}",
  "traits:busy": "\u{1F3C3}",
  "traits:cute": "\u{1F60D}",
  "traits:excited": "\u{1F929}",
  "traits:exciting": "\u{1F389}",
  "traits:good": "\u{1F44D}",
  "traits:happy": "\u{1F60A}",
  "traits:heavy": "\u{1F3CB}\uFE0F",
  "traits:lazy": "\u{1F634}",
  "traits:mad": "\u{1F620}",
  "traits:nice": "\u{1F642}",
  "traits:old": "\u{1F474}",
  "traits:pretty": "\u{1F338}",
  "traits:sad": "\u{1F622}",
  "traits:short": "\u{2195}\uFE0F",
  "traits:smart": "\u{1F9E0}",
  "traits:tall": "\u{2B06}\uFE0F",
  "traits:thin": "\u{1F9CD}",
  "traits:young": "\u{1F9D2}",
  "sizeMeasurement:pair": "\u{1F45F}",
  "transportation:airplane": "\u{2708}\uFE0F",
  "transportation:airport": "\u{1F6EB}",
  "transportation:bicycle": "\u{1F6B2}",
  "transportation:bike": "\u{1F6B2}",
  "transportation:boat": "\u{26F5}",
  "transportation:bus": "\u{1F68C}",
  "transportation:bus stop": "\u{1F68F}",
  "transportation:car": "\u{1F697}",
  "transportation:drive": "\u{1F697}",
  "transportation:fly": "\u{2708}\uFE0F",
  "transportation:motorcycle": "\u{1F3CD}\uFE0F",
  "transportation:mrt": "\u{1F687}",
  "transportation:plane": "\u{2708}\uFE0F",
  "transportation:ride": "\u{1F6B2}",
  "transportation:scooter": "\u{1F6F5}",
  "transportation:ship": "\u{1F6A2}",
  "transportation:station": "\u{1F689}",
  "transportation:taxi": "\u{1F695}",
  "transportation:train": "\u{1F686}",
  "transportation:truck": "\u{1F69A}"
};

const WORD_IMAGE_OVERRIDES = {
  "animals:bite": "assets/words/bite.png"
};

const CATEGORY_EMOJI_FALLBACKS = {
  animals: "\u{1F43E}",
  foods: "\u{1F37D}\uFE0F",
  tableware: "\u{1F37D}\uFE0F",
  colors: "\u{1F3A8}",
  body: "\u{1F642}",
  clothes: "\u{1F455}",
  family: "\u{1F46A}",
  people: "\u{1F9D2}",
  geography: "\u{1F30A}",
  nature: "\u{1F324}\uFE0F",
  hobbies: "\u{26BD}",
  holidays: "\u{1F389}",
  home: "\u{1F3E0}",
  jobs: "\u{1F9D1}\u200D\u{1F4BC}",
  money: "\u{1F4B0}",
  numbers: "\u{1F522}",
  places: "\u{1F4CD}",
  school: "\u{1F4DA}",
  sizeMeasurement: "\u{1F4CF}",
  time: "\u{1F552}",
  transportation: "\u{1F697}",
  useful_words: "\u{2B50}",
  default: "\u{1F524}"
};

const GRAMMAR_ONLY_CATEGORIES = new Set([
  "determiners",
  "prepositions",
  "auxiliaries",
  "conjunctions",
  "pronouns",
  "questionwords"
]);

const GRAMMAR_USAGE_NOTES = {
  "determiners:a": {
    note: "\u7528\u5728\u5b50\u97f3\u958b\u982d\u7684\u55ae\u6578\u540d\u8a5e\u524d\uff0c\u8868\u793a\u300c\u4e00\u500b\u300d\u3002",
    sentence: "I see a dog."
  },
  "determiners:an": {
    note: "\u7528\u5728\u6bcd\u97f3\u8072\u97f3\u958b\u982d\u7684\u55ae\u6578\u540d\u8a5e\u524d\uff0c\u8868\u793a\u300c\u4e00\u500b\u300d\u3002",
    sentence: "I eat an apple."
  },
  "determiners:the": {
    note: "\u7528\u5728\u5927\u5bb6\u90fd\u77e5\u9053\uff0c\u6216\u524d\u9762\u5df2\u7d93\u63d0\u904e\u7684\u4eba\u4e8b\u7269\u524d\u3002",
    sentence: "The cat is on the chair."
  },
  "prepositions:at": {
    note: "\u8868\u793a\u5728\u67d0\u500b\u5730\u9ede\u6216\u6642\u9593\u9ede\u3002",
    sentence: "I am at school."
  },
  "prepositions:in": {
    note: "\u8868\u793a\u5728\u88e1\u9762\uff0c\u6216\u5728\u4e00\u6bb5\u6642\u9593\u88e1\u3002",
    sentence: "The book is in my bag."
  },
  "prepositions:on": {
    note: "\u8868\u793a\u5728\u4e0a\u9762\uff0c\u6216\u5728\u67d0\u4e00\u5929\u3002",
    sentence: "The cup is on the table."
  },
  "conjunctions:and": {
    note: "\u9023\u63a5\u5169\u500b\u4eba\u3001\u7269\u6216\u53e5\u5b50\uff0c\u610f\u601d\u662f\u300c\u548c\u300d\u3002",
    sentence: "Jim and Ai are reading."
  },
  "conjunctions:but": {
    note: "\u9023\u63a5\u76f8\u53cd\u7684\u60f3\u6cd5\uff0c\u610f\u601d\u662f\u300c\u4f46\u662f\u300d\u3002",
    sentence: "I like dogs, but I do not like snakes."
  },
  "conjunctions:because": {
    note: "\u8aaa\u660e\u539f\u56e0\uff0c\u610f\u601d\u662f\u300c\u56e0\u70ba\u300d\u3002",
    sentence: "I am happy because I got a star."
  },
  "auxiliaries:can": {
    note: "\u8868\u793a\u300c\u53ef\u4ee5\u3001\u6703\u300d\uff0c\u5f8c\u9762\u63a5\u539f\u5f62\u52d5\u8a5e\u3002",
    sentence: "I can swim."
  },
  "auxiliaries:do": {
    note: "\u53ef\u4ee5\u7528\u4f86\u554f\u554f\u984c\u6216\u5426\u5b9a\uff0c\u4e5f\u53ef\u4ee5\u8868\u793a\u300c\u505a\u300d\u3002",
    sentence: "Do you like apples?"
  },
  "auxiliaries:have": {
    note: "\u53ef\u4ee5\u8868\u793a\u300c\u6709\u300d\uff0c\u4e5f\u53ef\u4ee5\u7576\u52a9\u52d5\u8a5e\u4f7f\u7528\u3002",
    sentence: "I have a pencil."
  },
  "auxiliaries:be": {
    note: "be \u52d5\u8a5e\u6703\u8b8a\u6210 am\u3001is\u3001are\uff0c\u8868\u793a\u300c\u662f\u300d\u6216\u300c\u5728\u300d\u3002",
    sentence: "I am a student."
  },
  "auxiliaries:will": {
    note: "\u8868\u793a\u672a\u4f86\u6703\u505a\u7684\u4e8b\u3002",
    sentence: "I will read a book."
  },
  "traits:bad": {
    note: "\u5f62\u5bb9\u8a5e\uff0c\u7528\u4f86\u8aaa\u300c\u4e0d\u597d\u7684\u300d\u6216\u300c\u58de\u7684\u300d\u3002",
    sentence: "This apple is bad."
  },
  "body:back": {
    note: "\u540d\u8a5e\uff0c\u6307\u8eab\u9ad4\u5f8c\u9762\u7684\u300c\u80cc\u300d\u3002",
    sentence: "My back hurts."
  },
  "places:back": {
    note: "\u53ef\u8868\u793a\u300c\u5f8c\u9762\u300d\u6216\u300c\u56de\u4f86\u300d\u3002",
    sentence: "Please come back."
  }
};

const EXAMPLE_SENTENCE_OVERRIDES = {
  "animals:ant": "The ant is tiny.",
  "animals:bear": "The bear is big.",
  "animals:bee": "The bee is flying.",
  "animals:bird": "The bird can sing.",
  "animals:butterfly": "The butterfly is pretty.",
  "animals:cat": "The cat is sleeping.",
  "animals:chicken": "The chicken is on the farm.",
  "animals:cow": "The cow eats grass.",
  "animals:dog": "The dog is happy.",
  "animals:duck": "The duck is swimming.",
  "animals:elephant": "The elephant is big.",
  "animals:fish": "The fish is in the water.",
  "animals:frog": "The frog can jump.",
  "animals:horse": "The horse can run.",
  "animals:lion": "The lion is strong.",
  "animals:monkey": "The monkey likes bananas.",
  "animals:mouse": "The mouse is small.",
  "animals:panda": "The panda is cute.",
  "animals:pig": "The pig is pink.",
  "animals:rabbit": "The rabbit can hop.",
  "animals:sheep": "The sheep is white.",
  "animals:snake": "The snake is long.",
  "animals:tiger": "The tiger is orange.",
  "animals:turtle": "The turtle is slow.",
  "foods:apple": "I eat an apple.",
  "foods:banana": "I like bananas.",
  "foods:bread": "I eat bread for breakfast.",
  "foods:cake": "The cake is sweet.",
  "foods:duck": "I eat duck for dinner.",
  "foods:egg": "I eat an egg.",
  "foods:fish": "I eat fish for lunch.",
  "foods:juice": "I drink juice.",
  "foods:milk": "I drink milk.",
  "foods:noodles": "I eat noodles.",
  "foods:rice": "I eat rice.",
  "colors:black": "The cat is black.",
  "colors:blue": "The sky is blue.",
  "colors:green": "The leaf is green.",
  "colors:red": "The apple is red.",
  "colors:white": "The sheep is white.",
  "colors:yellow": "The banana is yellow.",
  "body:back": "My back hurts.",
  "body:ear": "I hear with my ears.",
  "body:eye": "I see with my eyes.",
  "body:hand": "I raise my hand.",
  "body:head": "This is my head.",
  "hobbies:run": "I can run fast.",
  "hobbies:swim": "I can swim.",
  "places:back": "Please come back.",
  "school:book": "I read a book.",
  "school:pencil": "I use a pencil.",
  "school:teacher": "My teacher is kind.",
  "traits:angry": "The man is angry.",
  "traits:bad": "This apple is bad.",
  "traits:good": "This is a good book.",
  "traits:happy": "The girl is happy.",
  "traits:sad": "The boy is sad.",
  ant: "The ant is tiny.",
  angry: "The man is angry.",
  bad: "This apple is bad.",
  duck: "The duck is swimming."
};

const GENERIC_CATEGORY_EMOJIS = new Set([
  "\u{1F436}", "\u{1F34E}", "\u{1F44B}", "\u{1F455}", "\u{1F3A8}", "\u{1F517}", "\u{1F524}",
  "\u{1F43E}",
  "\u{1F46A}", "\u{1F30A}", "\u{1F4AA}", "\u{26BD}", "\u{1F389}", "\u{1F3E0}", "\u{1F4AC}",
  "\u{1F469}\u200D\u2695\uFE0F", "\u{1F4B0}", "\u{1F324}\uFE0F", "\u{1F522}", "\u{1F9D2}",
  "\u{1F4CD}", "\u{2194}\uFE0F", "\u{1F464}", "\u{2753}", "\u{1F4DA}", "\u{1F4CF}",
  "\u{1F37D}\uFE0F", "\u{1F552}", "\u{1F3F7}\uFE0F", "\u{1F642}", "\u{1F697}", "\u{2B50}",
  "?", "\u{2754}", "\u{FFFD}"
]);

const PICTURE_QUIZ_EXCLUDED_CATEGORIES = new Set([
  "auxiliaries",
  "conjunctions",
  "determiners",
  "hobbies",
  "interjections",
  "nature",
  "others",
  "prepositions",
  "pronouns",
  "questionwords",
  "traits"
]);

const PICTURE_QUIZ_EXCLUDED_WORD_KEYS = new Set([
  "foods:drink",
  "foods:food",
  "foods:meal",
  "home:clean",
  "school:answer",
  "school:listen",
  "school:question",
  "school:say",
  "school:speak",
  "school:talk",
  "school:spell",
  "school:study",
  "school:test",
  "school:vacation",
  "school:write",
  "sizeMeasurement:big",
  "sizeMeasurement:heavy",
  "sizeMeasurement:high",
  "sizeMeasurement:light",
  "sizeMeasurement:long",
  "sizeMeasurement:short",
  "sizeMeasurement:small"
]);

function normalizeEmojiKey(value) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, " ");
}

const NORMALIZED_WORD_EMOJI_OVERRIDES = Object.entries(WORD_EMOJI_OVERRIDES).reduce((lookup, [key, value]) => {
  lookup[normalizeEmojiKey(key)] = value;
  return lookup;
}, {});

function emojiOverrideForKey(key) {
  return NORMALIZED_WORD_EMOJI_OVERRIDES[normalizeEmojiKey(key)];
}

function imageOverrideForKey(key) {
  return WORD_IMAGE_OVERRIDES[normalizeEmojiKey(key)];
}

function wordEmojiKey(word) {
  return normalizeEmojiKey(word.word || word.en || word.id);
}

function wordCategoryKey(word) {
  return normalizeEmojiKey(word.sourceCategory || word.rawAppCategory || word.appCategory || word.category || "");
}

function wordCategoryKeys(word) {
  const keys = [
    word.sourceCategory,
    word.rawAppCategory,
    word.appCategory,
    word.category,
    word.categoryId,
    word.stageId
  ].map(normalizeEmojiKey).filter(Boolean);
  return [...new Set(keys.flatMap((key) => {
    const normalized = key.replace(/_easy|_medium|_hard|_stage_\d+$/, "");
    return [key, normalized, DISPLAY_CATEGORY_LOOKUP[key], DISPLAY_CATEGORY_LOOKUP[normalized]].filter(Boolean);
  }))];
}

function isGrammarOnlyWord(word) {
  return wordCategoryKeys(word).some((categoryKey) => GRAMMAR_ONLY_CATEGORIES.has(categoryKey));
}

function wordImageForWord(word) {
  const wordKey = wordEmojiKey(word);
  for (const categoryKey of wordCategoryKeys(word)) {
    const image = imageOverrideForKey(`${categoryKey}:${wordKey}`);
    if (image) return image;
  }
  return word.image || "";
}

function wordVisualMarkup(word, className = "word-visual") {
  const image = wordImageForWord(word);
  if (image) {
    return `<img class="${className} word-image" src="${assetUrl(image)}" alt="${escapeHtml(getMeaning(word) || word.en || word.word || "")}">`;
  }
  return `<span class="${className}">${escapeHtml(word.emoji || "")}</span>`;
}

function hasWordSpecificEmoji(word) {
  const wordKey = wordEmojiKey(word);
  return wordCategoryKeys(word).some((categoryKey) => Boolean(emojiOverrideForKey(`${categoryKey}:${wordKey}`)));
}

function isPictureQuizWord(word) {
  const hasImage = Boolean(wordImageForWord(word));
  if (!hasImage && (!word?.emoji || GENERIC_CATEGORY_EMOJIS.has(word.emoji))) return false;
  if (isGrammarOnlyWord(word)) return false;
  if (wordCategoryKeys(word).some((categoryKey) => PICTURE_QUIZ_EXCLUDED_CATEGORIES.has(categoryKey))) return false;
  const wordKey = wordEmojiKey(word);
  if (wordCategoryKeys(word).some((categoryKey) => PICTURE_QUIZ_EXCLUDED_WORD_KEYS.has(`${categoryKey}:${wordKey}`))) return false;
  return hasImage || hasWordSpecificEmoji(word);
}

function wordAllowedForChild(word, childId) {
  if (childId === "ethan" && isGrammarOnlyWord(word)) return false;
  if (Array.isArray(word.enabledFor) && word.enabledFor.length && !word.enabledFor.includes(childId)) return false;
  return true;
}

function categoryFallbackEmoji(categoryKey) {
  return CATEGORY_EMOJI_FALLBACKS[categoryKey] ||
    CATEGORY_EMOJI_FALLBACKS[DISPLAY_CATEGORY_LOOKUP[categoryKey]] ||
    CATEGORY_EMOJI_FALLBACKS.default;
}

function resolveWordEmoji(word) {
  const key = wordEmojiKey(word);
  const categoryKeys = wordCategoryKeys(word);
  for (const categoryKey of categoryKeys) {
    const categorySpecific = emojiOverrideForKey(`${categoryKey}:${key}`);
    if (categorySpecific) return categorySpecific;
  }
  if (emojiOverrideForKey(key)) return emojiOverrideForKey(key);

  const existing = String(word.emoji || "").trim();
  if (existing && !GENERIC_CATEGORY_EMOJIS.has(existing)) return existing;
  const fallbackKey = categoryKeys.find((categoryKey) => CATEGORY_EMOJI_FALLBACKS[categoryKey] || CATEGORY_EMOJI_FALLBACKS[DISPLAY_CATEGORY_LOOKUP[categoryKey]]);
  return categoryFallbackEmoji(fallbackKey);
}

function grammarUsageForWord(word) {
  const key = wordEmojiKey(word);
  for (const categoryKey of wordCategoryKeys(word)) {
    const usage = GRAMMAR_USAGE_NOTES[`${categoryKey}:${key}`];
    if (usage) return usage;
  }
  return null;
}

function isTemplateSentence(sentence) {
  return !sentence || /^I know the word "/i.test(String(sentence).trim());
}

function articleFor(wordText) {
  return /^[aeiou]/i.test(String(wordText || "")) ? "an" : "a";
}

function exampleSentenceForWord(word) {
  const key = wordEmojiKey(word);
  for (const categoryKey of wordCategoryKeys(word)) {
    const categoryExample = EXAMPLE_SENTENCE_OVERRIDES[`${categoryKey}:${key}`];
    if (categoryExample) return categoryExample;
  }
  if (EXAMPLE_SENTENCE_OVERRIDES[key]) return EXAMPLE_SENTENCE_OVERRIDES[key];

  const partOfSpeech = String(word.partOfSpeech || "");
  const categories = wordCategoryKeys(word);
  const displayWord = String(word.en || word.word || "").trim();
  if (!displayWord) return "";

  if (partOfSpeech.includes("\u5f62\u5bb9\u8a5e")) return `It is ${displayWord}.`;
  if (partOfSpeech.includes("\u52d5\u8a5e")) return `I can ${displayWord}.`;
  if (categories.includes("colors")) return `I see ${displayWord}.`;
  if (categories.includes("animals")) return `I see ${articleFor(displayWord)} ${displayWord}.`;
  if (categories.includes("foods")) return `I like ${displayWord}.`;
  if (categories.includes("body")) return `This is my ${displayWord}.`;
  if (categories.includes("school")) return `I use ${articleFor(displayWord)} ${displayWord}.`;
  return `I see ${articleFor(displayWord)} ${displayWord}.`;
}

function enrichWordForDisplay(word) {
  const usage = grammarUsageForWord(word);
  const sentence = isTemplateSentence(word.sentence)
    ? (usage?.sentence || exampleSentenceForWord(word))
    : word.sentence;
  return {
    ...word,
    usageNote: usage ? (word.usageNote || usage.note) : word.usageNote,
    sentence
  };
}

function duplicateWordKey(word) {
  return [
    normalizeEmojiKey(word.word || word.en),
    normalizeEmojiKey(getMeaning(word)),
    normalizeEmojiKey(word.rawAppCategory || word.appCategory || word.sourceCategory)
  ].join("|");
}

function preferWordRecord(current, candidate) {
  const currentTemplate = isTemplateSentence(current.sentence);
  const candidateTemplate = isTemplateSentence(candidate.sentence);
  if (!current.usageNote && candidate.usageNote) return candidate;
  if (currentTemplate && !candidateTemplate) return candidate;
  if (current.source === "custom" && candidate.source !== "custom") return candidate;
  return current;
}

function dedupeWordRecords(words) {
  const byKey = new Map();
  words.forEach((word) => {
    const key = duplicateWordKey(word);
    const existing = byKey.get(key);
    byKey.set(key, existing ? preferWordRecord(existing, word) : word);
  });
  return [...byKey.values()];
}

const DISPLAY_DIFFICULTIES = ["easy", "medium", "hard"];

const LEGACY_ACCESSORY_ID_MAP = {
  cap: "star_headband",
  glasses: "tiara",
  cape: "flower_crown",
  wings: "bunny_ears",
  backpack: "leaf_crown",
  crown: "royal_crown",
  wand: "bead_headband",
  snack_style: "none",
  stationery_style: "none",
  gift_style: "none"
};

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
const ASSET_VERSION = "word-assets-20260618-custom-accessories";
const FIREBASE_STORAGE_VERSION = "12.15.0";
const FIREBASE_STORAGE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_STORAGE_VERSION}/firebase-storage.js`;
const ACCESSORY_UPLOAD_TIMEOUT_MS = 45000;
const ACCESSORY_INLINE_IMAGE_LIMIT = 420000;
const ACCESSORY_INLINE_FILE_SIZE_LIMIT = 160 * 1024;
const ACCESSORY_SLOT_LABELS = {
  all: "全部",
  headTop: "頭頂",
  headSide: "髮飾",
  face: "臉部",
  neck: "脖子",
  body: "身體",
  back: "背後",
  pet: "小萌寵"
};
const ACCESSORY_SLOT_DEFAULTS = {
  headTop: { allowMultipleInSlot: false, zIndex: 50 },
  headSide: { allowMultipleInSlot: true, zIndex: 45 },
  face: { allowMultipleInSlot: false, zIndex: 40 },
  neck: { allowMultipleInSlot: false, zIndex: 30 },
  body: { allowMultipleInSlot: true, zIndex: 25 },
  back: { allowMultipleInSlot: false, zIndex: 5 },
  pet: { allowMultipleInSlot: false, width: 32, left: 78, top: 58, offsetXPercent: 28, offsetYPercent: 28, zIndex: 35 }
};
const ACCESSORY_SLOT_FILTERS = ["all", "headTop", "headSide", "face", "neck", "body", "back", "pet"];
let activeAccessorySlotFilter = "all";
const DEFAULT_ACCESSORY_POSITIONS = {
  bow: { width: 68, left: 16, top: -6, zIndex: 4 },
  flower_clip: { width: 27, left: 57, top: 14, zIndex: 4 },
  star_headband: { width: 66, left: 17, top: -7, zIndex: 4 },
  heart_antenna: { width: 70, left: 15, top: -8, zIndex: 4 },
  bunny_ears: { width: 72, left: 14, top: -12, zIndex: 4 },
  leaf_crown: { width: 66, left: 17, top: -1, zIndex: 4 },
  bead_headband: { width: 70, left: 15, top: -2, zIndex: 4 },
  flower_crown: { width: 76, left: 12, top: -3, zIndex: 4 },
  tiara: { width: 72, left: 14, top: -5, zIndex: 4 },
  royal_crown: { width: 58, left: 21, top: -11, zIndex: 4 }
};

function assetUrl(src) {
  if (!src || src.startsWith("data:") || src.includes("?")) return src;
  return `${src}?v=${ASSET_VERSION}`;
}

function defaultChildProgress() {
  return {
    stars: 0,
    diamonds: 0,
    learned: {},
    mistakes: [],
    learnedWordIds: [],
    masteredWordIds: [],
    wordModeMastery: {},
    wrongWordIds: [],
    completed: [],
    completedStageIds: [],
    claimedStageRewardIds: [],
    unlockedAccessories: ["none"],
    equippedAccessories: ["none"],
    avatarColor: "blue",
    outfit: "none",
    unlocked: ["none"],
    ownedItems: [],
    customAccessories: [],
    hiddenAccessoryIds: [],
    accessoryPositionOverrides: {},
    rewardCoupons: [],
    rewardStoreItems: defaultRewardStoreItems(),
    quizHistory: [],
    quizResults: [],
    customWords: []
  };
}

function defaultGardenChild() {
  return {
    gardenPoints: 0,
    gardenLevel: 1,
    unlockedGardenItems: []
  };
}

function defaultGardenProgress() {
  return {
    sharedGardenPoints: 0,
    sharedGardenLevel: 1,
    childGarden: Object.fromEntries(PROFILES.map((profile) => [profile.id, defaultGardenChild()]))
  };
}

const defaultProgress = () => ({
  version: 3,
  syncMode: "local",
  activeChildId: "jim",
  children: Object.fromEntries(PROFILES.map((profile) => [profile.id, defaultChildProgress()])),
  garden: defaultGardenProgress(),
  accessoryLibrary: defaultAccessoryLibrary()
});

let legacyCustomWords = loadLegacyCustomWords();
let progress = loadProgress();
try {
  saveProgress({ keepUpdatedAt: true });
} catch (error) {
  console.warn("Word Adventure initial save fallback:", error);
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", () => {
  renderProfileSwitch();
  renderCategories();
  bindNavigation();
  bindLearning();
  bindParentGate();
  bindParentSettings();
  bindSpeechButtons();
  renderHome();
  ensureHomeRendered();
  startCloudSync();
  registerServiceWorker();
  initializeCsvData()
    .then(() => {
      renderCategories();
      renderHome();
      ensureHomeRendered();
    })
    .catch((error) => {
      console.warn("Word Adventure CSV fallback:", error);
      renderCategories();
      renderHome();
      ensureHomeRendered();
    });
});

function ensureHomeRendered() {
  window.setTimeout(() => {
    if (!$("#profileSwitch")?.children?.length) renderProfileSwitch();
    if (!$("#categoryGrid")?.children?.length) renderCategories();
    renderHeader();
  }, 0);
}

window.dataStore?.subscribe?.(({ source }) => {
  if (!document.body) return;
  renderSyncStatus();
  if (source !== "cloud-pull") return;
  progress = loadProgress();
  renderAll();
  renderActiveViewAfterSync();
});

function renderActiveViewAfterSync() {
  const activeView = document.querySelector(".view.active");
  if (!activeView) return;
  const viewName = activeView.id.replace(/View$/, "");
  if (viewName === "learn") renderLearning();
  if (viewName === "quiz" && !state.currentQuiz) renderQuizModeSelection();
  if (viewName === "review") renderReview();
  if (viewName === "dressup") renderDressup();
  if (viewName === "rewards") renderRewards();
  if (viewName === "garden") renderGarden();
  if (viewName === "parent") renderParentSettings();
}

async function startCloudSync() {
  if (!window.dataStore) return;
  try {
    window.dataStore.enableCloudSync();
    await window.dataStore.init();
    await window.dataStore.startCloudListener();
  } catch (error) {
    window.dataStore.setSyncStatus?.({
      syncMode: "cloud",
      online: false,
      syncing: false,
      error: error?.message || String(error)
    });
    console.warn("Word Adventure cloud sync fallback:", error);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.info("Word Adventure service worker fallback:", error?.message || error);
    });
  });
}

function loadProgress() {
  const parsedState = window.dataStore?.getState?.();
  if (!parsedState || !Object.keys(parsedState).length) {
    const fresh = defaultProgress();
    migrateLegacyCustomWords(fresh);
    return fresh;
  }

  try {
    const parsed = parsedState;
    const base = defaultProgress();
    base.syncMode = parsed.syncMode || "local";
    base.accessoryLibrary = normalizeAccessoryLibrary(parsed.accessoryLibrary);
    const sourceChildren = parsed.children || {};

    Object.entries(LEGACY_CHILD_ID_MAP).forEach(([legacyId, childId]) => {
      if (!sourceChildren[childId] && parsed[legacyId]) sourceChildren[childId] = parsed[legacyId];
    });

    PROFILES.forEach((child) => {
      base.children[child.id] = normalizeChildProgress({ ...base.children[child.id], ...(sourceChildren[child.id] || {}) }, child, base.accessoryLibrary);
    });

    base.garden = normalizeGardenProgress(parsed.garden || base.garden);
    base.activeChildId = PROFILES.some((child) => child.id === parsed.activeChildId) ? parsed.activeChildId : "jim";
    migrateLegacyCustomWords(base);
    migrateSharedAccessoryLibrary(base);
    state.activeChildId = base.activeChildId;
    return base;
  } catch {
    const fresh = defaultProgress();
    migrateLegacyCustomWords(fresh);
    return fresh;
  }
}

function saveProgress(options = {}) {
  progress.activeChildId = state.activeChildId;
  progress.syncMode = window.dataStore?.getSyncStatus?.().syncMode || progress.syncMode || "local";
  progress.garden = normalizeGardenProgress(progress.garden);
  window.dataStore.saveState(progress, options);
}

function normalizeChildProgress(childProgress, child, sharedLibrary = defaultAccessoryLibrary()) {
  const normalized = { ...defaultChildProgress(), ...childProgress };
  normalized.learned = normalized.learned && typeof normalized.learned === "object" ? normalized.learned : {};
  normalized.mistakes = Array.isArray(normalized.mistakes) ? normalized.mistakes : [];
  normalized.learnedWordIds = hydrateLearnedWordIds(normalized, child);
  normalized.wordModeMastery = hydrateWordModeMastery(normalized, child);
  normalized.masteredWordIds = hydrateMasteredWordIds(normalized, child);
  normalized.wrongWordIds = hydrateWrongWordIds(normalized, child);
  normalized.completedStageIds = Array.isArray(normalized.completedStageIds) ? normalized.completedStageIds : [];
  normalized.claimedStageRewardIds = Array.isArray(normalized.claimedStageRewardIds)
    ? normalized.claimedStageRewardIds
    : [...normalized.completedStageIds];
  normalized.customAccessories = normalizeCustomAccessories(normalized.customAccessories);
  normalized.hiddenAccessoryIds = Array.isArray(normalized.hiddenAccessoryIds)
    ? [...new Set(normalized.hiddenAccessoryIds.map((id) => LEGACY_ACCESSORY_ID_MAP[id] || id).filter((id) => id && id !== "none"))]
    : [];
  normalized.accessoryPositionOverrides = normalizeAccessoryPositionOverrides(normalized.accessoryPositionOverrides);
  const sharedCustomAccessories = normalizeCustomAccessories(sharedLibrary.customAccessories);
  const validAccessoryIds = new Set([...ACCESSORIES, ...sharedCustomAccessories, ...normalized.customAccessories].map((item) => item.id));
  const normalizeAccessoryId = (id) => LEGACY_ACCESSORY_ID_MAP[id] || id;
  normalized.unlockedAccessories = Array.isArray(normalized.unlockedAccessories)
    ? normalized.unlockedAccessories.map(normalizeAccessoryId).filter((id) => validAccessoryIds.has(id))
    : (Array.isArray(normalized.unlocked) ? normalized.unlocked.map(normalizeAccessoryId).filter((id) => validAccessoryIds.has(id)) : ["none"]);
  normalized.unlockedAccessories = normalized.unlockedAccessories.filter((id) => !normalized.hiddenAccessoryIds.includes(id));
  if (!normalized.unlockedAccessories.includes("none")) normalized.unlockedAccessories.unshift("none");
  normalized.unlockedAccessories = [...new Set(normalized.unlockedAccessories)];
  const legacyEquipped = normalized.equippedAccessory || normalized.outfit || "none";
  normalized.equippedAccessories = Array.isArray(normalized.equippedAccessories)
    ? normalized.equippedAccessories.map(normalizeAccessoryId).filter((id) => validAccessoryIds.has(id))
    : [normalizeAccessoryId(legacyEquipped)].filter((id) => validAccessoryIds.has(id));
  normalized.equippedAccessories = normalized.equippedAccessories.filter((id) => !normalized.hiddenAccessoryIds.includes(id));
  if (!normalized.equippedAccessories.length) normalized.equippedAccessories = ["none"];
  normalized.equippedAccessories = [...new Set(normalized.equippedAccessories)];
  normalized.equippedAccessories = normalizeEquippedAccessoriesForSlots(normalized.equippedAccessories, [...ACCESSORIES, ...sharedCustomAccessories, ...normalized.customAccessories]);
  if (!AVATAR_COLORS.some((item) => item.id === normalized.avatarColor)) {
    normalized.avatarColor = child.defaultAvatarColor || "blue";
  }
  normalized.outfit = normalized.equippedAccessories[0] || normalized.outfit || "none";
  normalized.unlocked = normalized.unlockedAccessories;
  normalized.completed = Array.isArray(normalized.completed) ? normalized.completed : [];
  normalized.ownedItems = Array.isArray(normalized.ownedItems) ? normalized.ownedItems : [];
  normalized.rewardCoupons = Array.isArray(normalized.rewardCoupons) ? normalized.rewardCoupons : [];
  normalized.rewardStoreItems = normalizeRewardStoreItems(normalized.rewardStoreItems);
  normalized.quizHistory = Array.isArray(normalized.quizHistory) ? normalized.quizHistory : [];
  normalized.quizResults = Array.isArray(normalized.quizResults) ? normalized.quizResults : [];
  normalized.customWords = Array.isArray(normalized.customWords) ? normalized.customWords : [];
  normalized.diamonds = Number.isFinite(Number(normalized.diamonds)) ? Number(normalized.diamonds) : 0;
  normalized.stars = Number.isFinite(Number(normalized.stars)) ? Number(normalized.stars) : 0;
  return normalized;
}

function normalizeCustomAccessories(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeAccessoryItem(item, { source: "customAccessory", className: "wear-custom" }))
    .filter((item) => item.wearableSrc);
}

function inferAccessorySlot(item) {
  const slot = String(item?.slot || "").trim();
  if (ACCESSORY_SLOT_DEFAULTS[slot]) return slot;
  const id = String(item?.id || "");
  if (["bow", "flower_clip"].includes(id)) return "headSide";
  if (id.includes("glasses")) return "face";
  if (id.includes("wing") || id.includes("backpack")) return "back";
  if (id.includes("pet")) return "pet";
  return "headTop";
}

function accessorySlotDefaults(slot) {
  return ACCESSORY_SLOT_DEFAULTS[slot] || ACCESSORY_SLOT_DEFAULTS.headTop;
}

function normalizeAccessoryPositionForSlot(position, slot) {
  const defaults = accessorySlotDefaults(slot);
  const safePosition = position && typeof position === "object" ? position : {};
  return {
    width: clampNumber(safePosition.width ?? safePosition.widthPercent, 10, 160, defaults.width ?? 70),
    left: clampNumber(safePosition.left ?? safePosition.offsetXPercent, -40, 140, defaults.left ?? 15),
    top: clampNumber(safePosition.top ?? safePosition.offsetYPercent, -70, 140, defaults.top ?? -8),
    zIndex: clampNumber(safePosition.zIndex, 0, 100, defaults.zIndex ?? 4)
  };
}

function normalizeAccessoryItem(item, options = {}) {
  const slot = inferAccessorySlot(item);
  const defaults = accessorySlotDefaults(slot);
  const id = String(item?.id || `custom_accessory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).replace(/\s+/g, "_");
  const basePosition = item?.position && typeof item.position === "object"
    ? item.position
    : {
      width: item?.widthPercent,
      left: item?.offsetXPercent,
      top: item?.offsetYPercent,
      zIndex: item?.zIndex
    };
  const position = normalizeAccessoryPositionForSlot(basePosition, slot);
  const wearableSrc = item?.wearableSrc || item?.wearImage || item?.image || "";
  const iconSrc = item?.iconSrc || item?.iconImage || wearableSrc;
  return {
    ...item,
    id,
    name: String(item?.name || "自訂裝備"),
    icon: item?.icon || "⭐",
    wearableSrc,
    iconSrc,
    wearImage: wearableSrc,
    iconImage: iconSrc,
    image: item?.image || wearableSrc,
    costStars: Math.max(0, Number.parseInt(item?.costStars, 10) || 0),
    widthPercent: position.width,
    offsetXPercent: position.left,
    offsetYPercent: position.top,
    zIndex: position.zIndex,
    position,
    slot,
    allowMultipleInSlot: typeof item?.allowMultipleInSlot === "boolean" ? item.allowMultipleInSlot : defaults.allowMultipleInSlot,
    className: options.className || item?.className || "",
    source: options.source || item?.source || "builtInAccessory",
    createdAt: item?.createdAt || new Date().toISOString(),
    updatedAt: item?.updatedAt || item?.createdAt || new Date().toISOString()
  };
}

function normalizeAccessoryPositionOverrides(overrides) {
  if (!overrides || typeof overrides !== "object") return {};
  return Object.fromEntries(Object.entries(overrides).map(([id, position]) => [
    id,
    {
      ...normalizeAccessoryPositionForSlot(position, inferAccessorySlot(position)),
      ...(position?.slot ? { slot: position.slot } : {}),
      ...(typeof position?.allowMultipleInSlot === "boolean" ? { allowMultipleInSlot: position.allowMultipleInSlot } : {}),
      ...(position?.name ? { name: position.name } : {}),
      ...(Number.isFinite(Number(position?.costStars)) ? { costStars: Number(position.costStars) } : {}),
      ...(position?.updatedAt ? { updatedAt: position.updatedAt } : {})
    }
  ]));
}

function defaultAccessoryLibrary() {
  return {
    customAccessories: [],
    hiddenAccessoryIds: [],
    accessoryPositionOverrides: {}
  };
}

function normalizeAccessoryLibrary(library) {
  const source = library && typeof library === "object" ? library : {};
  return {
    customAccessories: normalizeCustomAccessories(source.customAccessories),
    hiddenAccessoryIds: Array.isArray(source.hiddenAccessoryIds)
      ? [...new Set(source.hiddenAccessoryIds.map((id) => LEGACY_ACCESSORY_ID_MAP[id] || id).filter((id) => id && id !== "none"))]
      : [],
    accessoryPositionOverrides: normalizeAccessoryPositionOverrides(source.accessoryPositionOverrides)
  };
}

function accessoryLibrary() {
  progress.accessoryLibrary = normalizeAccessoryLibrary(progress.accessoryLibrary);
  return progress.accessoryLibrary;
}

function sharedAccessories() {
  const library = accessoryLibrary();
  return [...ACCESSORIES, ...library.customAccessories].map((item) => {
    const override = library.accessoryPositionOverrides[item.id];
    return normalizeAccessoryItem(override ? { ...item, ...override, position: override } : item, {
      source: item.source,
      className: item.className
    });
  }).filter((item) => item.id === "none" || !library.hiddenAccessoryIds.includes(item.id));
}

function migrateSharedAccessoryLibrary(targetProgress) {
  const library = normalizeAccessoryLibrary(targetProgress.accessoryLibrary);
  const customById = new Map(library.customAccessories.map((item) => [item.id, item]));
  const hiddenIds = new Set(library.hiddenAccessoryIds);
  const positionOverrides = { ...library.accessoryPositionOverrides };

  PROFILES.forEach((profile) => {
    const childProgress = targetProgress.children?.[profile.id];
    if (!childProgress) return;
    normalizeCustomAccessories(childProgress.customAccessories).forEach((item) => {
      if (!customById.has(item.id)) customById.set(item.id, item);
    });
    (Array.isArray(childProgress.hiddenAccessoryIds) ? childProgress.hiddenAccessoryIds : [])
      .map((id) => LEGACY_ACCESSORY_ID_MAP[id] || id)
      .filter((id) => id && id !== "none")
      .forEach((id) => hiddenIds.add(id));
    Object.assign(positionOverrides, normalizeAccessoryPositionOverrides(childProgress.accessoryPositionOverrides));
    childProgress.customAccessories = [];
    childProgress.hiddenAccessoryIds = [];
    childProgress.accessoryPositionOverrides = {};
  });

  targetProgress.accessoryLibrary = normalizeAccessoryLibrary({
    customAccessories: [...customById.values()],
    hiddenAccessoryIds: [...hiddenIds],
    accessoryPositionOverrides: positionOverrides
  });
}

function normalizeAccessoryPosition(position) {
  return normalizeAccessoryPositionForSlot(position, "headTop");
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeEquippedAccessoriesForSlots(equippedIds, accessories = sharedAccessories()) {
  const byId = new Map(accessories.map((item) => {
    const normalized = normalizeAccessoryItem(item);
    return [normalized.id, normalized];
  }));
  const next = [];
  (Array.isArray(equippedIds) ? equippedIds : []).forEach((id) => {
    if (!id || id === "none") {
      if (!next.length) next.push("none");
      return;
    }
    const item = byId.get(id);
    if (!item) return;
    if (!item.allowMultipleInSlot) {
      for (let index = next.length - 1; index >= 0; index -= 1) {
        const existing = byId.get(next[index]);
        if (existing?.slot === item.slot) next.splice(index, 1);
      }
    }
    if (!next.includes(id)) next.push(id);
  });
  const withoutNone = next.filter((id) => id !== "none");
  return withoutNone.length ? withoutNone : ["none"];
}

function accessoriesForProgress(childProgress = currentProgress()) {
  const child = childProgress || currentProgress();
  const items = sharedAccessories();
  const allowedIds = new Set(items.map((item) => item.id));
  const normalizeAccessoryId = (id) => LEGACY_ACCESSORY_ID_MAP[id] || id;

  child.unlockedAccessories = Array.isArray(child.unlockedAccessories)
    ? child.unlockedAccessories.map(normalizeAccessoryId).filter((id) => allowedIds.has(id))
    : ["none"];
  if (!child.unlockedAccessories.includes("none")) child.unlockedAccessories.unshift("none");
  child.unlockedAccessories = [...new Set(child.unlockedAccessories)];

  child.equippedAccessories = Array.isArray(child.equippedAccessories)
    ? child.equippedAccessories.map(normalizeAccessoryId).filter((id) => allowedIds.has(id))
    : [normalizeAccessoryId(child.outfit || "none")];
  if (!child.equippedAccessories.length) child.equippedAccessories = ["none"];
  child.equippedAccessories = [...new Set(child.equippedAccessories)];
  child.equippedAccessories = normalizeEquippedAccessoriesForSlots(child.equippedAccessories, items);
  child.outfit = child.equippedAccessories[0] || "none";
  child.unlocked = child.unlockedAccessories;

  return items;
}

function currentAccessories() {
  return accessoriesForProgress(currentProgress());
}

function calculateGardenLevel(points) {
  const safePoints = Math.max(0, Number(points) || 0);
  return GARDEN_LEVELS.reduce((level, item) => (safePoints >= item.points ? item.level : level), 1);
}

function gardenInfoForLevel(level) {
  return GARDEN_LEVELS.find((item) => item.level === level) || GARDEN_LEVELS[0];
}

function unlockedGardenItemsForLevel(level, existing = []) {
  const items = new Set(Array.isArray(existing) ? existing : []);
  GARDEN_LEVELS.forEach((item) => {
    if (item.item && item.level <= level) items.add(item.item);
  });
  return [...items];
}

function normalizeGardenChild(childGarden = {}) {
  const gardenPoints = Math.max(0, Number(childGarden.gardenPoints) || 0);
  const gardenLevel = calculateGardenLevel(gardenPoints);
  return {
    gardenPoints,
    gardenLevel,
    unlockedGardenItems: unlockedGardenItemsForLevel(gardenLevel, childGarden.unlockedGardenItems)
  };
}

function normalizeGardenProgress(garden = {}) {
  const base = defaultGardenProgress();
  const sharedGardenPoints = Math.max(0, Number(garden.sharedGardenPoints) || 0);
  base.sharedGardenPoints = sharedGardenPoints;
  base.sharedGardenLevel = calculateGardenLevel(sharedGardenPoints);

  PROFILES.forEach((profile) => {
    base.childGarden[profile.id] = normalizeGardenChild(garden.childGarden?.[profile.id]);
  });

  return base;
}

function ensureGarden() {
  progress.garden = normalizeGardenProgress(progress.garden);
  return progress.garden;
}

function childGardenProgress(childId = state.activeChildId) {
  const garden = ensureGarden();
  garden.childGarden[childId] = normalizeGardenChild(garden.childGarden[childId]);
  return garden.childGarden[childId];
}

function pointsToNextGardenLevel(points) {
  const safePoints = Math.max(0, Number(points) || 0);
  const next = GARDEN_LEVELS.find((item) => item.points > safePoints);
  return next ? next.points - safePoints : 0;
}

function addGardenPoints(childId, points) {
  const amount = Math.max(0, Number(points) || 0);
  if (!amount) return;
  progress.garden = normalizeGardenProgress(window.dataStore.addGardenPoints(childId, amount));
  const childGarden = progress.garden.childGarden[childId] || defaultGardenChild();
  childGarden.unlockedGardenItems = unlockedGardenItemsForLevel(childGarden.gardenLevel, childGarden.unlockedGardenItems);
  progress.garden.childGarden[childId] = childGarden;
}

function completeDailyGardenTask(childId = state.activeChildId) {
  addGardenPoints(childId, 5);
  saveProgress();
}

function normalizeRewardStoreItems(items) {
  const source = Array.isArray(items) ? items : defaultRewardStoreItems();
  return source
    .map((item) => ({
      id: String(item.id || `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      name: String(item.name || "").trim(),
      costDiamonds: Math.max(1, Number.parseInt(item.costDiamonds, 10) || 1),
      type: String(item.type || "physical"),
      icon: String(item.icon || "🎁").trim() || "🎁"
    }))
    .filter((item) => item.name);
}

function migrateQuizModeId(modeId) {
  return LEGACY_QUIZ_MODE_MAP[modeId] || modeId;
}

function migrateWordModeMastery(modeMap = {}) {
  return Object.fromEntries(Object.entries(modeMap).map(([wordId, modes]) => [
    wordId,
    [...new Set((Array.isArray(modes) ? modes : []).map(migrateQuizModeId))]
  ]));
}

function migrateLegacyCustomWords(targetProgress) {
  if (!legacyCustomWords) return;
  const addWords = (childId, words) => {
    if (!targetProgress.children[childId] || !Array.isArray(words) || !words.length) return;
    const childWords = targetProgress.children[childId].customWords;
    const existingIds = new Set(childWords.map((word) => word.id));
    words.forEach((word) => {
      if (!existingIds.has(word.id)) childWords.push(word);
    });
  };

  addWords("ethan", legacyCustomWords.beginner);
  addWords("jim", legacyCustomWords.elementary);
  addWords("ai", legacyCustomWords.elementary);
}

function speakWord(text) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    showSpeechMessage("這個瀏覽器不支援發音功能。");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.75;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function bindSpeechButtons() {
  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak]");
    if (!button) return;
    speakWord(button.dataset.speak);
  });
}

function showSpeechMessage(message) {
  const feedback = $("#quizFeedback") || $("#customWordFeedback");
  if (feedback) feedback.textContent = message;
  else window.alert(message);
}

function loadLegacyCustomWords() {
  return window.dataStore?.getLegacyCustomWords?.() || null;
}

function saveCustomWords() {
  invalidateWordDataCache();
  saveProgress();
}

function currentProgress() {
  if (!progress.children[state.activeChildId]) {
    progress.children[state.activeChildId] = defaultChildProgress();
  }
  return progress.children[state.activeChildId];
}

function currentProfile() {
  return PROFILES.find((profile) => profile.id === state.activeChildId) || PROFILES[0];
}

function currentRewardStoreItems() {
  const profile = currentProgress();
  profile.rewardStoreItems = normalizeRewardStoreItems(profile.rewardStoreItems);
  return profile.rewardStoreItems;
}

function activeWordData() {
  const level = currentProfile().wordSetId || currentProfile().level || "elementary";
  const customSignature = (currentProgress().customWords || []).map((word) => word.id).join("|");
  const key = `${wordDataCache.version}|${currentProfile().id}|${level}|${customSignature}`;
  if (wordDataCache.activeKey === key && wordDataCache.activeStages) {
    return wordDataCache.activeStages;
  }

  const stages = mergedWordData(level);
  wordDataCache.activeKey = key;
  wordDataCache.activeStages = stages;
  wordDataCache.allKey = "";
  wordDataCache.allWords = null;
  return stages;
}

function invalidateWordDataCache() {
  wordDataCache.version += 1;
  wordDataCache.activeKey = "";
  wordDataCache.activeStages = null;
  wordDataCache.allKey = "";
  wordDataCache.allWords = null;
}




function mergedWordData(level) {
  const childId = currentProfile().id;
  const sourceCategories = (WORD_BANKS[level] || WORD_DATA).map((category) => ({
    ...category,
    words: category.words
      .filter((word) => wordAllowedForChild({
        ...word,
        sourceCategory: word.sourceCategory || category.baseCategoryId || category.appCategory || category.id
      }, childId))
      .map((word) => enrichWordForDisplay({
        ...word,
        id: word.id || `${category.id}:${word.en}`,
        stageId: word.stageId || category.id,
        categoryId: category.id,
        categoryZh: word.categoryZh || category.zh,
        sourceCategory: word.sourceCategory || category.baseCategoryId || category.appCategory || category.id,
        rawAppCategory: word.rawAppCategory || word.appCategory || category.baseCategoryId || category.appCategory || category.id,
        emoji: resolveWordEmoji({
          ...word,
          sourceCategory: word.sourceCategory || category.baseCategoryId || category.appCategory || category.id,
          rawAppCategory: word.rawAppCategory || word.appCategory || category.baseCategoryId || category.appCategory || category.id
        })
      }))
  }));

  (currentProgress().customWords || []).filter((word) => wordAllowedForChild(word, childId)).forEach((word) => {
    const group = displayGroupForCategory(word.appCategory || word.category || word.categoryZh || "useful_words");
    const normalizedWord = enrichWordForDisplay({
      ...word,
      id: word.id || `custom_${Date.now()}`,
      en: word.en || word.word,
      word: word.word || word.en,
      appCategory: group.id,
      categoryZh: group.zh,
      sourceCategory: word.sourceCategory || word.appCategory || "custom",
      emoji: resolveWordEmoji(word)
    });
    sourceCategories.push({
      id: `custom_source_${normalizedWord.id}`,
      baseCategoryId: group.id,
      appCategory: group.id,
      zh: group.zh,
      categoryZh: group.zh,
      en: group.id,
      icon: group.icon,
      color: group.color,
      words: [normalizedWord]
    });
  });

  return normalizeStageBank(sourceCategories).filter((category) => category.words.length >= 10);
}

function normalizeStageBank(sourceCategories) {
  const groupedWords = new Map();

  sourceCategories.forEach((category) => {
    const group = displayGroupForCategory(category.baseCategoryId || category.appCategory || category.id || category.en);
    if (!groupedWords.has(group.id)) groupedWords.set(group.id, []);
    (category.words || []).forEach((word) => {
      const normalizedWord = {
        ...word,
        en: word.en || word.word,
        word: word.word || word.en,
        originalStageId: category.id,
        sourceStageId: word.stageId || category.id,
        sourceCategory: word.sourceCategory || category.baseCategoryId || category.appCategory || category.id,
        sourceCategoryZh: word.categoryZh || category.categoryZh || category.zh,
        rawAppCategory: word.rawAppCategory || word.appCategory || category.baseCategoryId || category.appCategory || category.id,
        appCategory: group.id,
        categoryZh: group.zh
      };
      groupedWords.get(group.id).push({
        ...normalizedWord,
        emoji: resolveWordEmoji(normalizedWord)
      });
    });
  });

  return Object.entries(DISPLAY_CATEGORY_GROUPS).flatMap(([groupId, groupInfo]) => {
    const group = displayGroupForCategory(groupId);
    const words = dedupeWordRecords(groupedWords.get(group.id) || []);
    if (words.length < 10) return [];
    return splitWordsIntoDisplayStages(group, words);
  });
}


function splitWordsIntoDisplayStages(group, words) {
  const targetWordsPerStage = 24;
  const minWordsPerStage = 10;
  let stageCount = Math.max(1, Math.ceil(words.length / targetWordsPerStage));
  while (stageCount > 1 && Math.floor(words.length / stageCount) < minWordsPerStage) {
    stageCount -= 1;
  }

  const ordered = [...words].sort((a, b) => {
    const aLevel = Number(a.level) || 1;
    const bLevel = Number(b.level) || 1;
    if (aLevel !== bLevel) return aLevel - bLevel;
    return String(a.en || a.word).localeCompare(String(b.en || b.word));
  });
  const chunks = [];
  let startIndex = 0;

  for (let index = 0; index < stageCount; index += 1) {
    const remainingWords = ordered.length - startIndex;
    const remainingStages = stageCount - index;
    const chunkSize = Math.ceil(remainingWords / remainingStages);
    chunks.push(ordered.slice(startIndex, startIndex + chunkSize));
    startIndex += chunkSize;
  }

  const stageKeys = chunks.map((_, index) => stageKeyForIndex(index, stageCount));
  return chunks
    .filter((chunk) => chunk.length >= minWordsPerStage)
    .map((chunk, index) => createDisplayStage(group, stageKeys[index], chunk, index, stageKeys));
}


function createDisplayStage(group, stageKey, words, index, stageKeys = DISPLAY_DIFFICULTIES) {
  const stageId = `${group.id}_${stageKey}`;
  const label = stageLabel(stageKey, index);
  return {
    id: stageId,
    baseCategoryId: group.id,
    appCategory: group.id,
    difficulty: stageKey,
    difficultyZh: label,
    title: `${group.zh}\u30fb${label}`,
    zh: group.zh,
    categoryZh: group.zh,
    en: stageId,
    color: group.color,
    icon: group.icon,
    unlockRequirement: index > 0 ? `${group.id}_${stageKeys[index - 1]}` : "",
    diamondReward: 1,
    words: words.map((word) => ({
      ...word,
      id: word.id,
      en: word.en || word.word,
      word: word.word || word.en,
      stageId,
      categoryId: stageId,
      categoryZh: group.zh,
      appCategory: group.id,
      rawAppCategory: word.rawAppCategory || word.appCategory,
      difficulty: stageKey,
      emoji: resolveWordEmoji(word)
    }))
  };
}


function stageKeyForIndex(index, total) {
  if (total <= 3) return DISPLAY_DIFFICULTIES[index] || `stage_${String(index + 1).padStart(2, "0")}`;
  return `stage_${String(index + 1).padStart(2, "0")}`;
}

function stageLabel(stageKey, index = 0) {
  if (DISPLAY_DIFFICULTIES.includes(stageKey)) return difficultyLabel(stageKey);
  const match = String(stageKey).match(/stage_(\d+)/);
  const stageNumber = match ? Number(match[1]) : index + 1;
  return `\u7b2c ${stageNumber} \u95dc`;
}

function displayGroupForCategory(categoryId) {
  const raw = String(categoryId || "useful_words");
  const normalized = raw.toLowerCase();
  const groupId = DISPLAY_CATEGORY_GROUPS[raw]
    ? raw
    : DISPLAY_CATEGORY_LOOKUP[normalized] || DISPLAY_CATEGORY_LOOKUP[normalized.replace(/_easy|_medium|_hard$/, "")] || "useful_words";
  const group = DISPLAY_CATEGORY_GROUPS[groupId] || DISPLAY_CATEGORY_GROUPS.useful_words;
  return { id: groupId, ...group };
}

function visibleStages() {
  return activeWordData().filter((stage) => isStageUnlocked(stage));
}

function activeCategory() {
  const categories = activeWordData();
  return categories.find((category) => category.id === state.activeCategory && isStageUnlocked(category)) ||
    categories.find((category) => isStageUnlocked(category)) ||
    categories[0];
}

function allWords() {
  const stages = activeWordData();
  const key = `${wordDataCache.activeKey}|all`;
  if (wordDataCache.allKey === key && wordDataCache.allWords) {
    return wordDataCache.allWords;
  }

  const words = stages.flatMap((category) => category.words.map((word) => ({
    ...word,
    id: getWordId(word, category.id),
    categoryId: category.id,
    categoryZh: category.zh
  })));
  wordDataCache.allKey = key;
  wordDataCache.allWords = words;
  return words;
}

function getWordId(word, categoryId = word.categoryId) {
  if (word.id) return word.id;
  return `${categoryId}:${word.en}`;
}

function hydrateLearnedWordIds(profileProgress, profile) {
  const existing = Array.isArray(profileProgress.learnedWordIds) ? profileProgress.learnedWordIds : [];
  const level = profile.wordSetId || profile.level || "elementary";
  const categories = WORD_BANKS[level] || WORD_DATA;
  const ids = new Set(existing);

  Object.entries(profileProgress.learned || {}).forEach(([categoryId, words]) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;
    (words || []).forEach((wordEn) => {
      const word = category.words.find((item) => item.en === wordEn);
      if (word) ids.add(getWordId(word, categoryId));
    });
  });

  return [...ids];
}

function hydrateWrongWordIds(profileProgress, profile) {
  const existing = Array.isArray(profileProgress.wrongWordIds) ? profileProgress.wrongWordIds : [];
  const level = profile.wordSetId || profile.level || "elementary";
  const categories = WORD_BANKS[level] || WORD_DATA;
  const words = categories.flatMap((category) => category.words.map((word) => ({
    ...word,
    id: getWordId(word, category.id),
    categoryId: category.id
  })));
  const ids = new Set(existing);

  (profileProgress.mistakes || []).forEach((mistake) => {
    const word = words.find((item) => (
      (mistake.id && item.id === mistake.id) ||
      (item.en === mistake.en && (!mistake.categoryId || item.categoryId === mistake.categoryId))
    ));
    if (word) ids.add(word.id);
  });

  return [...ids];
}

function hydrateWordModeMastery(profileProgress, profile) {
  const level = profile.wordSetId || profile.level || "elementary";
  const categories = WORD_BANKS[level] || WORD_DATA;
  const words = categories.flatMap((category) => category.words.map((word) => ({
    ...word,
    id: getWordId(word, category.id),
    categoryId: category.id
  })));
  const mastery = migrateWordModeMastery(profileProgress.wordModeMastery || {});

  (profileProgress.quizResults || []).forEach((result) => {
    if (!result.isCorrect || !result.mode) return;
    const word = words.find((item) => (
      (result.wordId && item.id === result.wordId) ||
      (item.en === result.word && (!result.categoryId || item.categoryId === result.categoryId))
    ));
    if (!word) return;

    mastery[word.id] = Array.isArray(mastery[word.id]) ? mastery[word.id] : [];
    const modeId = migrateQuizModeId(result.mode);
    if (!mastery[word.id].includes(modeId)) mastery[word.id].push(modeId);
  });

  return mastery;
}


function hydrateMasteredWordIds(profileProgress, profile) {
  const ids = new Set(Array.isArray(profileProgress.masteredWordIds) ? profileProgress.masteredWordIds : []);
  const mastery = profileProgress.wordModeMastery || {};

  Object.entries(mastery).forEach(([wordId, modes]) => {
    if (Array.isArray(modes) && modes.length > 0) ids.add(wordId);
  });

  return [...ids];
}

function getMeaning(word) {
  return word.meaning || word.zh;
}

function getDisplayWord(word) {
  return allWords().find((item) => (
    (word.id && item.id === word.id) ||
    (item.en === word.en && (!word.categoryId || item.categoryId === word.categoryId))
  )) || word;
}

function learnedWords() {
  const learnedIds = new Set(currentProgress().learnedWordIds || []);
  return allWords().filter((word) => learnedIds.has(word.id));
}

function learnedWordsForCategory(categoryId) {
  const learnedIds = new Set(currentProgress().learnedWordIds || []);
  return allWords().filter((word) => learnedIds.has(word.id) && word.categoryId === categoryId);
}

function quizWordPool() {
  const pool = state.quizCategoryId ? learnedWordsForCategory(state.quizCategoryId) : learnedWords();
  if (state.quizMode === "choice_picture_to_en") return pool.filter(isPictureQuizWord);
  if (state.quizMode !== "spelling") return pool;
  const childId = currentProfile().id;
  return pool.filter((word) => !Array.isArray(word.spellingEnabledFor) || word.spellingEnabledFor.includes(childId));
}

function quizScopeCategory() {
  if (!state.quizCategoryId) return null;
  return activeWordData().find((category) => category.id === state.quizCategoryId) || null;
}


function quizScopeLabel() {
  const category = quizScopeCategory();
  return category
    ? `${currentProfile().displayName} \u30fb ${category.title || category.zh}`
    : `${currentProfile().displayName} \u7684\u6e2c\u9a57`;
}

function wrongWords() {
  const wrongIds = new Set(currentProgress().wrongWordIds || []);
  const byId = allWords().filter((word) => wrongIds.has(word.id));
  if (byId.length) return byId;
  return currentProgress().mistakes.map((mistake) => getDisplayWord(mistake));
}

function shouldShowZhuyin() {
  return Boolean(currentProfile().showZhuyin);
}


function getMascotImageForContext(context, colorId = currentProgress().avatarColor) {
  const baseImage = MASCOT_IMAGES[context] || MASCOT_IMAGES.default;
  if (isMainMascotContext(context)) {
    const color = AVATAR_COLORS.find((item) => item.id === colorId) || AVATAR_COLORS[0];
    return assetUrl(color.image || baseImage);
  }
  return assetUrl(baseImage);
}

function isMainMascotContext(context) {
  return ["home", "dressup", "default"].includes(context);
}

function avatarFilterForContext(context, color) {
  return isMainMascotContext(context) ? "none" : (color.filter || "none");
}

function currentAvatarColor() {
  return AVATAR_COLORS.find((item) => item.id === currentProgress().avatarColor) || AVATAR_COLORS[0];
}


function setMascotImage(selector, context) {
  const buddy = $(selector);
  if (!buddy) return;
  buddy.dataset.context = context;
  const image = buddy.querySelector(".character-image");
  if (!image) return;

  const color = currentAvatarColor();
  image.src = getMascotImageForContext(context, color.id);
  image.alt = `${currentProfile().displayName} mascot`;
  image.dataset.context = context;
  image.dataset.avatarColorPreview = color.id;
  image.style.setProperty("--avatar-filter", avatarFilterForContext(context, color));
}


function mascotMarkup(context, className = "page-mascot") {
  const color = currentAvatarColor();
  const imageId = className === "quiz-mascot" ? ` id="quizMascot"` : "";
  return `
    <div class="${className}">
      <img${imageId} class="character-image" src="${getMascotImageForContext(context, color.id)}" alt="${currentProfile().displayName} mascot" data-avatar-color-preview="${color.id}" style="--avatar-filter: ${avatarFilterForContext(context, color)}">
    </div>
  `;
}


function updateMascotElement(selector, context) {
  const image = $(selector);
  if (!image) return;
  const color = currentAvatarColor();
  image.src = getMascotImageForContext(context, color.id);
  image.dataset.avatarColorPreview = color.id;
  image.style.setProperty("--avatar-filter", avatarFilterForContext(context, color));
}

function renderRubyMeaning(word) {
  if (!shouldShowZhuyin() || isGrammarOnlyWord(word)) {
    return `<span class="meaning">${getMeaning(word)}</span>`;
  }

  if (Array.isArray(word.zhuyinChars) && word.zhuyinChars.length) {
    return word.zhuyinChars.map((item) => (
      `<span class="ruby-pair"><span class="ruby-char">${item.char}</span>${renderSideZhuyin(item.ruby)}</span>`
    )).join("");
  }

  if (word.zhuyin) {
    return `<span class="meaning">${getMeaning(word)}\uff08${escapeHtml(word.zhuyin)}\uff09</span>`;
  }

  return `<span class="meaning">${getMeaning(word)}</span>`;
}

function renderSideZhuyin(ruby) {
  const toneMarks = ["\u02ca", "\u02c7", "\u02cb", "\u02d9"];
  const chars = Array.from(ruby);
  const tone = chars.find((char) => toneMarks.includes(char)) || "";
  const body = chars.filter((char) => !toneMarks.includes(char));

  return `
    <span class="side-zhuyin" aria-label="${ruby}">
      <span class="side-zhuyin-body">${body.map((char) => `<span>${char}</span>`).join("")}</span>
      ${tone ? `<span class="side-zhuyin-tone">${tone}</span>` : ""}
    </span>
  `;
}

function meaningMarkup(word) {
  return `<span class="meaning-inline">${renderRubyMeaning(word)}</span>`;
}

function choiceOptionMarkup(word, mode) {
  if (mode.id === "choice_en_to_zh") return meaningMarkup(word);
  return mode.option(word);
}


function renderProfileSwitch() {
  const switcher = $("#profileSwitch");
  switcher.innerHTML = PROFILES.map((profile) => `
    <button class="profile-card ${profile.id === state.activeChildId ? "selected" : ""}" type="button" data-profile="${profile.id}">
      <span class="profile-avatar ${profile.color}">${profile.avatar || profile.displayName.slice(0, 1)}</span>
      <strong>${profile.displayName}</strong>
      <small>${profile.roleName}\u30fb${profile.levelName}</small>
    </button>
  `).join("");

  switcher.onclick = (event) => {
    const button = event.target.closest("[data-profile]");
    if (!button) return;
    state.activeChildId = button.dataset.profile;
    state.quizMode = null;
    state.quizCategoryId = null;
    saveProgress();
    renderAll();
  };
}

function renderCategories() {
  const groups = groupStagesByCategory(visibleStages());

  $("#categoryGrid").innerHTML = groups.map((group) => `
    <section class="stage-category-group">
      <div class="stage-group-heading">
        <span>${group.icon}</span>
        <strong>${group.title}</strong>
      </div>
      <div class="stage-grid">
        ${group.stages.map((category) => {
          const unlocked = isStageUnlocked(category);
          const hint = !unlocked ? stageUnlockHint(category) : "";
          return `
            <article class="category-card ${category.color} ${unlocked ? "" : "locked"}">
              <span class="category-icon">${category.icon}</span>
              <span>
                <strong>${category.title || `${category.zh}\u30fb${category.difficultyZh || category.en}`}</strong>
                <small>${category.difficultyZh || category.difficulty || category.en}</small>
              </span>
              <em id="cat-${category.id}">\u5df2\u5b78\u7fd2 0 / 0</em>
              <small class="category-progress" id="cat-mastered-${category.id}">\u5df2\u638c\u63e1 0 / 0</small>
              <small class="category-status" id="cat-status-${category.id}">${unlocked ? "\u53ef\u6311\u6230" : "\u672a\u89e3\u9396"}</small>
              ${hint ? `<small class="unlock-hint">${hint}</small>` : ""}
              <span class="category-reward" id="cat-reward-${category.id}"></span>
              <span class="category-actions">
                <button class="category-action learn" type="button" data-category="${category.id}" data-go="learn" ${unlocked ? "" : "disabled"}>\u5b78\u7fd2</button>
                <button class="category-action quiz" type="button" data-category="${category.id}" data-go="quiz" ${unlocked ? "" : "disabled"}>\u6e2c\u9a57</button>
              </span>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");
}

function bindParentSettings() {
  $("#customWordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveCustomWordFromForm();
  });

  $("#generateZhuyinButton").addEventListener("click", handleGenerateZhuyin);
  $("#importWordsButton").addEventListener("click", importCustomWordsFromFile);
  $("#rewardItemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveRewardItemFromForm();
  });
  $("#accessoryItemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveCustomAccessoryFromForm();
  });
  ["accessoryWearImage", "accessoryWidth", "accessoryLeft", "accessoryTop", "accessoryZIndex", "accessorySlot"].forEach((id) => {
    $(`#${id}`).addEventListener("input", updateAccessoryAdminPreview);
    $(`#${id}`).addEventListener("change", updateAccessoryAdminPreview);
  });
  $("#accessorySlot").addEventListener("change", applyAccessorySlotDefaults);
  $("#cancelAccessoryEditButton").addEventListener("click", resetAccessoryForm);
  $("#customMeaning").addEventListener("input", () => {
    $("#zhuyinEditor").innerHTML = "";
    $("#zhuyinHint").textContent = "可按自動產生注音，再手動修正。";
  });
  $("#customProfile").addEventListener("change", () => {
    renderCustomWordList();
    renderRewardItemList();
    renderCustomAccessoryList();
  });
  $("#customWordList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-custom]");
    if (!button) return;
    deleteCustomWord(button.dataset.childId, button.dataset.deleteCustom);
  });
  $("#rewardItemList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-reward-item]");
    if (!button) return;
    deleteRewardItem(button.dataset.childId, button.dataset.deleteRewardItem);
  });
  $("#accessoryItemList").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-accessory-item]");
    if (editButton) {
      startAccessoryPositionEdit(editButton.dataset.editAccessoryItem);
      return;
    }
    const resetButton = event.target.closest("[data-reset-accessory-position]");
    if (resetButton) {
      resetAccessoryPosition(resetButton.dataset.resetAccessoryPosition);
      return;
    }
    const deleteButton = event.target.closest("[data-delete-accessory-item]");
    if (!deleteButton) return;
    deleteCustomAccessory(deleteButton.dataset.deleteAccessoryItem);
  });
}

function bindNavigation() {
  document.body.addEventListener("click", (event) => {
    const claimButton = event.target.closest("[data-claim-stage]");
    if (claimButton) {
      claimStageReward(claimButton.dataset.claimStage);
      return;
    }

    const starRedeemButton = event.target.closest("[data-redeem-star]");
    if (starRedeemButton) {
      redeemStarItem(starRedeemButton.dataset.redeemStar);
      return;
    }

    const diamondRedeemButton = event.target.closest("[data-redeem-diamond]");
    if (diamondRedeemButton) {
      redeemDiamondItem(diamondRedeemButton.dataset.redeemDiamond);
      return;
    }

    const couponButton = event.target.closest("[data-claim-coupon]");
    if (couponButton) {
      markCouponClaimed(couponButton.dataset.claimCoupon);
      return;
    }

    const goButton = event.target.closest("[data-go]");
    if (!goButton) return;

    const targetView = goButton.dataset.go;
    if (targetView === "parent" && !state.parentUnlocked) {
      showView("parentGate");
      return;
    }

    if (targetView === "quiz") {
      state.quizCategoryId = goButton.dataset.category || null;
    } else if (targetView !== "review") {
      state.quizCategoryId = null;
    }

    if (goButton.dataset.category && targetView === "learn") {
      state.activeCategory = goButton.dataset.category;
      state.wordIndex = 0;
    }

    showView(targetView);
  });

  $("#backButton").addEventListener("click", () => showView("home"));
}

function bindParentGate() {
  const form = $("#parentPasswordForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#parentPasswordInput");
    const feedback = $("#parentPasswordFeedback");

    if (input.value.trim() === "8804") {
      state.parentUnlocked = true;
      input.value = "";
      feedback.textContent = "";
      showView("parent");
      return;
    }

    feedback.textContent = "密碼不正確，請再試一次。";
    input.select();
  });
}

function bindLearning() {
  $("#prevWord").addEventListener("click", () => {
    const words = activeCategory().words;
    state.wordIndex = (state.wordIndex - 1 + words.length) % words.length;
    renderLearn();
  });

  $("#nextWord").addEventListener("click", () => {
    const words = activeCategory().words;
    state.wordIndex = (state.wordIndex + 1) % words.length;
    renderLearn();
  });

  $("#knownWord").addEventListener("click", () => {
    const category = activeCategory();
    const word = category.words[state.wordIndex];
    markLearned(category.id, word);
    state.wordIndex = Math.min(state.wordIndex + 1, category.words.length - 1);
    renderAll();
    renderLearn();
  });
}

function showView(viewName) {
  $$(".view").forEach((view) => view.classList.remove("active"));
  $(`#${viewName}View`).classList.add("active");
  $("#backButton").classList.toggle("hidden", viewName === "home");

  if (viewName === "home") renderAll();
  if (viewName === "learn") renderLearn();
  if (viewName === "quiz") renderQuizModeSelection();
  if (viewName === "review") renderReview();
  if (viewName === "dressup") renderDressup();
  if (viewName === "rewards") renderRewards();
  if (viewName === "garden") renderGarden();
  if (viewName === "parent") renderParentSettings();
  renderHeader();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderProfileSwitch();
  renderCategories();
  renderHome();
  renderHeader();
}

function renderHeader() {
  $("#starCount").textContent = currentProgress().stars;
  const diamondCount = $("#diamondCount");
  if (diamondCount) diamondCount.textContent = currentProgress().diamonds;
}

function renderHome() {
  const profile = currentProfile();
  const learnedCount = learnedWords().length;
  const totalCount = allWords().length;
  const percent = Math.round((learnedCount / totalCount) * 100);

  $("#activeProfileLabel").textContent = `${profile.displayName} \u7684\u5192\u96aa`;
  $("#progressText").textContent = `${percent}%`;
  $("#progressFill").style.width = `${percent}%`;
  $("#starCount").textContent = currentProgress().stars;
  const diamondCount = $("#diamondCount");
  if (diamondCount) diamondCount.textContent = currentProgress().diamonds;
  renderHomeRewardSummary();
  renderHomeGardenSummary();
  renderSyncStatus();
  applyOutfit("#homeBuddy", "home");

  activeWordData().forEach((category) => {
    const learnedIds = new Set(currentProgress().learnedWordIds || []);
    const masteredIds = new Set(currentProgress().masteredWordIds || []);
    const claimedIds = new Set(currentProgress().claimedStageRewardIds || []);
    const learnedCountForCategory = category.words.filter((word) => learnedIds.has(getWordId(word, category.id))).length;
    const masteredCountForCategory = category.words.filter((word) => masteredIds.has(getWordId(word, category.id))).length;
    const total = category.words.length;
    const isUnlocked = isStageUnlocked(category);
    const canClaim = isUnlocked && total > 0 && learnedCountForCategory === total && masteredCountForCategory === total && !claimedIds.has(category.id);
    const isDone = claimedIds.has(category.id);
    const status = !isUnlocked ? "\u672a\u89e3\u9396" : isDone ? "\u5df2\u5b8c\u6210" : canClaim ? "\u53ef\u9818\u947d\u77f3" : learnedCountForCategory === 0 ? "\u53ef\u6311\u6230" : "\u5b78\u7fd2\u4e2d";
    const label = $(`#cat-${category.id}`);
    const masteredLabel = $(`#cat-mastered-${category.id}`);
    const statusLabel = $(`#cat-status-${category.id}`);
    const rewardLabel = $(`#cat-reward-${category.id}`);
    if (label) label.textContent = `\u5df2\u5b78\u7fd2 ${learnedCountForCategory} / ${total}`;
    if (masteredLabel) masteredLabel.textContent = `\u5df2\u638c\u63e1 ${masteredCountForCategory} / ${total}`;
    if (statusLabel) {
      statusLabel.textContent = status;
      statusLabel.classList.toggle("locked", !isUnlocked);
      statusLabel.classList.toggle("done", isDone);
      statusLabel.classList.toggle("claimable", canClaim);
    }
    if (rewardLabel) {
      rewardLabel.innerHTML = canClaim
        ? `<button class="claim-button" type="button" data-claim-stage="${category.id}">\u9818\u53d6\u947d\u77f3 \ud83d\udc8e</button>`
        : isDone ? `<small>\u5df2\u9818\u53d6 ${Number(category.diamondReward) || 1} \u9846\u947d\u77f3</small>` : "";
    }
  });
}

function syncStatusInfo() {
  const status = window.dataStore?.getSyncStatus?.() || {};
  if (status.syncing) return { text: "同步中", tone: "syncing" };
  if (status.error) return { text: "同步失敗，稍後再試", tone: "error" };
  if (status.syncMode === "cloud" && status.online) return { text: "已同步", tone: "synced" };
  return { text: "離線模式", tone: "offline" };
}

function renderSyncStatus() {
  const box = $("#syncStatus");
  if (!box) return;
  const info = syncStatusInfo();
  box.textContent = info.text;
  box.className = `sync-status ${info.tone}`;
}


function renderHomeRewardSummary() {
  const box = $("#rewardSummary");
  if (!box) return;
  const profile = currentProfile();
  const current = currentProgress();
  const pendingCoupons = (current.rewardCoupons || []).filter((coupon) => !coupon.claimed).length;
  box.innerHTML = `
    <div><strong>${profile.displayName}</strong><small>${profile.roleName}\u30fb${profile.levelName}</small></div>
    <div><span>\u2b50</span><strong>${current.stars}</strong></div>
    <div><span>\ud83d\udc8e</span><strong>${current.diamonds}</strong></div>
    <div><small>\u5b8c\u6210\u95dc\u5361</small><strong>${(current.claimedStageRewardIds || []).length}</strong></div>
    <div><small>\u5f85\u514c\u63db</small><strong>${pendingCoupons}</strong></div>
  `;
}

function renderHomeGardenSummary() {
  const box = $("#gardenSummary");
  if (!box) return;
  const garden = ensureGarden();
  const info = gardenInfoForLevel(garden.sharedGardenLevel);
  const nextPoints = pointsToNextGardenLevel(garden.sharedGardenPoints);
  box.innerHTML = `
    <div class="garden-summary-copy">
      <span>${info.icon}</span>
      <div>
        <strong>\u79d8\u5bc6\u82b1\u5712 Lv.${garden.sharedGardenLevel}</strong>
        <small>${garden.sharedGardenPoints} \u5206\u30fb${nextPoints ? `\u8ddd\u96e2\u4e0b\u4e00\u7d1a\u9084\u5dee ${nextPoints} \u5206` : "\u5df2\u5b8c\u6210\u6700\u9ad8\u7b49\u7d1a"}</small>
      </div>
    </div>
  `;
}

function gardenStatusMarkup(points) {
  const level = calculateGardenLevel(points);
  const info = gardenInfoForLevel(level);
  const nextPoints = pointsToNextGardenLevel(points);
  return `
    <div class="garden-visual" aria-hidden="true">${info.icon}</div>
    <strong>Lv.${level} ${info.name}</strong>
    <p>${points} \u5206</p>
    <small>${nextPoints ? `\u8ddd\u96e2\u4e0b\u4e00\u7d1a\u9084\u5dee ${nextPoints} \u5206` : "\u7955\u5bc6\u82b1\u5712\u5b8c\u6210"}</small>
  `;
}

function renderGarden() {
  const garden = ensureGarden();
  const sharedInfo = gardenInfoForLevel(garden.sharedGardenLevel);

  $("#gardenBox").innerHTML = `
    <section class="garden-shared-card">
      <div>
        <p class="eyebrow">\u4e09\u500b\u5b69\u5b50\u4e00\u8d77\u9577\u5927</p>
        <h3>\u5171\u540c\u79d8\u5bc6\u82b1\u5712</h3>
      </div>
      <div class="garden-scene level-${garden.sharedGardenLevel}">
        ${gardenStatusMarkup(garden.sharedGardenPoints)}
      </div>
      <p class="garden-note">${sharedInfo.name}</p>
    </section>
    <section class="garden-child-grid">
      ${PROFILES.map((profile) => {
        const childGarden = childGardenProgress(profile.id);
        const childInfo = gardenInfoForLevel(childGarden.gardenLevel);
        const items = childGarden.unlockedGardenItems || [];
        return `
          <article class="garden-child-card ${profile.color}">
            <div class="garden-child-heading">
              <span class="profile-avatar ${profile.color}">${profile.avatar || profile.displayName.slice(0, 1)}</span>
              <div>
                <strong>${profile.displayName} \u7684\u82b1\u5703</strong>
                <small>${profile.roleName}\u30fb${profile.levelName}</small>
              </div>
            </div>
            <div class="garden-mini-scene">${gardenStatusMarkup(childGarden.gardenPoints)}</div>
            <div class="garden-items">
              <span>\u5df2\u89e3\u9396</span>
              <p>${items.length ? items.map(escapeHtml).join("\u3001") : "\u9084\u5728\u52aa\u529b\u9577\u5927"}</p>
            </div>
            <em>${childInfo.name}</em>
          </article>
        `;
      }).join("")}
    </section>
  `;
}


function renderParentSettings() {
  $("#customWordFeedback").textContent = "";
  $("#customProfile").innerHTML = `<option value="all">\u5168\u90e8\u5b69\u5b50</option>` + PROFILES.map((child) => (
    `<option value="${child.id}">${child.displayName}\uff08${child.roleName}\uff09</option>`
  )).join("");
  $("#customProfile").value = currentProfile().id;
  renderCategoryOptions();
  renderCustomWordList();
  renderRewardItemList();
  renderCustomAccessoryList();
  updateAccessoryAdminPreview();
}

function saveCustomWordFromForm() {
  const selectedProfileId = $("#customProfile").value;
  const profiles = selectedProfileId === "all"
    ? PROFILES
    : PROFILES.filter((item) => item.id === selectedProfileId);
  const word = $("#customWord").value.trim();
  const meaning = $("#customMeaning").value.trim();
  const zhuyin = $("#customZhuyin").value.trim();
  const sentence = $("#customSentence").value.trim();
  const emojiInput = $("#customEmoji").value.trim();
  const category = $("#customCategory").value.trim();
  const difficulty = $("#customDifficulty").value || "easy";
  const editedZhuyinChars = getEditedZhuyinChars();

  if (!word || !meaning || !category || !profiles.length) return;

  profiles.forEach((profile) => {
    const childProgress = progress.children[profile.id] || (progress.children[profile.id] = defaultChildProgress());
    const level = profile.wordSetId || profile.level;
    const stageInfo = findStageInfo(level, category, difficulty);
    const zhuyinChars = editedZhuyinChars || buildZhuyinChars(meaning, zhuyin) || generateZhuyinChars(meaning);
    const normalizedWord = word.toLowerCase();

    const customWord = {
      id: `custom_${profile.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      word: normalizedWord,
      en: normalizedWord,
      meaning,
      zhuyinText: zhuyin,
      zhuyin,
      zhuyinChars,
      partOfSpeech: "",
      sourceCategory: "custom",
      appCategory: stageInfo.appCategory,
      rawAppCategory: stageInfo.appCategory,
      category: stageInfo.zh,
      categoryId: stageInfo.stageId,
      categoryZh: stageInfo.zh,
      difficulty,
      stageId: stageInfo.stageId,
      enabledFor: [profile.id],
      spellingEnabledFor: profile.id === "ethan" ? [] : [profile.id],
      sentence,
      emoji: emojiInput || resolveWordEmoji({ word: normalizedWord, en: normalizedWord, sourceCategory: category, appCategory: stageInfo.appCategory }),
      source: "custom",
      createdAt: new Date().toISOString()
    };

    childProgress.customWords = childProgress.customWords || [];
    childProgress.customWords.push(customWord);
  });

  saveCustomWords();
  $("#customWordForm").reset();
  $("#zhuyinEditor").innerHTML = "";
  $("#zhuyinHint").textContent = "\u81ea\u52d5\u6ce8\u97f3\u53ef\u80fd\u9047\u5230\u7834\u97f3\u5b57\uff0c\u8acb\u78ba\u8a8d\u5f8c\u518d\u5132\u5b58\u3002";
  $("#customProfile").value = selectedProfileId;
  $("#customWordFeedback").textContent = "\u5df2\u65b0\u589e\u81ea\u8a02\u55ae\u5b57\u3002";
  renderCustomWordList();
  renderAll();
}



function renderCustomWordList() {
  const profileId = $("#customProfile").value;
  const entries = profileId === "all"
    ? PROFILES.flatMap((profile) => (progress.children[profile.id]?.customWords || []).map((word) => ({ profile, word })))
    : (progress.children[profileId]?.customWords || []).map((word) => ({ profile: PROFILES.find((item) => item.id === profileId), word }));

  if (!entries.length) {
    $("#customWordList").innerHTML = `
      <div class="empty-state compact">
        <span>\uff0b</span>
        <strong>\u9084\u6c92\u6709\u81ea\u8a02\u55ae\u5b57</strong>
        <p>\u53ef\u4ee5\u5f9e\u8868\u55ae\u65b0\u589e\uff0c\u6216\u532f\u5165 Excel CSV\u3002</p>
      </div>
    `;
    return;
  }

  $("#customWordList").innerHTML = entries.map(({ profile, word }) => `
    <article class="custom-word-item">
      <span class="custom-emoji">${escapeHtml(word.emoji)}</span>
      <div>
        <strong>${escapeHtml(word.en || word.word)}</strong>
        <p>${escapeHtml(word.meaning)}\u30fb${escapeHtml(word.categoryZh)}\u30fb${escapeHtml(word.difficulty)}\u30fb${escapeHtml(profile?.displayName || "")}</p>
        ${word.sentence ? `<small>${escapeHtml(word.sentence)}</small>` : ""}
      </div>
      <button class="soft-button small" type="button" data-child-id="${profile.id}" data-delete-custom="${escapeHtml(word.id)}">\u522a\u9664</button>
    </article>
  `).join("");
}

function deleteCustomWord(childId, wordId) {
  const childProgress = progress.children[childId];
  if (!childProgress) return;
  childProgress.customWords = (childProgress.customWords || []).filter((word) => word.id !== wordId);
  saveCustomWords();
  renderCustomWordList();
  renderAll();
}


function selectedParentChild() {
  const profileId = $("#customProfile").value;
  const profile = PROFILES.find((item) => item.id === profileId) || currentProfile();
  const childProgress = progress.children[profile.id] || (progress.children[profile.id] = defaultChildProgress());
  childProgress.rewardStoreItems = normalizeRewardStoreItems(childProgress.rewardStoreItems);
  return { profile, childProgress, isAll: profileId === "all" };
}



function saveRewardItemFromForm() {
  const { profile, childProgress, isAll } = selectedParentChild();
  if (isAll) {
    $("#rewardItemFeedback").textContent = "\u734e\u52f5\u5546\u5e97\u5167\u5bb9\u8acb\u5148\u9078\u55ae\u4e00\u5b69\u5b50\uff0c\u518d\u65b0\u589e\u6216\u522a\u9664\u3002";
    return;
  }

  const name = $("#rewardItemName").value.trim();
  const costDiamonds = Number.parseInt($("#rewardItemCost").value, 10);
  const type = $("#rewardItemType").value || "physical";
  const icon = $("#rewardItemIcon").value.trim() || "\ud83c\udf81";

  if (!name || !Number.isFinite(costDiamonds) || costDiamonds < 1) {
    $("#rewardItemFeedback").textContent = "\u8acb\u8f38\u5165\u734e\u52f5\u540d\u7a31\uff0c\u947d\u77f3\u8cbb\u7528\u81f3\u5c11 1 \u9846\u3002";
    return;
  }

  childProgress.rewardStoreItems.push({
    id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    costDiamonds,
    type,
    icon
  });

  saveProgress();
  $("#rewardItemForm").reset();
  $("#rewardItemIcon").value = "\ud83c\udf81";
  $("#rewardItemFeedback").textContent = `\u5df2\u65b0\u589e\u5230 ${profile.displayName} \u7684\u947d\u77f3\u5546\u5e97\u3002`;
  renderRewardItemList();
  if ($(`#rewardsView`)?.classList.contains("active") && profile.id === state.activeChildId) renderRewards();
}


function renderRewardItemList() {
  const list = $("#rewardItemList");
  if (!list) return;
  const { profile, childProgress, isAll } = selectedParentChild();
  if (isAll) {
    list.innerHTML = `
      <div class="empty-state compact">
        <span>\ud83d\udc8e</span>
        <strong>\u734e\u52f5\u5546\u5e97\u8acb\u9078\u55ae\u4e00\u5b69\u5b50</strong>
        <p>\u4e09\u4f4d\u5b69\u5b50\u7684\u734e\u52f5\u5167\u5bb9\u662f\u7368\u7acb\u7684\u3002</p>
      </div>
    `;
    return;
  }

  const items = normalizeRewardStoreItems(childProgress.rewardStoreItems);
  childProgress.rewardStoreItems = items;

  list.innerHTML = items.length ? items.map((item) => `
    <article class="reward-admin-item">
      <span class="reward-admin-icon">${escapeHtml(item.icon)}</span>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${item.costDiamonds} \u947d\u77f3\u30fb${escapeHtml(item.type)}</p>
      </div>
      <button class="soft-button small" type="button" data-child-id="${profile.id}" data-delete-reward-item="${escapeHtml(item.id)}">\u522a\u9664</button>
    </article>
  `).join("") : `
    <div class="empty-state compact">
      <span>\ud83c\udf81</span>
      <strong>\u9084\u6c92\u6709\u734e\u52f5\u9805\u76ee</strong>
      <p>\u53ef\u4ee5\u5e6b ${escapeHtml(profile.displayName)} \u65b0\u589e\u947d\u77f3\u53ef\u514c\u63db\u7684\u734e\u52f5\u3002</p>
    </div>
  `;
}


function deleteRewardItem(childId, itemId) {
  const childProgress = progress.children[childId];
  if (!childProgress) return;
  childProgress.rewardStoreItems = normalizeRewardStoreItems(childProgress.rewardStoreItems)
    .filter((item) => item.id !== itemId);
  saveProgress();
  $("#rewardItemFeedback").textContent = "\u5df2\u522a\u9664\u734e\u52f5\u9805\u76ee\u3002";
  renderRewardItemList();
  if ($(`#rewardsView`)?.classList.contains("active") && childId === state.activeChildId) renderRewards();
}

async function saveCustomAccessoryFromForm() {
  const editId = $("#accessoryEditId").value;
  const name = $("#accessoryItemName").value.trim();
  const costStars = Math.max(0, Number.parseInt($("#accessoryItemCost").value, 10) || 0);
  const wearFile = $("#accessoryWearImage").files[0];
  const iconFile = $("#accessoryIconImage").files[0];
  const position = accessoryPositionFromForm();
  const slot = $("#accessorySlot").value || "headTop";
  const allowMultipleInSlot = accessorySlotDefaults(slot).allowMultipleInSlot;

  if (editId) {
    saveAccessoryPositionEdit(editId, position, { slot, allowMultipleInSlot, costStars, name });
    return;
  }

  if (!name || !wearFile) {
    $("#accessoryItemFeedback").textContent = "請輸入裝備名稱並上傳佩戴圖。";
    return;
  }

  const submitButton = $("#accessorySubmitButton");
  try {
    submitButton.disabled = true;
    $("#accessoryItemFeedback").textContent = "正在處理佩戴圖...";
    const itemId = `custom_accessory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const updateUploadStatus = (message) => {
      $("#accessoryItemFeedback").textContent = message;
    };
    const wearImage = await uploadAccessoryImage(wearFile, itemId, "wear", 640, updateUploadStatus);
    const iconImage = iconFile ? await uploadAccessoryImage(iconFile, itemId, "icon", 360, updateUploadStatus) : wearImage;
    const library = accessoryLibrary();
    const now = new Date().toISOString();
    library.customAccessories.push(normalizeAccessoryItem({
      id: itemId,
      name,
      icon: "⭐",
      wearableSrc: wearImage,
      iconSrc: iconImage,
      costStars,
      className: "wear-custom",
      position,
      slot,
      allowMultipleInSlot,
      source: "customAccessory",
      createdAt: now,
      updatedAt: now
    }, { source: "customAccessory", className: "wear-custom" }));
    saveProgress();
    resetAccessoryForm();
    $("#accessoryItemFeedback").textContent = "已新增共用角色裝備，三位孩子都可以兌換。";
    renderCustomAccessoryList();
    renderDressup();
    renderHome();
  } catch (error) {
    $("#accessoryItemFeedback").textContent = `圖片處理失敗：${friendlyUploadError(error)}`;
  } finally {
    submitButton.disabled = false;
  }
}

function accessoryPositionFromForm() {
  const slot = $("#accessorySlot")?.value || "headTop";
  const defaults = accessorySlotDefaults(slot);
  return {
    width: clampNumber($("#accessoryWidth").value, 10, 160, defaults.width ?? 70),
    left: clampNumber($("#accessoryLeft").value, -40, 140, defaults.left ?? 15),
    top: clampNumber($("#accessoryTop").value, -70, 140, defaults.top ?? -8),
    zIndex: clampNumber($("#accessoryZIndex").value, 0, 100, defaults.zIndex ?? 4)
  };
}

function accessoryPositionForItem(item) {
  const library = accessoryLibrary();
  const override = library.accessoryPositionOverrides?.[item.id];
  return normalizeAccessoryPosition(override || item.position || DEFAULT_ACCESSORY_POSITIONS[item.id] || {});
}

function setAccessoryPositionForm(position) {
  const normalized = normalizeAccessoryPosition(position);
  $("#accessoryWidth").value = String(normalized.width);
  $("#accessoryLeft").value = String(normalized.left);
  $("#accessoryTop").value = String(normalized.top);
  $("#accessoryZIndex").value = String(normalized.zIndex);
}

function setAccessoryPositionFormForSlot(position, slot) {
  const normalized = normalizeAccessoryPositionForSlot(position, slot);
  $("#accessoryWidth").value = String(normalized.width);
  $("#accessoryLeft").value = String(normalized.left);
  $("#accessoryTop").value = String(normalized.top);
  $("#accessoryZIndex").value = String(normalized.zIndex);
}

function applyAccessorySlotDefaults() {
  const slot = $("#accessorySlot")?.value || "headTop";
  if (slot !== "pet") {
    updateAccessoryAdminPreview();
    return;
  }
  const defaults = accessorySlotDefaults("pet");
  $("#accessoryWidth").value = String(defaults.width);
  $("#accessoryLeft").value = String(defaults.left);
  $("#accessoryTop").value = String(defaults.top);
  $("#accessoryZIndex").value = String(defaults.zIndex);
  updateAccessoryAdminPreview();
}

function findSharedAccessory(itemId) {
  return sharedAccessories().find((item) => item.id === itemId);
}

function startAccessoryPositionEdit(itemId) {
  const item = findSharedAccessory(itemId);
  if (!item) return;
  const position = accessoryPositionForItem(item);
  $("#accessoryEditId").value = item.id;
  $("#accessoryItemName").value = item.name;
  $("#accessoryItemCost").value = String(item.costStars || 0);
  $("#accessorySlot").value = item.slot || "headTop";
  $("#accessorySubmitButton").textContent = "儲存定位";
  $("#cancelAccessoryEditButton").hidden = false;
  $("#accessoryWearImage").required = false;
  setAccessoryPositionFormForSlot(position, item.slot || "headTop");
  const preview = $("#accessoryPreviewImage");
  preview.src = assetUrl(item.wearableSrc || item.wearImage || item.image || item.iconImage);
  preview.dataset.previewName = "";
  preview.hidden = false;
  updateAccessoryAdminPreview();
  $("#accessoryItemFeedback").textContent = `正在調整：${item.name}`;
}

function saveAccessoryPositionEdit(itemId, position, updates = {}) {
  const library = accessoryLibrary();
  const customItem = library.customAccessories.find((item) => item.id === itemId);
  const slot = updates.slot || customItem?.slot || findSharedAccessory(itemId)?.slot || "headTop";
  const normalizedPosition = normalizeAccessoryPositionForSlot(position, slot);
  const now = new Date().toISOString();
  if (customItem) {
    Object.assign(customItem, normalizeAccessoryItem({
      ...customItem,
      name: updates.name || customItem.name,
      costStars: Number.isFinite(Number(updates.costStars)) ? updates.costStars : customItem.costStars,
      position: normalizedPosition,
      slot,
      allowMultipleInSlot: updates.allowMultipleInSlot,
      updatedAt: now
    }, { source: "customAccessory", className: "wear-custom" }));
  } else {
    const item = findSharedAccessory(itemId);
    library.accessoryPositionOverrides[itemId] = {
      ...normalizedPosition,
      slot,
      allowMultipleInSlot: updates.allowMultipleInSlot ?? item?.allowMultipleInSlot ?? accessorySlotDefaults(slot).allowMultipleInSlot,
      costStars: Number.isFinite(Number(updates.costStars)) ? updates.costStars : item?.costStars,
      name: updates.name || item?.name,
      updatedAt: now
    };
  }
  saveProgress();
  resetAccessoryForm();
  $("#accessoryItemFeedback").textContent = "已儲存共用裝備定位。";
  renderCustomAccessoryList();
  renderDressup();
  renderHome();
}

function resetAccessoryForm() {
  $("#accessoryItemForm").reset();
  $("#accessoryEditId").value = "";
  $("#accessoryItemCost").value = "100";
  $("#accessorySlot").value = "headTop";
  $("#accessoryWidth").value = "70";
  $("#accessoryLeft").value = "15";
  $("#accessoryTop").value = "-8";
  $("#accessoryZIndex").value = "50";
  $("#accessorySubmitButton").textContent = "新增裝備";
  $("#cancelAccessoryEditButton").hidden = true;
  $("#accessoryWearImage").required = false;
  const preview = $("#accessoryPreviewImage");
  preview.hidden = true;
  preview.removeAttribute("src");
  preview.dataset.previewName = "";
  updateAccessoryAdminPreview();
}

function updateAccessoryAdminPreview() {
  const preview = $("#accessoryPreviewImage");
  if (!preview) return;
  const file = $("#accessoryWearImage")?.files?.[0];
  if (file) {
    if (preview.dataset.previewName !== file.name) {
      preview.src = URL.createObjectURL(file);
      preview.dataset.previewName = file.name;
    }
    preview.hidden = false;
  }
  const position = accessoryPositionFromForm();
  preview.style.width = `${position.width}%`;
  preview.style.left = `${position.left}%`;
  preview.style.top = `${position.top}%`;
  preview.style.zIndex = String(position.zIndex);
}

async function uploadAccessoryImage(file, itemId, role, maxEdge, onStatus) {
  if (!file) return "";
  const roleLabel = role === "icon" ? "顯示圖" : "佩戴圖";
  onStatus?.(`正在壓縮${roleLabel}...`);
  const inlineBlob = await imageFileToBlob(file, role === "icon" ? 260 : 420, 0.72);
  onStatus?.(`正在儲存${roleLabel}...`);
  return imageBlobToInlineDataUrl(inlineBlob, roleLabel);
}

async function uploadAccessoryImageToStorage(file, itemId, role, maxEdge, onStatus) {
  if (!file) return "";
  const roleLabel = role === "icon" ? "顯示圖" : "佩戴圖";
  onStatus?.(`正在壓縮${roleLabel}...`);
  const firebase = await import("./firebase.js");
  const storage = await import(FIREBASE_STORAGE_URL);
  const { user } = await firebase.initFirebase();
  const imageBlob = await imageFileToBlob(file, maxEdge);
  const extension = imageBlob.type === "image/png" ? "png" : "webp";
  const safeRole = String(role || "image").replace(/[^\w-]/g, "");
  const path = `accessories/${user.uid}/${itemId}/${safeRole}.${extension}`;
  const imageRef = storage.ref(firebase.storage, path);
  onStatus?.(`正在上傳${roleLabel} 0%...`);
  const uploadTask = storage.uploadBytesResumable(imageRef, imageBlob, {
    contentType: imageBlob.type,
    customMetadata: {
      originalName: file.name || "",
      itemId,
      role: safeRole
    }
  });
  try {
    await waitForUploadTask(uploadTask, roleLabel, onStatus);
    onStatus?.(`正在取得${roleLabel}網址...`);
    return await storage.getDownloadURL(imageRef);
  } catch (error) {
    console.warn("Word Adventure Storage upload fallback:", error);
    onStatus?.(`${roleLabel}雲端圖片庫暫時無回應，改用壓縮備援儲存...`);
    const fallbackBlob = await imageFileToBlob(file, role === "icon" ? 260 : 420, 0.62);
    return imageBlobToInlineDataUrl(fallbackBlob, roleLabel);
  }
}

function waitForUploadTask(uploadTask, roleLabel, onStatus) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      uploadTask.cancel();
      reject(new Error(`${roleLabel}上傳逾時，請確認網路或 Firebase Storage 規則後再試一次`));
    }, ACCESSORY_UPLOAD_TIMEOUT_MS);

    uploadTask.on("state_changed", (snapshot) => {
      const percent = snapshot.totalBytes
        ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        : 0;
      onStatus?.(`正在上傳${roleLabel} ${percent}%...`);
    }, (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(error);
    }, () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      onStatus?.(`${roleLabel}上傳完成`);
      resolve();
    });
  });
}

function friendlyUploadError(error) {
  const code = error?.code || "";
  if (code === "storage/unauthorized") {
    return "Firebase Storage 沒有允許目前使用者上傳，請檢查 Storage Rules。";
  }
  if (code === "storage/canceled") {
    return "上傳逾時或已取消，請換小一點的圖片或稍後再試。";
  }
  if (code === "storage/retry-limit-exceeded") {
    return "上傳重試太久，請檢查網路後再試一次。";
  }
  if (code === "auth/network-request-failed" || code === "storage/unknown") {
    return "網路或 Firebase 暫時沒有回應，請稍後再試。";
  }
  return error?.message || String(error);
}

function imageBlobToInlineDataUrl(blob, roleLabel) {
  return new Promise((resolve, reject) => {
    if (!blob) {
      reject(new Error(`${roleLabel}壓縮失敗，請換一張圖片試試看`));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${roleLabel}備援儲存失敗，請換小一點的圖片`));
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (dataUrl.length > ACCESSORY_INLINE_IMAGE_LIMIT) {
        reject(new Error(`${roleLabel}壓縮後仍太大，請先裁切或換小一點的圖片`));
        return;
      }
      resolve(dataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

function imageFileToBlob(file, maxEdge = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("無法讀取圖片檔案"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("無法載入圖片，請換一張試試看"));
      image.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("圖片壓縮失敗，請換一張試試看"));
            return;
          }
          resolve(blob);
        }, "image/webp", quality);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderCustomAccessoryList() {
  const list = $("#accessoryItemList");
  if (!list) return;
  const entries = sharedAccessories()
    .filter((item) => item.id !== "none")
    .map((item) => ({
      item,
      isCustom: item.source === "customAccessory",
      position: accessoryPositionForItem(item)
    }));

  if (!entries.length) {
    list.innerHTML = `
      <div class="empty-state compact">
        <span>🎒</span>
        <strong>還沒有共用裝備</strong>
        <p>新增後三位孩子都可以在角色換裝頁兌換。</p>
      </div>
    `;
    return;
  }

  list.innerHTML = entries.map(({ item, isCustom, position }) => `
    <article class="accessory-admin-item">
      <img src="${assetUrl(item.iconSrc || item.iconImage || item.wearableSrc || item.wearImage)}" alt="${escapeHtml(item.name)}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>共用・${ACCESSORY_SLOT_LABELS[item.slot] || item.slot}・${item.costStars || 0} 星・寬 ${position.width}%・左 ${position.left}%・上 ${position.top}%・層 ${position.zIndex}</p>
      </div>
      <div class="accessory-admin-actions">
        <button class="soft-button small" type="button" data-edit-accessory-item="${escapeHtml(item.id)}">調整定位</button>
        <button class="soft-button small" type="button" data-reset-accessory-position="${escapeHtml(item.id)}">重設</button>
        <button class="soft-button small danger" type="button" data-delete-accessory-item="${escapeHtml(item.id)}">刪除</button>
      </div>
    </article>
  `).join("");
}

function deleteCustomAccessory(itemId) {
  if (!window.confirm("刪除此裝備後，三位孩子身上的此裝備也會被移除，確定要刪除嗎？")) return;
  const library = accessoryLibrary();
  const isCustom = library.customAccessories.some((item) => item.id === itemId);
  if (isCustom) {
    library.customAccessories = library.customAccessories.filter((item) => item.id !== itemId);
  } else if (itemId !== "none" && !library.hiddenAccessoryIds.includes(itemId)) {
    library.hiddenAccessoryIds.push(itemId);
  }
  delete library.accessoryPositionOverrides[itemId];

  PROFILES.forEach((profile) => {
    const childProgress = progress.children[profile.id] || (progress.children[profile.id] = defaultChildProgress());
    childProgress.unlockedAccessories = (childProgress.unlockedAccessories || ["none"]).filter((id) => id !== itemId);
    childProgress.equippedAccessories = (childProgress.equippedAccessories || ["none"]).filter((id) => id !== itemId);
    if (!childProgress.unlockedAccessories.includes("none")) childProgress.unlockedAccessories.unshift("none");
    if (!childProgress.equippedAccessories.length) childProgress.equippedAccessories = ["none"];
    childProgress.outfit = childProgress.equippedAccessories[0] || "none";
    childProgress.unlocked = childProgress.unlockedAccessories;
    childProgress.customAccessories = [];
    childProgress.hiddenAccessoryIds = [];
    childProgress.accessoryPositionOverrides = {};
  });

  saveProgress();
  $("#accessoryItemFeedback").textContent = "已刪除共用裝備，三位孩子都會同步移除。";
  renderCustomAccessoryList();
  renderDressup();
  renderHome();
}

function resetAccessoryPosition(itemId) {
  const library = accessoryLibrary();
  const customItem = library.customAccessories.find((item) => item.id === itemId);
  if (customItem) {
    customItem.position = normalizeAccessoryPositionForSlot(DEFAULT_ACCESSORY_POSITIONS[itemId] || customItem.position || {}, customItem.slot || "headTop");
  } else {
    delete library.accessoryPositionOverrides[itemId];
  }
  saveProgress();
  $("#accessoryItemFeedback").textContent = "已重設共用裝備定位。";
  renderCustomAccessoryList();
  renderDressup();
  renderHome();
}
function importCustomWordsFromFile() {
  const file = $("#importWordsFile").files[0];
  const profileId = $("#customProfile").value;
  const profiles = profileId === "all" ? PROFILES : PROFILES.filter((item) => item.id === profileId);
  const profile = profiles[0] || PROFILES[0];
  const level = profile.wordSetId || profile.level;
  const childProgress = progress.children[profile.id] || (progress.children[profile.id] = defaultChildProgress());

  if (!file) {
    $("#importWordsFeedback").textContent = "請先選擇 CSV 檔案。";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseDelimitedText(String(reader.result || ""));
      const imported = profiles.flatMap((targetProfile) => {
        const targetLevel = targetProfile.wordSetId || targetProfile.level;
        return rows.map((row) => customWordFromImportRow(row, targetLevel, targetProfile)).filter(Boolean);
      });

      if (!imported.length) {
        $("#importWordsFeedback").textContent = "沒有找到可匯入的單字。";
        return;
      }

      profiles.forEach((targetProfile) => {
        const targetProgress = progress.children[targetProfile.id] || (progress.children[targetProfile.id] = defaultChildProgress());
        targetProgress.customWords = targetProgress.customWords || [];
        targetProgress.customWords.push(...imported.filter((word) => (word.enabledFor || []).includes(targetProfile.id)));
      });
      saveCustomWords();
      $("#importWordsFeedback").textContent = `已匯入 ${imported.length} 個單字。`;
      $("#importWordsFile").value = "";
      renderCustomWordList();
      renderAll();
    } catch {
      $("#importWordsFeedback").textContent = "匯入失敗，請確認 CSV 格式正確。";
    }
  };
  reader.readAsText(file, "utf-8");
}


function customWordFromImportRow(row, level, profile) {
  const word = (row.word || row.en || "").trim();
  const meaning = (row.meaning || row.zh || "").trim();
  const category = (row.appcategory || row.category || "").trim();
  if (!word || !meaning || !category) return null;

  const difficulty = (row.difficulty || "easy").trim();
  const zhuyin = (row.zhuyintext || row.zhuyin || "").trim();
  const stageInfo = findStageInfo(level, category, difficulty);
  const zhuyinChars = parseCsvZhuyinChars(row.zhuyincharsjson || "", meaning, zhuyin);
  const childId = profile?.id || currentProfile().id;
  const normalizedWord = word.toLowerCase();

  return {
    id: `custom_${childId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    word: normalizedWord,
    en: normalizedWord,
    meaning,
    zhuyinText: zhuyin,
    zhuyin,
    zhuyinChars: zhuyinChars.length ? zhuyinChars : generateZhuyinChars(meaning),
    partOfSpeech: (row.partofspeech || "").trim(),
    sourceCategory: (row.sourcecategory || "custom").trim(),
    appCategory: stageInfo.appCategory,
    rawAppCategory: stageInfo.appCategory,
    category: stageInfo.zh,
    categoryId: stageInfo.stageId,
    categoryZh: stageInfo.zh,
    difficulty,
    stageId: stageInfo.stageId,
    enabledFor: [childId],
    spellingEnabledFor: childId === "ethan" ? [] : [childId],
    sentence: (row.sentence || "").trim(),
    emoji: (row.emoji || "").trim() || resolveWordEmoji({
      word: normalizedWord,
      en: normalizedWord,
      sourceCategory: (row.sourcecategory || category || "custom").trim(),
      appCategory: stageInfo.appCategory
    }),
    source: "custom",
    createdAt: new Date().toISOString()
  };
}

function parseDelimitedText(text) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const table = parseCsv(text.replace(/^\uFEFF/, ""), delimiter);
  if (table.length < 2) return [];

  const headers = table[0].map((cell) => cell.trim().toLowerCase());
  return table.slice(1).map((cells) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] || "").trim();
    });
    return row;
  });
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function loadWordsFromCsv(csvText) {
  return parseDelimitedText(csvText)
    .map(csvWordFromRow)
    .filter(Boolean);
}


function loadStagesFromCsv(csvText) {
  return parseDelimitedText(csvText)
    .map(csvStageFromRow)
    .filter(Boolean);
}

function csvStageFromRow(row) {
  const id = csvValue(row, "stageid") || csvValue(row, "id");
  const appCategory = csvValue(row, "category") || csvValue(row, "appcategory") || id.split("_")[0];
  const difficulty = csvValue(row, "difficulty") || id.split("_").pop() || "easy";
  if (!id || !appCategory) return null;

  return {
    id,
    appCategory,
    baseCategoryId: appCategory,
    difficulty,
    title: csvValue(row, "title") || `${csvValue(row, "categoryzh") || appCategory}?${difficultyLabel(difficulty)}`,
    zh: csvValue(row, "categoryzh") || appCategory,
    categoryZh: csvValue(row, "categoryzh") || appCategory,
    en: id,
    color: categoryColor(appCategory),
    icon: csvValue(row, "emoji") || "?",
    unlockRequirement: csvValue(row, "unlockrequirement") || defaultStageUnlockRequirement(appCategory, difficulty),
    diamondReward: Number.parseInt(csvValue(row, "diamondreward"), 10) || 1,
    words: []
  };
}

function defaultStageUnlockRequirement(appCategory, difficulty) {
  if (difficulty === "medium") return `${appCategory}_easy`;
  if (difficulty === "hard") return `${appCategory}_medium`;
  return "";
}

function buildWordBanksFromCsvData(words, stages) {
  const makeBank = (levelId, childId) => {
    const stageMap = new Map(stages.map((stage) => [stage.id, { ...stage, words: [] }]));
    words
      .filter((word) => wordAllowedForChild(word, childId))
      .forEach((word) => {
        const stageId = word.stageId || `${word.appCategory}_${word.difficulty || "easy"}`;
        if (!stageMap.has(stageId)) {
          const info = findStageInfo(levelId, word.appCategory || word.category || "custom", word.difficulty || "easy");
          stageMap.set(stageId, {
            id: stageId,
            appCategory: info.appCategory,
            baseCategoryId: info.appCategory,
            difficulty: word.difficulty || "easy",
            title: `${info.zh}?${difficultyLabel(word.difficulty || "easy")}`,
            zh: info.zh,
            categoryZh: info.zh,
            en: stageId,
            color: categoryColor(info.appCategory),
            icon: displayGroupForCategory(info.appCategory).icon || categoryFallbackEmoji(info.appCategory),
            unlockRequirement: defaultStageUnlockRequirement(info.appCategory, word.difficulty || "easy"),
            diamondReward: 1,
            words: []
          });
        }
        const stage = stageMap.get(stageId);
        stage.words.push(enrichWordForDisplay({
          ...word,
          id: word.id,
          en: word.en || word.word,
          word: word.word || word.en,
          categoryId: stageId,
          categoryZh: stage.categoryZh || stage.zh,
          rawAppCategory: word.rawAppCategory || word.appCategory,
          stageId,
          emoji: resolveWordEmoji(word)
        }));
      });
    return [...stageMap.values()].filter((stage) => stage.words.length > 0);
  };

  return {
    beginner: makeBank("beginner", "ethan"),
    elementary: makeBank("elementary", "jim")
  };
}

async function initializeCsvData() {
  if (!window.fetch) return;

  const warning = (message) => showCsvLoadWarning(message);
  if (window.location.protocol === "file:") {
    warning("CSV \u6a94\u6848\u9700\u8981\u7528\u672c\u6a5f\u4f3a\u670d\u5668\u958b\u555f\u3002\u8acb\u5728\u8cc7\u6599\u593e\u57f7\u884c python -m http.server 8000\uff0c\u518d\u958b http://localhost:8000/index.html\u3002\u73fe\u5728\u5148\u4f7f\u7528 data.js fallback \u5b57\u5eab\u3002");
    return;
  }

  try {
    const [wordsResponse, stagesResponse] = await Promise.all([
      fetch("data/word_adventure_gept_kids_words_zhuyin_balanced.csv"),
      fetch("data/word_adventure_gept_kids_stages_balanced.csv")
    ]);
    if (!wordsResponse.ok || !stagesResponse.ok) throw new Error("CSV fetch failed");
    const [wordsText, stagesText] = await Promise.all([wordsResponse.text(), stagesResponse.text()]);
    const csvWords = loadWordsFromCsv(wordsText);
    const csvStages = loadStagesFromCsv(stagesText);
    if (!csvWords.length || !csvStages.length) throw new Error("CSV parsed empty");
    const banks = buildWordBanksFromCsvData(csvWords, csvStages);
    WORD_BANKS.beginner = banks.beginner;
    WORD_BANKS.elementary = banks.elementary;
    invalidateWordDataCache();
  } catch (error) {
    console.warn("Word Adventure CSV load fallback:", error);
    warning("CSV \u8b80\u53d6\u5931\u6557\uff0c\u73fe\u5728\u5148\u4f7f\u7528 data.js fallback \u5b57\u5eab\u3002\u82e5\u8981\u76f4\u63a5\u8b80 CSV\uff0c\u8acb\u7528\u672c\u6a5f\u4f3a\u670d\u5668\u958b\u555f\uff0c\u4f8b\u5982 python -m http.server 8000\u3002");
  }
}

function showCsvLoadWarning(message) {
  if (document.querySelector(".csv-load-warning")) return;
  const warning = document.createElement("div");
  warning.className = "csv-load-warning";
  warning.textContent = message;
  document.body.prepend(warning);
}

function csvWordFromRow(row) {
  const id = csvValue(row, "id");
  const word = csvValue(row, "word").toLowerCase();
  const meaning = csvValue(row, "meaning");
  const stageId = csvValue(row, "stageid");

  if (!id || !word || !meaning || !stageId) return null;
  if (!/[a-z]/.test(word)) return null;

  const zhuyinText = csvValue(row, "zhuyintext");
  const appCategory = csvValue(row, "appcategory");

  return {
    id,
    word,
    en: word,
    meaning,
    zhuyinText,
    zhuyin: zhuyinText,
    zhuyinChars: parseCsvZhuyinChars(csvValue(row, "zhuyincharsjson"), meaning, zhuyinText),
    partOfSpeech: csvValue(row, "partofspeech"),
    sourceCategory: csvValue(row, "sourcecategory"),
    appCategory,
    rawAppCategory: appCategory,
    category: csvValue(row, "appcategoryzh") || appCategory,
    categoryZh: csvValue(row, "appcategoryzh") || appCategory,
    difficulty: csvValue(row, "difficulty") || "easy",
    level: Number.parseInt(csvValue(row, "level"), 10) || 1,
    stageId,
    sentence: csvValue(row, "sentence"),
    emoji: resolveWordEmoji({
      word,
      en: word,
      sourceCategory: csvValue(row, "sourcecategory"),
      appCategory,
      emoji: csvValue(row, "emoji")
    }),
    source: csvValue(row, "source"),
    enabledFor: splitCsvList(csvValue(row, "enabledfor")),
    spellingEnabledFor: splitCsvList(csvValue(row, "spellinenabledfor") || csvValue(row, "spellingenabledfor"))
  };
}

function csvValue(row, key) {
  return (row[key] || "").trim();
}

function splitCsvList(value) {
  return value.split("|").map((item) => item.trim()).filter(Boolean);
}

function parseCsvZhuyinChars(jsonText, meaning, zhuyinText) {
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        const items = parsed
          .filter((item) => item && item.char)
          .map((item) => ({ char: String(item.char), ruby: String(item.ruby || "") }));
        if (items.length) return items;
      }
    } catch {
      // Fall back to zhuyinText below.
    }
  }

  return buildZhuyinChars(meaning, zhuyinText);
}

function handleGenerateZhuyin() {
  const meaning = $("#customMeaning").value.trim();
  const generated = generateZhuyinChars(meaning);
  renderZhuyinEditor(generated);

  if (!meaning) {
    $("#zhuyinHint").textContent = "請先輸入中文意思。";
    return;
  }

  const hasMissing = generated.some((item) => !item.ruby);
  $("#zhuyinHint").textContent = hasMissing
    ? "有些字沒有自動產生注音，請手動補上。"
    : "已自動產生注音，請確認後再儲存。";
}

function generateZhuyinChars(meaning) {
  return Array.from(meaning.replace(/\s+/g, "")).map((char) => ({
    char,
    ruby: ZHUYIN_MAP[char] || ""
  }));
}

function renderZhuyinEditor(items) {
  if (!items.length) {
    $("#zhuyinEditor").innerHTML = "";
    return;
  }

  $("#zhuyinEditor").innerHTML = items.map((item, index) => `
    <label class="zhuyin-edit-row">
      <span>${escapeHtml(item.char)}</span>
      <input type="text" value="${escapeHtml(item.ruby)}" data-zhuyin-index="${index}" data-char="${escapeHtml(item.char)}" aria-label="${escapeHtml(item.char)} 注音">
    </label>
  `).join("");
}

function getEditedZhuyinChars() {
  const inputs = $$("[data-zhuyin-index]");
  if (!inputs.length) return null;

  return inputs.map((input) => ({
    char: input.dataset.char,
    ruby: input.value.trim()
  }));
}

function renderLearn() {
  const category = activeCategory();
  const word = category.words[state.wordIndex];
  const wordId = getWordId(word, category.id);
  const isLearned = (currentProgress().learnedWordIds || []).includes(wordId);

  $("#learnCategoryLabel").textContent = `${category.zh} ${category.en}`;
  $("#wordCard").innerHTML = `
    ${mascotMarkup("learn")}
    ${wordVisualMarkup(word, "big-emoji")}
    <p class="word-en">${word.en}</p>
    <button class="sound-button" type="button" data-speak="${escapeHtml(word.en)}">🔊 發音</button>
    <div class="word-zh">${meaningMarkup(word)}</div>
    ${word.usageNote ? `
      <div class="usage-note">
        <strong>\u7528\u6cd5</strong>
        <p>${escapeHtml(word.usageNote)}</p>
        ${word.sentence ? `<small>${escapeHtml(word.sentence)}</small>` : ""}
      </div>
    ` : word.sentence ? `<p class="example-sentence">${escapeHtml(word.sentence)}</p>` : ""}
    <span class="learned-badge ${isLearned ? "done" : ""}">
      ${isLearned ? "已學會" : "還沒收集"}
    </span>
  `;
}



function renderQuizModeSelection() {
  const profile = currentProfile();
  state.quizMode = null;
  state.quizWord = null;
  state.currentQuiz = null;

  if (!state.quizCategoryId) {
    renderQuizStageSelection();
    return;
  }

  const scope = quizScopeCategory();
  if (scope && !isStageUnlocked(scope)) {
    renderQuizStageSelection();
    return;
  }

  const modes = (profile.quizModes || []).map((modeId) => QUIZ_MODES[modeId]).filter(Boolean);

  $("#quizCategoryLabel").textContent = quizScopeLabel();
  $("#quizTitle").textContent = "\u9078\u64c7\u6e2c\u9a57\u6a21\u5f0f";
  $("#quizBox").innerHTML = `
    ${mascotMarkup("quiz", "quiz-mascot")}
    <div class="mode-grid">
      ${modes.map((mode) => `
        <button class="mode-card" type="button" data-quiz-mode="${mode.id}">
          <span>${mode.icon}</span>
          <strong>${mode.label}</strong>
          <small>${mode.helper}</small>
        </button>
      `).join("")}
    </div>
    <div class="quiz-actions">
      <button class="soft-button small" type="button" id="changeQuizStage">\u5207\u63db\u95dc\u5361</button>
    </div>
  `;

  $("#changeQuizStage").addEventListener("click", () => {
    state.quizCategoryId = null;
    renderQuizStageSelection();
  });

  $$(`[data-quiz-mode]`).forEach((button) => {
    button.addEventListener("click", () => {
      state.quizMode = button.dataset.quizMode;
      startQuizRound();
      renderQuizQuestion();
    });
  });
}


function renderQuizStageSelection() {
  const stages = visibleStages();
  $("#quizCategoryLabel").textContent = `${currentProfile().displayName} \u7684\u5192\u96aa`;
  $("#quizTitle").textContent = "\u9078\u64c7\u95dc\u5361\u6e2c\u9a57";
  $("#quizBox").innerHTML = `
    ${mascotMarkup("hint", "quiz-mascot")}
    <div class="stage-quiz-grid">
      ${stages.map((stage) => {
        const unlocked = isStageUnlocked(stage);
        const learnedCount = learnedWordsForCategory(stage.id).length;
        return `
          <button class="stage-quiz-card ${unlocked ? "" : "locked"}" type="button" data-quiz-stage="${stage.id}" ${unlocked ? "" : "disabled"}>
            <span>${stage.icon}</span>
            <strong>${stage.title || `${stage.zh}\u30fb${stage.difficultyZh || stage.difficulty}`}</strong>
            <small>${unlocked ? `\u5df2\u5b78\u7fd2 ${learnedCount} / ${stage.words.length}` : stageUnlockHint(stage)}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;

  $$(`[data-quiz-stage]`).forEach((button) => {
    button.addEventListener("click", () => {
      state.quizCategoryId = button.dataset.quizStage;
      renderQuizModeSelection();
    });
  });
}

function groupStagesByCategory(stages) {
  const groups = new Map();
  stages.forEach((stage) => {
    const key = stage.baseCategoryId || stage.appCategory || stage.categoryId || stage.id;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        title: stage.categoryZh || stage.zh || key,
        icon: stage.icon || "?",
        stages: []
      });
    }
    groups.get(key).stages.push(stage);
  });

  const order = { easy: 1, medium: 2, hard: 3 };
  return [...groups.values()].map((group) => ({
    ...group,
    stages: group.stages.sort((a, b) => (order[a.difficulty] || 9) - (order[b.difficulty] || 9))
  }));
}



function stageUnlockHint(stage) {
  if (!stage?.unlockRequirement) return "";
  if (stage.difficulty === "medium") return "\u5b8c\u6210\u7c21\u55ae\u95dc\u5361\u5f8c\u89e3\u9396";
  if (stage.difficulty === "hard") return "\u5b8c\u6210\u4e2d\u7b49\u95dc\u5361\u5f8c\u89e3\u9396";
  return "\u5b8c\u6210\u4e0a\u4e00\u95dc\u5f8c\u89e3\u9396";
}


function difficultyLabel(difficulty) {
  return { easy: "\u7c21\u55ae", medium: "\u4e2d\u7b49", hard: "\u56f0\u96e3" }[difficulty] || stageLabel(difficulty);
}

function categoryColor(categoryId) {
  const colors = ["green", "pink", "purple", "orange", "blue", "mint"];
  let sum = 0;
  String(categoryId || "custom").split("").forEach((char) => sum += char.charCodeAt(0));
  return colors[sum % colors.length];
}

function startQuizRound() {
  const learnedPool = quizWordPool();
  const mode = QUIZ_MODES[state.quizMode];
  const needsFourOptions = mode?.type === "choice";

  if (!mode || (needsFourOptions && learnedPool.length < 4) || (!needsFourOptions && learnedPool.length < 1)) {
    state.currentQuiz = null;
    return;
  }

  const questionWords = shuffle(learnedPool).slice(0, Math.min(10, learnedPool.length));
  state.currentQuiz = {
    mode: state.quizMode,
    categoryId: state.quizCategoryId,
    questionWordIds: questionWords.map((word) => word.id),
    answeredWordIds: [],
    correctWordIds: [],
    wrongWordIds: [],
    starsEarned: 0,
    startedAt: new Date().toISOString()
  };
}

function renderQuizQuestion() {
  const mode = QUIZ_MODES[state.quizMode];
  if (!mode) {
    renderQuizModeSelection();
    return;
  }

  const pool = quizWordPool();
  if (mode.type === "choice" && pool.length < 4) {
    renderNotEnoughLearnedWords();
    return;
  }
  if (mode.type !== "choice" && pool.length < 1) {
    renderNotEnoughLearnedWords();
    return;
  }

  if (!state.currentQuiz || state.currentQuiz.mode !== state.quizMode || state.currentQuiz.categoryId !== state.quizCategoryId) startQuizRound();
  const nextWordId = state.currentQuiz.questionWordIds.find((wordId) => !state.currentQuiz.answeredWordIds.includes(wordId));
  if (!nextWordId) {
    renderQuizResults();
    return;
  }

  const picked = allWords().find((word) => word.id === nextWordId);
  if (!picked) {
    state.currentQuiz.answeredWordIds.push(nextWordId);
    renderQuizQuestion();
    return;
  }
  state.quizWord = picked;
  $("#quizCategoryLabel").textContent = state.quizCategoryId ? quizScopeLabel() : picked.categoryZh;
  $("#quizTitle").textContent = `${mode.label} ${state.currentQuiz.answeredWordIds.length + 1}/${state.currentQuiz.questionWordIds.length}`;

  if (mode.type === "spelling") {
    renderSpellingQuiz(picked);
    return;
  }

  renderChoiceQuiz(picked, mode, pool);
}

function renderNotEnoughLearnedWords() {
  $("#quizBox").innerHTML = `
    <div class="empty-state compact">
      <span>📚</span>
      <strong>這個關卡已學會的單字還不夠測驗，請先收集至少 4 個單字。</strong>
      <button class="primary-button" type="button" id="goLearnFromQuiz">去學單字</button>
    </div>
  `;

  $("#goLearnFromQuiz").addEventListener("click", () => {
    if (state.quizCategoryId) state.activeCategory = state.quizCategoryId;
    showView("learn");
  });
}

function renderQuizResults() {
  const quiz = state.currentQuiz;
  if (!quiz) {
    renderQuizModeSelection();
    return;
  }

  const total = quiz.questionWordIds.length;
  const correct = quiz.correctWordIds.length;
  const wrong = quiz.wrongWordIds.length;
  currentProgress().quizHistory.push({
    mode: quiz.mode,
    categoryId: quiz.categoryId || null,
    total,
    correct,
    wrong,
    starsEarned: quiz.starsEarned,
    answeredWordIds: [...quiz.answeredWordIds],
    finishedAt: new Date().toISOString()
  });
  saveProgress();

  $("#quizTitle").textContent = "測驗結果";
  $("#quizBox").innerHTML = `
    <div class="quiz-result">
      <strong>完成測驗，太棒了！</strong>
      <div class="result-grid">
        <span>題數</span><b>${total}</b>
        <span>答對</span><b>${correct}</b>
        <span>答錯</span><b>${wrong}</b>
        <span>獲得星星</span><b>${quiz.starsEarned}</b>
      </div>
      <div class="quiz-actions">
        <button class="primary-button" type="button" id="retryQuiz">再玩一次</button>
        <button class="soft-button" type="button" id="quizHome">回首頁</button>
        <button class="soft-button" type="button" id="quizReview">錯題複習</button>
      </div>
    </div>
  `;

  state.currentQuiz = null;
  $("#retryQuiz").addEventListener("click", () => {
    startQuizRound();
    renderQuizQuestion();
  });
  $("#quizHome").addEventListener("click", () => showView("home"));
  $("#quizReview").addEventListener("click", () => showView("review"));
}


function updateCompletedStages(categoryId) {
  const profile = currentProgress();
  const category = activeWordData().find((item) => item.id === categoryId);
  if (!category) return;

  const learnedIds = new Set(profile.learnedWordIds || []);
  const masteredIds = new Set(profile.masteredWordIds || []);
  const isComplete = category.words.length > 0 && category.words.every((word) => {
    const wordId = getWordId(word, categoryId);
    return learnedIds.has(wordId) && masteredIds.has(wordId);
  });

  profile.completedStageIds = profile.completedStageIds || [];
  if (isComplete && !profile.completedStageIds.includes(categoryId)) {
    profile.completedStageIds.push(categoryId);
  }
}

function isStageRequirementMet(stageId) {
  if (!stageId) return true;
  const profile = currentProgress();
  if ((profile.completedStageIds || []).includes(stageId)) return true;
  if ((profile.claimedStageRewardIds || []).includes(stageId)) return true;
  const requiredStage = activeWordData().find((item) => item.id === stageId);
  return requiredStage ? isCategoryMastered(requiredStage) : false;
}

function isStageUnlocked(category) {
  return !category?.unlockRequirement || isStageRequirementMet(category.unlockRequirement);
}

function isCategoryMastered(category) {
  const profile = currentProgress();
  const learnedIds = new Set(profile.learnedWordIds || []);
  const masteredIds = new Set(profile.masteredWordIds || []);
  return category.words.length > 0 && category.words.every((word) => {
    const wordId = getWordId(word, category.id);
    return learnedIds.has(wordId) && masteredIds.has(wordId);
  });
}

function claimStageReward(categoryId) {
  const profile = currentProgress();
  const childId = state.activeChildId;
  const category = activeWordData().find((item) => item.id === categoryId);
  if (!category || !isCategoryMastered(category)) return;

  profile.claimedStageRewardIds = profile.claimedStageRewardIds || [];
  if (profile.claimedStageRewardIds.includes(categoryId)) return;

  const rewardDiamonds = Number(category.diamondReward) || 1;
  profile.diamonds = (profile.diamonds || 0) + rewardDiamonds;
  profile.claimedStageRewardIds.push(categoryId);
  profile.completedStageIds = profile.completedStageIds || [];
  if (!profile.completedStageIds.includes(categoryId)) profile.completedStageIds.push(categoryId);
  profile.completed = profile.completed || [];
  if (!profile.completed.includes(categoryId)) profile.completed.push(categoryId);
  window.dataStore.claimStageReward(childId, categoryId);
  addGardenPoints(childId, 10);

  saveProgress();
  showRewardToast(`完成關卡獎勵！獲得 ${rewardDiamonds} 顆鑽石！`);
  renderAll();
}

function renderChoiceQuiz(picked, mode, learnedPool) {
  const correctAnswer = mode.answer(picked);
  const learnedDistractors = learnedPool.filter((word) => mode.option(word) !== correctAnswer);
  const fallbackPoolBase = state.quizCategoryId ? allWords().filter((word) => word.categoryId === state.quizCategoryId) : allWords();
  const fallbackPool = mode.id === "choice_picture_to_en" ? fallbackPoolBase.filter(isPictureQuizWord) : fallbackPoolBase;
  const fallbackDistractors = fallbackPool.filter((word) => mode.option(word) !== correctAnswer);
  const options = [picked];

  shuffle(learnedDistractors).forEach((word) => {
    if (options.length < 4 && !options.some((item) => mode.option(item) === mode.option(word))) options.push(word);
  });

  shuffle(fallbackDistractors).forEach((word) => {
    if (options.length < 4 && !options.some((item) => mode.option(item) === mode.option(word))) options.push(word);
  });

  $("#quizBox").innerHTML = `
    ${mascotMarkup("quiz", "quiz-mascot")}
    <div class="quiz-question">
      ${quizPromptMarkup(picked, mode)}
    </div>
    <div class="option-grid">
      ${shuffle(options).map((word) => `
        <button class="option-button" type="button" data-answer="${mode.option(word)}">
          ${choiceOptionMarkup(word, mode)}
        </button>
      `).join("")}
    </div>
    <div class="quiz-actions">
      <button class="soft-button small" type="button" id="changeQuizMode">換模式</button>
    </div>
    <p class="feedback" id="quizFeedback"></p>
  `;

  $("#changeQuizMode").addEventListener("click", renderQuizModeSelection);
  $$(".option-button").forEach((button) => {
    button.addEventListener("click", () => answerChoiceQuiz(button));
  });
}



function quizPromptMarkup(word, mode) {
  if (mode.id === "listening_choice") {
    return `
      <span>\ud83d\udd0a</span>
      <button class="sound-button" type="button" data-speak="${escapeHtml(word.en)}">\u64ad\u653e\u767c\u97f3</button>
      <p>\u807d\u767c\u97f3\uff0c\u9078\u82f1\u6587\u55ae\u5b57</p>
    `;
  }

  if (currentProfile().showZhuyin && mode.id === "choice_en_to_zh") {
    return `
      <div class="simple-question-line">
        ${wordVisualMarkup(word, "quiz-inline-visual")}
        <strong>${word.en}</strong>
      </div>
      <button class="sound-button small" type="button" data-speak="${escapeHtml(word.en)}">\ud83d\udd0a \u767c\u97f3</button>
      <p>\u8acb\u9078\u4e2d\u6587\u610f\u601d</p>
    `;
  }

  if (currentProfile().showZhuyin && mode.id === "choice_picture_to_en") {
    return `
      ${wordVisualMarkup(word, "quiz-picture-visual")}
      <p>\u9019\u662f\u4ec0\u9ebc\u82f1\u6587\uff1f</p>
    `;
  }

  return `
    ${mode.id === "choice_picture_to_en" ? wordVisualMarkup(word, "quiz-picture-visual") : `<span>\u2b50</span><strong>${mode.question(word)}</strong>`}
    ${mode.id === "choice_en_to_zh" ? `<button class="sound-button small" type="button" data-speak="${escapeHtml(word.en)}">\ud83d\udd0a \u767c\u97f3</button>` : ""}
    <p>${mode.questionLabel}</p>
  `;
}

function renderSpellingQuiz(picked) {
  $("#quizBox").innerHTML = `
    ${mascotMarkup("quiz", "quiz-mascot")}
    <div class="quiz-question">
      ${wordVisualMarkup(picked, "quiz-picture-visual")}
      <div class="quiz-meaning">${meaningMarkup(picked)}</div>
      <button class="sound-button small" type="button" data-speak="${escapeHtml(picked.en)}">🔊 發音</button>
      <p>請看中文和圖片，拼出英文單字。</p>
    </div>
    <form class="spelling-form" id="spellingForm" autocomplete="off">
      <input id="spellingInput" name="spelling" type="text" inputmode="latin" autocapitalize="none" spellcheck="false" aria-label="輸入英文單字" placeholder="type the word">
      <button class="primary-button" type="submit">送出答案</button>
    </form>
    <div class="quiz-actions">
      <button class="soft-button small" type="button" id="changeQuizMode">換模式</button>
    </div>
    <p class="feedback" id="quizFeedback"></p>
  `;

  $("#changeQuizMode").addEventListener("click", renderQuizModeSelection);
  $("#spellingForm").addEventListener("submit", answerSpellingQuiz);
  $("#spellingInput").focus();
}

function answerChoiceQuiz(button) {
  const mode = QUIZ_MODES[state.quizMode];
  const correctAnswer = mode.answer(state.quizWord);
  const isCorrect = button.dataset.answer === correctAnswer;
  const feedback = $("#quizFeedback");
  $$(".option-button").forEach((item) => item.disabled = true);

  if (isCorrect) {
    button.classList.add("correct");
    feedback.textContent = "答對了！獲得 1 顆星星 ⭐";
    updateMascotElement("#quizMascot", "correct");
    markQuizAnswer(true);
  } else {
    button.classList.add("wrong");
    feedback.innerHTML = `再試一次，正確答案是 ${escapeHtml(correctAnswer)} <button class="sound-button tiny" type="button" data-speak="${escapeHtml(state.quizWord.en)}">🔊 再聽一次</button>`;
    updateMascotElement("#quizMascot", "wrong");
    markQuizAnswer(false);
  }

  recordQuizResult(isCorrect, button.dataset.answer, correctAnswer);
  saveProgress();
  renderHeader();
  setTimeout(renderQuizQuestion, 1300);
}

function answerSpellingQuiz(event) {
  event.preventDefault();

  const input = $("#spellingInput");
  const answer = input.value.trim();
  const correctAnswer = state.quizWord.en;
  const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();
  const feedback = $("#quizFeedback");

  input.disabled = true;
  $("#spellingForm button").disabled = true;

  if (isCorrect) {
    feedback.textContent = "拼對了！獲得 1 顆星星 ⭐";
    updateMascotElement("#quizMascot", "correct");
    markQuizAnswer(true);
  } else {
    feedback.innerHTML = `再試一次，正確拼字是 ${escapeHtml(correctAnswer)} <button class="sound-button tiny" type="button" data-speak="${escapeHtml(state.quizWord.en)}">🔊 再聽一次</button>`;
    updateMascotElement("#quizMascot", "wrong");
    markQuizAnswer(false);
  }

  recordQuizResult(isCorrect, answer, correctAnswer);
  saveProgress();
  renderHeader();
  setTimeout(renderQuizQuestion, 1500);
}


function markQuizAnswer(isCorrect) {
  const profile = currentProgress();
  const wordId = getWordId(state.quizWord, state.quizWord.categoryId);
  profile.masteredWordIds = profile.masteredWordIds || [];
  profile.wordModeMastery = profile.wordModeMastery || {};
  profile.wrongWordIds = profile.wrongWordIds || [];
  const alreadyAnswered = state.currentQuiz.answeredWordIds.includes(wordId);

  if (!alreadyAnswered) {
    state.currentQuiz.answeredWordIds.push(wordId);
  }

  if (isCorrect) {
    profile.stars += 1;
    state.currentQuiz.starsEarned += 1;
    if (!alreadyAnswered) addGardenPoints(state.activeChildId, 1);
    profile.wordModeMastery[wordId] = Array.isArray(profile.wordModeMastery[wordId]) ? profile.wordModeMastery[wordId] : [];
    if (!profile.wordModeMastery[wordId].includes(state.quizMode)) {
      profile.wordModeMastery[wordId].push(state.quizMode);
    }
    if (!profile.masteredWordIds.includes(wordId)) {
      profile.masteredWordIds.push(wordId);
    }
    window.dataStore.addMasteredWord(state.activeChildId, wordId);
    profile.wrongWordIds = profile.wrongWordIds.filter((id) => id !== wordId);
    profile.mistakes = profile.mistakes.filter((word) => getWordId(word, word.categoryId) !== wordId && word.en !== state.quizWord.en);
    if (!state.currentQuiz.correctWordIds.includes(wordId)) state.currentQuiz.correctWordIds.push(wordId);
    updateCompletedStages(state.quizWord.categoryId);
  } else {
    addMistake(state.quizWord);
    if (!state.currentQuiz.wrongWordIds.includes(wordId)) state.currentQuiz.wrongWordIds.push(wordId);
  }
}

function isWordMasteredInAllModes(wordId) {
  const requiredModes = currentProfile().quizModes || [];
  const passedModes = currentProgress().wordModeMastery?.[wordId] || [];
  return requiredModes.every((mode) => passedModes.includes(mode));
}

function renderReview() {
  const reviewWords = wrongWords();
  if (!reviewWords.length) {
    $("#reviewList").innerHTML = `
      <div class="empty-state">
        <span>🌟</span>
        <strong>目前沒有錯題</strong>
        <p>答錯的單字會出現在這裡，方便之後複習。</p>
      </div>
    `;
    return;
  }

  $("#reviewList").innerHTML = `${mascotMarkup("wrong")}` + reviewWords.map((word) => {
    const wordId = getWordId(word, word.categoryId);
    return `
      <article class="review-item">
        ${wordVisualMarkup(word, "review-visual")}
        <div>
          <strong>${word.en}</strong>
          <p>${meaningMarkup(word)}・${escapeHtml(word.categoryZh || "")}</p>
        </div>
        <button class="sound-button small" type="button" data-speak="${escapeHtml(word.en)}">🔊 發音</button>
        <button class="soft-button small" type="button" data-review-done="${word.en}" data-review-id="${wordId}">我會了</button>
      </article>
    `;
  }).join("");

  $$("[data-review-done]").forEach((button) => {
    button.addEventListener("click", () => {
      const wasWrong = (currentProgress().wrongWordIds || []).includes(button.dataset.reviewId);
      currentProgress().mistakes = currentProgress().mistakes.filter((word) => word.en !== button.dataset.reviewDone);
      currentProgress().wrongWordIds = (currentProgress().wrongWordIds || []).filter((wordId) => wordId !== button.dataset.reviewId);
      currentProgress().stars += 1;
      if (wasWrong) addGardenPoints(state.activeChildId, 2);
      saveProgress();
      renderAll();
      renderReview();
    });
  });
}

function renderDressup() {
  applyOutfit("#dressupBuddy", "dressup");
  const unlocked = currentProgress().unlockedAccessories || ["none"];
  const equipped = currentProgress().equippedAccessories || [currentProgress().outfit || "none"];
  const accessories = currentAccessories().filter((item) => activeAccessorySlotFilter === "all" || item.slot === activeAccessorySlotFilter);

  $("#accessoryGrid").innerHTML = `
    <div class="character-picker">
      <h3>角色顏色</h3>
      <div class="character-option-grid color-option-grid">
        ${AVATAR_COLORS.map((item) => `
          <button class="character-option color-option ${currentProgress().avatarColor === item.id ? "selected" : ""}" type="button" data-avatar-color="${item.id}">
            <span class="color-swatch ${item.id}"></span>
            <span>${item.name}</span>
          </button>
        `).join("") || `<p class="empty-note">還沒有顏色選項</p>`}
      </div>
    </div>
    <div class="dressup-balance">可用星星：${currentProgress().stars}</div>
    <div class="accessory-filter" role="group" aria-label="裝備分類">
      ${ACCESSORY_SLOT_FILTERS.map((slot) => `
        <button class="soft-button small ${activeAccessorySlotFilter === slot ? "selected" : ""}" type="button" data-accessory-filter="${slot}">
          ${ACCESSORY_SLOT_LABELS[slot]}
        </button>
      `).join("")}
    </div>
  ` + accessories.map((item) => {
    if (item.id === "none") return "";
    const isUnlocked = unlocked.includes(item.id);
    const isSelected = equipped.includes(item.id);
    const price = item.costStars || 0;
    const canRedeem = currentProgress().stars >= price;
    const actionText = isUnlocked ? (isSelected ? "卸下" : "穿戴") : "解鎖";
    const statusText = isUnlocked ? (isSelected ? "✓ 已穿戴" : "已解鎖") : `🔒 ${price} 星`;
    const actionAttr = isUnlocked ? `data-accessory="${item.id}"` : `data-redeem-star="${item.id}"`;
    return `
      <button class="accessory-card ${isSelected ? "selected" : ""}" type="button" ${actionAttr} ${isUnlocked || canRedeem ? "" : ""}>
        <span>${accessoryPreviewMarkup(item)}</span>
        <strong>${item.name}</strong>
        <small>${ACCESSORY_SLOT_LABELS[item.slot] || item.slot}・${statusText}</small>
        <em>${actionText}</em>
      </button>
    `;
  }).join("");

  $$("[data-accessory-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeAccessorySlotFilter = button.dataset.accessoryFilter || "all";
      renderDressup();
    });
  });

  $$("[data-avatar-color]").forEach((button) => {
    button.addEventListener("click", () => {
      currentProgress().avatarColor = button.dataset.avatarColor;
      saveProgress();
      renderDressup();
      renderHome();
    });
  });

  $$("[data-accessory]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleAccessory(state.activeChildId, button.dataset.accessory);
    });
  });
}

function renderRewards() {
  const profile = currentProfile();
  const current = currentProgress();
  const rewardItems = currentRewardStoreItems();
  const coupons = current.rewardCoupons || [];
  const pendingCoupons = coupons.filter((coupon) => !coupon.claimed);
  const claimedCoupons = coupons.filter((coupon) => coupon.claimed);

  $("#rewardStore").innerHTML = `
    <section class="store-section">
      <div class="store-heading">
        <h3>可兌換獎勵</h3>
        <strong>💎 ${current.diamonds}</strong>
      </div>
      <div class="store-grid">
        ${rewardItems.map((item) => `
          <article class="store-item">
            <span>${escapeHtml(item.icon)}</span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${item.costDiamonds} 鑽石</small>
            <button class="primary-button small" type="button" data-redeem-diamond="${item.id}" ${current.diamonds < item.costDiamonds ? "disabled" : ""}>兌換</button>
          </article>
        `).join("") || `<p class="empty-note">還沒有獎勵項目</p>`}
      </div>
    </section>

    <section class="store-section">
      <div class="store-heading">
        <h3>兌換紀錄</h3>
        <strong>${profile.displayName}</strong>
      </div>
      ${couponListMarkup("尚未兌換", pendingCoupons)}
      ${couponListMarkup("已兌換", claimedCoupons)}
    </section>
  `;
}

function couponListMarkup(title, coupons) {
  return `
    <div class="coupon-group">
      <h4>${title}</h4>
      ${coupons.length ? coupons.map((coupon) => `
        <article class="coupon-item">
          <div>
            <strong>${escapeHtml(coupon.rewardName)}</strong>
            <small>${coupon.costDiamonds} 鑽石・${formatDateTime(coupon.createdAt)}</small>
            <em>${coupon.claimed ? "已兌換" : "尚未兌換"}</em>
          </div>
          ${coupon.claimed ? "" : `<button class="soft-button small" type="button" data-claim-coupon="${coupon.id}">媽咪已兌換</button>`}
        </article>
      `).join("") : `<p class="empty-note">目前沒有${title}的紀錄</p>`}
    </div>
  `;
}

function redeemStarItem(itemId) {
  const item = currentAccessories().find((entry) => entry.id === itemId && entry.id !== "none");
  const profile = currentProgress();
  const cost = item?.costStars || 0;
  if (!item) return;

  profile.unlockedAccessories = profile.unlockedAccessories || ["none"];
  if (profile.unlockedAccessories.includes(item.id)) return;
  if (profile.stars < cost) {
    showRewardToast("星星不夠喔，繼續學單字來收集星星吧！");
    return;
  }

  profile.stars -= cost;
  profile.unlockedAccessories.push(item.id);
  profile.unlocked = profile.unlockedAccessories;
  saveProgress();
  showRewardToast(`已兌換：${item.name}`);
  renderDressup();
  renderHeader();
  renderHomeRewardSummary();
}

function toggleAccessory(childId, accessoryId) {
  const child = progress.children?.[childId] || currentProgress();
  accessoriesForProgress(child);
  const item = currentAccessories().find((entry) => entry.id === accessoryId && entry.id !== "none");
  if (!item) return;

  child.unlockedAccessories = Array.isArray(child.unlockedAccessories) ? child.unlockedAccessories : [];
  child.equippedAccessories = Array.isArray(child.equippedAccessories) ? child.equippedAccessories : [];

  if (!child.unlockedAccessories.includes(accessoryId)) {
    showRewardToast("尚未解鎖這個裝備喔！");
    return;
  }

  if (child.equippedAccessories.includes(accessoryId)) {
    child.equippedAccessories = child.equippedAccessories.filter((id) => id !== accessoryId && id !== "none");
  } else if (item.allowMultipleInSlot) {
    child.equippedAccessories = child.equippedAccessories.filter((id) => id !== "none");
    child.equippedAccessories.push(accessoryId);
  } else {
    const byId = new Map(currentAccessories().map((entry) => [entry.id, entry]));
    child.equippedAccessories = child.equippedAccessories
      .filter((id) => id !== "none")
      .filter((id) => byId.get(id)?.slot !== item.slot);
    child.equippedAccessories.push(accessoryId);
  }

  if (!child.equippedAccessories.length) child.equippedAccessories = ["none"];
  child.equippedAccessories = normalizeEquippedAccessoriesForSlots(child.equippedAccessories, currentAccessories());
  child.outfit = child.equippedAccessories[0] || "none";
  saveProgress();
  renderDressup();
  renderHome();
}

function redeemDiamondItem(itemId) {
  const item = currentRewardStoreItems().find((entry) => entry.id === itemId);
  const profile = currentProgress();
  if (!item || profile.diamonds < item.costDiamonds) return;

  profile.diamonds -= item.costDiamonds;
  profile.rewardCoupons = profile.rewardCoupons || [];
  profile.rewardCoupons.push({
    id: `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    childId: currentProfile().id,
    rewardName: item.name,
    costDiamonds: item.costDiamonds,
    type: item.type,
    createdAt: new Date().toISOString(),
    claimed: false,
    claimedAt: null
  });
  saveProgress();
  showRewardToast(`已產生兌換券：${item.name}`);
  renderRewards();
  renderHeader();
  renderHomeRewardSummary();
}

function markCouponClaimed(couponId) {
  const profile = currentProgress();
  const coupon = (profile.rewardCoupons || []).find((item) => item.id === couponId);
  if (!coupon || coupon.claimed) return;

  coupon.claimed = true;
  coupon.claimedAt = new Date().toISOString();
  saveProgress();
  showRewardToast("已完成兌換紀錄。");
  renderRewards();
  renderHomeRewardSummary();
}

function showRewardToast(message) {
  const feedback = $("#rewardFeedback") || $("#dressupFeedback") || $("#customWordFeedback") || $("#quizFeedback");
  if (feedback) feedback.textContent = message;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function accessoryPreviewMarkup(item) {
  const image = item.iconSrc || item.iconImage || item.image || item.wearableSrc || item.wearImage;
  if (!image) return item.icon;
  return `<img class="accessory-preview" src="${assetUrl(image)}" alt="${item.name}">`;
}

function markLearned(categoryId, wordOrEn, giveStar = true) {
  const profile = currentProgress();
  const word = typeof wordOrEn === "string"
    ? activeWordData().find((category) => category.id === categoryId)?.words.find((item) => item.en === wordOrEn)
    : wordOrEn;
  const wordEn = typeof wordOrEn === "string" ? wordOrEn : wordOrEn.en;
  const wordId = word ? getWordId(word, categoryId) : `${categoryId}:${wordEn}`;

  profile.learned[categoryId] = profile.learned[categoryId] || [];
  profile.learnedWordIds = profile.learnedWordIds || [];

  if (!profile.learnedWordIds.includes(wordId)) {
    profile.learnedWordIds.push(wordId);
  }
  window.dataStore.addLearnedWord(state.activeChildId, wordId);

  if (!profile.learned[categoryId].includes(wordEn)) {
    profile.learned[categoryId].push(wordEn);
    if (giveStar) profile.stars += 1;
  }

  saveProgress();
}

function addMistake(word) {
  const profile = currentProgress();
  const wordId = getWordId(word, word.categoryId);
  profile.wrongWordIds = profile.wrongWordIds || [];
  if (!profile.wrongWordIds.includes(wordId)) {
    profile.wrongWordIds.push(wordId);
  }
  window.dataStore.addWrongWord(state.activeChildId, wordId);

  if (!profile.mistakes.some((item) => item.en === word.en)) {
    profile.mistakes.push(word);
  }
}

function recordQuizResult(isCorrect, answer, correctAnswer) {
  const profile = currentProgress();
  profile.quizResults = profile.quizResults || [];
  profile.quizResults.push({
    mode: state.quizMode,
    wordId: getWordId(state.quizWord, state.quizWord.categoryId),
    word: state.quizWord.en,
    categoryId: state.quizWord.categoryId,
    answer,
    correctAnswer,
    isCorrect,
    answeredAt: new Date().toISOString()
  });
}

function applyOutfit(selector, context = "dressup") {
  const buddy = $(selector);
  const equippedIds = normalizeEquippedAccessoriesForSlots(currentProgress().equippedAccessories || [currentProgress().outfit || "none"], currentAccessories());
  const equippedItems = equippedIds
    .filter((id) => id !== "none")
    .map((id) => currentAccessories().find((item) => item.id === id))
    .filter(Boolean)
    .sort((a, b) => (a.position?.zIndex || a.zIndex || 0) - (b.position?.zIndex || b.zIndex || 0));
  buddy.className = `buddy ${equippedItems.map((item) => item.className).filter(Boolean).join(" ")}`;
  buddy.dataset.context = context;
  setMascotImage(selector, context);
  buddy.querySelectorAll(".equipped-accessory").forEach((node) => node.remove());
  equippedItems.forEach((item) => {
    const wearImage = item.wearableSrc || item.wearImage || item.image;
    if (!wearImage) return;
    const image = document.createElement("img");
    image.className = `equipped-accessory accessory-layer accessory-slot-${item.slot}`;
    image.src = assetUrl(wearImage);
    image.alt = item.name;
    applyAccessoryLayerStyle(image, item);
    buddy.appendChild(image);
  });
}

function applyAccessoryLayerStyle(element, item) {
  const position = accessoryPositionForItem(item);
  element.style.width = `${position.width}%`;
  element.style.left = `${position.left}%`;
  element.style.top = `${position.top}%`;
  element.style.zIndex = String(position.zIndex);
}


function renderCategoryOptions() {
  const list = $("#customCategoryList");
  if (!list) return;
  const seen = new Set();
  const options = activeWordData()
    .filter((stage) => {
      const key = stage.baseCategoryId || stage.appCategory || stage.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((stage) => `<option value="${escapeHtml(stage.baseCategoryId || stage.appCategory || stage.id)}">${escapeHtml(stage.categoryZh || stage.zh || stage.id)}</option>`)
    .join("");
  list.innerHTML = options;
}

function findStageInfo(level, categoryValue, difficulty = "easy") {
  const categories = WORD_BANKS[level] || WORD_DATA;
  const normalized = String(categoryValue || "").trim().toLowerCase();
  const matched = categories.find((category) => {
    const keys = [category.baseCategoryId, category.appCategory, category.categoryId, category.id, category.en, category.zh, category.categoryZh]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return keys.includes(normalized) && (!difficulty || category.difficulty === difficulty);
  }) || categories.find((category) => {
    const keys = [category.baseCategoryId, category.appCategory, category.categoryId, category.id, category.en, category.zh, category.categoryZh]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return keys.includes(normalized);
  });

  if (matched) {
    const appCategory = matched.baseCategoryId || matched.appCategory || normalizeAppCategoryId(matched.zh || matched.id);
    const stageId = difficulty ? `${appCategory}_${difficulty}` : matched.id;
    const stage = categories.find((item) => item.id === stageId) || matched;
    return {
      appCategory,
      stageId: stage.id || stageId,
      zh: stage.categoryZh || stage.zh || matched.categoryZh || matched.zh || appCategory
    };
  }

  const appCategory = normalizeAppCategoryId(categoryValue);
  return {
    appCategory,
    stageId: `${appCategory}_${difficulty || "easy"}`,
    zh: categoryValue || appCategory
  };
}

function findCategoryInfo(level, categoryValue) {
  const info = findStageInfo(level, categoryValue, "easy");
  return { id: info.stageId, zh: info.zh };
}


function normalizeCategoryId(value) {
  return normalizeAppCategoryId(value);
}

function normalizeAppCategoryId(value) {
  const normalized = String(value || "custom").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (normalized) return normalized;
  let hash = 0;
  String(value || "custom").split("").forEach((char) => hash = ((hash << 5) - hash) + char.charCodeAt(0));
  return `custom_${Math.abs(hash)}`;
}

function buildZhuyinChars(meaning, zhuyin) {
  if (!meaning || !zhuyin) return [];
  const meaningChars = Array.from(meaning.replace(/\s+/g, ""));
  const rubyParts = zhuyin.trim().split(/\s+/).filter(Boolean);

  if (meaningChars.length === rubyParts.length) {
    return meaningChars.map((char, index) => ({ char, ruby: rubyParts[index] }));
  }

  if (meaningChars.length === 1) {
    return [{ char: meaningChars[0], ruby: zhuyin.trim() }];
  }

  return [];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
