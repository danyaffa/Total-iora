import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-white/80 backdrop-blur border-b">
      <Link href="/" className="flex items-center gap-2">
        {/* MODIFIED: Logo is larger */}
        <img src="/logo.png" alt="AuraCode" className="h-10"/>
        <span className="font-bold">AuraCode</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/get-your-aura">Begin</Link>
        <Link href="/sacred-space">Sacred Notes</Link>
        <Link href="/unlock">Support</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
    </header>
  );
}
