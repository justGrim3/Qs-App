'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [dimCount, setDimCount] = useState(0);
  const [rates, setRates] = useState([]);
  const [rn, setRn] = useState(''); const [ru, setRu] = useState('m³'); const [rr, setRr] = useState('');
  const router = useRouter();
  const revealRefs = useRef([]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) { router.replace('/login'); return; }
      load();
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revealRefs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [loading, projects]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const { data: pData, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error) setProjects(pData || []);
    const { count } = await supabase.from('dimension_rows').select('id', { count: 'exact', head: true });
    setDimCount(count || 0);
    const { data: rData } = await supabase.from('rates').select('*').eq('owner', userData.user.id).order('description');
    setRates(rData || []);
    setLoading(false);
  }

  async function createProject(e) {
    e.preventDefault();
    setErr('');
    if (!name.trim()) return;
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setErr('Not signed in according to the browser: ' + (userErr?.message || 'no user object'));
      return;
    }
    const { data, error } = await supabase.from('projects')
      .insert({ name: name.trim(), created_by: userData.user.id })
      .select().single();
    if (error) {
      setErr(
        'code: ' + error.code +
        ' | message: ' + error.message +
        (error.details ? ' | details: ' + error.details : '') +
        (error.hint ? ' | hint: ' + error.hint : '') +
        ' | signed in as uid: ' + userData.user.id
      );
      return;
    }
    const { error: memErr } = await supabase.from('project_members')
      .insert({ project_id: data.id, user_id: userData.user.id, role: 'owner' });
    if (memErr) { setErr('project_members error: ' + memErr.message); return; }
    router.push(`/projects/${data.id}`);
  }

  async function addRate(e) {
    e.preventDefault();
    if (!rn.trim() || !rr) return;
    const { data: userData } = await supabase.auth.getUser();
    const rate = parseFloat(rr) || 0;
    await supabase.from('rates').upsert({ owner: userData.user.id, description: rn.trim(), unit: ru, rate });
    setRates(r => {
      const i = r.findIndex(x => x.description === rn.trim() && x.unit === ru);
      const row = { owner: userData.user.id, description: rn.trim(), unit: ru, rate };
      if (i > -1) { const c = [...r]; c[i] = row; return c; }
      return [...r, row].sort((a, b) => a.description.localeCompare(b.description));
    });
    setRn(''); setRr('');
  }

  async function updateRate(row, value) {
    const rate = parseFloat(value) || 0;
    setRates(rs => rs.map(r => (r.description === row.description && r.unit === row.unit ? { ...r, rate } : r)));
    await supabase.from('rates').upsert({ owner: row.owner, description: row.description, unit: row.unit, rate });
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  const filtered = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="ghero">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="inner wrap" style={{ padding: '0 0 0' }}>
          <div className="topbar" style={{ marginBottom: 0 }}>
            <div><h1>Dimension Sheet</h1><p className="d" style={{ margin: '2px 0 0' }}>Digital takeoff, the standard way</p></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a className="btn o" href="/profile">Profile</a>
              <button className="btn o" onClick={signOut}>Sign out</button>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 0 }}>
        <div className="stats">
          <div className="stat glass rv" ref={el => (revealRefs.current[0] = el)}><b>{projects.length}</b><span>Projects</span></div>
          <div className="stat glass rv" ref={el => (revealRefs.current[1] = el)}><b>{dimCount}</b><span>Dimensions logged</span></div>
          <div className="stat glass rv" ref={el => (revealRefs.current[2] = el)}><b>{rates.length}</b><span>Rates saved</span></div>
        </div>

        <div className="hcols">
          <div className="hcard glass rv" ref={el => (revealRefs.current[3] = el)}>
            <h2>Your projects</h2>
            {projects.length > 3 && (
              <input className="search" placeholder="Search projects…" value={q} onChange={e => setQ(e.target.value)} />
            )}
            <div className="plist">
              {projects.length === 0 && <p className="d">No projects yet — create your first one.</p>}
              {projects.length > 0 && filtered.length === 0 && <p className="d">No projects match "{q}".</p>}
              {filtered.map(p => (
                <div key={p.id} className="pitem" onClick={() => router.push(`/projects/${p.id}`)}>{p.name}</div>
              ))}
            </div>
          </div>
          <div className="hcard glass rv" ref={el => (revealRefs.current[4] = el)}>
            <h2>Create a new project</h2>
            <p className="d">Give it a name — a job number or site name works well.</p>
            <form onSubmit={createProject} className="newp">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 14 Marina Road" />
              <button className="btn g" type="submit">Create</button>
            </form>
            {err && <p className="err" style={{ wordBreak: 'break-word' }}>{err}</p>}
          </div>
        </div>

        <details className="hcard glass rv" style={{ marginTop: 16 }} ref={el => (revealRefs.current[5] = el)}>
          <summary className="rsum"><span>Your rate list</span></summary>
          <p className="d" style={{ marginTop: 8 }}>Prices you've set once, reused automatically in every project's abstract.</p>
          <div className="ratelist">
            {rates.length === 0 && <p className="d" style={{ margin: 0 }}>No rates saved yet — add one below, or set one from inside a project.</p>}
            {rates.map(r => (
              <div className="raterow" key={r.description + '|' + r.unit}>
                <span>{r.description}</span><span>{r.unit}</span>
                <input type="number" step="0.01" value={r.rate || ''} onChange={e => updateRate(r, e.target.value)} />
              </div>
            ))}
          </div>
          <form onSubmit={addRate} className="newrate">
            <input value={rn} onChange={e => setRn(e.target.value)} placeholder="Description, e.g. Blinding" />
            <select value={ru} onChange={e => setRu(e.target.value)}>
              {['m³', 'm²', 'm', 'nr', 'kg', 'item'].map(u => <option key={u}>{u}</option>)}
            </select>
            <input type="number" step="0.01" value={rr} onChange={e => setRr(e.target.value)} placeholder="Rate" />
            <button className="btn g" type="submit">Add</button>
          </form>
        </details>
      </div>
    </div>
  );
}
