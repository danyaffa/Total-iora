export default function VibeMessage({ code, color, reading }) {
  return (
    <div className="p-6 rounded-2xl border shadow-sm bg-white/70">
      <h3 className="text-xl font-semibold">Your AuraCode</h3>
      <p className="mt-1 font-mono">{code} · <span className="italic">{color}</span></p>
      <div className="mt-4 whitespace-pre-wrap leading-7">{reading}</div>
      <p className="mt-4 text-xs text-gray-500">AuraCode is symbolic. Not medical, legal, or financial advice.</p>
    </div>
  );
}
