export default function Footer() {
  return (
    <footer className="w-full py-10 text-center text-xs text-gray-500">
      <p>© {new Date().getFullYear()} AuraCode · A sanctuary of reflection. No promises. Only presence.</p>
      <p className="mt-2">Use of this site constitutes acceptance of our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</p>
    </footer>
  );
}
