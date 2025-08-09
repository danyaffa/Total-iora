// lets users choose their spiritual heritage (affects visuals/text)
import { StarOfDavid, Cross, Crescent, Om } from "./Icons";

const OPTIONS = [
  { key:"Jewish",    label:"Jewish",    sub:"Kabbalah, Psalms, Sages",   icon:StarOfDavid },
  { key:"Christian", label:"Christian", sub:"Gospels, Fathers, Saints",  icon:Cross },
  { key:"Muslim",    label:"Muslim",    sub:"Quranic light, Sufi wisdom",icon:Crescent },
  { key:"Eastern",   label:"Eastern",   sub:"Buddhist/Tao/Veda insight", icon:Om },
  { key:"Universal", label:"Universal", sub:"Humanist, agnostic, open",  icon:null },
];

export default function PathPicker({ value, onChange }){
  return (
    <div className="grid sm:grid-cols-5 gap-3">
      {OPTIONS.map(o=>{
        const Active = value===o.key;
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            onClick={()=>onChange(o.key)}
            className={`p-3 rounded-2xl border text-left hover:shadow ${Active?'border-black bg-white':'border-gray-200 bg-white/70'}`}>
            <div className="flex items-center gap-2">
              {Icon ? <Icon className="text-gray-700"/> : <span className="text-lg">✧</span>}
              <div className="font-semibold">{o.label}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{o.sub}</div>
          </button>
        );
      })}
    </div>
  );
}
