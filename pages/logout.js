// FILE: /pages/logout.js
import { useEffect } from "react";

export default function Logout(){
  useEffect(()=>{
    (async ()=>{
      try{ await fetch("/api/logout", { method:"POST" }); }catch{}
      // also clear any client copies just in case
      try{ document.cookie = "ac_session=; Max-Age=0; Path=/"; }catch{}
      window.location.replace("/");
    })();
  },[]);
  return null;
}

