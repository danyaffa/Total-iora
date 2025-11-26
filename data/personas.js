// FILE: /data/personas.js

// Base list of paths
export const PATHS = [
  { id: "Muslim",    title: "Muslim" },
  { id: "Christian", title: "Christian" },
  { id: "Jewish",    title: "Jewish" },
  { id: "Eastern",   title: "Eastern" },
  { id: "Universal", title: "Universal" },
];

// Main personas array used by /guide/[id]
export const PERSONAS = PATHS.map((p) => ({
  id: p.id,
  slug: p.id.toLowerCase(), // e.g. "muslim"
  title: p.title,
  blurb: `Guidance room for ${p.title}-aligned souls.`,
}));

// Simple ID list
export const PERSONAS_LIST = PERSONAS.map((p) => p.id);

// Object map by id
export const personas = PERSONAS.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

// Default export so `import PersonasModule from '../../data/personas'` also works
const PersonasModule = { PATHS, PERSONAS, PERSONAS_LIST, personas };
export default PersonasModule;
