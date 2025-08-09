import { MONTHLY_LINK, YEARLY_LINK } from "../lib/stripe"; // Assuming you have a YEARLY_LINK now

function PricingCard({ title, price, billing, description, link, isFeatured }) {
  const cardClass = isFeatured
    ? "bg-slate-800 text-white border-slate-800"
    : "bg-white text-slate-800 border-slate-200";
  const buttonClass = isFeatured
    ? "bg-white text-slate-800 hover:bg-slate-200"
    : "bg-slate-800 text-white hover:bg-slate-700";

  return (
    <div className={`p-8 rounded-2xl border shadow-lg w-full max-w-sm text-center ${cardClass}`}>
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="my-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-slate-400">{billing}</span>
      </div>
      <p className="text-sm mb-6 h-12">{description}</p>
      <a className={`btn block w-full ${buttonClass}`} href={link} target="_blank" rel="noreferrer">
        Choose Plan
      </a>
    </div>
  );
}

export default function Unlock() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800">Support the Sanctuary</h1>
        <p className="mt-3 text-lg text-slate-500">
          Your first session is free. Register to save your progress and unlock more features.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        <PricingCard
          title="Monthly"
          price="$1"
          billing="/mo"
          description="Continue your journey with unlimited sessions, notes, and candles."
          link={MONTHLY_LINK}
        />
        <PricingCard
          title="Yearly"
          price="$10"
          billing="/yr"
          description="Our best value. Get a full year of unlimited access and support our mission."
          link={YEARLY_LINK} // Changed from LIFETIME_LINK
          isFeatured={true}
        />
      </div>
    </div>
  );
}
