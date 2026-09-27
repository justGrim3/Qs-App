'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TIPS } from '../lib/tips';

function randomIndex(exclude) {
  if (TIPS.length < 2) return 0;
  let i = exclude;
  while (i === exclude) i = Math.floor(Math.random() * TIPS.length);
  return i;
}

export default function TipBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const shownOnce = useRef(false);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * TIPS.length));
    if (shownOnce.current) return;
    let already = false;
    try { already = sessionStorage.getItem('qs_tip_shown') === '1'; } catch (e) {}
    if (already) return;
    const t = setTimeout(() => {
      setOpen(true);
      shownOnce.current = true;
      try { sessionStorage.setItem('qs_tip_shown', '1'); } catch (e) {}
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  // Hide on marketing / auth pages
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') return null;

  const tip = TIPS[idx];

  return (
    <div className="tipwrap">
      {open && (
        <div className="tipcard" role="status">
          <div className="tiphead">
            <span className="tipcat">{tip.cat}</span>
            <button className="tipx" onClick={() => setOpen(false)} aria-label="Close tip">✕</button>
          </div>
          <p className="tiptext">{tip.text}</p>
          <button className="tipnext" onClick={() => setIdx(i => randomIndex(i))}>Next tip</button>
        </div>
      )}
      <button className="tipfab" onClick={() => setOpen(o => !o)} aria-label="Tips">💡</button>
    </div>
  );
}
