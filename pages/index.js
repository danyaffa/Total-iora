// FILE: /pages/index.js
// Landing page — Benefits, 14-day free trial, core features, FAQ, SEO optimized.

import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";
import InstallAppButton from "../components/InstallAppButton";
import { useEffect, useRef, useState } from "react";

const FAITH_OPTIONS = [
  { id: "universal", label: "Universal / Open", symbol: "\u2728" },
  { id: "christian", label: "Christian", symbol: "\u271D\uFE0F" },
  { id: "muslim", label: "Muslim", symbol: "\u262A\uFE0F" },
  { id: "buddhist", label: "Buddhist", symbol: "\u2638\uFE0F" },
  { id: "hindu", label: "Hindu", symbol: "\uD83D\uDD49\uFE0F" },
  { id: "jewish", label: "Jewish", symbol: "\u2721\uFE0F" },
  { id: "tao", label: "Taoist", symbol: "\u262F\uFE0F" },
  { id: "spiritual", label: "Spiritual (Non-religious)", symbol: "\uD83C\uDF3F" },
];

const CORE_FEATURES = [
  {
    title: "Voice Guidance",
    desc: "Speak privately with a guide aligned to your tradition. Real-time voice conversations powered by advanced AI.",
    icon: "\uD83C\uDF99\uFE0F",
  },
  {
    title: "Sacred Notes",
    desc: "A private, ephemeral writing space. Light a candle, write your thoughts. Nothing is stored or kept.",
    icon: "\uD83D\uDD6F\uFE0F",
  },
  {
    title: "Oracle Universe DNA",
    desc: "Your personal spiritual map. Ask questions by voice or text, get grounded answers. Download your report.",
    icon: "\uD83E\uDDEC",
  },
  {
    title: "Beautiful Atmospheres",
    desc: "Immerse yourself in serene environments \u2014 Beach, Nature, Library, Temple, Mosque, Church, Synagogue.",
    icon: "\uD83C\uDF05",
  },
  {
    title: "Multi-Faith Support",
    desc: "Guidance aligned to Christianity, Islam, Judaism, Buddhism, Hinduism, Taoism, or Universal spirituality.",
    icon: "\uD83C\uDF0D",
  },
  {
    title: "Private & Secure",
    desc: "Your notes disappear when you leave. Voice data is never stored. We never sell your personal information.",
    icon: "\uD83D\uDD12",
  },
];

const FAQ_DATA = [
  {
    q: "What is Total-iora?",
    a: "Total-iora is a spiritual guidance platform that lets you speak privately with an AI guide aligned to your faith tradition. It includes Sacred Notes (a private writing space), Oracle Universe DNA (personalized spiritual reports), and beautiful immersive atmospheres.",
  },
  {
    q: "How does the 14-day free trial work?",
    a: "When you register, you get full access to all features for 14 days at no cost. After the trial, you can continue with a $5/month subscription via PayPal. If you choose not to subscribe, access pauses until you activate a plan.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Sacred Notes are ephemeral and never stored on our servers. Voice data is only used to process your request and is not retained. We never sell your data to third parties.",
  },
  {
    q: "What faiths are supported?",
    a: "We support Christian, Muslim, Jewish, Buddhist, Hindu, Taoist, Universal, and Spiritual (non-religious) paths. Each path provides guidance aligned to that tradition\u2019s wisdom and texts.",
  },
  {
    q: "How do I cancel or delete my account?",
    a: "You can stop your account and remove all your data directly from the app \u2014 no email required. Go to \u2018Manage Account\u2019 in the footer and follow the prompts. Data removal is automatic and immediate.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept payments via PayPal. Your subscription is $5/month after the 14-day free trial. You can cancel anytime from your PayPal account or from within the app.",
  },
  {
    q: "Can I use Total-iora on my phone?",
    a: "Yes! Total-iora is a Progressive Web App (PWA). You can install it on your phone\u2019s home screen for a native app-like experience on both iOS and Android.",
  },
  {
    q: "Is this real spiritual advice?",
    a: "Total-iora is for entertainment and spiritual reflection only. We do not provide medical, psychological, financial, or legal advice. You are responsible for your own decisions and well-being.",
  },
];

function safeLocalStorageGet(key) {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, val) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, val);
  } catch {
    // ignore
  }
}

