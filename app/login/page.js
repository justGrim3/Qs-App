'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push('/dashboard');
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <h1>Dimension Sheet</h1>
        <p className="d">Sign in to your projects</p>
        <form onSubmit={submit}>
          <div><label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label htmlFor="pw">Password</label>
            <input id="pw" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
          {err && <p className="err">{err}</p>}
          <button className="btn g" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="d">No account? <Link href="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}
