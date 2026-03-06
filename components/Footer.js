// FILE: /components/Footer.js
export default function Footer() {
  return (
    <footer role="contentinfo" className="footer">
      <div className="inner">
        <p className="copy">
          &copy; {new Date().getFullYear()} Leffler International Investments &middot; Total-iora &middot; A sanctuary of
          reflection. No promises. Only presence.
        </p>
        <nav className="links" aria-label="Footer links">
          <a href="/terms">Terms</a>
          <span className="sep">&middot;</span>
          <a href="/privacy">Privacy</a>
          <span className="sep">&middot;</span>
          <a href="/legal">Legal</a>
          <span className="sep">&middot;</span>
          <a href="/delete-account">Manage Account</a>
          <span className="sep">&middot;</span>
          <a href="/#faq">FAQ</a>
        </nav>
      </div>
      <style jsx>{`
        .footer {
          text-align: center;
          border-top: 1px solid #e2e8f0;
          background: #fff;
          width: 100%;
          margin-top: auto;
        }
        .inner {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .copy {
          font-size: 0.85rem;
          color: #475569;
          margin: 0 0 8px;
          line-height: 1.5;
        }
        .links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px 6px;
          font-size: 0.8rem;
        }
        .links a {
          color: #64748b;
          text-decoration: underline;
          padding: 4px 2px;
        }
        .links a:hover {
          color: #334155;
        }
        .sep {
          color: #cbd5e1;
        }
        @media (max-width: 480px) {
          .copy {
            font-size: 0.8rem;
          }
          .links {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </footer>
  );
}
