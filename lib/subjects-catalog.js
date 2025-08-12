// FILE: /lib/subjects-catalog.js
// Central catalog for every subject page: label, description, seed queries, and trusted resources.
// Add/edit items here; /subjects/[slug].js will render them automatically.

export const SUBJECTS = [
  // --- Originals (styles are included for completeness, but pages target "topic:*" slugs) ---
  { slug: "general", label: "General", group: "core", seeds: ["guidance", "meaning of life"], resources: [] },
  { slug: "gentle-guidance", label: "Gentle Guidance", group: "core-style", isStyle: true },
  { slug: "ancient-wisdom", label: "Ancient Wisdom", group: "core-style", isStyle: true },
  { slug: "practical-steps", label: "Practical Steps", group: "core-style", isStyle: true },
  { slug: "comfort-healing", label: "Comfort & Healing", group: "core-style", isStyle: true },

  // --- Core spiritual themes ---
  {
    slug: "prayer", label: "Prayer & Meditation", group: "themes",
    seeds: ["how to pray", "meditation for peace", "psalms for comfort", "quran verses on prayer"],
    resources: [
      { title: "Tanakh @ Sefaria", url: "https://www.sefaria.org/texts/Tanakh" },
      { title: "Qur’an @ quran.com", url: "https://quran.com/" },
      { title: "Bible (KJV) @ Gutenberg", url: "https://www.gutenberg.org/ebooks/10" },
      { title: "Dhammapada @ Gutenberg", url: "https://www.gutenberg.org/ebooks/2017" },
      { title: "Tao Te Ching @ Gutenberg", url: "https://www.gutenberg.org/ebooks/216" }
    ]
  },
  {
    slug: "faith", label: "Faith & Belief", group: "themes",
    seeds: ["strengthen faith", "belief and doubt"],
    resources: [
      { title: "Hebrew Bible search @ Sefaria", url: "https://www.sefaria.org/search" },
      { title: "Qur’an search (English)", url: "https://quran.com/search" },
      { title: "BibleGateway search", url: "https://www.biblegateway.com/quicksearch/" }
    ]
  },
  { slug: "doubt", label: "Spiritual Doubt", group: "themes", seeds: ["when faith is weak", "why suffering?"], resources: [] },
  { slug: "purpose", label: "Purpose & Meaning", group: "themes", seeds: ["what is my purpose", "calling"], resources: [] },
  { slug: "gratitude", label: "Gratitude", group: "themes", seeds: ["gratitude prayers", "psalms of thanks"], resources: [] },
  { slug: "forgiveness", label: "Forgiveness", group: "themes", seeds: ["how to forgive", "mercy"], resources: [] },
  { slug: "hope", label: "Hope & Resilience", group: "themes", seeds: ["hope in hardship", "endurance"], resources: [] },

  // --- Life situations ---
  { slug: "relationships", label: "Relationships & Love", group: "life", seeds: ["love and kindness", "marriage harmony"], resources: [] },
  { slug: "family", label: "Family & Parenting", group: "life", seeds: ["honor parents", "raising children"], resources: [] },
  { slug: "friendship", label: "Friendship", group: "life", seeds: ["true friendship", "loyalty"], resources: [] },
  { slug: "conflict", label: "Conflict Resolution", group: "life", seeds: ["reconciliation", "peace-making"], resources: [] },
  { slug: "loneliness", label: "Loneliness", group: "life", seeds: ["not alone", "divine presence"], resources: [] },
  { slug: "grief", label: "Grief & Loss", group: "life", seeds: ["comfort in grief", "mourning"], resources: [] },
  { slug: "anxiety", label: "Anxiety & Fear", group: "life", seeds: ["do not fear", "calm heart"], resources: [] },
  { slug: "health", label: "Health & Illness", group: "life", seeds: ["healing prayer", "strength"], resources: [] },
  { slug: "addiction", label: "Addictions & Recovery", group: "life", seeds: ["freedom from bondage", "self-control"], resources: [] },

  // --- Work & practical life ---
  { slug: "work", label: "Work & Purpose", group: "work", seeds: ["diligence", "calling at work"], resources: [] },
  { slug: "career", label: "Career Decisions", group: "work", seeds: ["discernment", "wisdom for choices"], resources: [] },
  { slug: "money", label: "Money & Stewardship", group: "work", seeds: ["generosity", "contentment"], resources: [] },
  { slug: "ethics", label: "Ethical Dilemmas", group: "work", seeds: ["justice", "righteous choices"], resources: [] },
  { slug: "decisions", label: "Decision-Making", group: "work", seeds: ["guidance", "choose the good"], resources: [] },
  { slug: "habits", label: "Habits & Discipline", group: "work", seeds: ["self-discipline", "daily practice"], resources: [] },
  { slug: "study", label: "Study & Learning", group: "work", seeds: ["seek wisdom", "knowledge"], resources: [] },
  { slug: "creativity", label: "Creativity", group: "work", seeds: ["inspiration", "gifts and talents"], resources: [] },

  // --- Community & world ---
  { slug: "community", label: "Community & Service", group: "world", seeds: ["serve others", "love neighbor"], resources: [] },
  { slug: "justice", label: "Justice & Compassion", group: "world", seeds: ["defend the weak", "mercy and justice"], resources: [] },
  { slug: "nature", label: "Nature & Environment", group: "world", seeds: ["creation care", "stewardship of earth"], resources: [] },
  { slug: "travel", label: "Travel & Pilgrimage", group: "world", seeds: ["journey mercies", "pilgrim"], resources: [] },
  { slug: "rituals", label: "Rituals & Holidays", group: "world", seeds: ["holy days", "festivals"], resources: [] },

  // --- Life stages ---
  { slug: "youth", label: "Youth & Teens", group: "stages", seeds: ["wisdom for youth"], resources: [] },
  { slug: "marriage", label: "Marriage", group: "stages", seeds: ["marital love", "covenant"], resources: [] },
  { slug: "aging", label: "Elders & Aging", group: "stages", seeds: ["gray hair is a crown", "finishing well"], resources: [] },
  { slug: "endoflife", label: "End of Life", group: "stages", seeds: ["peace at the end", "hope beyond"], resources: [] },

  // --- Special topics ---
  { slug: "dreams", label: "Dreams & Symbols", group: "special", seeds: ["dream interpretation (sacred)"], resources: [] },
  { slug: "scripture", label: "Scripture Study", group: "special", seeds: ["how to read scripture", "best commentaries"], resources: [] },
];

// Helper: quick index by slug
export const SUBJECT_INDEX = Object.fromEntries(SUBJECTS.map(s => [s.slug, s]));
