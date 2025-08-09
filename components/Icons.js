// Simple inline icons for faith/sacred context
export function StarOfDavid(props){ return (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="currentColor" d="M12 2l3.5 6h7L16 20l-4-6-4 6L1.5 8h7L12 2z"/>
  </svg>
);}
export function Cross(props){ return (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="currentColor" d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6z"/>
  </svg>
);}
export function Crescent(props){ return (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="currentColor" d="M14 2a10 10 0 100 20 9 9 0 01-9-9 9 9 0 019-9z"/>
  </svg>
);}
export function Om(props){ return (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12c2-3 6-3 8 0M10 15c1 1 3 1 4 0" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);}

// MODIFIED: Candle is now multi-colored with a yellow/gold flame.
export function Candle(props){ return (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path fill="#FFD700" d="M11 2c2 2 2 3 0 5-2-2-2-3 0-5z"/>
    <path fill="#B0B0B0" d="M8 9h8v11a2 2 0 01-2 2H10a2 2 0 01-2-2V9z"/>
  </svg>
);}
