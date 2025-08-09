import { StarOfDavid, Cross, Crescent, Om } from "./Icons";

const OPTIONS = [
  { key:"Muslim",    label:"Muslim",    sub:"Quranic light • Sufi wisdom",  Icon:Crescent,     className:"muslim" },
  { key:"Christian", label:"Christian", sub:"Gospels • Fathers • Saints",   Icon:Cross,        className:"christian" },
  { key:"Eastern",   label:"Eastern",   sub:"Buddhist • Tao • Veda",        Icon:Om,           className:"eastern" },
  { key:"Universal", label:"Universal", sub:"Humanist • Open • Gentle",     Icon:null,         className:"universal" },
  { key:"Jewish",    label:"Jewish",    sub:"Kabbalah • Psalms • Sages",    Icon:StarOfDavid,  className:"jewish" },
];

export default function PathPicker({ value, onChange }){
  return (
    <div className="grid sm:grid-cols-5 gap-3">
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
              {Icon ? <Icon className="icon text-gray-700"/> : <span className="badge">✧</span>}
              <span>{label}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">{sub}</div>
          </button>
        );
      })}
    </div>
  );
}
