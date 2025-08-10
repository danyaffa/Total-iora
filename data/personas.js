// FILE: /data/personas.js
// Keep/merge your current data; below is a safe shape with both default + named exports.

export const PATHS = [
  { id: "Muslim",    title: "Muslim"    },
  { id: "Christian", title: "Christian" },
  { id: "Jewish",    title: "Jewish"    },
  { id: "Eastern",   title: "Eastern"   },
  { id: "Universal", title: "Universal" },
];

export const PERSONAS_LIST = PATHS.map(p => p.id);

// If you already have richer persona defs, merge them here:
export const personas = PATHS.reduce((acc, p) => {
  acc[p.id] = { id: p.id, title: p.title };
  return acc;
}, {});

// Default export (so `import PersonasModule from '../../data/personas'` also works)
const PersonasModule = { PATHS, PERSONAS_LIST, personas };
export default PersonasModule;
