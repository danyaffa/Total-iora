export default function Index() {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"#fff"}}>
      <div style={{display:"flex",justifyContent:"center",gap:12,padding:14}}>
        <a href="/register" className="btn">Register — Free Access</a>
        <a href="/login" className="btn">Log in</a>
      </div>

      <p style={{textAlign:"center",color:"#475569",fontWeight:600,margin:"0 12px 8px"}}>
        Register (free) to protect your privacy — only you can access your notes and questions.
      </p>

      {/* Full screenshot of the REAL homepage */}
      <img
        src="/homepage-preview.jpg"
        alt="Preview of your private homepage after sign-in"
        style={{display:"block",width:"100%",height:"100%",objectFit:"contain",flex:1}}
      />

      <style jsx>{`.btn{padding:10px 16px;border-radius:14px;font-weight:800;border:1px solid rgba(15,23,42,.12);background:#fff}`}</style>
    </div>
  );
}

