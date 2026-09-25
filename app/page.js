'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const revealRefs = useRef([]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) { router.replace('/dashboard'); return; }
      setChecking(false);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (checking) return;
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealRefs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [checking]);

  if (checking) return <p style={{ padding: 24 }}>Loading…</p>;

  const FEATURES = [
    { t: 'Digital dimension sheet', d: 'Timesing, dimensions and squaring, kept visible the way a checker expects — not just a final number.', i: 'sheet' },
    { t: 'Standard items, in order', d: 'Each work section lists its usual sequence of items, so nothing gets missed on site.', i: 'list' },
    { t: 'Click-measure a drawing', d: 'Import a drawing image, set its scale, and fill length, width or a count straight from your clicks.', i: 'ruler' },
    { t: 'Abstract, automatically', d: 'Matching descriptions collect and total themselves, grouped by section, as you go.', i: 'stack' },
    { t: 'Your rate list', d: 'Price a description once — it\u2019s remembered across every project you open.', i: 'tag' },
    { t: 'Priced BOQ export', d: 'Send a client-ready bill as PDF, or the raw quantities as CSV, in one tap.', i: 'doc' },
  ];
  const ICONS = {
    sheet: <><rect x="6" y="4" width="26" height="34" rx="2" /><path d="M11 12h16M11 18h16M11 24h10" /></>,
    list: <><circle cx="9" cy="10" r="2" /><circle cx="9" cy="19" r="2" /><circle cx="9" cy="28" r="2" /><path d="M15 10h18M15 19h18M15 28h12" /></>,
    ruler: <><rect x="5" y="17" width="30" height="10" rx="1.5" transform="rotate(-18 20 22)" /><path d="M13 15l2 4M18 13l2 4M23 11l2 4" /></>,
    stack: <><path d="M20 5 6 12l14 7 14-7z" /><path d="M6 20l14 7 14-7M6 28l14 7 14-7" /></>,
    tag: <><path d="M6 6h13l15 15-13 13L6 19z" /><circle cx="14" cy="14" r="2.4" /></>,
    doc: <><path d="M9 4h15l7 7v25H9z" /><path d="M24 4v7h7" /><path d="M14 21h12M14 27h12M14 15h6" /></>,
  };

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-navin">
          <span className="lp-brand">Dimension Sheet</span>
          <nav className="lp-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </nav>
          <div className="lp-navcta">
            <Link className="btn o" href="/login">Sign in</Link>
            <Link className="btn g" href="/signup">Sign up free</Link>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-grid" aria-hidden="true"></div>
        <div className="lp-heroin">
          <div className="lp-herotxt">
            <span className="lp-eyebrow">Digital takeoff, the standard way</span>
            <h1>Measure a job<br /><em>the way you were trained,</em><br />just faster.</h1>
            <p>Dimension sheets, standard-item checklists, click-measure drawings and priced bills of quantities — one tool, kept true to how a real takeoff is done and checked.</p>
            <div className="lp-cta">
              <Link className="btn g" href="/signup">Start free</Link>
              <a className="btn o" href="#features">See what's inside</a>
            </div>
          </div>
          <svg className="lp-scene" viewBox="0 0 600 420" aria-hidden="true">
            <g className="lp-drawn lp-d1"><path d="M40 380h520" /></g>
            <g className="lp-drawn lp-d2"><path d="M120 380V140h140V380" /><path d="M120 170h140M120 210h140M120 250h140M120 290h140M120 330h140" /></g>
            <g className="lp-drawn lp-d2">
              {[0, 1, 2, 3, 4].map(r => [0, 1, 2].map(c => (
                <rect key={r + '-' + c} x={135 + c * 42} y={182 + r * 40} width="24" height="20" />
              )))}
            </g>
            <g className="lp-crane">
              <g className="lp-drawn lp-d3"><path d="M430 380V90" /><path d="M405 110h50M405 130h50M405 150h50" /></g>
              <g className="lp-jib">
                <g className="lp-drawn lp-d4"><path d="M430 92h150M430 92 L400 78 L430 92" /></g>
                <g className="lp-drawn lp-d4"><path d="M560 92v14M545 92v10" /></g>
                <g className="lp-hook"><path className="lp-drawn lp-d5" d="M552 106v40" /><circle className="lp-drawn lp-d5" cx="552" cy="150" r="5" /></g>
              </g>
            </g>
            <g className="lp-drawn lp-d6"><path d="M120 400h140M120 396v8M260 396v8" /></g>
            <text className="lp-dimlabel" x="150" y="416">12.400 m</text>
            <g className="lp-pts">
              <circle className="lp-pt" cx="90" cy="380" r="4" /><circle className="lp-ring" cx="90" cy="380" r="4" />
              <circle className="lp-pt" cx="330" cy="380" r="4" /><circle className="lp-ring" cx="330" cy="380" r="4" style={{ animationDelay: '-1s' }} />
              <circle className="lp-pt" cx="480" cy="380" r="4" /><circle className="lp-ring" cx="480" cy="380" r="4" style={{ animationDelay: '-2s' }} />
            </g>
          </svg>
        </div>
      </section>

      <div className="lp-tick" aria-hidden="true"><div>
        {Array(2).fill('Timesing \u2726 Squaring \u2726 Abstracting \u2726 Billing \u2726 Priced BOQ \u2726 Click-to-measure \u2726 ').join('')}
      </div></div>

      <section className="lp-sec">
        <div className="lp-steps3">
          <div className="lp-s3 rv" ref={el => (revealRefs.current[0] = el)}><b>1</b><h3>Take off</h3><p>By hand, from a standard checklist, or by clicking a drawing.</p></div>
          <div className="lp-s3 rv" ref={el => (revealRefs.current[1] = el)}><b>2</b><h3>Abstract</h3><p>Matching items total themselves automatically, section by section.</p></div>
          <div className="lp-s3 rv" ref={el => (revealRefs.current[2] = el)}><b>3</b><h3>Bill</h3><p>Add your rates once, export a priced BOQ or a plain quantities CSV.</p></div>
        </div>
      </section>

      <section id="features" className="lp-sec">
        <h2 className="lp-h2">Everything a takeoff needs</h2>
        <p className="lp-sub">No spreadsheet gymnastics, no separate pricing sheet, no forgetting what comes next.</p>
        <div className="lp-fgrid">
          {FEATURES.map((f, i) => (
            <div className="lp-fcard rv" key={f.t} ref={el => (revealRefs.current[3 + i] = el)}>
              <svg className="lp-ic" viewBox="0 0 40 40" aria-hidden="true">{ICONS[f.i]}</svg>
              <h3>{f.t}</h3><p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="lp-sec lp-glass2">
        <h2 className="lp-h2">Built for the method, not around it</h2>
        <p className="lp-sub" style={{ maxWidth: 640, margin: '0 auto 8px' }}>
          Most takeoff software replaces judgement with automated measurement. This keeps the traditional
          sequence — timesing, dimensions, squaring, abstracting — intact and simply removes the tedious parts:
          retyping totals, re-deriving prices, and remembering what's left to measure.
        </p>
      </section>

      <section className="lp-sec lp-endcta">
        <h2 className="lp-h2" style={{ color: '#fff' }}>Start your first sheet</h2>
        <p className="lp-sub" style={{ color: '#cfc7b6' }}>Free to use. Your own projects, your own rate list, synced to your account.</p>
        <div className="lp-cta" style={{ justifyContent: 'center' }}>
          <Link className="btn g" href="/signup">Create free account</Link>
          <Link className="btn o" href="/login" style={{ borderColor: '#5a5245', color: '#fff' }}>I already have one</Link>
        </div>
      </section>

      <footer className="lp-foot">
        <span>Dimension Sheet</span>
        <nav><a href="#features">Features</a><Link href="/login">Sign in</Link><Link href="/signup">Sign up</Link></nav>
      </footer>
    </div>
  );
}
