/**
 * Hindi to Santali (Ol Chiki) Voice & Script Converter
 * 
 * Features:
 * 1. Web Speech API (hi-IN) with live noise filtering and normalization.
 * 2. Specialized Hindi ASR Error Correction Pipeline:
 *    - Nukta normalization (ज़->ज, फ़->फ, ड़->ड, etc.)
 *    - Schwa deletion & Halant alignment
 *    - Punctuation & filler token cleaning
 * 3. Devanagari to Ol Chiki Phonetic & Semantic Transliteration.
 * 4. Common Hindi <-> Santali Phrasebook mapping.
 * 5. On-screen Ol Chiki Unicode keyboard.
 * 6. Audio Player integration for Parler-TTS generated speech.
 */

// ── 1. Comprehensive Hindi ASR Normalization & Correction Map ─────────────────

const HINDI_ASR_CORRECTIONS = [
  // Common Hindi speech recognizer phonetic mis-transcriptions
  { pattern: /\b(नमस्ते|नमस्ते जी|नमस्कार)\b/gi, replacement: "नमस्ते" },
  { pattern: /\b(जोहार|जोहार गे)\b/gi, replacement: "जोहार" },
  { pattern: /\b(धन्यवाद|थैंक यू|शुक्रिया)\b/gi, replacement: "धन्यवाद" },
  { pattern: /\b(कैसे हो|आप कैसे हैं|कैसा है)\b/gi, replacement: "आप कैसे हैं" },
  { pattern: /\b(क्या नाम है|आपका नाम क्या है)\b/gi, replacement: "आपका नाम क्या है" },
  { pattern: /\b(मेरा नाम)\b/gi, replacement: "मेरा नाम" },
  { pattern: /\b(हाँ|हां|हं)\b/gi, replacement: "हाँ" },
  { pattern: /\b(नहीं|ना|नाही)\b/gi, replacement: "नहीं" },
  { pattern: /\b(अच्छा|ठीक है|सही है)\b/gi, replacement: "ठीक है" },
  // Common filler tokens injected by speech engines
  { pattern: /\b(अम्म|उम्म|अह|एह|uh|um|hmm)\b/gi, replacement: "" },
];

// Nukta normalization map (speech engines often inject irregular decomposed characters)
const NUKTA_MAP = {
  "क़": "क",
  "ख़": "ख",
  "ग़": "ग",
  "ज़": "ज",
  "फ़": "फ",
  "ड़": "ड",
  "ढ़": "ढ",
  "य़": "य",
  "ऩ": "न",
  "ऱ": "र",
};

