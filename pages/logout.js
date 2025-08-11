// FILE: /pages/logout.js
import { useEffect } from "react";

export default function Logout(){
  useEffect(()=>{
    (async ()=>{
      try { await fetch("/api/logout", { method:"POST", credentials:"include" }); } catch {}
      try {
        document.cookie = "ac_session=; Max-Age=0; Path=/; SameSite=Lax;";
        document.cookie = "ac_registered=; Max-Age=0; Path=/; SameSite=Lax;";
      } catch {}
      window.location.replace("/"); // back to photo-only index
    })();
  },[]);
  return null;
}
