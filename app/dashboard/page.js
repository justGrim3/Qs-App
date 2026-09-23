'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const router = useRouter();

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

  async function load() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  }

  async function createProject(e) {
    e.preventDefault();
    setErr('');
    if (!name.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('projects')
      .insert({ name: name.trim(), created_by: userData.user.id })
      .select().single();
    if (error) { setErr(error.message); return; }
    router.push(`/projects/${data.id}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="wrap">
      <div className="topbar">
        <div><h1>Dimension Sheet</h1><p className="d" style={{ margin: '2px 0 0' }}>Digital takeoff, the standard way</p></div>
        <button className="btn o" onClick={signOut}>Sign out</button>
      </div>
      <div className="hcols">
        <div className="hcard">
          <h2>Your projects</h2>
          <div className="plist">
            {projects.length === 0 && <p className="d">No projects yet — create your first one.</p>}
            {projects.map(p => (
              <div key={p.id} className="pitem" onClick={() => router.push(`/projects/${p.id}`)}>{p.name}</div>
            ))}
          </div>
        </div>
        <div className="hcard">
          <h2>Create a new project</h2>
          <p className="d">Give it a name — a job number or site name works well.</p>
          <form onSubmit={createProject} className="newp">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 14 Marina Road" />
            <button className="btn g" type="submit">Create</button>
          </form>
          {err && <p className="err">{err}</p>}
        </div>
      </div>
    </div>
  );
}
