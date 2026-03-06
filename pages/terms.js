// FILE: /pages/terms.js
import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="page">
      <Head>
        <title>Terms of Use | Total-Iora Voice</title>
        <meta
          name="description"
          content="Terms of Use for Total-Iora Voice – Spiritual reflection, Sacred Notes, and Oracle guidance."
        />
      </Head>

      <nav className="topnav">
        <Link href="/" className="logoLink">
          ← Back to Home
        </Link>
      </nav>

      <main className="mainContent">
        <div className="legalCard">
          <h1>Terms of Use</h1>
          <p className="lastUpdated">
            <strong>Last updated: December 21, 2025</strong>
          </p>

          <p>
            Welcome to <strong>Total-Iora Voice</strong> ("the Platform", "we", "us", "our"). 
            By accessing or using our services, including Sacred Notes and Oracle Universe DNA, 
            you agree to these Terms of Use. If you do not agree, you must stop using the Platform immediately.
          </p>

          <h2>1. Service Description</h2>
          <p>
            Total-Iora provides digital tools for spiritual contemplation, symbolic reflection, 
            and personal sanctuary. Our features include "Sacred Notes" (a temporary writing space) 
            and "Oracle Universe DNA" (symbolic guidance). These services are intended solely 
            for <strong>personal reflection and entertainment purposes</strong>.
          </p>

          <h2>2. Disclaimer: Entertainment Only</h2>
          <p>
            The insights, answers, and guidance provided by Total-Iora are symbolic in nature.
          </p>
          <ul>
            <li><strong>No Professional Advice:</strong> We do not provide medical, legal, financial, or psychological advice.</li>
            <li><strong>No Guarantees:</strong> We do not guarantee specific outcomes, predictions of the future, or contact with external entities.</li>
            <li><strong>Personal Responsibility:</strong> Any decisions you make based on content from Total-Iora are your sole responsibility.</li>
          </ul>

          <h2>3. Sacred Notes & Privacy</h2>
          <p>
            The "Sacred Notes" feature is designed as a private, ephemeral space. 
            <strong>We do not store your notes on our servers.</strong> Once you leave the page or refresh, 
            the text is gone. Total-Iora is not responsible for any data loss regarding these temporary notes.
          </p>

          <h2>4. Pricing & Subscriptions</h2>
          <p>
            Access to the active board requires a valid subscription (currently US$9/month). 
          </p>
          <ul>
            <li>Prices and features are subject to change.</li>
            <li>Payments are processed securely via PayPal.</li>
            <li>Subscriptions typically auto-renew unless cancelled.</li>
            <li>Refunds are not provided for partial months unless required by applicable law.</li>
          </ul>

          <h2>5. User Responsibilities</h2>
          <ul>
            <li>You must be at least 18 years of age to use this Platform.</li>
            <li>You agree not to use the Platform for any illegal or harmful purpose.</li>
            <li>You understand that the "Oracle" responses are generated for contemplation, not as factual directives.</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            All content, branding, logos (Total-Iora), and software code are the property of Total-Iora. 
            You may not copy, reverse-engineer, or resell our services.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We strive for high uptime, but we do not guarantee uninterrupted access. 
            Downtime may occur due to maintenance, technical failures, or third-party outages.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Total-Iora is not liable for any indirect, 
            incidental, or consequential damages arising from your use of the Platform or reliance on its content.
          </p>

          <h2>9. Termination</h2>
          <h3>Termination by Us</h3>
          <p>
            We may suspend or terminate your access if you violate these Terms or abuse the service.
          </p>

          <h3>Termination by You</h3>
          <p>
            Subject to any product-specific terms, you may terminate any
            Consumer Service at any time by closing or deleting your account.
            Instructions are available at:
          </p>
          <p>
            <a
              href="https://support.link.com/how-to-delete-your-saved-payment-information"
              target="_blank"
              rel="noopener noreferrer"
              className="textLink"
            >
              https://support.link.com/how-to-delete-your-saved-payment-information
            </a>
          </p>
          <p>
            Termination is effective on the date your account is closed.
          </p>

          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the Platform constitutes
            acceptance of the updated Terms.
          </p>

          <div className="copyrightBox">
            <p>&copy; {new Date().getFullYear()} Leffler International Investments. All rights reserved.</p>
          </div>
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

        h3 {
          margin-top: 20px;
          font-size: 1.1rem;
          color: #334155;
          font-weight: 700;
        }

        p {
          margin-bottom: 16px;
          color: #475569;
        }

        ul {
          margin-bottom: 16px;
          padding-left: 24px;
          color: #475569;
        }

        li {
          margin-bottom: 8px;
        }

        .textLink {
          color: #2563eb;
          text-decoration: underline;
          word-break: break-all;
        }
        .textLink:hover {
          color: #1d4ed8;
        }

        .copyrightBox {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .copyrightBox p {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .legalCard {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}
