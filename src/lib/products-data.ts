export interface Product {
  id: string;
  slug: string;
  title: { ar: string; en: string };
  author: { ar: string; en: string };
  publisher?: { ar: string; en: string };
  description: { ar: string; en: string };
  price: number;
  comparePrice?: number;
  cover: string;
  category: string;
  pages?: number;
  isbn?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: "1", slug: "literature", name: { ar: "أدب وروايات", en: "Literature" }, icon: "📖", count: 248 },
  { id: "2", slug: "history", name: { ar: "تاريخ", en: "History" }, icon: "🏛️", count: 132 },
  { id: "3", slug: "philosophy", name: { ar: "فلسفة", en: "Philosophy" }, icon: "💭", count: 86 },
  { id: "4", slug: "religion", name: { ar: "إسلاميات", en: "Islamic" }, icon: "🕌", count: 174 },
  { id: "5", slug: "children", name: { ar: "أطفال", en: "Children" }, icon: "🧸", count: 95 },
  { id: "6", slug: "self-help", name: { ar: "تنمية ذاتية", en: "Self-help" }, icon: "🌱", count: 112 },
  { id: "7", slug: "science", name: { ar: "علوم", en: "Science" }, icon: "🔬", count: 67 },
  { id: "8", slug: "poetry", name: { ar: "شعر", en: "Poetry" }, icon: "🪶", count: 54 },
];

