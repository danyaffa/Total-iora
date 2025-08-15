# Total-iora

Got it. Here’s a **complete, SEO-ready README** you can drop in as `README.md`. It replaces the tiny placeholder and documents everything we’ve built (Atmosphere picker, faith-specific views, assets, deploy, troubleshooting, etc.), while packing in the keywords and structure that help both GitHub SEO and general search.

---

# Total-iora Voice (AuraCode)

**A sanctuary of reflection — not science, not dogma. A mirror.**
Private voice + text guidance with faith-aware atmospheres (Imam, Priest, Rabbi, Monk) and a calm space for notes.

---

## Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Screens & Atmospheres](#screens--atmospheres)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Quick Start](#quick-start)
* [Environment Variables](#environment-variables)
* [Local Development](#local-development)
* [Production Deploy (Vercel)](#production-deploy-vercel)
* [Content & Assets](#content--assets)
* [Faith Routing & Query Params](#faith-routing--query-params)
* [Accessibility](#accessibility)
* [SEO Checklist](#seo-checklist)
* [Security & Privacy](#security--privacy)
* [Troubleshooting](#troubleshooting)
* [Changelog](#changelog)
* [License](#license)
* [Credits](#credits)
* [Contact](#contact)

---

## Overview

Total-iora Voice (code name **AuraCode**) is a Next.js app for **one-to-one spiritual conversation** and **private sacred notes**. It includes an *Atmosphere Picker* that turns the entire page into the place you want to sit: **Beach, Nature, Library, Sun Rays** and a tradition-specific sacred space (**Mosque / Church / Synagogue / Temple**) depending on the user’s selected heritage.

The app never promises outcomes. Reflections are symbolic and private.

> Prior README summary retained for lineage: quick start + “Sanctuary of reflection” language.&#x20;

---

## Key Features

* **Voice & Text Guidance:** Talk or type; receive grounded answers with optional grammar fix.
* **Atmosphere Picker (faith-aware):**

  * Muslims see: Beach, Nature, Library, Sun Rays, **Mosque**
  * Christians see: Beach, Nature, Library, Sun Rays, **Church**
  * Jewish users see: Beach, Nature, Library, Sun Rays, **Synagogue**
  * Eastern users see: Beach, Nature, Library, Sun Rays, **Temple**
* **Full-page Backgrounds:** High-quality photos (public assets) with subtle overlay for readability.
* **Sacred Notes:** A quiet page to write, pray, or light a candle. Nothing stored on our servers (page is local only).
* **Downloadable Guidance Write-ups:** Export when you’re done (where enabled).
* **Faith Badge Icons:** Muslim crescent, Christian cross, **Jewish Star of David in blue on white**, Eastern icon.
* **Gentle UI:** Rounded CTAs, gradient highlights, accessible contrast.

---

## Screens & Atmospheres

* **Homepage** (`/homepage`) — Logo, “Register — Free Access” CTA, Atmosphere button under the logo, faith icon, sacred tiles, Oracle panel, and a **white rounded footer card** for readability over photos.
* **Sacred Notes** (`/sacred-space`) — Private note area with candle/light UI.
* **Oracle Universe DNA** (`/oracle-universe-dna`) — Personal map & downloadable guidance.

**Atmosphere photos** live in `/public/atmo/*.jpg` (see [Content & Assets](#content--assets)).

---

## Tech Stack

* **Framework:** Next.js 14.x
* **Styling:** Scoped JSX CSS + small global overrides
* **Audio:** Web Speech API (recognition), Speech Synthesis (voice)
* **Auth / Data (optional):** Firebase (Firestore) for Aura Wall notes
* **Payments (optional):** Stripe Checkout Links
* **Hosting:** Vercel (recommended)

---

## Project Structure

```
/components
  AtmospherePicker.js      # Full-page photo + options, faith-filtered
  Footer.js
  HeritageSelector.js
  OracleVoice.js
/pages
  homepage.js              # Main landing with Atmosphere and tiles
  sacred-space.js          # Sacred Notes
  oracle-universe-dna.js   # Guidance flow
/public
  /atmo                    # Atmosphere photos (add your JPGs here)
  TotalIora_Logo.png
/styles
  globals.css              # Small global tokens & overrides
.env.example               # Template for env vars
```

---

## Quick Start

1. **Clone** this repo and install:

   ```bash
   npm install
   ```
2. **Copy env**:

   ```bash
   cp .env.example .env.local
   ```
3. **Fill env vars** (see below).
4. **Add photos** under `/public/atmo/` (see file names in [Content & Assets](#content--assets)).
5. **Run dev**:

   ```bash
   npm run dev
   ```
6. Open **[http://localhost:3000/homepage](http://localhost:3000/homepage)**.

---

## Environment Variables

Create `.env.local` with any of the following you use:

```
OPENAI_API_KEY=sk-...                # if you call the OpenAI API
NEXT_PUBLIC_DEV_BYPASS=0             # set 1 to unlock features locally without login
FAITH_OVERRIDE=                      # optional: force "Muslim"|"Christian"|"Jewish"|"Eastern"|"Universal"
# Firebase (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# Stripe (optional)
NEXT_PUBLIC_STRIPE_MONTHLY_LINK=
NEXT_PUBLIC_STRIPE_LIFETIME_LINK=
```

---

## Local Development

```bash
npm run dev     # Start Next.js in development
npm run build   # Production build
npm start       # Serve production build locally
```

> If you see **“Found lockfile missing swc dependencies”**, just run the dev server once locally; Next.js auto-patches SWC.

---

## Production Deploy (Vercel)

1. Push to GitHub.
2. In Vercel, **Import Project** → connect the repo.
3. Add the **Environment Variables** from `.env.local`.
4. Deploy.

**Build note:** We fixed a prior SWC parse error by removing JSX comments inside attribute lists (see *Troubleshooting*). Current `AtmospherePicker.js` compiles cleanly.

---

## Content & Assets

Place photos in **`/public/atmo/`**. The picker tries candidates in order and uses the first that loads:

* `beach.jpg`
* `nature-meadow.jpg` (or fallback `nature.jpg`)
* `library.jpg`
* `sunrays.jpg`
* `church-vatican.jpg` **or**
  `Interior_view_of_Saint_Peter_s_Basilica_04.jpg`
  `Interior_view_of_Saint_Peter's_Basilica_04.jpg`
* `synagogue-kotel.jpg`
* `mosque-mecca.jpg`
* `temple.jpg`

**Tips**

* Use **wide, high-resolution** images (e.g., 2400×1600+).
* Add concise filenames (no spaces) to avoid URL encoding confusion.
* Provide **alt text** (we add it in markup when used directly).

---

## Faith Routing & Query Params

* The server resolves faith from **`?faith=`**, `x-faith` header, cookie `faith`, or `FAITH_OVERRIDE`.
* Valid values: **Muslim | Christian | Jewish | Eastern | Universal**.
* Example: `/homepage?faith=Jewish` locks UI to **Synagogue** option and shows the **blue Star of David** badge.

---

## Accessibility

* High-contrast pill buttons, focus outlines, large tap targets.
* Buttons are real `<button>` elements with ARIA roles where needed.
* Atmosphere menu is a `role="listbox"` with `aria-selected`.
* Faith icons include `aria-label`s.
* Footers/notes use white cards over photos for readability.

---

## SEO Checklist

This README itself is optimized (keywords in headings, structured sections), but you should also:

1. **Meta tags & Open Graph** – add in `_app.js` or page `<Head>`:

   ```jsx
   import Head from "next/head";
   // in your layout or page:
   <Head>
     <title>Total-iora Voice – Spiritual Guidance & Sacred Notes</title>
     <meta name="description" content="Faith-aware voice guidance (Imam, Priest, Rabbi, Monk) with beautiful atmospheres—Mosque, Church, Synagogue, Temple—plus a private Sacred Notes space." />
     <meta name="keywords" content="Total-iora, spiritual guidance, faith AI, imam, priest, rabbi, monk, mosque, church, synagogue, temple, sacred notes, meditation, oracle" />
     <meta property="og:title" content="Total-iora Voice" />
     <meta property="og:description" content="Speak privately with a guide aligned to your tradition. Choose your atmosphere: Beach, Nature, Library, Sun Rays, or your sacred place." />
     <meta property="og:image" content="https://your-domain.com/og-cover.jpg" />
     <meta property="og:type" content="website" />
     <meta name="twitter:card" content="summary_large_image" />
   </Head>
   ```
2. **Readable copy** on the homepage: we include a white note under the logo with target keywords.
3. **Semantic HTML**: real headings (`<h1>`, `<h2>`) on pages.
4. **Sitemap & robots** (optional):

   ```
   /public/robots.txt
   /public/sitemap.xml
   ```
5. **Alt text** on images; avoid text baked into images.

---

## Security & Privacy

* **No promises**; reflections are symbolic only.
* **Sacred Notes** page: we do not store your writing on our servers.
* Respect user cookies:

  * `faith` — selected tradition
  * `ac_atmo` — chosen atmosphere
  * `ac_dev` — local dev bypass (optional)

---

## Troubleshooting

**Build fails with** `Expected '...', got '}'`

* Cause: JSX comment placed inside an attribute list (e.g., `<button data-key={x} {/* comment */} ...>`).
* Fix: remove the inline comment. Current `AtmospherePicker.js` is clean.

**“Found lockfile missing swc dependencies” on Vercel**

* Run `npm run dev` locally once; Next.js patches SWC. Commit any changes to lockfile.

**Image doesn’t show after renaming**

* Avoid spaces / unusual apostrophes in filenames. We included **three Vatican variants** so at least one resolves. If you still can’t see the image, check Vercel’s static file path casing.

**Buttons looked square/grey**

* Caused by global button styles. We added strong, scoped overrides so the **Atmosphere** trigger and pills are **rounded, larger, and colorful**.

---

## Changelog

* **Aug 2025**

  * Atmosphere button moved under logo; big rounded style.
  * Faith-aware options (Mosque/Church/Synagogue/Temple) with **colorful pills**.
  * Full-page photo backgrounds with white **footer card**.
  * **Jewish** icon updated to **blue Star of David on white**.
  * Readability & accessibility passes.

---

## License

© 2025 Total-iora. All rights reserved.

---

## Credits

* Photography: Use your own or free sources such as **Unsplash**, **Pexels**, **Wikimedia Commons** (check licenses).
* Icons: Emoji + inline SVG for the **Star of David** to guarantee contrast on photo backgrounds.

---

## Contact

Team Total-iora
Email: [support@your-domain.com](mailto:support@your-domain.com)
Issues & feature requests: open a GitHub Issue in this repo.

---

If you want this README to double as your **landing page copy**, we can reuse the SEO sections (title/description) directly in `<Head>` and extract feature bullets to your homepage hero.
