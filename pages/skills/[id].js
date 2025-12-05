// FILE: /pages/skills/[id].js
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import OracleVoice from "../../components/OracleVoice";

const META = {
  muslim:     { id: "Muslim",     title: "Life Skills with Islam...q, Qur’an & hadith, and Sufi practice applied to daily life." },
  christian:  { id: "Christian",  title: "Life Skills with Chris...Gospels, Fathers, and the saints—habits of virtue and mercy." },
  jewish:     { id: "Jewish",     title: "Life Skills with Ramba...on character (Hilchot De’ot), Mussar, and practical halacha." },
  eastern:    { id: "Eastern",    title: "Life Skills with Easte..., Taoist balance, and Vedic disciplines for everyday living." },
  universal:  { id: "Universal",  title: "Life Skills (Universal... open, and gentle—clarity, compassion, and simple practices." },
};


export default function SkillsRoom() {
  const { query } = useRouter();
  const slug = Array.isArray(query.id) ? query.id[0] : query.id || "universal";
  const meta = META[slug] || META.universal;

  return (
    <div className="room">
      <header className="head">
        <div className="badge">Life Skills</div>
        <h1>{meta.title}</h1>
        <p className="blurb">{meta.blurb}</p>
      </header>

      {/* Same component, different mode */}
      <OracleVoice path={meta.id} mode="skills" />

      <Footer />

      <style jsx>{`
        .room { min-height:100vh; background:linear-gradient(#fff,#f8fafc); }
        .head { text-align:center; padding:18px 12px 6px; }
        .badge { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h1 { margin:8px 0 6px; font-size:1.8rem; font-weight:800; color:#0f172a; }
        .blurb { color:#475569; max-width:760px; margin:0 auto; }
      `}</style>
    </div>
  );
}
