// FILE: /components/AppLayout.js
// Safe minimal layout for future use — no Header/Footer.
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main>{children}</main>
    </div>
  );
}
