'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (data.session) { router.push('/dashboard'); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="authWrap"><div className="authCard">
        <h1>Check your email</h1>
        <p className="d">We sent a confirmation link to {email}. Click it, then come back and sign in.</p>
        <Link className="btn g" href="/login">Go to sign in</Link>
      </div></div>
    );
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <h1>Create your account</h1>
        <p className="d">Free — just you and your projects</p>
        <form onSubmit={submit}>
          <div><label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label htmlFor="pw">Password</label>
            <input id="pw" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
          {err && <p className="err">{err}</p>}
          <button className="btn g" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        </form>
        <p className="d">Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
