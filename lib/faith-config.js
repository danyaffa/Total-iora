// canonical names: "Muslim" | "Christian" | "Jewish" | "Eastern" | "Universal"
export const DOMAIN_TO_FAITH = {
  "totaliora.com": "Christian",
  "www.totaliora.com": "Christian",
  "totaliora-muslim.com": "Muslim",
  "www.totaliora-muslim.com": "Muslim",
  "totaliora-jewish.com": "Jewish",
  "www.totaliora-jewish.com": "Jewish",
};

export const DEFAULT_FAITH = "Universal";
export const VALID_FAITHS = new Set(["Muslim","Christian","Jewish","Eastern","Universal"]);
