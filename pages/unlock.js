// FILE: /pages/unlock.js
import { MONTHLY_LINK, YEARLY_LINK } from "../lib/stripe";

function PricingCard({ title, price, billing, description, link, isFeatured }) {
  const cardClass = isFeatured ? "pricing-card featured" : "pricing-card";
  const buttonClass = isFeatured ? "btn btn-accent" : "btn btn-ghost";

  return (
    <div className={cardClass}>
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="my-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-slate-400">{billing}</span>
      </div>
      <p className="text-sm opacity-80 leading-relaxed">{description}</p>
      <a href={link || "#"} target="_blank" rel="noreferrer" className={buttonClass} style={{marginTop: 16}}>
        Continue
      </a>
    </div>
  );
}

export default function Unlock() {
  return (
    <div className="page-main" style={{paddingTop: 32}}>
      <h1 className="brand-name" style={{textAlign: "center"}}>Upgrade</h1>
      <p className="subhead" style={{textAlign: "center"}}>
        Choose a plan that fits. You can change or cancel anytime.
      </p>

      <div className="info-grid" style={{marginTop: 24}}>
        <PricingCard
          title="Monthly"
          price="$1"
          billing="/mo"
          description="Full access. Billed monthly."
          link={MONTHLY_LINK}
        />
        <PricingCard
          title="Yearly"
          price="$10"
          billing="/yr"
          description="Best value for regular use."
          link={YEARLY_LINK}
          isFeatured={true}
        />
      </div>
    </div>
  );
}
