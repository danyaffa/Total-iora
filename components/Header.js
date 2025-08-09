import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white/70 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <img src="/AuraCode_Logo.png" alt="AuraCode Logo" className="h-9 w-auto" />
            <span className="font-bold text-slate-800 text-lg tracking-wide">AuraCode</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-slate-600">
            <Link href="/get-your-aura" className="hover:text-slate-900 transition-colors">Begin</Link>
            <Link href="/sacred-space" className="hover:text-slate-900 transition-colors">Sacred Notes</Link>
            <Link href="/unlock" className="bg-slate-800 text-white px-4 py-2 rounded-full hover:bg-slate-700 transition-colors">
              Support
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
