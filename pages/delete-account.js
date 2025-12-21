// FILE: /pages/delete-account.js
import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";

export default function DeleteAccountPage() {
  return (
    <div className="page">
      <Head>
        <title>Delete Account | Total-Iora Voice</title>
        <meta
          name="description"
          content="How to delete your Total-Iora account and personal data."
        />
      </Head>

      <nav className="topnav">
        <Link href="/" className="logoLink">← Back to Home</Link>
      </nav>

      <main className="mainContent">
        <div className="legalCard">
          <h1>Delete Account &amp; Personal Data</h1>
          <p className="lastUpdated">
            <strong>Last updated: December 21, 2025</strong>
          </p>

          <h2>Option 1 — Delete by Request (Fastest)</h2>
          <p>
            Send a deletion request via the <strong>Review / Feedback widget</strong> on the home page.
            Include your registered email address and write: <strong>“DELETE MY ACCOUNT”</strong>.
          </p>
          <p>
            Go to: <a className="textLink" href="/#reviews">/ (Review Widget)</a>
          </p>

          <h2>Option 2 — Cancel Payment</h2>
          <p>
            If your goal is to stop payment details saved in Link/Stripe context, use:
          </p>
          <p>
            <a
              className="textLink"
              href="https://support.link.com/how-to-delete-your-saved-payment-information"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://support.link.com/how-to-delete-your-saved-payment-information
            </a>
          </p>

          <h2>What Gets Deleted</h2>
          <ul>
            <li>Account record (email / phone / username) stored in our database.</li>
            <li>Any service access flags (e.g., subscription status markers).</li>
          </ul>

          <p>
            See also: <Link href="/privacy" className="textLink">Privacy</Link> ·{" "}
            <Link href="/terms" className="textLink">Terms</Link> ·{" "}
            <Link href="/legal" className="textLink">Legal</Link>
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(#ffffff, #f8fafc);
          color: #334155;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .topnav {
          padding: 20px;
          text-align: center;
        }
        .logoLink {
          text-decoration: none;
          color: #64748b;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .logoLink:hover {
          color: #0f172a;
          text-decoration: underline;
        }
        .mainContent {
          padding: 20px 16px 60px;
        }
        .legalCard {
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          line-height: 1.7;
        }
        h1 {
          font-size: 2rem;
          margin: 0 0 8px;
          color: #0f172a;
          font-weight: 800;
        }
        .lastUpdated {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-bottom: 30px;
        }
        h2 {
          margin-top: 32px;
          margin-bottom: 12px;
          font-size: 1.25rem;
          color: #0f172a;
          font-weight: 700;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }
        p { margin-bottom: 16px; color: #475569; }
        ul { margin-bottom: 16px; padding-left: 24px; color: #475569; }
        li { margin-bottom: 8px; }
        .textLink { color: #2563eb; text-decoration: underline; }
        .textLink:hover { color: #1d4ed8; }
        @media (max-width: 600px) {
          .legalCard { padding: 24px; }
        }
      `}</style>
    </div>
  );
}
