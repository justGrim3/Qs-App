'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { findLesson, allLessonSlugs } from '../../../lib/lessons';
import { loadProgress, saveProgress } from '../../../lib/progress';

function rand(min, max, dp = 1) {
  const v = Math.random() * (max - min) + min;
  return Math.round(v * 10 ** dp) / 10 ** dp;
}

function genSquaring() {
  const units = ['m', 'm²', 'm³', 'nr'];
  const unit = units[Math.floor(Math.random() * units.length)];
  const t = Math.floor(rand(1, 4, 0));
  const l = rand(0.8, 9.5);
  const w = rand(0.8, 9.5);
  const h = rand(0.8, 4.5);
  let correct, given;
  if (unit === 'nr') { correct = t; given = { t }; }
  else if (unit === 'm') { correct = t * l; given = { t, l }; }
  else if (unit === 'm²') { correct = t * l * w; given = { t, l, w }; }
  else { correct = t * l * w * h; given = { t, l, w, h }; }
  return { unit, given, correct: Math.round(correct * 1000) / 1000 };
}

function genAbstract() {
  const items = [
    { ds: 'Excavate foundation trench', un: 'm³' },
    { ds: 'Blinding', un: 'm²' },
    { ds: 'Mass concrete foundation', un: 'm³' },
  ];
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const it = items[Math.floor(Math.random() * items.length)];
    rows.push({ ...it, q: rand(0.4, 8) });
  }
  const target = items[Math.floor(Math.random() * items.length)];
  const correct = rows.filter(r => r.ds === target.ds).reduce((s, r) => s + r.q, 0);
  return { rows, target, correct: Math.round(correct * 1000) / 1000 };
}

function genScale() {
  const scale = [20, 50, 100, 200][Math.floor(Math.random() * 4)];
  const mm = Math.floor(rand(10, 150, 0));
  const correct = Math.round(((mm * scale) / 1000) * 1000) / 1000;
  return { scale, mm, correct };
}

function Practice({ type }) {
  const [data, setData] = useState(null);
  const [ans, setAns] = useState('');
  const [result, setResult] = useState(null);

  function reroll() {
    setAns(''); setResult(null);
    if (type === 'squaring') setData(genSquaring());
    else if (type === 'abstract') setData(genAbstract());
    else if (type === 'scale') setData(genScale());
  }
  useEffect(() => { reroll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  if (!data) return null;

  function check(e) {
    e.preventDefault();
    const v = parseFloat(ans);
    if (isNaN(v)) return;
    const ok = Math.abs(v - data.correct) <= Math.max(0.02, data.correct * 0.01);
    setResult(ok ? 'right' : 'wrong');
  }

  return (
    <div className="practice">
      <h3>Practice</h3>
      {type === 'squaring' && (
        <>
          <p className="d">Work out the squaring for this row:</p>
          <div className="pgiven">
            {data.given.t !== undefined && <span>Timesing: <b>{data.given.t}</b></span>}
            {data.given.l !== undefined && <span>Length: <b>{data.given.l} m</b></span>}
            {data.given.w !== undefined && <span>Width: <b>{data.given.w} m</b></span>}
            {data.given.h !== undefined && <span>Height: <b>{data.given.h} m</b></span>}
          </div>
          <p className="d">Unit: <b>{data.unit}</b></p>
        </>
      )}
      {type === 'abstract' && (
        <>
          <p className="d">These dimension-sheet rows need abstracting. What is the total for <b>"{data.target.ds}"</b> ({data.target.un})?</p>
          <div className="pgiven pgrid">
            {data.rows.map((r, i) => <span key={i}>{r.ds} — {r.q.toFixed(2)} {r.un}</span>)}
          </div>
        </>
      )}
      {type === 'scale' && (
        <p className="d">A drawing is at 1:{data.scale}. You measure a line as <b>{data.mm} mm</b> on the paper. What is the real length, in metres?</p>
      )}
      <form onSubmit={check} className="pform">
        <input type="number" step="any" value={ans} onChange={e => setAns(e.target.value)} placeholder="Your answer" />
        <button className="btn g" type="submit">Check</button>
        <button className="btn o" type="button" onClick={reroll}>New numbers</button>
      </form>
      {result === 'right' && <p className="pok">Correct — {data.correct}.</p>}
      {result === 'wrong' && <p className="pbad">Not quite — the answer is {data.correct}.</p>}
    </div>
  );
}

export default function LessonPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [done, setDone] = useState([]);
  const [userId, setUserId] = useState(null);
  const found = findLesson(slug);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { router.replace('/login'); return; }
      const p = await loadProgress();
      setDone(p.done); setUserId(p.userId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!found) return <div className="wrap"><p className="err">Lesson not found.</p><Link className="btn o" href="/learn">Back to Learn</Link></div>;
  const { module: mod, lesson } = found;
  const order = allLessonSlugs();
  const pos = order.indexOf(slug);
  const prev = pos > 0 ? order[pos - 1] : null;
  const next = pos < order.length - 1 ? order[pos + 1] : null;
  const isDone = done.includes(slug);

  async function markDone() {
    if (!userId) return;
    await saveProgress(userId, slug, {});
    setDone(d => Array.from(new Set([...d, slug])));
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div className="topbar">
        <div><p className="d" style={{ margin: '0 0 2px' }}>{mod.title}</p><h1>{lesson.title}</h1></div>
        <Link className="btn o" href="/learn">All lessons</Link>
      </div>

      <div className="card entry">
        {lesson.body.map((p, i) => <p key={i} style={{ lineHeight: 1.65, marginBottom: 14 }}>{p}</p>)}
        {lesson.practice && <Practice type={lesson.practice.type} />}
      </div>

      <div className="actions" style={{ marginTop: 16 }}>
        <button className="btn g" onClick={markDone} disabled={isDone}>{isDone ? 'Completed ✓' : 'Mark complete'}</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {prev && <button className="btn o" onClick={() => router.push(`/learn/${prev}`)}>Previous</button>}
          {next && <button className="btn o" onClick={() => router.push(`/learn/${next}`)}>Next</button>}
        </div>
      </div>
    </div>
  );
}