// ── 2. Comprehensive Hindi -> Santali (Ol Chiki) Semantic Translation Dictionary ──
// Unlike phonetic transliteration, this maps actual Hindi words and sentences to their true Santali language equivalents!
const PHRASEBOOK = {
  // Common Greetings & Courtesies
  "नमस्ते": { ol: "ᱡᱚᱦᱟᱨ", roman: "Johar", meaning: "Greetings / Hello" },
  "नमस्कार": { ol: "ᱡᱚᱦᱟᱨ", roman: "Johar", meaning: "Greetings / Hello" },
  "प्रणाम": { ol: "ᱡᱚᱦᱟᱨ", roman: "Johar", meaning: "Greetings / Respects" },
  "जोहार": { ol: "ᱡᱚᱦᱟᱨ", roman: "Johar", meaning: "Greetings" },
  "जोहार गे": { ol: "ᱡᱚᱦᱟᱨ ᱜᱮ", roman: "Johar ge", meaning: "Greetings" },
  "धन्यवाद": { ol: "ᱥᱟᱨᱦᱟᱣ", roman: "Sarhaw", meaning: "Thank you" },
  "शुक्रिया": { ol: "ᱥᱟᱨᱦᱟᱣ", roman: "Sarhaw", meaning: "Thank you" },
  "माफ कीजिए": { ol: "ᱤᱠᱟᱹ ᱠᱟᱹᱧ ᱢᱮ", roman: "Ika kanj me", meaning: "Forgive me / Sorry" },
  "क्षमा करें": { ol: "ᱤᱠᱟᱹ ᱠᱟᱹᱧ ᱢᱮ", roman: "Ika kanj me", meaning: "Forgive me" },

  // Questions & Common Daily Phrases
  "आप कैसे हैं": { ol: "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?", roman: "Ched leka menama?", meaning: "How are you?" },
  "तुम कैसे हो": { ol: "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?", roman: "Ched leka menama?", meaning: "How are you?" },
  "कैसा है": { ol: "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?", roman: "Ched leka menama?", meaning: "How are you?" },
  "मैं ठीक हूँ": { ol: "ᱤᱧ ᱫᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ", roman: "Injh do bhagi ge menanja", meaning: "I am fine" },
  "हम ठीक हैं": { ol: "ᱟᱞᱮ ᱫᱚ ᱵᱷᱟᱹᱜᱤ ᱜᱮ ᱢᱮᱱᱟᱜ ᱞᱮᱭᱟ", roman: "Ale do bhagi ge menag leya", meaning: "We are fine" },
  "आपका नाम क्या है": { ol: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", roman: "Amag nhutum do ched?", meaning: "What is your name?" },
  "तुम्हारा नाम क्या है": { ol: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", roman: "Amag nhutum do ched?", meaning: "What is your name?" },
  "तेरा नाम क्या है": { ol: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱫ?", roman: "Amag nhutum do ched?", meaning: "What is your name?" },
  "मेरा नाम": { ol: "ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ", roman: "Injhag nhutum do", meaning: "My name is" },
  "कहाँ जा रहे हो": { ol: "ᱚᱠᱟ ᱛᱮᱢ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ?", roman: "Oka tem calag kana?", meaning: "Where are you going?" },
  "आप कहाँ जा रहे हैं": { ol: "ᱚᱠᱟ ᱛᱮᱢ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ?", roman: "Oka tem calag kana?", meaning: "Where are you going?" },
  "मैं घर जा रहा हूँ": { ol: "ᱤᱧ ᱚᱲᱟᱜ ᱤᱧ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ", roman: "Injh orhag injh calag kana", meaning: "I am going home" },
  "हम घर जा रहे हैं": { ol: "ᱟᱞᱮ ᱚᱲᱟᱜ ᱞᱮ ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ", roman: "Ale orhag le calag kana", meaning: "We are going home" },
  "खाना खा लो": { ol: "ᱫᱟᱠᱟ ᱡᱚᱢ ᱢᱮ", roman: "Daka jom me", meaning: "Eat food" },
  "खाना खाओ": { ol: "ᱫᱟᱠᱟ ᱡᱚᱢ ᱢᱮ", roman: "Daka jom me", meaning: "Eat food" },
  "खाना खाया": { ol: "ᱫᱟᱠᱟᱢ ᱡᱚᱢ ᱠᱮᱫᱼᱟ?", roman: "Dakam jom ked-a?", meaning: "Did you eat food?" },
  "पानी पियो": { ol: "ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ", roman: "Daag nhu me", meaning: "Drink water" },
  "पानी पी लो": { ol: "ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ", roman: "Daag nhu me", meaning: "Drink water" },
  "मुझे पानी चाहिए": { ol: "ᱤᱧ ᱫᱟᱜ ᱫᱚᱨᱠᱟᱨ", roman: "Injh daag dorkar", meaning: "I need water" },
  "मुझे खाना चाहिए": { ol: "ᱤᱧ ᱫᱟᱠᱟ ᱫᱚᱨᱠᱟᱨ", roman: "Injh daka dorkar", meaning: "I need food" },
  "क्या कर रहे हो": { ol: "ᱪᱮᱫ ᱮᱢ ᱪᱮᱠᱟᱭᱮᱫᱼᱟ?", roman: "Ched em cekayed-a?", meaning: "What are you doing?" },
  "आप क्या कर रहे हैं": { ol: "ᱪᱮᱫ ᱮᱢ ᱪᱮᱠᱟᱭᱮᱫᱼᱟ?", roman: "Ched em cekayed-a?", meaning: "What are you doing?" },
  "मैं काम कर रहा हूँ": { ol: "ᱤᱧ ᱠᱟᱹᱢᱤ ᱠᱟᱱᱟᱹᱧ", roman: "Injh kami kananjh", meaning: "I am working" },
  "यह क्या है": { ol: "ᱱᱚᱶᱟ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?", roman: "Nowa do ched kana?", meaning: "What is this?" },
  "वह क्या है": { ol: "ᱚᱱᱟ ᱫᱚ ᱪᱮᱫ ᱠᱟᱱᱟ?", roman: "Ona do ched kana?", meaning: "What is that?" },
  "यहाँ आओ": { ol: "ᱱᱚᱸᱰᱮ ᱦᱤᱡᱩᱜ ᱢᱮ", roman: "Nonde hijug me", meaning: "Come here" },
  "वहाँ जाओ": { ol: "ᱚᱸᱰᱮ ᱪᱟᱞᱟᱜ ᱢᱮ", roman: "Onde calag me", meaning: "Go there" },
  "बैठ जाओ": { ol: "ᱫᱩᱲᱩᱵ ᱢᱮ", roman: "Durhub me", meaning: "Sit down" },
  "चलो चलें": { ol: "ᱫᱮᱞᱟᱵᱚᱱ ᱪᱟᱞᱟᱜᱼᱟ", roman: "Delabon calag-a", meaning: "Let's go" },
  "सब कुछ ठीक है": { ol: "ᱡᱚᱛᱚᱣᱟᱜ ᱴᱷᱤᱠ ᱜᱮᱭᱟ", roman: "Jotowag thik geya", meaning: "Everything is fine" },
  "सब ठीक है": { ol: "ᱡᱚᱛᱚᱣᱟᱜ ᱴᱷᱤᱠ ᱜᱮᱭᱟ", roman: "Jotowag thik geya", meaning: "All is well" },
  "शुभ प्रभात": { ol: "ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ", roman: "Sagun setag", meaning: "Good morning" },
  "शुभ रात्रि": { ol: "ᱥᱟᱹᱜᱩᱱ ᱧᱤᱫᱟᱹ", roman: "Sagun nhida", meaning: "Good night" },
  "अच्छा लगा": { ol: "ᱵᱷᱟᱹᱜᱤ ᱵᱩᱡᱷᱟᱹᱣᱮᱱᱟ", roman: "Bhagi bujhawena", meaning: "Felt good" },
  "हाँ": { ol: "ᱦᱮᱸ", roman: "Heñ", meaning: "Yes" },
  "नहीं": { ol: "ᱵᱟᱝ", roman: "Bang", meaning: "No" },
  "ठीक है": { ol: "ᱴᱷᱤᱠ ᱜᱮᱭᱟ", roman: "Thik geya", meaning: "Alright / Okay" },
  "बहुत अच्छा": { ol: "ᱟᱹᱰᱤ ᱵᱷᱟᱹᱜᱤ", roman: "Adi bhagi", meaning: "Very good" },

  // FLN Math & Classroom Pedagogy Phrases
  "2 और 4 को जोड़ो": { ol: "᱒ ᱟᱨ ᱔ ᱢᱮᱥᱟᱭ ᱢᱮ", roman: "bar ar pon mesay me", meaning: "Add 2 and 4" },
  "संख्याओं को जोड़ो": { ol: "ᱮᱞ ᱠᱚ ᱢᱮᱥᱟᱭ ᱢᱮ", roman: "el ko mesay me", meaning: "Add the numbers" },
  "किताब खोलो": { ol: "ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ", roman: "Puthi jhij me", meaning: "Open the book" },
  "किताब पढ़ो": { ol: "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱢᱮ", roman: "Puthi paṛhaw me", meaning: "Read the book" },
  "बोर्ड पर देखो": { ol: "ᱵᱳᱨᱰ ᱨᱮ ᱧᱮᱞ ᱢᱮ", roman: "Bord re ñel me", meaning: "Look at the board" },
  "हाथ उठाओ": { ol: "ᱛᱤ ᱛᱩᱞ ᱢᱮ", roman: "Ti tul me", meaning: "Raise your hand" },
  "खड़े हो जाओ": { ol: "ᱛᱤᱸᱜᱩᱱ ᱢᱮ", roman: "Tingun me", meaning: "Stand up" },
  "खड़े हो": { ol: "ᱛᱤᱸᱜᱩᱱ ᱢᱮ", roman: "Tingun me", meaning: "Stand up" },
  "चुप रहो": { ol: "ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱢᱮ", roman: "Thir tahen me", meaning: "Keep quiet" },
  "ध्यान से सुनो": { ol: "ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱢᱮ", roman: "Dheyan te añjom me", meaning: "Listen carefully" },
  "गिनती करो": { ol: "ᱞᱮᱠᱷᱟᱭ ᱢᱮ", roman: "Lekhay me", meaning: "Count" },
  "अपनी जगह पर बैठ जाओ": { ol: "ᱟᱢᱟᱜ ᱴᱷᱟᱶ ᱨᱮ ᱫᱩᱲᱩᱵ ᱢᱮ", roman: "Amag ṭhaw re duṛub me", meaning: "Sit in your place" },
  "कॉपी निकालो": { ol: "ᱠᱷᱟᱛᱟ ᱚᱰᱚᱠ ᱢᱮ", roman: "Khata oḍok me", meaning: "Take out your notebook" },
  "पेंसिल से लिखो": { ol: "ᱯᱮᱱᱥᱤᱞ ᱛᱮ ᱚᱞ ᱢᱮ", roman: "Pensil te ol me", meaning: "Write with a pencil" },
  "शाबाश": { ol: "ᱥᱟᱨᱦᱟᱣ", roman: "Sarhaw", meaning: "Well done / Praise" },
  "शाबाश!": { ol: "ᱥᱟᱨᱦᱟᱣ", roman: "Sarhaw", meaning: "Well done / Praise" },
  "तुमने बहुत अच्छा काम किया": { ol: "ᱟᱢ ᱟᱹᱰᱤ ᱵᱷᱟᱹᱜᱤ ᱠᱟᱹᱢᱤ ᱠᱮᱫᱼᱟ", roman: "Am aḍi bhagi kami ked-a", meaning: "You did a great job" },
  "शानदार प्रयास": { ol: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ ᱠᱩᱨᱩᱢᱩᱴᱩ", roman: "Aḍi napay kurumutu", meaning: "Wonderful effort" },
  "शानदार प्रयास!": { ol: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ ᱠᱩᱨᱩᱢᱩᱴᱩ", roman: "Aḍi napay kurumutu", meaning: "Wonderful effort" },
  "बिल्कुल सही": { ol: "ᱯᱩᱨᱟᱹ ᱴᱷᱤᱠ", roman: "Pura ṭhik", meaning: "Absolutely correct" },
  "बिल्कुल सही!": { ol: "ᱯᱩᱨᱟᱹ ᱴᱷᱤᱠ", roman: "Pura ṭhik", meaning: "Absolutely correct" },
  "शोर मत करो": { ol: "ᱜᱚᱞᱢᱟᱞ ᱟᱞᱚᱯᱮ ᱠᱚᱨᱟᱣᱟ", roman: "Golmal alope korawa", meaning: "Do not make noise" },
  "कतार में खड़े हो जाओ": { ol: "ᱛᱷᱟᱨ ᱨᱮ ᱛᱤᱸᱜᱩᱱ ᱢᱮ", roman: "Thar re tiṅgun me", meaning: "Stand in a line" },
  "चित्र बनाओ": { ol: "ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱢᱮ", roman: "Citạr benaw me", meaning: "Draw a picture" },
  "साथ में गाओ": { ol: "ᱢᱤᱫ ᱛᱮ ᱥᱮᱨᱮᱧ ᱢᱮ", roman: "Mid te sereñ me", meaning: "Sing together" },
  "तालियां बजाओ": { ol: "ᱛᱷᱟᱹᱭᱳ ᱢᱮ", roman: "Thạyo me", meaning: "Clap your hands" },
  "खेल शुरू करो": { ol: "ᱮᱱᱮᱡ ᱮᱦᱚᱵ ᱢᱮ", roman: "Enej ehob me", meaning: "Start the game" },
  "शुभ संध्या": { ol: "ᱥᱟᱹᱜᱩᱱ ᱟᱹᱭᱩᱵ", roman: "Sagun ayub", meaning: "Good evening" },
  "फिर मिलेंगे": { ol: "ᱫᱚᱦᱲᱟ ᱵᱚᱱ ᱧᱟᱯᱟᱢᱟ", roman: "Dohṛa bon ñapama", meaning: "See you again" },
};

// ── FLN Master Pedagogy Bank Data (27 Foundational Phrases) ───────────────────
const FLN_BANK_DATA = [
  // 1. Daily Classroom Phrases (7)
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "किताब खोलो",
    ol: "ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ",
    roman: "Puthi jhij me",
    meaning: "Open the book"
  },
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "किताब पढ़ो",
    ol: "ᱯᱩᱛᱷᱤ ᱯᱟᱲᱦᱟᱣ ᱢᱮ",
    roman: "Puthi paṛhaw me",
    meaning: "Read the book"
  },
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "बोर्ड पर देखो",
    ol: "ᱵᱳᱨᱰ ᱨᱮ ᱧᱮᱞ ᱢᱮ",
    roman: "Bord re ñel me",
    meaning: "Look at the board"
  },
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "यहाँ आओ",
    ol: "ᱱᱚᱸᱰᱮ ᱦᱤᱡᱩᱜ ᱢᱮ",
    roman: "Noṇḍe hijug me",
    meaning: "Come here"
  },
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "अपनी जगह पर बैठ जाओ",
    ol: "ᱟᱢᱟᱜ ᱴᱷᱟᱶ ᱨᱮ ᱫᱩᱲᱩᱵ ᱢᱮ",
    roman: "Amag ṭhaw re duṛub me",
    meaning: "Sit in your place"
  },
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "कॉपी निकालो",
    ol: "ᱠᱷᱟᱛᱟ ᱚᱰᱚᱠ ᱢᱮ",
    roman: "Khata oḍok me",
    meaning: "Take out your notebook"
  },
  {
    category: "classroom",
    categoryLabel: "Daily Classroom",
    hindi: "पेंसिल से लिखो",
    ol: "ᱯᱮᱱᱥᱤᱞ ᱛᱮ ᱚᱞ ᱢᱮ",
    roman: "Pensil te ol me",
    meaning: "Write with a pencil"
  },

  // 2. Praise & Encouragement Phrases (5)
  {
    category: "praise",
    categoryLabel: "Praise",
    hindi: "बहुत अच्छा",
    ol: "ᱟᱹᱰᱤ ᱵᱷᱟᱹᱜᱤ",
    roman: "Aḍi bhagi",
    meaning: "Very good"
  },
  {
    category: "praise",
    categoryLabel: "Praise",
    hindi: "शाबाश!",
    ol: "ᱥᱟᱨᱦᱟᱣ",
    roman: "Sarhaw",
    meaning: "Well done / Praise"
  },
  {
    category: "praise",
    categoryLabel: "Praise",
    hindi: "तुमने बहुत अच्छा काम किया",
    ol: "ᱟᱢ ᱟᱹᱰᱤ ᱵᱷᱟᱹᱜᱤ ᱠᱟᱹᱢᱤ ᱠᱮᱫᱼᱟ",
    roman: "Am aḍi bhagi kami ked-a",
    meaning: "You did a great job"
  },
  {
    category: "praise",
    categoryLabel: "Praise",
    hindi: "शानदार प्रयास!",
    ol: "ᱟᱹᱰᱤ ᱱᱟᱯᱟᱭ ᱠᱩᱨᱩᱢᱩᱴᱩ",
    roman: "Aḍi napay kurumutu",
    meaning: "Wonderful effort"
  },
  {
    category: "praise",
    categoryLabel: "Praise",
    hindi: "बिल्कुल सही!",
    ol: "ᱯᱩᱨᱟᱹ ᱴᱷᱤᱠ",
    roman: "Pura ṭhik",
    meaning: "Absolutely correct"
  },

  // 3. Discipline & Attention Phrases (5)
  {
    category: "discipline",
    categoryLabel: "Discipline",
    hindi: "चुप रहो",
    ol: "ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱢᱮ",
    roman: "Thir tahen me",
    meaning: "Keep quiet / Silence"
  },
  {
    category: "discipline",
    categoryLabel: "Discipline",
    hindi: "ध्यान से सुनो",
    ol: "ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱢᱮ",
    roman: "Dheyan te añjom me",
    meaning: "Listen carefully"
  },
  {
    category: "discipline",
    categoryLabel: "Discipline",
    hindi: "शोर मत करो",
    ol: "ᱜᱚᱞᱢᱟᱞ ᱟᱞᱚᱯᱮ ᱠᱚᱨᱟᱣᱟ",
    roman: "Golmal alope korawa",
    meaning: "Do not make noise"
  },
  {
    category: "discipline",
    categoryLabel: "Discipline",
    hindi: "कतार में खड़े हो जाओ",
    ol: "ᱛᱷᱟᱨ ᱨᱮ ᱛᱤᱸᱜᱩᱱ ᱢᱮ",
    roman: "Thar re tiṅgun me",
    meaning: "Stand in a line"
  },
  {
    category: "discipline",
    categoryLabel: "Discipline",
    hindi: "हाथ उठाओ",
    ol: "ᱛᱤ ᱛᱩᱞ ᱢᱮ",
    roman: "Ti tul me",
    meaning: "Raise your hand"
  },

  // 4. Classroom Activity Phrases (5)
  {
    category: "activity",
    categoryLabel: "Activities",
    hindi: "गिनती करो",
    ol: "ᱞᱮᱠᱷᱟᱭ ᱢᱮ",
    roman: "Lekhay me",
    meaning: "Count the numbers"
  },
  {
    category: "activity",
    categoryLabel: "Activities",
    hindi: "चित्र बनाओ",
    ol: "ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱢᱮ",
    roman: "Citạr benaw me",
    meaning: "Draw a picture"
  },
  {
    category: "activity",
    categoryLabel: "Activities",
    hindi: "साथ में गाओ",
    ol: "ᱢᱤᱫ ᱛᱮ ᱥᱮᱨᱮᱧ ᱢᱮ",
    roman: "Mid te sereñ me",
    meaning: "Sing together"
  },
  {
    category: "activity",
    categoryLabel: "Activities",
    hindi: "तालियां बजाओ",
    ol: "ᱛᱷᱟᱹᱭᱳ ᱢᱮ",
    roman: "Thạyo me",
    meaning: "Clap your hands"
  },
  {
    category: "activity",
    categoryLabel: "Activities",
    hindi: "खेल शुरू करो",
    ol: "ᱮᱱᱮᱡ ᱮᱦᱚᱵ ᱢᱮ",
    roman: "Enej ehob me",
    meaning: "Start the game/activity"
  },

  // 5. Greetings & Courtesies Phrases (5)
  {
    category: "greetings",
    categoryLabel: "Greetings",
    hindi: "नमस्ते",
    ol: "ᱡᱚᱦᱟᱨ",
    roman: "Johar",
    meaning: "Greetings / Hello"
  },
  {
    category: "greetings",
    categoryLabel: "Greetings",
    hindi: "शुभ प्रभात",
    ol: "ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ",
    roman: "Sagun setag",
    meaning: "Good morning"
  },
  {
    category: "greetings",
    categoryLabel: "Greetings",
    hindi: "शुभ संध्या",
    ol: "ᱥᱟᱹᱜᱩᱱ ᱟᱹᱭᱩᱵ",
    roman: "Sagun ayub",
    meaning: "Good evening"
  },
  {
    category: "greetings",
    categoryLabel: "Greetings",
    hindi: "आप कैसे हैं?",
    ol: "ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?",
    roman: "Ched leka menama?",
    meaning: "How are you?"
  },
  {
    category: "greetings",
    categoryLabel: "Greetings",
    hindi: "फिर मिलेंगे",
    ol: "ᱫᱚᱦᱲᱟ ᱵᱚᱱ ᱧᱟᱯᱟᱢᱟ",
    roman: "Dohṛa bon ñapama",
    meaning: "See you again"
  }
];

