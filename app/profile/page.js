'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [nameMsg, setNameMsg] = useState('');
  const [email, setEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) { router.replace('/login'); return; }
      setUser(data.user);
      setName(data.user.user_metadata?.full_name || '');
      setEmail(data.user.email || '');
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveName(e) {
    e.preventDefault();
    setNameMsg('');
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setNameMsg(error ? error.message : 'Saved.');
  }

  async function saveEmail(e) {
    e.preventDefault();
    setEmailMsg('');
    if (!email.trim() || email === user.email) return;
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setEmailMsg(error ? error.message : 'Check both your old and new inbox for a confirmation link.');
  }

  async function savePw(e) {
    e.preventDefault();
    setPwMsg('');
    if (pw.length < 6) { setPwMsg('Use at least 6 characters.'); return; }
    if (pw !== pw2) { setPwMsg('Passwords don\u2019t match.'); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwMsg(error ? error.message : 'Password updated.');
    if (!error) { setPw(''); setPw2(''); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <div className="topbar">
        <div><h1>Profile</h1><p className="d" style={{ margin: '2px 0 0' }}>Your account details</p></div>
        <Link className="btn o" href="/dashboard">Back to projects</Link>
      </div>

      <div className="card entry" style={{ marginBottom: 16 }}>
        <h2>Display name</h2>
        <p className="d">Shown around the app instead of your email.</p>
        <form onSubmit={saveName}>
          <label htmlFor="nm">Name</label>
          <input id="nm" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <div className="actions">
            <button className="btn g" type="submit">Save name</button>
            {nameMsg && <span className="d" style={{ margin: 0 }}>{nameMsg}</span>}
          </div>
        </form>
      </div>

      <div className="card entry" style={{ marginBottom: 16 }}>
        <h2>Email</h2>
        <p className="d">Signed in as <b>{user.email}</b></p>
        <form onSubmit={saveEmail}>
          <label htmlFor="em">New email</label>
          <input id="em" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="actions">
            <button className="btn g" type="submit">Update email</button>
            {emailMsg && <span className="d" style={{ margin: 0 }}>{emailMsg}</span>}
          </div>
        </form>
      </div>

      <div className="card entry" style={{ marginBottom: 16 }}>
        <h2>Password</h2>
        <form onSubmit={savePw}>
          <label htmlFor="p1">New password</label>
          <input id="p1" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          <label htmlFor="p2" style={{ marginTop: 8 }}>Confirm new password</label>
          <input id="p2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} />
          <div className="actions">
            <button className="btn g" type="submit">Update password</button>
            {pwMsg && <span className="d" style={{ margin: 0 }}>{pwMsg}</span>}
          </div>
        </form>
      </div>

      <div className="card entry">
        <h2>Account</h2>
        <p className="d">Member since {new Date(user.created_at).toLocaleDateString()}</p>
        <button className="btn o" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
