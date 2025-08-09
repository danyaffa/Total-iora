import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-white/70 backdrop-blur border-b">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="AuraCode" className="h-8"/>
        <span className="font-bold">AuraCode</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/get-your-aura">Get Your Aura</Link>
        <Link href="/wall">Aura Wall</Link>
        <Link href="/unlock">Support</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
    </header>
  );
}
