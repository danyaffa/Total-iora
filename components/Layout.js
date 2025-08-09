// FILE: /components/AppLayout.js
// Header removed by request. Keeping layout minimal and safe.

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main>{children}</main>
    </div>
  );
}
