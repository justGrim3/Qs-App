'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { DEFAULT_SECTIONS, TEMPLATES } from '../../../lib/templates';

function fmtDim(vals) {
  return vals && vals.length ? vals.map(v => Number(v).toFixed(3)).join(' × ') : '—';
}
function money(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [rows, setRows] = useState([]);
  const [rates, setRates] = useState({});
  const [err, setErr] = useState('');

  const [tm, setTm] = useState(1);
  const [l, setL] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [un, setUn] = useState('m³');
  const [ds, setDs] = useState('');
  const [sec, setSec] = useState('');
  const [nsec, setNsec] = useState('');
  const [dw, setDw] = useState('');
  const [tsec, setTsec] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { router.replace('/login'); return; }
      const { data: proj, error: pErr } = await supabase.from('projects').select('*').eq('id', id).single();
      if (pErr || !proj) { setErr('Project not found, or you don\u2019t have access to it.'); setLoading(false); return; }
      const { data: userData } = await supabase.auth.getUser();
      const { data: rowData } = await supabase.from('dimension_rows').select('*').eq('project_id', id).order('created_at');
      const { data: rateData } = await supabase.from('rates').select('*').eq('owner', userData.user.id);
      if (!active) return;
      setProject(proj);
      setSections(proj.sections && proj.sections.length ? proj.sections : DEFAULT_SECTIONS);
      setSec((proj.sections && proj.sections[0]) || DEFAULT_SECTIONS[0]);
      setTsec((proj.sections && proj.sections[0]) || DEFAULT_SECTIONS[0]);
      setRows(rowData || []);
      const rMap = {};
      (rateData || []).forEach(r => { rMap[r.description + '|' + r.unit] = r.rate; });
      setRates(rMap);
      setLoading(false);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function nums() {
    const t = parseFloat(tm) || 1;
    const vals = [l, w, h].map(parseFloat).filter(v => v > 0 && !isNaN(v));
    let p = t; vals.forEach(v => { p *= v; });
    return { t, vals, p: vals.length ? p : 0 };
  }
  const preview = nums();

  async function persistSections(next) {
    setSections(next);
    await supabase.from('projects').update({ sections: next }).eq('id', id);
  }

  async function addRow(e) {
    e.preventDefault();
    const n = nums();
    if (!n.p) return;
    const description = ds.trim() || '(no description)';
    let section = nsec.trim() || sec;
    if (nsec.trim() && !sections.includes(section)) {
      await persistSections([...sections, section]);
    }
    const payload = {
      project_id: id, section, timesing: n.t, dims: n.vals, squaring: n.p,
      description, unit: un, drawing_ref: dw.trim() || null
    };
    const { data, error } = await supabase.from('dimension_rows').insert(payload).select().single();
    if (error) { setErr(error.message); return; }
    setRows(r => [...r, data]);
    setL(''); setW(''); setH(''); setDs(''); setNsec(''); setTm(1);
  }

  async function removeRow(rowId) {
    await supabase.from('dimension_rows').delete().eq('id', rowId);
    setRows(r => r.filter(x => x.id !== rowId));
  }

  async function editRow(row) {
    const nd = prompt('Description:', row.description);
    if (nd === null) return;
    const ns = prompt('Section:', row.section);
    if (ns === null) return;
    const patch = { description: nd.trim() || row.description, section: ns.trim() || row.section };
    if (patch.section && !sections.includes(patch.section)) await persistSections([...sections, patch.section]);
    await supabase.from('dimension_rows').update(patch).eq('id', row.id);
    setRows(rs => rs.map(r => (r.id === row.id ? { ...r, ...patch } : r)));
  }

  async function setRate(key, value) {
    setRates(r => ({ ...r, [key]: value }));
    const [description, unit] = key.split('|');
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('rates').upsert({ owner: userData.user.id, description, unit, rate: value });
  }

  function groups() {
    const g = {};
    rows.forEach(r => {
      g[r.section] = g[r.section] || {};
      const k = r.description + '|' + r.unit;
      g[r.section][k] = g[r.section][k] || { ds: r.description, un: r.unit, q: 0 };
      g[r.section][k].q += Number(r.squaring);
    });
    return g;
  }

  function exportCsv() {
    const g = groups();
    const lines = [['Section', 'Description', 'Unit', 'Quantity'].join(',')];
    Object.keys(g).forEach(section => {
      Object.values(g[section]).forEach(it => {
        lines.push([section, '"' + it.ds.replace(/"/g, '""') + '"', it.un, it.q.toFixed(2)].join(','));
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (project?.name || 'project') + '-boq.csv';
    a.click();
  }

  function exportPdf() {
    const g = groups();
    let grand = 0, rowsHtml = '';
    Object.keys(g).forEach(section => {
      const items = Object.values(g[section]);
      if (!items.length) return;
      rowsHtml += `<tr class="s"><td colspan="4">${section}</td></tr>`;
      items.forEach(it => {
        const rate = rates[it.ds + '|' + it.un] || 0;
        const amt = it.q * rate; grand += amt;
        rowsHtml += `<tr><td>${it.ds}</td><td class="n">${it.q.toFixed(2)} ${it.un}</td><td class="n">${money(rate)}</td><td class="n">${money(amt)}</td></tr>`;
      });
    });
    const el = document.getElementById('pboq');
    el.innerHTML = `<h1>${project?.name || ''}</h1><p>Bill of quantities — ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>Description</th><th class="n">Quantity</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead>
      <tbody>${rowsHtml}<tr class="g"><td colspan="3">Estimated total</td><td class="n">${money(grand)}</td></tr></tbody></table>`;
    document.body.classList.add('print-boq');
    window.print();
    setTimeout(() => document.body.classList.remove('print-boq'), 300);
  }

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (err) return <div className="wrap"><p className="err">{err}</p><a className="btn o" href="/dashboard">Back to projects</a></div>;

  const g = groups();
  let grand = 0;
  const templateList = TEMPLATES[tsec];
  const doneDs = new Set(rows.filter(r => r.section === tsec).map(r => r.description.toLowerCase()));

  return (
    <div className="wrap">
      <div className="topbar">
        <div><h1>{project.name}</h1><p className="d" style={{ margin: '2px 0 0' }}>Digital takeoff, the standard way</p></div>
        <a className="btn o" href="/dashboard">All projects</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 18 }} className="projGrid">
        <div>
          <div className="card">
            <div className="entry">
              <h2>Add dimension</h2>
              <p className="d">Fill in and add — or pick a standard item below to prefill it.</p>
              <form onSubmit={addRow}>
                <div className="frow">
                  <div><label>Timesing</label><input type="number" min="1" step="1" value={tm} onChange={e => setTm(e.target.value)} /></div>
                  <div><label>Length (m)</label><input type="number" step="0.001" value={l} onChange={e => setL(e.target.value)} /></div>
                  <div><label>Width (m)</label><input type="number" step="0.001" value={w} onChange={e => setW(e.target.value)} /></div>
                  <div><label>Height (m)</label><input type="number" step="0.001" value={h} onChange={e => setH(e.target.value)} /></div>
                  <div><label>Unit</label>
                    <select value={un} onChange={e => setUn(e.target.value)}>
                      {['m³', 'm²', 'm', 'nr', 'kg', 'item'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div><label>Description</label><input type="text" value={ds} onChange={e => setDs(e.target.value)} placeholder="e.g. Excavate foundation trench" /></div>
                </div>
                <div className="frow" style={{ marginTop: 10 }}>
                  <div style={{ gridColumn: '1/3' }}><label>Section</label>
                    <select value={sec} onChange={e => setSec(e.target.value)}>
                      {sections.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '3/5' }}><label>Or new section</label><input type="text" value={nsec} onChange={e => setNsec(e.target.value)} placeholder="New section name" /></div>
                  <div style={{ gridColumn: '5/7' }}><label>Drawing ref.</label><input type="text" value={dw} onChange={e => setDw(e.target.value)} placeholder="e.g. A-101 rev C" /></div>
                </div>
                <div className="actions">
                  <button className="btn g" type="submit">Add to sheet</button>
                  <span className="res">Squaring = <b>{preview.p.toFixed(3)}</b></span>
                </div>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="entry" style={{ paddingBottom: 10 }}>
              <h2>Standard items</h2>
              <p className="d">The usual sequence for a section. Tap one to load it above.</p>
              <select value={tsec} onChange={e => setTsec(e.target.value)} style={{ marginBottom: 10 }}>
                {sections.map(s => <option key={s}>{s}</option>)}
              </select>
              <div className="tlist">
                {!templateList && <p className="d" style={{ margin: 0 }}>No standard list for this section yet.</p>}
                {templateList && templateList.map((it, i) => {
                  const done = doneDs.has(it[0].toLowerCase());
                  return (
                    <div key={it[0]} className={'trow' + (done ? ' done' : '')} onClick={() => { setDs(it[0]); setUn(it[1]); setSec(tsec); }}>
                      <span className="n">{i + 1}</span><span className="tick">{done ? '✓' : ''}</span>
                      <span className="t">{it[0]}</span><span className="u">{it[1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="sheet">
              <table>
                <thead><tr><th style={{ width: 60 }}>Timesing</th><th style={{ width: 150 }}>Dimensions</th><th style={{ width: 90 }}>Squaring</th><th>Description</th><th style={{ width: 70 }}>Unit</th><th style={{ width: 60 }}></th></tr></thead>
                <tbody>
                  {sections.map(section => {
                    const rs = rows.filter(r => r.section === section);
                    if (!rs.length) return null;
                    return (
                      <tbody key={section}>
                        <tr className="sec-h"><td colSpan={6}>{section}</td></tr>
                        {rs.map(r => (
                          <tr key={r.id}>
                            <td className="tm">{r.timesing > 1 ? r.timesing + '/' : '—'}</td>
                            <td className="dm">{fmtDim(r.dims)}</td>
                            <td className="sq">{Number(r.squaring).toFixed(3)}</td>
                            <td>{r.description}{r.drawing_ref && <small style={{ display: 'block', color: 'var(--mu)', fontSize: 11 }}>{r.drawing_ref}</small>}</td>
                            <td>{r.unit}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <button className="ed" onClick={() => editRow(r)} aria-label="Reassign row">✎</button>
                              <button className="rm" onClick={() => removeRow(r.id)} aria-label="Remove row">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && <div className="empty">No dimensions entered yet. Add your first line above.</div>}
            </div>
          </div>
        </div>

        <div className="side">
          <div className="card entry">
            <h2>Abstract</h2>
            <p className="d">Like descriptions collected and totalled, priced from your rate list.</p>
            {Object.keys(g).map(section => {
              const items = Object.values(g[section]);
              if (!items.length) return null;
              return (
                <div className="abs-grp" key={section}>
                  <h3>{section}</h3>
                  {items.map(it => {
                    const key = it.ds + '|' + it.un;
                    const rate = rates[key] || 0;
                    const amt = it.q * rate; grand += amt;
                    return (
                      <div className="abs-row" key={key}>
                        <span>{it.ds}</span><b>{it.q.toFixed(2)} {it.un}</b>
                        <input type="number" step="0.01" placeholder="rate" value={rate || ''} onChange={e => setRate(key, parseFloat(e.target.value) || 0)} />
                        <span className="amt">{money(amt)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {rows.length === 0 && <p className="d" style={{ margin: 0 }}>Nothing to abstract yet.</p>}
            <div className="abs-tot"><span>Estimated total</span><span>{money(grand)}</span></div>
          </div>
          <div className="card entry">
            <div className="actions" style={{ margin: 0, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <button className="btn o" onClick={exportCsv}>Export BOQ (CSV)</button>
              <button className="btn o" onClick={exportPdf}>Export priced BOQ (PDF)</button>
            </div>
            <div className="hint" style={{ marginTop: 12 }}>Rates are your personal price list, shared across all your projects.</div>
          </div>
        </div>
      </div>
      <div className="pboq" id="pboq"></div>
      <style>{`@media (max-width: 980px){.projGrid{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