// Cover gradient palette as data-URL SVG (lightweight, themed)
const cover = (title: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='hsl(${hue},55%,28%)'/>
          <stop offset='1' stop-color='hsl(${hue},65%,15%)'/>
        </linearGradient>
      </defs>
      <rect width='300' height='420' fill='url(#g)'/>
      <rect x='12' y='12' width='276' height='396' fill='none' stroke='hsl(40,55%,65%)' stroke-width='1' opacity='0.5'/>
      <text x='150' y='200' font-family='Cairo, serif' font-size='22' font-weight='700' fill='hsl(40,55%,75%)' text-anchor='middle'>${title}</text>
      <circle cx='150' cy='330' r='28' fill='none' stroke='hsl(40,55%,65%)' stroke-width='1.5'/>
      <text x='150' y='338' font-family='serif' font-size='20' fill='hsl(40,55%,75%)' text-anchor='middle'>المتسولين</text>
    </svg>`,
  )}`;

export const products: Product[] = [
  {
    id: "p1", slug: "men-yawmiyyat-naib", category: "literature",
    title: { ar: "يوميات نائب في الأرياف", en: "Maze of Justice" },
    author: { ar: "توفيق الحكيم", en: "Tawfiq al-Hakim" },
    publisher: { ar: "دار الشروق", en: "Dar al-Shorouk" },
    description: { ar: "رواية كلاسيكية تصف الحياة في الريف المصري وقضايا العدالة.", en: "A classic novel about rural Egyptian life and justice." },
    price: 145, comparePrice: 180, cover: cover("يوميات نائب", 15),
    pages: 220, isbn: "978-977-09-1234-5", rating: 4.7, reviews: 312, inStock: true, isBestseller: true,
  },
  {
    id: "p2", slug: "thulathiyyat-naguib", category: "literature",
    title: { ar: "ثلاثية نجيب محفوظ", en: "The Cairo Trilogy" },
    author: { ar: "نجيب محفوظ", en: "Naguib Mahfouz" },
    publisher: { ar: "دار الشروق", en: "Dar al-Shorouk" },
    description: { ar: "ثلاثية محفوظ الشهيرة: بين القصرين، قصر الشوق، السكرية.", en: "Mahfouz's celebrated trilogy." },
    price: 420, comparePrice: 500, cover: cover("الثلاثية", 22),
    pages: 1500, isbn: "978-977-09-2345-6", rating: 4.9, reviews: 845, inStock: true, isBestseller: true,
  },
  {
    id: "p3", slug: "muqaddimat-ibn-khaldun", category: "history",
    title: { ar: "مقدمة ابن خلدون", en: "Muqaddimah" },
    author: { ar: "ابن خلدون", en: "Ibn Khaldun" },
    publisher: { ar: "دار الكتب العلمية", en: "Dar al-Kutub" },
    description: { ar: "أحد أهم الكتب في علم الاجتماع والتاريخ.", en: "A foundational work in sociology and history." },
    price: 280, cover: cover("المقدمة", 35),
    pages: 720, rating: 4.8, reviews: 521, inStock: true, isBestseller: true,
  },
  {
    id: "p4", slug: "alchemist-ar", category: "literature",
    title: { ar: "الخيميائي", en: "The Alchemist" },
    author: { ar: "باولو كويلو", en: "Paulo Coelho" },
    description: { ar: "رحلة الراعي سانتياغو بحثاً عن أسطورته الشخصية.", en: "Santiago's journey toward his personal legend." },
    price: 120, comparePrice: 150, cover: cover("الخيميائي", 200),
    pages: 180, rating: 4.6, reviews: 1240, inStock: true, isNew: true,
  },
  {
    id: "p5", slug: "tafsir-al-tabari", category: "religion",
    title: { ar: "تفسير الطبري", en: "Tafsir al-Tabari" },
    author: { ar: "الإمام الطبري", en: "Imam al-Tabari" },
    description: { ar: "من أعظم كتب التفسير في التراث الإسلامي.", en: "One of the greatest works of Quranic exegesis." },
    price: 650, cover: cover("تفسير الطبري", 145),
    pages: 2400, rating: 4.9, reviews: 287, inStock: true,
  },
  {
    id: "p6", slug: "kafka-on-the-shore", category: "literature",
    title: { ar: "كافكا على الشاطئ", en: "Kafka on the Shore" },
    author: { ar: "هاروكي موراكامي", en: "Haruki Murakami" },
    description: { ar: "رواية فلسفية ساحرة من اليابان.", en: "A philosophical, dreamlike novel from Japan." },
    price: 220, comparePrice: 260, cover: cover("كافكا", 250),
    pages: 480, rating: 4.5, reviews: 678, inStock: true, isNew: true,
  },
  {
    id: "p7", slug: "atomic-habits-ar", category: "self-help",
    title: { ar: "العادات الذرية", en: "Atomic Habits" },
    author: { ar: "جيمس كلير", en: "James Clear" },
    description: { ar: "دليل عملي لبناء عادات جيدة والتخلص من السيئة.", en: "A proven framework for habits." },
    price: 175, comparePrice: 220, cover: cover("العادات الذرية", 130),
    pages: 320, rating: 4.8, reviews: 2150, inStock: true, isBestseller: true, isNew: true,
  },
  {
    id: "p8", slug: "diwan-al-mutanabbi", category: "poetry",
    title: { ar: "ديوان المتنبي", en: "Diwan al-Mutanabbi" },
    author: { ar: "أبو الطيب المتنبي", en: "al-Mutanabbi" },
    description: { ar: "ديوان أعظم شعراء العربية.", en: "The complete poetry of al-Mutanabbi." },
    price: 195, cover: cover("ديوان المتنبي", 50),
    pages: 560, rating: 4.9, reviews: 412, inStock: true,
  },
  {
    id: "p9", slug: "sapiens-ar", category: "history",
    title: { ar: "العاقل: تاريخ مختصر للبشرية", en: "Sapiens" },
    author: { ar: "يوفال نوح هراري", en: "Yuval Noah Harari" },
    description: { ar: "نظرة شاملة على تاريخ الجنس البشري.", en: "A brief history of humankind." },
    price: 260, comparePrice: 320, cover: cover("العاقل", 195),
    pages: 512, rating: 4.7, reviews: 1890, inStock: true, isBestseller: true,
  },
  {
    id: "p10", slug: "little-prince-ar", category: "children",
    title: { ar: "الأمير الصغير", en: "The Little Prince" },
    author: { ar: "أنطوان دو سانت إكزوبيري", en: "Saint-Exupéry" },
    description: { ar: "حكاية خالدة للصغار والكبار.", en: "A timeless tale." },
    price: 95, cover: cover("الأمير الصغير", 220),
    pages: 96, rating: 4.9, reviews: 980, inStock: true, isNew: true,
  },
  {
    id: "p11", slug: "thus-spoke-zarathustra", category: "philosophy",
    title: { ar: "هكذا تكلم زرادشت", en: "Thus Spoke Zarathustra" },
    author: { ar: "فريدريك نيتشه", en: "Friedrich Nietzsche" },
    description: { ar: "تحفة نيتشه الفلسفية الشعرية.", en: "Nietzsche's philosophical masterpiece." },
    price: 185, cover: cover("زرادشت", 280),
    pages: 380, rating: 4.6, reviews: 524, inStock: false,
  },
  {
    id: "p12", slug: "brief-history-time", category: "science",
    title: { ar: "تاريخ موجز للزمن", en: "A Brief History of Time" },
    author: { ar: "ستيفن هوكينج", en: "Stephen Hawking" },
    description: { ar: "رحلة في فهم الكون من الانفجار الكبير إلى الثقوب السوداء.", en: "From the Big Bang to black holes." },
    price: 210, comparePrice: 250, cover: cover("تاريخ موجز للزمن", 230),
    pages: 256, rating: 4.7, reviews: 712, inStock: true, isNew: true,
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getBestsellers = () => products.filter((p) => p.isBestseller);
export const getNewArrivals = () => products.filter((p) => p.isNew);
export const getByCategory = (slug: string) => products.filter((p) => p.category === slug);
