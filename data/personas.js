// FILE: /data/personas.js
export const PERSONAS = {
  muslim:     { id: "Muslim",     title: "Kadhi",  blurb: "Qur’anic light and Sufi wisdom, offered with gentleness." },
  christian:  { id: "Christian",  title: "Priest", blurb: "Gospels, Church Fathers, and the witness of the saints." },
  jewish:     { id: "Jewish",     title: "Rabbi",  blurb: "Torah, Psalms, sages and a heart inclined to hesed." },
  eastern:    { id: "Eastern",    title: "Monk",   blurb: "Buddhist, Tao, and Vedic streams held in quiet attention." },
  universal:  { id: "Universal",  title: "Sage",   blurb: "Humanist, open, and gentle—presence over promises." },
};

export function resolvePersona(slug = "universal") {
  return PERSONAS[slug] || PERSONAS["universal"];
}
