import { MONTHLY_LINK, LIFETIME_LINK } from "../lib/stripe";

export default function Unlock(){
  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold">Support AuraCode</h2>
      <p className="mt-2 text-gray-600">
        AuraCode is free because we believe in giving light first. If you wish to support, choose a gentle option below. Thank you.
      </p>
      <div className="mt-6 grid gap-4">
        <a className="btn" href={MONTHLY_LINK} target="_blank" rel="noreferrer">$1 / month – Unlimited candles & notes</a>
        <a className="btn" href={LIFETIME_LINK} target="_blank" rel="noreferrer">$9.99 lifetime – Daily voice reflections</a>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        We don’t sell products. We don’t promise outcomes. We maintain a sanctuary.
      </p>
    </div>
  );
}
