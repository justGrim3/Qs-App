'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { DEFAULT_SECTIONS, TEMPLATES } from '../../../lib/templates';

function fmtDim(vals) {
  return vals && vals.length ? vals.map(v => Number(v).toFixed(3)).join(' × ') : '—';
}
function money(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function mToFtIn(m) {
  const ti = m / 0.0254, ft = Math.floor(ti / 12), inch = ti - ft * 12;
  return ft + "' " + inch.toFixed(1) + '"';
}
function parseLenInput(str, unit) {
  if (str === null) return null;
  str = str.trim();
  if (!str) return null;
  if (unit === 'm') { const v = parseFloat(str); return v > 0 ? v : null; }
  const m = str.match(/^(-?\d+(\.\d+)?)\s*'?\s*(\d+(\.\d+)?)?"?$/);
  if (!m) return null;
  const ft = parseFloat(m[1]) || 0, inch = parseFloat(m[3]) || 0;
  const meters = (ft * 12 + inch) * 0.0254;
  return meters > 0 ? meters : null;
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

  const [drawing, setDrawing] = useState(null);
  const [dMode, setDMode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [unit, setUnit] = useState('m');
  const [dStatusMsg, setDStatusMsg] = useState('');
  const [countActive, setCountActive] = useState(false);
  const imgCanvasRef = useRef(null);
  const ovCanvasRef = useRef(null);
  const dPtsRef = useRef([]);
  const countRef = useRef({ n: 0, ds: '', sec: '' });
  const fileRef = useRef(null);

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
      const { data: drawData } = await supabase.from('drawings').select('*').eq('project_id', id).maybeSingle();
      if (!active) return;
      setProject(proj);
      setSections(proj.sections && proj.sections.length ? proj.sections : DEFAULT_SECTIONS);
      setSec((proj.sections && proj.sections[0]) || DEFAULT_SECTIONS[0]);
      setTsec((proj.sections && proj.sections[0]) || DEFAULT_SECTIONS[0]);
      setRows(rowData || []);
      const rMap = {};
      (rateData || []).forEach(r => { rMap[r.description + '|' + r.unit] = r.rate; });
      setRates(rMap);
      if (drawData) setDrawing({ image: drawData.image, scale: drawData.scale });
      setLoading(false);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!drawing || !drawing.image) return;
    const img = new Image();
    img.onload = () => {
      const cv = imgCanvasRef.current, ov = ovCanvasRef.current;
      if (!cv || !ov) return;
      cv.width = ov.width = img.naturalWidth;
      cv.height = ov.height = img.naturalHeight;
      cv.style.width = ov.style.width = (img.naturalWidth * zoom) + 'px';
      cv.style.height = ov.style.height = (img.naturalHeight * zoom) + 'px';
      cv.getContext('2d').drawImage(img, 0, 0);
      ov.getContext('2d').clearRect(0, 0, ov.width, ov.height);
      dPtsRef.current = [];
    };
    img.src = drawing.image;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing && drawing.image]);

  useEffect(() => {
    const cv = imgCanvasRef.current, ov = ovCanvasRef.current;
    if (!cv || !cv.width) return;
    cv.style.width = ov.style.width = (cv.width * zoom) + 'px';
    cv.style.height = ov.style.height = (cv.height * zoom) + 'px';
  }, [zoom]);

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
    const [description, unit_] = key.split('|');
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('rates').upsert({ owner: userData.user.id, description, unit: unit_, rate: value });
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

  function fmtLen(m) { return unit === 'm' ? m.toFixed(3) + ' m' : mToFtIn(m); }

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const tmp = new Image();
      tmp.onload = async () => {
        const mw = 1400, sc = Math.min(1, mw / tmp.naturalWidth);
        const cw = Math.round(tmp.naturalWidth * sc), ch = Math.round(tmp.naturalHeight * sc);
        const oc = document.createElement('canvas');
        oc.width = cw; oc.height = ch;
        oc.getContext('2d').drawImage(tmp, 0, 0, cw, ch);
        const out = oc.toDataURL('image/jpeg', 0.78);
        await supabase.from('drawings').upsert({ project_id: id, image: out, scale: null });
        setDrawing({ image: out, scale: null });
        setDStatusMsg('Drawing imported. Tap "Set scale", then click two points a known distance apart.');
      };
      tmp.src = reader.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  async function removeDrawing() {
    if (!confirm('Remove the imported drawing from this project?')) return;
    await supabase.from('drawings').delete().eq('project_id', id);
    setDrawing(null);
    setDMode(null);
    setDStatusMsg('');
  }

  function dPoint(e) {
    const ov = ovCanvasRef.current;
    const r = ov.getBoundingClientRect();
    const sx = ov.width / r.width, sy = ov.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }
  function redrawPts() {
    const ov = ovCanvasRef.current, octx = ov.getContext('2d');
    octx.clearRect(0, 0, ov.width, ov.height);
    dPtsRef.current.forEach(p => {
      octx.fillStyle = dMode === 'cal' ? '#c2777a' : '#3c6e58';
      octx.beginPath(); octx.arc(p.x, p.y, 5, 0, 7); octx.fill();
    });
  }
  function dLabel(text, x, y) {
    const octx = ovCanvasRef.current.getContext('2d');
    octx.fillStyle = '#16232f';
    octx.font = "600 12px 'IBM Plex Mono', monospace";
    octx.fillText(text, x + 8, y - 8);
  }

  function endCount() {
    if (countActive && countRef.current.n > 0) {
      const c = countRef.current;
      supabase.from('dimension_rows').insert({
        project_id: id, section: c.sec, timesing: c.n, dims: [], squaring: c.n,
        description: c.ds, unit: 'nr', drawing_ref: null
      }).select().single().then(({ data, error }) => {
        if (!error) setRows(r => [...r, data]);
      });
    }
    setCountActive(false);
    countRef.current = { n: 0, ds: '', sec: '' };
  }

  function setMode(mode) {
    endCount();
    setDMode(cur => {
      const next = cur === mode ? null : mode;
      dPtsRef.current = [];
      redrawPts();
      setDStatusMsg(next ? statusFor(next) : '');
      return next;
    });
  }

  function statusFor(mode) {
    if (mode === 'cal') return 'Click two points a known distance apart on the drawing.';
    if (mode === 'len') return 'Click two points to measure a length.';
    if (mode === 'rect') return 'Click two opposite corners to measure length and width.';
    return '';
  }

  function startCount() {
    if (countActive) { endCount(); return; }
    if (!ds.trim()) { alert('Type a description in the "Add dimension" form above first (e.g. "Light fitting"), then start counting.'); return; }
    setDMode(null); dPtsRef.current = []; redrawPts();
    countRef.current = { n: 0, ds: ds.trim(), sec: nsec.trim() || sec };
    setCountActive(true);
    setDStatusMsg('Counting "' + countRef.current.ds + '" — click each one on the drawing, then "Finish count".');
  }

  function undoPoint() { dPtsRef.current.pop(); redrawPts(); }
  function clearMarks() { dPtsRef.current = []; redrawPts(); if (countActive) { countRef.current.n = 0; } }

  async function onCanvasClick(e) {
    if (countActive) {
      const p = dPoint(e);
      countRef.current.n++;
      const octx = ovCanvasRef.current.getContext('2d');
      octx.fillStyle = '#b1494c'; octx.beginPath(); octx.arc(p.x, p.y, 9, 0, 7); octx.fill();
      octx.fillStyle = '#fff'; octx.font = "600 12px 'IBM Plex Sans', sans-serif";
      octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.fillText(countRef.current.n, p.x, p.y + 1);
      octx.textAlign = 'start'; octx.textBaseline = 'alphabetic';
      setDStatusMsg('Counting "' + countRef.current.ds + '" — ' + countRef.current.n + ' placed. Click more, or "Finish count".');
      return;
    }
    if (!dMode) return;
    const p = dPoint(e);
    dPtsRef.current.push(p);
    const octx = ovCanvasRef.current.getContext('2d');
    octx.fillStyle = dMode === 'cal' ? '#c2777a' : '#3c6e58';
    octx.beginPath(); octx.arc(p.x, p.y, 5, 0, 7); octx.fill();
    if (dPtsRef.current.length === 2) {
      const a = dPtsRef.current[0], b = dPtsRef.current[1];
      const dx = b.x - a.x, dy = b.y - a.y, px = Math.sqrt(dx * dx + dy * dy);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      octx.strokeStyle = dMode === 'cal' ? '#c2777a' : '#3c6e58'; octx.lineWidth = 2;
      if (dMode === 'rect') octx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(dx), Math.abs(dy));
      else { octx.beginPath(); octx.moveTo(a.x, a.y); octx.lineTo(b.x, b.y); octx.stroke(); }

      if (dMode === 'cal') {
        const msg = unit === 'm' ? 'How many metres is that line, on the actual building?' : "How long is that line, in feet' inches\" (e.g. 12'6)?";
        const real = parseLenInput(prompt(msg), unit);
        if (real) {
          await supabase.from('drawings').upsert({ project_id: id, image: drawing.image, scale: px / real });
          setDrawing(dr => ({ ...dr, scale: px / real }));
          dLabel(fmtLen(real), mx, my);
          setDStatusMsg('Scale set — ' + Math.round(px / real) + ' px per metre.');
        } else { alert('Enter a valid length to set the scale.'); }
        dPtsRef.current = [];
      } else {
        const sc = drawing && drawing.scale;
        if (!sc) { alert('Set the scale first.'); dPtsRef.current = []; return; }
        if (dMode === 'len') {
          const mL = px / sc; setL(mL.toFixed(3)); dLabel(fmtLen(mL), mx, my);
          setDStatusMsg('Length filled: ' + fmtLen(mL));
        } else {
          const mLx = Math.abs(dx) / sc, mLy = Math.abs(dy) / sc;
          setL(mLx.toFixed(3)); setW(mLy.toFixed(3));
          dLabel(fmtLen(mLx) + ' × ' + fmtLen(mLy), Math.min(a.x, b.x), Math.min(a.y, b.y));
          setDStatusMsg('Length × width filled: ' + fmtLen(mLx) + ' × ' + fmtLen(mLy));
        }
        dPtsRef.current = [];
      }
    }
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
              <p className="d">Fill in and add — or pick a standard item below, or click-measure off the drawing.</p>
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
              <h2>Drawing</h2>
              <p className="d">Import a drawing image, set its scale, then click to measure straight off it.</p>
              <div className="actions" style={{ marginTop: 0 }}>
                <label className="btn o" style={{ cursor: 'pointer' }}>Upload image
                  <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} hidden />
                </label>
                <button className={'btn o' + (dMode === 'cal' ? ' on' : '')} onClick={() => setMode('cal')}>Set scale</button>
                <button className={'btn o' + (dMode === 'len' ? ' on' : '')} onClick={() => setMode('len')}>Measure length</button>
                <button className={'btn o' + (dMode === 'rect' ? ' on' : '')} onClick={() => setMode('rect')}>Measure rectangle</button>
                <button className={'btn o' + (countActive ? ' on' : '')} onClick={startCount}>{countActive ? ('Finish count (' + countRef.current.n + ')') : 'Count items'}</button>
                <button className="btn o" onClick={undoPoint}>Undo last point</button>
                <button className="btn o" onClick={clearMarks}>Clear marks</button>
                {drawing && <button className="btn o" onClick={removeDrawing}>Remove drawing</button>}
              </div>
              <p className="dstat">{drawing ? (dStatusMsg || (drawing.scale ? ('Scale set — ' + Math.round(drawing.scale) + ' px per metre.') : 'Drawing imported. Tap "Set scale" to begin.')) : 'No drawing imported yet.'}</p>
            </div>
            {drawing && (
              <div className="dwrap">
                <div className="dcv-outer">
                  <div className="dcv-in">
                    <canvas ref={imgCanvasRef} />
                    <canvas ref={ovCanvasRef} onClick={onCanvasClick} />
                  </div>
                </div>
                <div className="dzoom">
                  <button className="btn o zbtn" onClick={() => setZoom(z => Math.max(.3, z * 0.6))}>−</button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button className="btn o zbtn" onClick={() => setZoom(z => Math.min(3, z * 1.4))}>+</button>
                  <span style={{ marginLeft: 14, color: 'var(--mu)', fontSize: 12.5 }}>Units:</span>
                  <button className={'btn o utog' + (unit === 'm' ? ' on' : '')} onClick={() => setUnit('m')}>metres</button>
                  <button className={'btn o utog' + (unit === 'ft' ? ' on' : '')} onClick={() => setUnit('ft')}>feet-inches</button>
                </div>
              </div>
            )}
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