export default function IndexPreview() {
  const [faith, setFaith] = useState(FAITH_OPTIONS[0]);
  const [openFaithMenu, setOpenFaithMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");
  const faithMenuRef = useRef(null);

  useEffect(() => {
    const saved = safeLocalStorageGet("totaliora_faith");
    if (!saved) return;
    const found = FAITH_OPTIONS.find((x) => x.id === saved);
    if (found) setFaith(found);
  }, []);

  useEffect(() => {
    safeLocalStorageSet("totaliora_faith", faith.id);
  }, [faith]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!openFaithMenu) return;
      if (faithMenuRef.current && !faithMenuRef.current.contains(e.target)) {
        setOpenFaithMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openFaithMenu]);

  const filteredFaq = faqSearch.trim()
    ? FAQ_DATA.filter(
        (item) =>
          item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
          item.a.toLowerCase().includes(faqSearch.toLowerCase())
      )
    : FAQ_DATA;

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://totaliora.com";

  return (
    <div className="page">
      <Head>
        <title>Total-iora \u2014 Spiritual Guidance, Sacred Notes & Voice Oracle</title>
        <meta
          name="description"
          content="Total-iora: AI-powered spiritual guidance aligned to your faith. Voice oracle, Sacred Notes, and Oracle Universe DNA reports. 14-day free trial. Private, secure, multi-faith."
        />
        <meta
          name="keywords"
          content="Total-iora, spiritual guidance, voice oracle, sacred notes, meditation app, faith AI, imam, priest, rabbi, monk, oracle universe DNA, spiritual reflection, prayer app, multi-faith guidance, Leffler International Investments"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="author" content="Leffler International Investments" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <link rel="canonical" href={siteUrl} />

        {/* Open Graph */}
        <meta property="og:title" content="Total-iora \u2014 Spiritual Guidance & Voice Oracle" />
        <meta
          property="og:description"
          content="AI-powered spiritual guidance aligned to your faith. Voice oracle, Sacred Notes, downloadable reports. 14-day free trial."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Total-iora" />
        <meta property="og:image" content={`${siteUrl}/TotalIora_Logo.png`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Total-iora \u2014 Spiritual Guidance & Voice Oracle" />
        <meta
          name="twitter:description"
          content="AI-powered spiritual guidance aligned to your faith. 14-day free trial."
        />
        <meta name="twitter:image" content={`${siteUrl}/TotalIora_Logo.png`} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Total-iora",
              url: siteUrl,
              description:
                "AI-powered spiritual guidance aligned to your faith tradition. Voice oracle, Sacred Notes, and Oracle Universe DNA reports.",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "14-day free trial, then $5/month",
              },
              provider: {
                "@type": "Organization",
                name: "Leffler International Investments",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_DATA.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })),
            }),
          }}
        />
      </Head>

      {/* ===== HEADER / NAV ===== */}
      <nav className="topnav">
        <div className="navLeft">
          <img src="/TotalIora_Logo.png" alt="Total-iora" className="navLogo" />
          <span className="navBrand">Total-iora</span>
        </div>
        <div className="navRight">
          <Link href="/register" className="navPill primary">
            Start Free Trial
          </Link>
          <Link href="/login" className="navPill secondary">
            Log in
          </Link>
          <InstallAppButton variant="compact" />
        </div>
        {/* Mobile hamburger */}
        <input type="checkbox" id="nav-toggle" className="navCheck" />
        <label htmlFor="nav-toggle" className="navHamburger" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </label>
        <div className="navMobileMenu">
          <Link href="/register" className="navMobileLink primary">Start Free Trial</Link>
          <Link href="/login" className="navMobileLink">Log in</Link>
          <InstallAppButton variant="compact" />
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-iora" className="logo" />

        <h1>Your Private Spiritual Sanctuary</h1>
        <p className="heroSub">
          AI-powered voice guidance aligned to your faith tradition.
          Sacred Notes, Oracle Universe DNA reports, and immersive atmospheres.
        </p>

        {/* Trial badge */}
        <div className="trialBadge">
          <span className="trialIcon">14</span>
          <span>
            <strong>14-Day Free Trial</strong>
            <br />
            <span className="trialSmall">
              Full access to all features. Then $5/month via PayPal. Cancel anytime.
            </span>
          </span>
        </div>

        {/* Faith picker */}
        <div className="pillRow">
          <div className="faithPicker" ref={faithMenuRef}>
            <button
              type="button"
              className="pillButton"
              onClick={() => setOpenFaithMenu((v) => !v)}
            >
              <span className="pillIcon">{faith.symbol}</span>
              <span>Choose your faith</span>
              <span className="pillValue">{faith.label}</span>
              <span className="pillCaret">&#x25BE;</span>
            </button>

            {openFaithMenu && (
              <div className="faithMenu">
                {FAITH_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`faithItem ${opt.id === faith.id ? "active" : ""}`}
                    onClick={() => {
                      setFaith(opt);
                      setOpenFaithMenu(false);
                    }}
                  >
                    <span className="faithSymbol">{opt.symbol}</span>
                    <span className="faithLabel">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="heroCta">
          <Link href="/register" className="ctaBtn primary">
            Start Your Free Trial
          </Link>
          <Link href="/login" className="ctaBtn secondary">
            Log in
          </Link>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="benefits" id="benefits">
        <h2 className="sectionTitle">Why Choose Total-iora?</h2>
        <p className="sectionSub">
          A sanctuary for reflection, guidance, and inner peace \u2014 personalized to your faith.
        </p>
        <div className="benefitsGrid">
          {CORE_FEATURES.map((f, i) => (
            <article className="benefitCard" key={i}>
              <div className="benefitIcon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="howItWorks">
        <h2 className="sectionTitle">How It Works</h2>
        <div className="stepsGrid">
          <div className="step">
            <div className="stepNum">1</div>
            <h3>Register Free</h3>
            <p>Create your account in seconds. Your 14-day free trial starts immediately.</p>
          </div>
          <div className="step">
            <div className="stepNum">2</div>
            <h3>Choose Your Path</h3>
            <p>Select your faith tradition and preferred atmosphere for a personalized experience.</p>
          </div>
          <div className="step">
            <div className="stepNum">3</div>
            <h3>Start Your Journey</h3>
            <p>Speak with your guide, write in Sacred Notes, or generate your Oracle Universe DNA report.</p>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="pricing" id="pricing">
        <h2 className="sectionTitle">Simple, Transparent Pricing</h2>
        <div className="pricingCard">
          <div className="pricingTrialTag">14-Day Free Trial</div>
          <div className="pricingHeader">
            <span className="pricingAmount">$5</span>
            <span className="pricingPeriod">/month</span>
          </div>
          <p className="pricingDesc">Full access to everything. Cancel anytime.</p>
          <ul className="pricingFeatures">
            <li>Unlimited voice guidance sessions</li>
            <li>Sacred Notes &amp; virtual candles</li>
            <li>Oracle Universe DNA reports</li>
            <li>All atmospheres &amp; faith traditions</li>
            <li>Install as app on any device</li>
            <li>Cancel anytime via PayPal</li>
          </ul>
          <Link href="/register" className="ctaBtn primary pricingCta">
            Start Free Trial
          </Link>
          <p className="pricingNote">
            No charge for 14 days. After trial, $5/month via PayPal.
            No commitment \u2014 cancel anytime.
          </p>
        </div>
      </section>

      {/* ===== FEATURE TILES ===== */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pillBadge">Sacred Notes</div>
              <h3>Leave a private note &middot; Light a candle</h3>
              <p>
                Your quiet place. Write, cry, pray, whisper. Light a candle. We
                don{"'"}t read or judge.{" "}
                <strong>Nothing is stored or kept.</strong>
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled">Open Sacred Notes</span>
              <div className="disc">
                This is your space. We have no responsibility for anything you
                write, and nothing is saved on our servers.
              </div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pillBadge">Oracle Universe DNA</div>
              <h3>Your personal map &middot; Downloadable guidance</h3>
              <p>
                Ask questions by typing or voice and get grounded answers.
                (Preview only here.)
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled">
                Get Your Oracle Universe DNA
              </span>
              <div className="disc">
                Spiritual guidance only. No medical, legal, or financial advice.
              </div>
            </footer>
          </article>
        </div>
      </section>

      {/* ===== STATIC MOCK BOARD ===== */}
      <section className="boardPreview">
        <h2 className="sectionTitle">Preview the Oracle Board</h2>
        <div className="board">
          <div className="left">
            <div className="orb" />
            <div className="input">
              <div className="label">You</div>
              <div className="box">
                Type or speak here, then press Get Answer.
              </div>
              <div className="row">
                <span className="btn disabled">Start</span>
                <span className="btn disabled">Get Answer</span>
              </div>
              <div className="row">
                <span className="btn disabled">Source</span>
                <span className="btn disabled">Download</span>
                <span className="btn disabled">Print</span>
              </div>
            </div>
          </div>

          <div className="right">
            <div className="orb orbBlue" />
            <div className="output">
              <div className="label">Guide</div>
              <div className="bubble">&mdash;</div>
              <div className="muted">
                This is a static preview. Register to use the full board.
              </div>
            </div>
          </div>
        </div>

        <p className="hint">
          Preview only. <Link href="/register"><strong>Register free</strong></Link> to unlock the full experience.
        </p>
      </section>

      {/* ===== AI FAQ ===== */}
      <section className="faqSection" id="faq">
        <h2 className="sectionTitle">Frequently Asked Questions</h2>
        <p className="sectionSub">
          Have a question? Search below or browse our answers.
        </p>
        <div className="faqSearch">
          <input
            type="text"
            placeholder="Search questions..."
            value={faqSearch}
            onChange={(e) => {
              setFaqSearch(e.target.value);
              setOpenFaq(null);
            }}
            className="faqSearchInput"
            aria-label="Search FAQ"
          />
        </div>
        <div className="faqList">
          {filteredFaq.length === 0 && (
            <p className="faqEmpty">
              No matching questions found. Try a different search term.
            </p>
          )}
          {filteredFaq.map((item, i) => (
            <div className="faqItem" key={i}>
              <button
                className={`faqQ ${openFaq === i ? "open" : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{item.q}</span>
                <span className="faqArrow">{openFaq === i ? "\u2212" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="faqA">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== DISCLAIMER ===== */}
      <section className="legalDisclaimer">
        <p>
          <strong>Disclaimer:</strong> Total-iora is strictly for{" "}
          <strong>entertainment and spiritual reflection purposes only</strong>.
          We are <strong>not</strong> providing medical, psychological,
          financial, or legal treatments or recommendations. You are solely
          responsible for your own decisions and well-being.
        </p>
        <p className="legalLinkRow">
          By using this site, you agree to our{" "}
          <Link href="/legal" className="legalLink">
            Full Legal Disclaimer & Liability Waiver
          </Link>
          .
        </p>
      </section>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(#ffffff, #f8fafc);
        }

        /* ---- Top nav ---- */
        .topnav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          z-index: 100;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }
        .navLeft {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .navLogo {
          width: 36px;
          height: 36px;
          border-radius: 8px;
        }
        .navBrand {
          font-weight: 800;
          font-size: 1.1rem;
          color: #0f172a;
        }
        .navRight {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .navPill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          color: white;
          border: none;
        }
        .navPill:hover {
          transform: translateY(-1px);
        }
        .navPill.primary {
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }
        .navPill.secondary {
          background: #0f172a;
          color: #fff;
        }

        /* Hamburger (mobile only) */
        .navCheck {
          display: none;
        }
        .navHamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          padding: 6px;
          z-index: 101;
        }
        .navHamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #0f172a;
          border-radius: 2px;
          transition: 0.3s;
        }
        .navMobileMenu {
          display: none;
        }

        @media (max-width: 640px) {
          .navRight {
            display: none;
          }
          .navHamburger {
            display: flex;
          }
          .navMobileMenu {
            display: none;
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 16px;
            flex-direction: column;
            gap: 12px;
            z-index: 99;
            align-items: center;
          }
          .navCheck:checked ~ .navMobileMenu {
            display: flex;
          }
          .navCheck:checked ~ .navHamburger span:nth-child(1) {
            transform: translateY(6px) rotate(45deg);
          }
          .navCheck:checked ~ .navHamburger span:nth-child(2) {
            opacity: 0;
          }
          .navCheck:checked ~ .navHamburger span:nth-child(3) {
            transform: translateY(-6px) rotate(-45deg);
          }
          .navMobileLink {
            display: block;
            padding: 12px 24px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            color: #0f172a;
            background: #f1f5f9;
            text-align: center;
            width: 100%;
            max-width: 280px;
          }
          .navMobileLink.primary {
            background: linear-gradient(135deg, #7c3aed, #14b8a6);
            color: #fff;
          }
        }

        /* ---- Hero ---- */
        .hero {
          text-align: center;
          padding: 40px 16px 32px;
        }
        .logo {
          width: 100px;
          margin: 0 auto;
          display: block;
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(2, 6, 23, 0.12);
        }
        h1 {
          margin: 20px 0 10px;
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .heroSub {
          max-width: 600px;
          margin: 0 auto 20px;
          color: #475569;
          font-size: 1.05rem;
          line-height: 1.6;
        }

        /* Trial badge */
        .trialBadge {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 14px 22px;
          background: linear-gradient(135deg, #ede9fe, #ccfbf1);
          border: 2px solid #7c3aed;
          border-radius: 16px;
          margin-bottom: 20px;
          text-align: left;
        }
        .trialIcon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          font-weight: 900;
          font-size: 1.3rem;
        }
        .trialSmall {
          font-size: 0.85rem;
          color: #64748b;
        }

        .pillRow {
          display: flex;
          justify-content: center;
          margin-top: 10px;
          padding: 0 12px;
        }
        .faithPicker {
          position: relative;
          display: inline-block;
        }
        .pillButton {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.12);
          max-width: 92vw;
          font-size: 14px;
        }
        .pillIcon {
          font-size: 18px;
          line-height: 1;
        }
        .pillValue {
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.22);
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 44vw;
        }
        .pillCaret {
          margin-left: 2px;
          font-weight: 900;
          opacity: 0.9;
        }
        .faithMenu {
          position: absolute;
          top: 52px;
          left: 0;
          right: 0;
          z-index: 50;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.14);
          overflow: hidden;
          min-width: 260px;
        }
        .faithItem {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #fff;
          border: none;
          cursor: pointer;
          text-align: left;
          font-weight: 800;
          color: #0f172a;
          font-size: 14px;
        }
        .faithItem:hover {
          background: #f8fafc;
        }
        .faithItem.active {
          background: #eef2ff;
        }
        .faithSymbol {
          width: 22px;
          display: inline-flex;
          justify-content: center;
        }
        .faithLabel {
          flex: 1;
        }

        .heroCta {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .ctaBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ctaBtn.primary {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
        }
        .ctaBtn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(124, 58, 237, 0.4);
        }
        .ctaBtn.secondary {
          color: #0f172a;
          background: #fff;
          border: 2px solid #e2e8f0;
        }
        .ctaBtn.secondary:hover {
          border-color: #7c3aed;
        }

        /* ---- Section titles ---- */
        .sectionTitle {
          text-align: center;
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
        }
        .sectionSub {
          text-align: center;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto 28px;
          font-size: 0.95rem;
        }

        /* ---- Benefits ---- */
        .benefits {
          max-width: 1100px;
          margin: 0 auto;
          padding: 50px 16px 40px;
        }
        .benefitsGrid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 600px) {
          .benefitsGrid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 900px) {
          .benefitsGrid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .benefitCard {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 4px 16px rgba(2, 6, 23, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .benefitCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.1);
        }
        .benefitIcon {
          font-size: 2rem;
          margin-bottom: 10px;
        }
        .benefitCard h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }
        .benefitCard p {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        /* ---- How it works ---- */
        .howItWorks {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 16px;
        }
        .stepsGrid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 700px) {
          .stepsGrid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .step {
          text-align: center;
          padding: 20px;
        }
        .stepNum {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          font-weight: 900;
          font-size: 1.2rem;
          margin-bottom: 12px;
        }
        .step h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }
        .step p {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        /* ---- Pricing ---- */
        .pricing {
          padding: 40px 16px;
        }
        .pricingCard {
          position: relative;
          max-width: 420px;
          margin: 0 auto;
          background: #fff;
          border: 2px solid #7c3aed;
          border-radius: 24px;
          padding: 36px 28px 28px;
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.12);
          text-align: center;
        }
        .pricingTrialTag {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 20px;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 999px;
          white-space: nowrap;
        }
        .pricingHeader {
          margin-bottom: 4px;
        }
        .pricingAmount {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
        }
        .pricingPeriod {
          font-size: 1.1rem;
          font-weight: 600;
          color: #64748b;
        }
        .pricingDesc {
          color: #475569;
          margin: 4px 0 16px;
        }
        .pricingFeatures {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          text-align: left;
          display: grid;
          gap: 10px;
        }
        .pricingFeatures li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          color: #334155;
          font-weight: 600;
        }
        .pricingFeatures li::before {
          content: "\u2713";
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          min-width: 22px;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .pricingCta {
          width: 100%;
          text-align: center;
        }
        .pricingNote {
          color: #94a3b8;
          font-size: 0.82rem;
          margin-top: 12px;
        }

        /* ---- Tiles ---- */
        .tiles {
          max-width: 1100px;
          margin: 16px auto 6px;
          padding: 0 16px;
        }
        .grid {
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 700px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .card {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
          padding: 18px;
        }
        .pillBadge {
          display: inline-block;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          color: #334155;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .card h3 {
          margin: 8px 0 4px;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }
        .card p {
          color: #475569;
        }
        .f {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        .btn {
          display: inline-block;
          padding: 10px 16px;
          border-radius: 14px;
          font-weight: 800;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: #0f172a;
          text-decoration: none;
          font-size: 14px;
        }
        .btn.accent {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          border: none;
        }
        .btn.disabled {
          opacity: 0.6;
          pointer-events: none;
        }
        .disc {
          color: #64748b;
          font-size: 0.88rem;
        }

        /* ---- Board preview ---- */
        .boardPreview {
          max-width: 1100px;
          margin: 20px auto 14px;
          padding: 0 16px;
        }
        .board {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 700px) {
          .board {
            grid-template-columns: 1fr 1fr;
          }
        }
        .left,
        .right {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .orb {
          width: 80px;
          height: 80px;
          min-width: 80px;
          border-radius: 999px;
          background: radial-gradient(
            40% 40% at 50% 50%,
            rgba(124, 58, 237, 0.18),
            rgba(124, 58, 237, 0)
          );
          border: 1px solid rgba(124, 58, 237, 0.25);
        }
        .orbBlue {
          background: radial-gradient(
            40% 40% at 50% 50%,
            rgba(14, 165, 233, 0.18),
            rgba(14, 165, 233, 0)
          );
          border-color: rgba(14, 165, 233, 0.25);
        }
        .label {
          font-size: 0.86rem;
          color: #64748b;
          margin-bottom: 6px;
        }
        .box {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          min-height: 60px;
          color: #334155;
          font-size: 0.9rem;
        }
        .row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .bubble {
          background: #eef6ff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 10px 12px;
          min-height: 44px;
          color: #0f172a;
        }
        .muted {
          color: #94a3b8;
          font-size: 0.88rem;
          margin-top: 6px;
        }
        .hint {
          text-align: center;
          color: #64748b;
          margin: 8px 0 0;
        }

        /* ---- FAQ ---- */
        .faqSection {
          max-width: 800px;
          margin: 0 auto;
          padding: 50px 16px 40px;
        }
        .faqSearch {
          max-width: 500px;
          margin: 0 auto 20px;
        }
        .faqSearchInput {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .faqSearchInput:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .faqList {
          display: grid;
          gap: 8px;
        }
        .faqItem {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
        }
        .faqQ {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          background: #fff;
          border: none;
          cursor: pointer;
          text-align: left;
          font-weight: 700;
          font-size: 0.95rem;
          color: #0f172a;
          gap: 12px;
        }
        .faqQ:hover {
          background: #f8fafc;
        }
        .faqQ.open {
          background: #f1f5f9;
        }
        .faqArrow {
          font-size: 1.3rem;
          font-weight: 700;
          color: #7c3aed;
          min-width: 20px;
          text-align: center;
        }
        .faqA {
          padding: 0 18px 16px;
          color: #475569;
          font-size: 0.92rem;
          line-height: 1.6;
        }
        .faqEmpty {
          text-align: center;
          color: #94a3b8;
          padding: 20px;
        }

        /* ---- Legal ---- */
        .legalDisclaimer {
          max-width: 900px;
          margin: 30px auto 20px;
          padding: 16px;
          text-align: center;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .legalLinkRow {
          margin-top: 8px;
        }
        .legalLink {
          color: #7c3aed;
          text-decoration: underline;
          font-weight: 700;
        }
        .legalLink:hover {
          color: #5b21b6;
        }

        /* ---- Mobile responsive ---- */
        @media (max-width: 480px) {
          h1 {
            font-size: 1.6rem;
          }
          .heroSub {
            font-size: 0.92rem;
          }
          .logo {
            width: 80px;
          }
          .trialBadge {
            padding: 12px 16px;
            gap: 10px;
          }
          .trialIcon {
            width: 40px;
            height: 40px;
            min-width: 40px;
            font-size: 1.1rem;
          }
          .pillButton {
            gap: 6px;
            padding: 8px 10px;
            font-size: 13px;
          }
          .orb {
            width: 50px;
            height: 50px;
            min-width: 50px;
          }
          .sectionTitle {
            font-size: 1.4rem;
          }
          .faithMenu {
            min-width: unset;
          }
          .pricingCard {
            padding: 28px 18px 20px;
          }
          .pricingAmount {
            font-size: 2.4rem;
          }
        }
      `}</style>
    </div>
  );
}
