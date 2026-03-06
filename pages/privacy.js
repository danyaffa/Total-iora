// FILE: /pages/privacy.js
import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="page">
      <Head>
        <title>Privacy Policy | Total-Iora Voice</title>
        <meta
          name="description"
          content="Privacy Policy for Total-Iora Voice. How we protect your data, your voice, and your sacred notes."
        />
      </Head>

      <nav className="topnav">
        <Link href="/" className="logoLink">
          ← Back to Home
        </Link>
      </nav>

      <main className="mainContent">
        <div className="legalCard">
          <h1>Privacy Policy</h1>
          <p className="lastUpdated">
            <strong>Last updated: December 21, 2025</strong>
          </p>

          <p>
            At <strong>Total-Iora Voice</strong>, we view privacy as a sacred trust. 
            This platform is designed to be a sanctuary for your thoughts and reflections. 
            This policy outlines what we collect, what we don't, and how we protect your space.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect the minimum amount of data necessary to provide you with access to the board.
          </p>
          <ul>
            <li><strong>Account Data:</strong> When you register, we collect your username, email address, and phone number to create your unique access key.</li>
            <li><strong>Payment Data:</strong> Payments are processed securely by <strong>PayPal</strong>. We do not store your credit card numbers on our servers; we only retain a record that your subscription is active.</li>
          </ul>

          <h2>2. Sacred Notes & Ephemeral Data</h2>
          <p>
            The <strong>"Sacred Notes"</strong> feature is designed to be ephemeral.
          </p>
          <ul>
            <li><strong>No Server Storage:</strong> Whatever you type into the Sacred Notes section is processed locally in your browser. It is <strong>not</strong> sent to our database or stored on our servers.</li>
            <li><strong>Disappearing Content:</strong> Once you refresh the page or close the tab, these notes are gone forever. This is intentional, ensuring your private reflections remain yours alone.</li>
          </ul>

          <h2>3. Voice & Oracle Data</h2>
          <p>
            When you use the Voice input for the Oracle Board:
          </p>
          <ul>
            <li><strong>Processing:</strong> Your voice input is transmitted securely to our transcription and AI processing providers solely to generate an answer.</li>
            <li><strong>No Training:</strong> We do not use your personal voice recordings or personal questions to train public AI models.</li>
            <li><strong>Retention:</strong> Voice data is retained only for the short duration necessary to process your request and provide the response.</li>
          </ul>

          <h2>4. How We Use Your Information</h2>
          <p>
            We use your contact information strictly for:
          </p>
          <ul>
            <li>Authenticating your login.</li>
            <li>Verifying your subscription status.</li>
            <li>Sending critical service updates (e.g., if the site is down).</li>
          </ul>
          <p><strong>We do not sell your personal data to advertisers or third parties.</strong></p>

          <h2>5. Cookies</h2>
          <p>
            We use secure cookies solely for authentication (to keep you logged in) and to remember your local preferences (like your selected Faith heritage). We do not use invasive tracking cookies.
          </p>

          <h2>6. Security</h2>
          <p>
            We employ industry-standard encryption (SSL/TLS) for all data in transit. Your account is protected by password hashing and secure session management.
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
