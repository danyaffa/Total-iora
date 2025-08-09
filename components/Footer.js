// FILE: /components/Footer.js
export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{ textAlign: "center" }}
      className="mt-auto w-full border-t border-slate-200 bg-white"
    >
      <div className="mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()} AuraCode · A sanctuary of reflection. No promises. Only presence.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Use of this site constitutes acceptance of our{" "}
          <a href="/terms" className="underline hover:text-slate-700">Terms</a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-slate-700">Privacy Policy</a>.
        </p>
      </div>
    </footer>
  );
}
