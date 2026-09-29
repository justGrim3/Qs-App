'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { MODULES, allLessonSlugs } from '../../lib/lessons';
import { loadProgress } from '../../lib/progress';

export default function LearnIndex() {
  const router = useRouter();
  const [done, setDone] = useState([]);
  const [data, setData] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { router.replace('/login'); return; }
      const p = await loadProgress();
      setDone(p.done); setData(p.data); setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slugs = allLessonSlugs();
  const doneLessons = done.filter(s => slugs.includes(s));
  const total = slugs.length;
  const pct = total ? Math.round((doneLessons.length / total) * 100) : 0;

  if (!ready) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="wrap">
      <div className="topbar">
        <div><h1>Learn takeoff</h1><p className="d" style={{ margin: '2px 0 0' }}>Short lessons, hands-on practice, and a quiz for each module.</p></div>
        <a className="btn o" href="/dashboard">Back to projects</a>
      </div>

      <div className="card entry" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--mu)', marginBottom: 6 }}>
          <span>Your progress</span><span>{doneLessons.length} / {total} lessons</span>
        </div>
        <div className="lprog"><div className="lprogbar" style={{ width: pct + '%' }} /></div>
      </div>

      {MODULES.map(mod => {
        const qslug = 'quiz-' + mod.slug;
        const score = data[qslug];
        return (
          <div className="card entry" key={mod.slug} style={{ marginBottom: 16 }}>
            <h2>{mod.title}</h2>
            <div className="llist">
              {mod.lessons.map(l => (
                <Link className="lrow" key={l.slug} href={`/learn/${l.slug}`}>
                  <span className={'ltick' + (done.includes(l.slug) ? ' done' : '')}>{done.includes(l.slug) ? '✓' : ''}</span>
                  <span>{l.title}</span>
                  {l.practice && <span className="lbadge">practice</span>}
                </Link>
              ))}
              {mod.quiz && (
                <Link className="lrow lquiz" href={`/learn/quiz/${mod.slug}`}>
                  <span className={'ltick' + (score ? ' done' : '')}>{score ? '✓' : '?'}</span>
                  <span>Module quiz</span>
                  <span className="lbadge">{score ? `${score.score}/${score.total}` : `${mod.quiz.length} questions`}</span>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
