import { StarOfDavid, Cross, Crescent, Om, Candle } from "./Icons"; // Added Candle

const OPTIONS = [
  { key:"Muslim",    label:"Muslim",    sub:"Quranic light • Sufi wisdom",  Icon:Crescent,     className:"muslim" },
  { key:"Christian", label:"Christian", sub:"Gospels • Fathers • Saints",   Icon:Cross,        className:"christian" },
  { key:"Jewish",    label:"Jewish",    sub:"Kabbalah • Psalms • Sages",    Icon:StarOfDavid,  className:"jewish" },
  { key:"Eastern",   label:"Eastern",   sub:"Buddhist • Tao • Veda",        Icon:Om,           className:"eastern" },
  // MODIFIED: Universal now uses the new Candle icon
  { key:"Universal", label:"Universal", sub:"Humanist • Open • Gentle",     Icon:Candle,       className:"universal" },
];

export default function PathPicker({ value, onChange }){
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {OPTIONS.map(({key,label,sub,Icon,className})=>{
        const active = value===key;
        return (
          <button
            key={key}
            onClick={()=>onChange(key)}
            className={`path-tile ${active?'active':''} ${className}`}
            aria-pressed={active}
            >
            <div className="path-title">
              {/* MODIFIED: Applies specific color class to each icon */}
              {Icon ? <Icon className={`icon path-icon-${className}`}/> : <span className="badge">✧</span>}
              <span>{label}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">{sub}</div>
          </button>
        );
      })}
    </div>
  );
}
