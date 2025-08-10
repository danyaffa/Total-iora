// FILE: /pages/auth/action.js
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebaseClient";
import { applyActionCode, checkActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

export default function AuthAction() {
  const [msg, setMsg] = useState("Working…");
  const [mode, setMode] = useState(null);
  const [oobCode, setOobCode] = useState(null);
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    const usp = new URLSearchParams(window.location.search);
    const m = usp.get("mode");
    const code = usp.get("oobCode");
    setMode(m);
    setOobCode(code);

    (async () => {
      try {
        if (m === "verifyEmail" && code) {
          await applyActionCode(auth, code);
          setMsg("Your email has been verified. You can close this tab.");
        } else if (m === "resetPassword" && code) {
          const info = await verifyPasswordResetCode(auth, code);
          setEmail(info);
          setMsg("");
        } else {
          setMsg("Invalid or expired link.");
        }
      } catch (e) {
        setMsg(e?.message || "There was a problem with the link.");
      }
    })();
  }, []);

  async function doReset(e) {
    e.preventDefault();
    try {
      await confirmPasswordReset(auth, oobCode, newPw);
      setMsg("Password has been reset. You may close this tab.");
    } catch (e) {
      setMsg(e?.message || "Could not reset password.");
    }
  }

  if (mode === "resetPassword" && email && !msg) {
    return (
      <div style={{maxWidth: 420, margin: "40px auto", padding: 16}}>
        <h1>Reset password</h1>
        <p>Email: <b>{email}</b></p>
        <form onSubmit={doReset}>
          <input
            type="password"
            placeholder="New password (min 8)"
            minLength={8}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #e2e8f0"}}
          />
          <button type="submit" style={{marginTop:12, padding:"10px 14px", borderRadius:12, background:"#111827", color:"#fff"}}>
            Set new password
          </button>
        </form>
      </div>
    );
  }

  return <div style={{maxWidth: 520, margin: "40px auto", padding:16}}><p>{msg}</p></div>;
}
