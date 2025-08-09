import { useState } from "react";

export default function AuraForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    time: "",
    birthplace: "",
    hand: "right",
    path: "Universal",
    selfWords: "",
    blockArea: "",
    locale: "en"
  });

  function upd(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e)=>{e.preventDefault(); onSubmit(form);}}>
      <input name="name" placeholder="Full name" onChange={upd} className="input" required/>
      <input type="date" name="dob" onChange={upd} className="input" required/>
      <input name="time" placeholder="Birth time (optional)" onChange={upd} className="input"/>
      <input name="birthplace" placeholder="Birthplace (City, Country)" onChange={upd} className="input"/>
      <select name="hand" onChange={upd} className="input">
        <option value="right">Dominant Hand: Right</option>
        <option value="left">Dominant Hand: Left</option>
      </select>
      <select name="path" onChange={upd} className="input">
        <option>Universal</option>
        <option>Jewish</option>
        <option>Christian</option>
        <option>Muslim</option>
        <option>Eastern</option>
      </select>
      <input name="selfWords" placeholder="3 words about you" onChange={upd} className="input md:col-span-2"/>
      <select name="blockArea" onChange={upd} className="input md:col-span-2">
        <option value="">Where do you feel blocked? (optional)</option>
        <option>Love</option>
        <option>Money</option>
        <option>Health</option>
        <option>Purpose</option>
        <option>Confidence</option>
      </select>
      <select name="locale" onChange={upd} className="input">
        <option value="en">English</option>
        <option value="he">Hebrew</option>
        <option value="ar">Arabic</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
      </select>
      <button className="btn md:col-span-2">Reveal My AuraCode</button>
    </form>
  );
}