// Vocabulary Word-level translation dictionary (Hindi -> Santali Ol Chiki)
const HINDI_TO_SANTALI_DICT = {
  // Pronouns
  "मैं": { ol: "ᱤᱧ", roman: "injh" },
  "मुझे": { ol: "ᱤᱧ", roman: "injh" },
  "मुझको": { ol: "ᱤᱧ", roman: "injh" },
  "मेरा": { ol: "ᱤᱧᱟᱜ", roman: "injhag" },
  "मेरी": { ol: "ᱤᱧᱟᱜ", roman: "injhag" },
  "मेरे": { ol: "ᱤᱧᱟᱜ", roman: "injhag" },
  "हम": { ol: "ᱟᱞᱮ", roman: "ale" },
  "हमारा": { ol: "ᱟᱞᱮᱭᱟᱜ", roman: "aleyag" },
  "हमें": { ol: "ᱟᱞᱮ", roman: "ale" },
  "तुम": { ol: "ᱟᱢ", roman: "am" },
  "तू": { ol: "ᱟᱢ", roman: "am" },
  "तुझे": { ol: "ᱟᱢ", roman: "am" },
  "तेरा": { ol: "ᱟᱢᱟᱜ", roman: "amag" },
  "तेरी": { ol: "ᱟᱢᱟᱜ", roman: "amag" },
  "तुम्हारा": { ol: "ᱟᱢᱟᱜ", roman: "amag" },
  "तुम्हारी": { ol: "ᱟᱢᱟᱜ", roman: "amag" },
  "तुम्हारे": { ol: "ᱟᱢᱟᱜ", roman: "amag" },
  "आप": { ol: "ᱟᱯᱮ", roman: "ape" },
  "आपका": { ol: "ᱟᱯᱮᱭᱟᱜ", roman: "apeyag" },
  "आपकी": { ol: "ᱟᱯᱮᱭᱟᱜ", roman: "apeyag" },
  "आपके": { ol: "ᱟᱯᱮᱭᱟᱜ", roman: "apeyag" },
  "यह": { ol: "ᱱᱚᱶᱟ", roman: "nowa" },
  "ये": { ol: "ᱱᱚᱶᱟ", roman: "nowa" },
  "वह": { ol: "ᱚᱱᱟ", roman: "ona" },
  "वो": { ol: "ᱩᱱᱤ", roman: "uni" },
  "वे": { ol: "ᱩᱱᱠᱩ", roman: "unku" },
  "उनका": { ol: "ᱩᱱᱠᱩᱣᱟᱜ", roman: "unkuwag" },
  "यहाँ": { ol: "ᱱᱚᱸᱰᱮ", roman: "nonde" },
  "वहाँ": { ol: "ᱚᱸᱰᱮ", roman: "onde" },
  "कहाँ": { ol: "ᱚᱠᱟᱨᱮ", roman: "okare" },
  "क्या": { ol: "ᱪᱮᱫ", roman: "ched" },
  "कब": { ol: "ᱛᱤᱥ", roman: "tis" },
  "कैसे": { ol: "ᱪᱮᱫ ᱞᱮᱠᱟ", roman: "ched leka" },
  "कैसा": { ol: "ᱪᱮᱫ ᱞᱮᱠᱟ", roman: "ched leka" },
  "कैसी": { ol: "ᱪᱮᱫ ᱞᱮᱠᱟ", roman: "ched leka" },
  "क्यों": { ol: "ᱪᱮᱫᱟᱜ", roman: "chedag" },
  "कौन": { ol: "ᱚᱠᱚᱭ", roman: "okoy" },
  "कितना": { ol: "ᱛᱤᱱᱟᱹᱜ", roman: "tinag" },
  "कितने": { ol: "ᱛᱤᱱᱟᱹᱜ", roman: "tinag" },

  // Nouns
  "पानी": { ol: "ᱫᱟᱜ", roman: "daag" },
  "घर": { ol: "ᱚᱲᱟᱜ", roman: "orhag" },
  "गाँव": { ol: "ᱟᱹᱛᱩ", roman: "atu" },
  "शहर": { ol: "ᱵᱟᱡᱟᱨ", roman: "bajar" },
  "खाना": { ol: "ᱫᱟᱠᱟ", roman: "daka" },
  "भात": { ol: "ᱫᱟᱠᱟ", roman: "daka" },
  "चावल": { ol: "ᱪᱟᱣᱞᱮ", roman: "cawle" },
  "रोटी": { ol: "ᱯᱤᱴᱷᱟᱹ", roman: "pitha" },
  "सब्जी": { ol: "ᱩᱛᱩ", roman: "utu" },
  "दूध": { ol: "ᱛᱚᱣᱟ", roman: "towa" },
  "चाय": { ol: "ᱪᱟ", roman: "ca" },
  "फल": { ol: "ᱡᱚ", roman: "jo" },
  "दोस्त": { ol: "ᱜᱟᱛᱮ", roman: "gate" },
  "मित्र": { ol: "ᱜᱟᱛᱮ", roman: "gate" },
  "माँ": { ol: "ᱟᱭᱳ", roman: "ayo" },
  "माता": { ol: "ᱟᱭᱳ", roman: "ayo" },
  "पिता": { ol: "ᱵᱟᱵᱟ", roman: "baba" },
  "बाप": { ol: "ᱵᱟᱵᱟ", roman: "baba" },
  "भाई": { ol: "ᱵᱚᱭᱦᱟ", roman: "boyha" },
  "बहन": { ol: "ᱢᱤᱥᱮᱨᱟ", roman: "misera" },
  "बेटा": { ol: "ᱠᱚᱲᱟ", roman: "korha" },
  "बेटी": { ol: "ᱠᱩᱲᱤ", roman: "kurhi" },
  "बच्चा": { ol: "ᱜᱤᱫᱽᱨᱟᱹ", roman: "gidra" },
  "बच्चे": { ol: "ᱜᱤᱫᱽᱨᱟᱹ", roman: "gidra" },
  "लड़का": { ol: "ᱠᱚᱲᱟ ᱜᱤᱫᱽᱨᱟᱹ", roman: "korha gidra" },
  "लड़की": { ol: "ᱠᱩᱲᱤ ᱜᱤᱫᱽᱨᱟᱹ", roman: "kurhi gidra" },
  "आदमी": { ol: "ᱦᱚᱲ", roman: "horh" },
  "लोग": { ol: "ᱦᱚᱲ", roman: "horh" },
  "महिला": { ol: "ᱢᱟᱹᱭᱡᱩ", roman: "mayju" },
  "स्त्री": { ol: "ᱢᱟᱹᱭᱡᱩ", roman: "mayju" },
  "पेड़": { ol: "ᱫᱟᱨᱮ", roman: "dare" },
  "जंगल": { ol: "ᱵᱤᱨ", roman: "bir" },
  "वन": { ol: "ᱵᱤᱨ", roman: "bir" },
  "रास्ता": { ol: "ᱦᱚᱨ", roman: "hor" },
  "सड़क": { ol: "ᱦᱚᱨ", roman: "hor" },
  "नाम": { ol: "ᱧᱩᱛᱩᱢ", roman: "nhutum" },
  "काम": { ol: "ᱠᱟᱹᱢᱤ", roman: "kami" },
  "बात": { ol: "ᱠᱟᱛᱷᱟ", roman: "katha" },
  "दिन": { ol: "ᱢᱟᱦᱟ", roman: "maha" },
  "रात": { ol: "ᱧᱤᱫᱟᱹ", roman: "nhida" },
  "सुबह": { ol: "ᱥᱮᱛᱟᱜ", roman: "setag" },
  "शाम": { ol: "ᱟᱹᱭᱩᱵ", roman: "ayub" },
  "आज": { ol: "ᱛᱮᱦᱮᱧ", roman: "tehenj" },
  "कल": { ol: "ᱜᱟᱯᱟ", roman: "gapa" },
  "पैसा": { ol: "ᱴᱟᱠᱟ", roman: "taka" },
  "रुपया": { ol: "ᱴᱟᱠᱟ", roman: "taka" },

  // Verbs
  "जाना": { ol: "ᱪᱟᱞᱟᱜ", roman: "calag" },
  "जाओ": { ol: "ᱪᱟᱞᱟᱜ ᱢᱮ", roman: "calag me" },
  "जा": { ol: "ᱪᱟᱞᱟᱜ", roman: "calag" },
  "जाता": { ol: "ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ", roman: "calag kana" },
  "जाती": { ol: "ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ", roman: "calag kana" },
  "जाते": { ol: "ᱪᱟᱞᱟᱜ ᱠᱟᱱᱟ", roman: "calag kana" },
  "आना": { ol: "ᱦᱤᱡᱩᱜ", roman: "hijug" },
  "आओ": { ol: "ᱦᱤᱡᱩᱜ ᱢᱮ", roman: "hijug me" },
  "आता": { ol: "ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ", roman: "hijug kana" },
  "आती": { ol: "ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ", roman: "hijug kana" },
  "आते": { ol: "ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ", roman: "hijug kana" },
  "खाओ": { ol: "ᱡᱚᱢ ᱢᱮ", roman: "jom me" },
  "खाता": { ol: "ᱡᱚᱢᱮᱫᱼᱟ", roman: "jomed-a" },
  "खाती": { ol: "ᱡᱚᱢᱮᱫᱼᱟ", roman: "jomed-a" },
  "खाते": { ol: "ᱡᱚᱢᱮᱫᱼᱟ", roman: "jomed-a" },
  "पियो": { ol: "ᱧᱩᱭ ᱢᱮ", roman: "nhu me" },
  "पीता": { ol: "ᱧᱩᱭᱮᱫᱼᱟ", roman: "nhuyed-a" },
  "पीती": { ol: "ᱧᱩᱭᱮᱫᱼᱟ", roman: "nhuyed-a" },
  "पीते": { ol: "ᱧᱩᱭᱮᱫᱼᱟ", roman: "nhuyed-a" },
  "बोलो": { ol: "ᱨᱚᱲ ᱢᱮ", roman: "rorh me" },
  "बोलना": { ol: "ᱨᱚᱲ", roman: "rorh" },
  "कहना": { ol: "ᱢᱮᱱ", roman: "men" },
  "सुनो": { ol: "ᱟᱸᱡᱚᱢ ᱢᱮ", roman: "anjom me" },
  "सुनना": { ol: "ᱟᱸᱡᱚᱢ", roman: "anjom" },
  "देखो": { ol: "ᱧᱮᱞ ᱢᱮ", roman: "nhel me" },
  "देखना": { ol: "ᱧᱮᱞ", roman: "nhel" },
  "करो": { ol: "ᱠᱟᱹᱢᱤ ᱢᱮ", roman: "kami me" },
  "करना": { ol: "ᱠᱟᱹᱢᱤ", roman: "kami" },
  "सोना": { ol: "ᱡᱟᱹᱯᱤᱫ", roman: "japid" },
  "उठो": { ol: "ᱵᱮᱨᱮᱫ ᱢᱮ", roman: "bered me" },
  "पढ़ो": { ol: "ᱯᱟᱲᱦᱟᱣ ᱢᱮ", roman: "parhaw me" },
  "पढ़ना": { ol: "ᱯᱟᱲᱦᱟᱣ", roman: "parhaw" },
  "लिखो": { ol: "ᱚᱞ ᱢᱮ", roman: "ol me" },
  "लिखना": { ol: "ᱚᱞ", roman: "ol" },

  // Adjectives & Modifiers
  "अच्छा": { ol: "ᱵᱷᱟᱹᱜᱤ", roman: "bhagi" },
  "अच्छी": { ol: "ᱵᱷᱟᱹᱜᱤ", roman: "bhagi" },
  "अच्छे": { ol: "ᱵᱷᱟᱹᱜᱤ", roman: "bhagi" },
  "बढ़िया": { ol: "ᱢᱚᱡᱽ", roman: "moj" },
  "सुंदर": { ol: "ᱢᱚᱡᱽ", roman: "moj" },
  "खराब": { ol: "ᱵᱟᱹᱲᱤᱡ", roman: "barhij" },
  "बुरा": { ol: "ᱵᱟᱹᱲᱤᱡ", roman: "barhij" },
  "बड़ा": { ol: "ᱢᱟᱨᱟᱝ", roman: "marang" },
  "बड़ी": { ol: "ᱢᱟᱨᱟᱝ", roman: "marang" },
  "बड़े": { ol: "ᱢᱟᱨᱟᱝ", roman: "marang" },
  "छोटा": { ol: "ᱠᱟᱹᱴᱤᱡ", roman: "katij" },
  "छोटी": { ol: "ᱠᱟᱹᱴᱤᱡ", roman: "katij" },
  "छोटे": { ol: "ᱠᱟᱹᱴᱤᱡ", roman: "katij" },
  "नया": { ol: "ᱱᱟᱶᱟ", roman: "nawa" },
  "नई": { ol: "ᱱᱟᱶᱟ", roman: "nawa" },
  "नए": { ol: "ᱱᱟᱶᱟ", roman: "nawa" },
  "पुराना": { ol: "ᱢᱟᱨᱮ", roman: "mare" },
  "पुरानी": { ol: "ᱢᱟᱨᱮ", roman: "mare" },
  "पुराने": { ol: "ᱢᱟᱨᱮ", roman: "mare" },
  "बहुत": { ol: "ᱟᱹᱰᱤ", roman: "adi" },
  "ज्यादा": { ol: "ᱟᱹᱰᱤ", roman: "adi" },
  "कम": { ol: "ᱠᱚᱢ", roman: "kom" },
  "खुश": { ol: "ᱨᱟᱹᱥᱠᱟᱹ", roman: "raska" },
  "और": { ol: "ᱟᱨ", roman: "ar" },
  "भी": { ol: "ᱦᱚᱸ", roman: "hoñ" },
  "को": { ol: "", roman: "" }, // Accusative particle - naturally omitted in Santali
  "है": { ol: "ᱠᱟᱱᱟ", roman: "kana" },
  "हैं": { ol: "ᱠᱟᱱᱟ ᱠᱚ", roman: "kana ko" },
  "हूँ": { ol: "ᱠᱟᱹᱱᱟᱹᱧ", roman: "kananjh" },
  "था": { ol: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ", roman: "taheñ kana" },
  "थी": { ol: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ", roman: "taheñ kana" },
  "थे": { ol: "ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ ᱠᱚ", roman: "taheñ kana ko" },

  // FLN Numerals & Math Operations
  "जोड़ो": { ol: "ᱢᱮᱥᱟᱭ ᱢᱮ", roman: "mesay me" },
  "जोड़": { ol: "ᱢᱮᱥᱟ", roman: "mesa" },
  "जोड़ना": { ol: "ᱢᱮᱥᱟ", roman: "mesa" },
  "घटाओ": { ol: "ᱵᱷᱮᱜᱟᱨ ᱢᱮ", roman: "bhegar me" },
  "घटाना": { ol: "ᱵᱷᱮᱜᱟᱨ", roman: "bhegar" },
  "गिनो": { ol: "ᱞᱮᱠᱷᱟᱭ ᱢᱮ", roman: "lekhay me" },
  "गिनती": { ol: "ᱞᱮᱠᱷᱟ", roman: "lekha" },
  "संख्या": { ol: "ᱮᱞ", roman: "el" },
  "संख्याएं": { ol: "ᱮᱞ ᱠᱚ", roman: "el ko" },
  "संख्याओं": { ol: "ᱮᱞ ᱠᱚ", roman: "el ko" },
  "एक": { ol: "ᱢᱤᱫ", roman: "mid" },
  "दो": { ol: "ᱵᱟᱨ", roman: "bar" },
  "तीन": { ol: "ᱯᱮ", roman: "pe" },
  "चार": { ol: "ᱯᱳᱱ", roman: "pon" },
  "पांच": { ol: "ᱢᱚᱬᱮ", roman: "mone" },
  "पाँच": { ol: "ᱢᱚᱬᱮ", roman: "mone" },
  "छह": { ol: "ᱛᱩᱨᱩᱭ", roman: "turui" },
  "सात": { ol: "ᱮᱭᱟᱭ", roman: "eae" },
  "आठ": { ol: "ᱤᱨᱟᱹᱞ", roman: "iral" },
  "नौ": { ol: "ᱟᱨᱮ", roman: "are" },
  "दस": { ol: "ᱜᱮᱞ", roman: "gel" },
  "किताब": { ol: "ᱯᱩᱛᱷᱤ", roman: "puthi" },
  "कॉपी": { ol: "ᱠᱷᱟᱛᱟ", roman: "khata" },
  "पेंसिल": { ol: "ᱯᱮᱱᱥᱤᱞ", roman: "pensil" },
  "बोर्ड": { ol: "ᱵᱳᱨᱰ", roman: "board" },
  "हाथ": { ol: "ᱛᱤ", roman: "ti" },
};

// ── 3. Devanagari to Ol Chiki Phonetic Mapping ───────────────────────────────

const DEVA_VOWELS = {
  "अ": { ol: "ᱚ", roman: "a" },
  "आ": { ol: "ᱟ", roman: "aa" },
  "इ": { ol: "ᱤ", roman: "i" },
  "ई": { ol: "ᱤ", roman: "ee" },
  "उ": { ol: "ᱩ", roman: "u" },
  "ऊ": { ol: "ᱩ", roman: "oo" },
  "ऋ": { ol: "ᱨᱤ", roman: "ri" },
  "ए": { ol: "ᱮ", roman: "e" },
  "ऐ": { ol: "ᱮ", roman: "ai" },
  "ओ": { ol: "ᱳ", roman: "o" },
  "औ": { ol: "ᱳ", roman: "au" },
};

const DEVA_MATRAS = {
  "ा": { ol: "ᱟ", roman: "aa" },
  "ि": { ol: "ᱤ", roman: "i" },
  "ी": { ol: "ᱤ", roman: "ee" },
  "ु": { ol: "ᱩ", roman: "u" },
  "ू": { ol: "ᱩ", roman: "oo" },
  "ृ": { ol: "ᱨᱤ", roman: "ri" },
  "े": { ol: "ᱮ", roman: "e" },
  "ै": { ol: "ᱮ", roman: "ai" },
  "ो": { ol: "ᱳ", roman: "o" },
  "ौ": { ol: "ᱳ", roman: "au" },
  "ं": { ol: "ᱝ", roman: "ng" }, // Anusvara
  "ँ": { ol: "ᱸ", roman: "ñ" },  // Chandrabindu -> Mu tudag (U+1C78)
  "ः": { ol: "ᱷ", roman: "h" },  // Visarga
};

const DEVA_CONSONANTS = {
  "क": { ol: "ᱠ", roman: "k" },
  "ख": { ol: "ᱠᱷ", roman: "kh" },
  "ग": { ol: "ᱜ", roman: "g" },
  "घ": { ol: "ᱜᱷ", roman: "gh" },
  "ङ": { ol: "ᱝ", roman: "ng" },
  "च": { ol: "ᱪ", roman: "c" },
  "छ": { ol: "ᱪᱷ", roman: "ch" },
  "ज": { ol: "ᱡ", roman: "j" },
  "झ": { ol: "ᱡᱷ", roman: "jh" },
  "ञ": { ol: "ᱧ", roman: "nh" },
  "ट": { ol: "ᱴ", roman: "t" },
  "ठ": { ol: "ᱴᱷ", roman: "th" },
  "ड": { ol: "ᱰ", roman: "d" },
  "ढ": { ol: "ᱰᱷ", roman: "dh" },
  "ण": { ol: "ᱬ", roman: "n" },
  "त": { ol: "ᱛ", roman: "t" },
  "थ": { ol: "ᱛᱷ", roman: "th" },
  "द": { ol: "ᱫ", roman: "d" },
  "ध": { ol: "ᱫᱷ", roman: "dh" },
  "न": { ol: "ᱱ", roman: "n" },
  "प": { ol: "ᱯ", roman: "p" },
  "फ": { ol: "ᱯᱷ", roman: "ph" },
  "ब": { ol: "ᱵ", roman: "b" },
  "भ": { ol: "ᱵᱷ", roman: "bh" },
  "म": { ol: "ᱢ", roman: "m" },
  "य": { ol: "ᱭ", roman: "y" },
  "र": { ol: "ᱨ", roman: "r" },
  "ल": { ol: "ᱞ", roman: "l" },
  "व": { ol: "ᱣ", roman: "w" },
  "श": { ol: "ᱥ", roman: "s" },
  "ष": { ol: "ᱥ", roman: "s" },
  "स": { ol: "ᱥ", roman: "s" },
  "ह": { ol: "ᱦ", roman: "h" },
  "ड़": { ol: "ᱲ", roman: "rh" },
  "ढ़": { ol: "ᱲᱷ", roman: "rh" },
};

// Halant character (Virama) in Devanagari
const VIRAMA = "्";

// ── 4. Ol Chiki Keyboard Layout Reference (Alphabetical + Diacritics) ─────────

const OL_CHIKI_KEYBOARD = [
  { ol: "ᱚ", roman: "LA" },
  { ol: "ᱛ", roman: "AT" },
  { ol: "ᱜ", roman: "AG" },
  { ol: "ᱝ", roman: "ANG" },
  { ol: "ᱞ", roman: "AL" },
  { ol: "ᱟ", roman: "LAA" },
  { ol: "ᱠ", roman: "AAK" },
  { ol: "ᱡ", roman: "AAJ" },
  { ol: "ᱢ", roman: "AAM" },
  { ol: "ᱣ", roman: "AAW" },
  { ol: "ᱤ", roman: "LI" },
  { ol: "ᱥ", roman: "IS" },
  { ol: "ᱦ", roman: "IH" },
  { ol: "ᱧ", roman: "INY" },
  { ol: "ᱨ", roman: "IR" },
  { ol: "ᱩ", roman: "LU" },
  { ol: "ᱪ", roman: "UCH" },
  { ol: "ᱫ", roman: "UD" },
  { ol: "ᱬ", roman: "UNN" },
  { ol: "ᱭ", roman: "UY" },
  { ol: "ᱮ", roman: "LE" },
  { ol: "ᱯ", roman: "EP" },
  { ol: "ᱰ", roman: "EDD" },
  { ol: "ᱱ", roman: "EN" },
  { ol: "ᱲ", roman: "ERR" },
  { ol: "ᱳ", roman: "LO" },
  { ol: "ᱴ", roman: "OTT" },
  { ol: "ᱵ", roman: "OB" },
  { ol: "ᱶ", roman: "OV" },
  { ol: "ᱷ", roman: "OH" },
  // Diacritics & Punctuation
  { ol: "ᱸ", roman: "Mu Tudag" },
  { ol: "ᱹ", roman: "Gahla Tudag" },
  { ol: "ᱺ", roman: "Mu Gahla" },
  { ol: "ᱻ", roman: "Relha" },
  { ol: "ᱼ", roman: "Ahven" },
  { ol: "ᱽ", roman: "Ohod" },
  { ol: "᱾", roman: "Mucad (।)" },
  { ol: "᱿", roman: "Double (॥)" }
];

// ── 5. Normalization & Transliteration Algorithms ─────────────────────────────

/**
 * Normalizes Hindi speech input to clean ASR artifacts.
 */
function normalizeHindiSpeech(text) {
  if (!text) return "";

  let cleaned = text.trim();

  // 1. Unicode NFKD / NFC normalization
  cleaned = cleaned.normalize("NFC");

  // 2. Replace Nuktas with base characters to avoid ASR splitting
  for (const [nuktaChar, baseChar] of Object.entries(NUKTA_MAP)) {
    cleaned = cleaned.replaceAll(nuktaChar, baseChar);
  }

  // 3. Apply common speech regex corrections
  for (const rule of HINDI_ASR_CORRECTIONS) {
    cleaned = cleaned.replace(rule.pattern, rule.replacement);
  }

  // 4. Remove multiple consecutive spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Translates/Transliterates Hindi (Devanagari) into Ol Chiki.
 */
function convertDevanagariToOlChiki(text) {
  if (!text) return { ol: "", roman: "" };

  const normalized = normalizeHindiSpeech(text);

  // 1. Check Phrasebook first for idiomatic Santali
  for (const [hindiPhrase, santaliData] of Object.entries(PHRASEBOOK)) {
    if (normalized.toLowerCase() === hindiPhrase.toLowerCase()) {
      return {
        ol: santaliData.ol,
        roman: santaliData.roman,
        phraseMatch: true,
      };
    }
  }

  // 2. Word-by-word translation using Dictionary, then phonetic fallback for names
  const words = normalized.split(/\s+/);
  const olWords = [];
  const romanWords = [];
  let translatedWordsCount = 0;

  for (const rawWord of words) {
    // Strip and preserve trailing punctuation
    const cleanWord = rawWord.replace(/[।.,?!;:]/g, "");
    const punct = rawWord.slice(cleanWord.length);
    const santaliPunct = (punct === "।" || punct === ".") ? "᱾" : punct;

    // A. Check Phrasebook
    if (PHRASEBOOK[cleanWord]) {
      olWords.push(PHRASEBOOK[cleanWord].ol + santaliPunct);
      romanWords.push(PHRASEBOOK[cleanWord].roman + punct);
      translatedWordsCount++;
      continue;
    }

    // B. Check Santali Vocabulary Dictionary
    if (HINDI_TO_SANTALI_DICT[cleanWord] !== undefined) {
      const mapping = HINDI_TO_SANTALI_DICT[cleanWord];
      if (mapping.ol) {
        olWords.push(mapping.ol + santaliPunct);
        romanWords.push(mapping.roman + punct);
      }
      translatedWordsCount++;
      continue;
    }

    // C. Check Digits / Numbers (e.g. 2 -> ᱒, 4 -> ᱔)
    if (/^\d+$/.test(cleanWord)) {
      const DIGIT_MAP = {
        "0": { ol: "᱐", roman: "0" },
        "1": { ol: "᱑", roman: "mid" },
        "2": { ol: "᱒", roman: "bar" },
        "3": { ol: "᱓", roman: "pe" },
        "4": { ol: "᱔", roman: "pon" },
        "5": { ol: "᱕", roman: "mone" },
        "6": { ol: "᱖", roman: "turui" },
        "7": { ol: "᱗", roman: "eae" },
        "8": { ol: "᱘", roman: "iral" },
        "9": { ol: "᱙", roman: "are" },
      };
      const olDigits = Array.from(cleanWord).map(d => DIGIT_MAP[d]?.ol || d).join("");
      const romanDigits = cleanWord.length === 1 ? (DIGIT_MAP[cleanWord]?.roman || cleanWord) : cleanWord;
      olWords.push(olDigits + santaliPunct);
      romanWords.push(romanDigits + punct);
      translatedWordsCount++;
      continue;
    }

    // C. Phonetic transliteration fallback (for proper nouns / unfamiliar names)
    let olWord = "";
    let romanWord = "";
    const chars = Array.from(cleanWord);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const nextChar = chars[i + 1];

      // Punctuation
      if (char === "।" || char === ".") {
        olWord += "᱾";
        romanWord += ".";
        continue;
      }
      if (char === "?" || char === "!" || char === "," || char === ";") {
        olWord += char;
        romanWord += char;
        continue;
      }

      // Independent Vowel
      if (DEVA_VOWELS[char]) {
        olWord += DEVA_VOWELS[char].ol;
        romanWord += DEVA_VOWELS[char].roman;
        continue;
      }

      // Consonant
      if (DEVA_CONSONANTS[char]) {
        const consData = DEVA_CONSONANTS[char];
        olWord += consData.ol;
        romanWord += consData.roman;

        // Check following character:
        // Case A: Virama (Halant) -> explicit suppress schwa
        if (nextChar === VIRAMA) {
          i++; // skip virama
          // in Ol Chiki, consonant has no inherent vowel, so nothing extra needed
        }
        // Case B: Followed by Matra
        else if (DEVA_MATRAS[nextChar]) {
          const matraData = DEVA_MATRAS[nextChar];
          olWord += matraData.ol;
          romanWord += matraData.roman;
          i++; // skip matra
        }
        // Case C: Final consonant of word -> Schwa deletion (Hindi phonology)
        else if (i === chars.length - 1) {
          // in spoken Hindi, final schwa is deleted (e.g., 'कमल' -> kamal, not kamala)
          // in Ol Chiki, consonants are unvoiced without vowels, so this is exact
        }
        // Case D: Non-final consonant without matra -> implicit 'a' (ᱚ)
        else {
          olWord += "ᱚ";
          romanWord += "a";
        }
        continue;
      }

      // Stray Matra or unknown character
      if (DEVA_MATRAS[char]) {
        olWord += DEVA_MATRAS[char].ol;
        romanWord += DEVA_MATRAS[char].roman;
      } else {
        olWord += char;
        romanWord += char;
      }
    }

    olWords.push(olWord);
    romanWords.push(romanWord);
  }

  return {
    ol: olWords.join(" "),
    roman: romanWords.join(" "),
    phraseMatch: false,
  };
}

// ── 6. UI Interaction & Speech Recognition Controller ────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const hindiInput = document.getElementById("hindiInput");
  const olChikiOutput = document.getElementById("olChikiOutput");
  const romanOutput = document.getElementById("romanOutput");
  const micBtn = document.getElementById("micBtn");
  const micBtnText = document.getElementById("micBtnText");
  const micStatus = document.getElementById("micStatus");
  const clearBtn = document.getElementById("clearBtn");
  const copyBtn = document.getElementById("copyBtn");
  const speakBtn = document.getElementById("speakBtn");
  const speakBtnText = document.getElementById("speakBtnText");
  const voiceSelect = document.getElementById("voiceSelect");
  const autoSynthesizeCheck = document.getElementById("autoSynthesizeCheck");
  const asrLiveBadge = document.getElementById("asrLiveBadge");
  const normStats = document.getElementById("normStats");
  const keyboardContainer = document.getElementById("keyboardContainer");
  const toggleKeyboard = document.getElementById("toggleKeyboard");
  const audioElement = document.getElementById("audioElement");
  const trackStatus = document.getElementById("trackStatus");
  const trackName = document.getElementById("trackName");
  const loadGeneratedBtn = document.getElementById("loadGeneratedBtn");

  // Colab Bridge Elements
  const colabUrlInput = document.getElementById("colabUrlInput");
  const connectColabBtn = document.getElementById("connectColabBtn");
  const bridgeStatusPill = document.getElementById("bridgeStatusPill");
  const colabStatusText = document.getElementById("colabStatusText");
  const bridgeHint = document.getElementById("bridgeHint");

  let colabBaseUrl = "https://jake-amanda-ada-manitoba.trycloudflare.com";
  colabUrlInput.value = colabBaseUrl;
  testColabConnection(colabBaseUrl, false);

  // Render on-screen keyboard
  OL_CHIKI_KEYBOARD.forEach((key) => {
    const btn = document.createElement("button");
    btn.className = "key-btn";
    btn.innerHTML = `<span class="key-ol">${key.ol}</span><span class="key-roman">${key.roman}</span>`;
    btn.addEventListener("click", () => {
      // Append to active Ol Chiki textarea
      olChikiOutput.value = (olChikiOutput.value || "") + key.ol;
      romanOutput.textContent = (romanOutput.textContent === "—" ? "" : romanOutput.textContent) + key.roman.toLowerCase();
    });
    keyboardContainer.appendChild(btn);
  });

  // Toggle keyboard tray
  toggleKeyboard.addEventListener("click", () => {
    keyboardContainer.classList.toggle("collapsed");
    const icon = toggleKeyboard.querySelector(".toggle-icon");
    icon.textContent = keyboardContainer.classList.contains("collapsed") ? "▶" : "▼";
  });

  // Live Conversion
  function handleInputUpdate() {
    const rawText = hindiInput.value;
    if (!rawText.trim()) {
      olChikiOutput.value = "";
      romanOutput.textContent = "—";
      normStats.textContent = "Nukta & Matra filter active";
      return;
    }

    const result = convertDevanagariToOlChiki(rawText);
    olChikiOutput.value = result.ol;
    romanOutput.textContent = result.roman;

    if (result.phraseMatch) {
      normStats.textContent = "✓ Native Santali phrasebook matched!";
      normStats.style.color = "#34d399";
    } else {
      normStats.textContent = "✓ Santali translation dictionary applied";
      normStats.style.color = "#34d399";
    }
  }

  hindiInput.addEventListener("input", handleInputUpdate);

  // Quick phrase chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      hindiInput.value = chip.getAttribute("data-text");
      handleInputUpdate();
      hindiInput.focus();
    });
  });

  // Clear button
  clearBtn.addEventListener("click", () => {
    hindiInput.value = "";
    olChikiOutput.value = "";
    romanOutput.textContent = "—";
    normStats.textContent = "Cleared";
    hindiInput.focus();
  });

  // Copy Ol Chiki text
  copyBtn.addEventListener("click", async () => {
    const text = olChikiOutput.value || olChikiOutput.textContent;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      const prevText = copyBtn.innerHTML;
      copyBtn.innerHTML = "✓ Copied!";
      setTimeout(() => (copyBtn.innerHTML = prevText), 1800);
    } catch (err) {
      alert("Failed to copy to clipboard.");
    }
  });

  // ── 7. Robust Hindi Speech Recognition (Web Speech API) ────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Specifically set to Hindi (India)
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add("recording");
      micBtnText.textContent = "सुन रहे हैं...";
      micStatus.textContent = "Listening (hi-IN)...";
      micStatus.style.color = "#ef4444";
      asrLiveBadge.classList.remove("hidden");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim feedback in textarea
      if (finalTranscript) {
        const cleaned = normalizeHindiSpeech(finalTranscript);
        hindiInput.value = (hindiInput.value ? hindiInput.value + " " : "") + cleaned;
        handleInputUpdate();
      } else if (interimTranscript) {
        // Preview normalized speech live
        normStats.textContent = `Interim: "${interimTranscript}"`;
      }
    };

    recognition.onerror = (event) => {
      console.warn("ASR Error:", event.error);
      micStatus.textContent = `Error: ${event.error}`;
      micStatus.style.color = "#f59e0b";
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };
  } else {
    micStatus.textContent = "Speech API not supported in this browser";
    micBtn.disabled = true;
    micBtn.title = "Use Google Chrome or Edge for Web Speech API";
  }

  function startListening() {
    if (!recognition) return;
    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
    }
  }

  function stopListening() {
    isRecording = false;
    micBtn.classList.remove("recording");
    micBtnText.textContent = "बोलें (Voice)";
    micStatus.textContent = "Mic Ready";
    micStatus.style.color = "";
    asrLiveBadge.classList.add("hidden");

    // If auto-synthesize is checked and we have text, synthesize immediately
    if (autoSynthesizeCheck && autoSynthesizeCheck.checked) {
      setTimeout(() => {
        const textVal = (olChikiOutput.value || olChikiOutput.textContent || "").trim();
        if (textVal) {
          synthesizeSpeech();
        }
      }, 300);
    }
  }

  micBtn.addEventListener("click", () => {
    if (!isRecording) {
      startListening();
    } else {
      if (recognition) recognition.stop();
      stopListening();
    }
  });

  // ── 7.1 Colab Bridge Connection Management ────────────────────────────────
  let isColabConnected = false;

  async function testColabConnection(url, userInitiated = true) {
    if (!url) {
      if (userInitiated) alert("Please enter your Colab Tunnel URL (e.g. https://...trycloudflare.com)");
      return;
    }

    // Sanitize URL
    const cleanUrl = url.trim().replace(/\/+$/, "");
    bridgeStatusPill.className = "bridge-status-pill connecting";
    colabStatusText.textContent = "Testing Colab connection...";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${cleanUrl}/health`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      isColabConnected = true;
      colabBaseUrl = cleanUrl;
      localStorage.setItem("santali_colab_url", cleanUrl);

      bridgeStatusPill.className = "bridge-status-pill connected";
      colabStatusText.textContent = "Colab GPU: Connected";
      bridgeHint.textContent = `Ready: ${data.model || "Parler-TTS GPU"}`;
      bridgeHint.style.color = "#34d399";
      speakBtnText.textContent = "⚡ Generate & Play (Colab GPU)";
      trackStatus.textContent = "Colab GPU connected! Click button to generate audio in ~2-3s.";

      if (userInitiated) {
        alert("🎉 Successfully connected to Colab GPU! You can now speak or type to generate Santali speech.");
      }
    } catch (err) {
      isColabConnected = false;
      bridgeStatusPill.className = "bridge-status-pill";
      colabStatusText.textContent = "Colab GPU: Disconnected";
      bridgeHint.textContent = "Could not reach Colab. Check if the Colab server cell is running.";
      bridgeHint.style.color = "#f87171";
      speakBtnText.textContent = "⚡ Synthesize & Play";
      if (userInitiated) {
        alert(`Failed to connect to Colab:\n${err.message}\n\nPlease check:\n1. Is the Colab server cell running?\n2. Did you paste the complete URL (including https://)?`);
      }
    }
  }

  connectColabBtn.addEventListener("click", () => {
    testColabConnection(colabUrlInput.value.trim(), true);
  });

  // Also connect on pressing Enter in the URL input
  colabUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      testColabConnection(colabUrlInput.value.trim(), true);
    }
  });

  // Helper for voice description
  function getVoiceDescription(gender) {
    if (gender === "male") {
      return "A clear natural Santali male voice speaking clearly in Ol Chiki script.";
    }
    return "A clear natural Santali female voice speaking clearly in Ol Chiki script.";
  }

  // ── 8. Audio Synthesizer & Colab GPU Synthesis ────────────────────────────

  async function synthesizeSpeech() {
    const text = (olChikiOutput.value || olChikiOutput.textContent || "").trim();
    if (!text) {
      alert("Please speak or enter Hindi text first to generate Ol Chiki script!");
      return;
    }

    const selectedVoice = voiceSelect ? voiceSelect.value : "female";
    const voiceDesc = getVoiceDescription(selectedVoice);

    if (isColabConnected && colabBaseUrl) {
      // 🚀 Live Colab GPU Synthesis!
      speakBtn.disabled = true;
      speakBtn.classList.add("loading");
      speakBtnText.textContent = "⏳ Generating (Colab GPU)...";
      trackStatus.textContent = "Sending Ol Chiki text to Colab GPU for synthesis...";

      const startTime = performance.now();
      try {
        const response = await fetch(`${colabBaseUrl}/synthesize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "audio/wav",
          },
          body: JSON.stringify({
            text: text,
            gender: selectedVoice,
            description: voiceDesc
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned ${response.status}`);
        }

        const audioBlob = await response.blob();
        const durationSec = ((performance.now() - startTime) / 1000).toFixed(2);
        const audioUrl = URL.createObjectURL(audioBlob);

        audioElement.src = audioUrl;
        audioElement.load();
        trackName.textContent = `Indic Parler-TTS • ${selectedVoice === "male" ? "Male" : "Female"} • 44.1 kHz`;
        trackStatus.textContent = `⚡ Synthesized in ${durationSec}s via Colab GPU! Playing now...`;
        trackStatus.style.color = "#34d399";

        await audioElement.play().catch(e => {
          console.warn("Auto-play prevented by browser:", e);
          trackStatus.textContent = `Synthesized in ${durationSec}s. Click audio controls to play.`;
        });

      } catch (err) {
        console.error("Colab Synthesis Error:", err);
        trackStatus.textContent = `Synthesis error: ${err.message}`;
        trackStatus.style.color = "#f87171";
        alert(`Synthesis failed: ${err.message}\n\nPlease verify that your Colab notebook is still active.`);
      } finally {
        speakBtn.disabled = false;
        speakBtn.classList.remove("loading");
        speakBtnText.textContent = "⚡ Generate & Play (Colab GPU)";
      }
    } else {
      // Offline fallback: load test_santali.wav
      trackStatus.textContent = "Tip: Connect Colab above to generate live audio. Playing local sample...";
      audioElement.src = "../outputs/test_santali.wav";
      audioElement.play().catch(() => {
        alert("Colab is not connected!\n\nTo hear live speech for your custom input:\n1. Run the Colab Server cell.\n2. Paste your Cloudflare/Ngrok URL in the top bar.\n3. Click 'Connect Colab'!");
      });
    }
  }

  speakBtn.addEventListener("click", synthesizeSpeech);

  // Load sample audio button
  loadGeneratedBtn.addEventListener("click", () => {
    audioElement.src = "../outputs/test_santali.wav";
    audioElement.load();
    trackStatus.textContent = "Loaded local sample: ../outputs/test_santali.wav";
    trackStatus.style.color = "";
    audioElement.play().catch(() => {
      trackStatus.textContent = "Click play on the audio bar to listen.";
    });
  });

  // ── 9. FLN Pedagogy Bank Controller ───────────────────────────────────────

  function initFLNBank() {
    const container = document.getElementById("flnCardsGrid");
    const tabs = document.querySelectorAll(".fln-tab");
    if (!container) return;

    function renderCategory(category = "all") {
      container.innerHTML = "";
      const filtered = category === "all" 
        ? FLN_BANK_DATA 
        : FLN_BANK_DATA.filter(item => item.category === category);

      filtered.forEach((item) => {
        const card = document.createElement("div");
        card.className = "fln-card";
        const tagClass = `tag-${item.category}`;

        card.innerHTML = `
          <div class="fln-card-top">
            <span class="fln-category-tag ${tagClass}">${item.categoryLabel}</span>
            <div class="fln-card-quick-actions">
              <button class="fln-icon-btn fln-copy-btn" title="Copy Ol Chiki text" data-text="${item.ol}">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="fln-hindi-row">${item.hindi}</div>

          <div class="fln-santali-row">
            <div class="fln-olchiki-text">${item.ol}</div>
            <div class="fln-roman-text">Phoneme: ${item.roman}</div>
          </div>

          <div class="fln-meaning-row">
            <span>📖 ${item.meaning}</span>
          </div>

          <div class="fln-card-footer">
            <button class="fln-use-btn" title="Send to Hindi input & translate">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Use in Input
            </button>
            <button class="fln-speak-btn" title="Synthesize & play speech">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <span>🔊 Speak</span>
            </button>
          </div>
        `;

        // Copy Ol Chiki
        const copyBtn = card.querySelector(".fln-copy-btn");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(item.ol);
          copyBtn.textContent = "✓";
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            `;
          }, 1500);
        });

        // Use in Input
        const useBtn = card.querySelector(".fln-use-btn");
        useBtn.addEventListener("click", () => {
          hindiInput.value = item.hindi;
          olChikiOutput.value = item.ol;
          romanOutput.textContent = item.roman;
          hindiInput.scrollIntoView({ behavior: "smooth", block: "center" });
          hindiInput.focus();
        });

        // Speak / Synthesize
        const speakFlnBtn = card.querySelector(".fln-speak-btn");
        speakFlnBtn.addEventListener("click", async () => {
          hindiInput.value = item.hindi;
          olChikiOutput.value = item.ol;
          romanOutput.textContent = item.roman;
          speakFlnBtn.classList.add("playing");
          await synthesizeSpeech();
          speakFlnBtn.classList.remove("playing");
        });

        container.appendChild(card);
      });
    }

    // Filter tabs
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderCategory(tab.dataset.category);
      });
    });

    renderCategory("all");
  }

  // Initialize FLN Bank
  initFLNBank();

  audioElement.addEventListener("ended", () => {
    trackStatus.textContent = "Playback completed.";
    trackStatus.style.color = "";
  });
});
