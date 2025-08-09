import { MONTHLY_LINK, LIFETIME_LINK } from "../lib/stripe";

function PricingCard({ title, price, description, link, isFeatured }) {
  const cardClass = isFeatured
    ? "bg-slate-800 text-white border-slate-800"
    : "bg-white text-slate-800 border-slate-200";
  const buttonClass = isFeatured
    ? "bg-white text-slate-800 hover:bg-slate-200"
    : "bg-slate-800 text-white hover:bg-slate-700";

  return (
    <div className={`p-8 rounded-2xl border shadow-lg w-full text-center ${cardClass}`}>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-4xl font-bold my-4">{price}</p>
      <p className="text-sm mb-6">{description}</p>
      <a className={`btn block w-full ${buttonClass}`} href={link} target="_blank" rel="noreferrer">
        Choose Plan
      </a>
    </div>
  );
}

export default function Unlock(){
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800">Support the Sanctuary</h1>
        <p className="mt-3 text-lg text-slate-500">
          Your first session is always free. Support us to continue your journey and help us hold this space for others.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        <PricingCard 
          title="Monthly Support"
          price="$1"
          description="For unlimited candles and sacred notes. A small gesture to keep the light burning."
          link={MONTHLY_LINK}
        />
        <PricingCard 
          title="Lifetime Access"
          price="$9.99"
          description="A one-time payment for lifetime access to daily voice reflections and all features."
          link={LIFETIME_LINK}
          isFeatured={true}
        />
      </div>
      
      <p className="mt-12 text-center text-sm text-slate-500">
        We don’t sell products. We don’t promise outcomes. We maintain a sanctuary.
      </p>
    </div>
  );
}
