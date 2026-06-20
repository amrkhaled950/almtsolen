// Picks a fitting emoji icon based on category name keywords (Arabic + English).
const RULES: Array<{ icon: string; re: RegExp }> = [
  { icon: "🧠", re: /(نفس|psych)/i },
  { icon: "🕌", re: /(اسلام|إسلام|دين|قرآن|قران|islam|relig)/i },
  { icon: "📜", re: /(تاريخ|histor)/i },
  { icon: "📖", re: /(رواي|قصص|novel|fiction|stor)/i },
  { icon: "🪶", re: /(شعر|أدب|ادب|poet|liter)/i },
  { icon: "💡", re: /(فلسف|philos|فكر|thought)/i },
  { icon: "💼", re: /(إدار|ادار|تسويق|أعمال|اعمال|market|business|manage)/i },
  { icon: "💰", re: /(اقتصاد|مال|econom|finance|money)/i },
  { icon: "🔬", re: /(علوم|علم(?!\s*نفس)|science)/i },
  { icon: "💻", re: /(تقني|تكنولوج|برمج|كمبيوتر|tech|program|comput|code)/i },
  { icon: "🧮", re: /(رياضي|math)/i },
  { icon: "🩺", re: /(طب|صح|medic|health)/i },
  { icon: "🍳", re: /(طبخ|طعام|cook|food)/i },
  { icon: "✈️", re: /(سفر|رحل|travel)/i },
  { icon: "🎨", re: /(فن|art|design)/i },
  { icon: "🎵", re: /(موسيق|music)/i },
  { icon: "⚽", re: /(رياض(ة|ي)|sport)/i },
  { icon: "🧒", re: /(أطفال|اطفال|child|kid)/i },
  { icon: "🎓", re: /(تعليم|دراس|مدرس|جامع|educat|study|school|academ)/i },
  { icon: "🌱", re: /(تنمي|ذات|نجاح|self|growth|develop|motiv)/i },
  { icon: "❤️", re: /(حب|عاطف|روم|love|roman)/i },
  { icon: "⚖️", re: /(قانون|سياس|law|polit)/i },
  { icon: "🗺️", re: /(جغراف|أطلس|اطلس|geo|atlas|map)/i },
  { icon: "🏆", re: /(مبيع|الأكثر|الاكثر|best|top)/i },
  { icon: "✨", re: /(جديد|أحدث|احدث|new|latest)/i },
  { icon: "📚", re: /(كل|all)/i },
];

export function pickCategoryIcon(...names: Array<string | null | undefined>): string {
  const hay = names.filter(Boolean).join(" ");
  for (const r of RULES) if (r.re.test(hay)) return r.icon;
  return "📚";
}
