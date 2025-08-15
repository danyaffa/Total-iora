function FaithIcon({ faith }) {
  if (faith === "Muslim") {
    return (
      <svg className="faith-icon gold" viewBox="0 0 52 52" aria-label="Muslim Crescent">
        <path d="M32 2 C18.7 2 8 12.7 8 26 C8 39.3 18.7 50 32 50 C33.7 50 35.4 49.8 37 49.5 C26.5 47.5 19 37.9 19 26 C19 14.1 26.5 4.5 37 2.5 C35.4 2.2 33.7 2 32 2Z" />
      </svg>
    );
  }
  if (faith === "Christian") {
    return (
      <svg className="faith-icon gold" viewBox="0 0 64 64" aria-label="Christian Cross">
        <path d="M28 8h8v16h12v8H36v24h-8V32H16v-8h12z" />
      </svg>
    );
  }
  if (faith === "Jewish") {
    // Blue Star of David (outline) on a white rounded square background
    return (
      <svg
        className="faith-icon jewish"
        viewBox="0 0 128 128"
        aria-label="Star of David"
      >
        <rect x="0" y="0" width="128" height="128" rx="16" fill="#ffffff" />
        <polygon
          points="64,12 12,108 116,108"
          fill="none"
          stroke="#0037FF"
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <polygon
          points="64,116 12,20 116,20"
          fill="none"
          stroke="#0037FF"
          strokeWidth="18"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}
