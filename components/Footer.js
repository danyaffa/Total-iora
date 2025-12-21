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
          © {new Date().getFullYear()} Total-iora · A sanctuary of reflection. No promises. Only presence.
        </p>

        <p className="mt-2 text-xs text-slate-500">
          <a href="/terms" className="underline hover:text-slate-700">Terms</a>{" "}
          ·{" "}
          <a href="/privacy" className="underline hover:text-slate-700">Privacy</a>{" "}
          ·{" "}
          <a href="/legal" className="underline hover:text-slate-700">Legal</a>{" "}
          ·{" "}
          <a href="/delete-account" className="underline hover:text-slate-700">Delete Account</a>{" "}
          ·{" "}
          <a href="/contact" className="underline hover:text-slate-700">Contact Us</a>
        </p>
      </div>
    </footer>
  );
}
