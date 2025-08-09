// FILE: /components/AppLayout.js
// Clean layout – no Header, no Footer.
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main>{children}</main>
    </div>
  );
}
