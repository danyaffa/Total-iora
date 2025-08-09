export default function Footer() {
  return (
    <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} AuraCode · A sanctuary of reflection. No promises. Only presence.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Use of this site constitutes acceptance of our <a href="/terms" className="underline hover:text-slate-600">Terms</a> and <a href="/privacy" className="underline hover:text-slate-600">Privacy Policy</a>.
        </p>
      </div>
    </footer>
  );
}
