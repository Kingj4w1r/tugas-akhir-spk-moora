/* ═══════════════════════════════════════════════════════════════════
   SPK MOORA — Front-end logic
═══════════════════════════════════════════════════════════════════ */

let kriteria    = [];
let alternatif  = [];

// ─── Bootstrap ────────────────────────────────────────────────────
function initApp(defaultKriteria, defaultAlternatif) {
  kriteria   = JSON.parse(JSON.stringify(defaultKriteria));
  alternatif = JSON.parse(JSON.stringify(defaultAlternatif));
  renderKriteria();
  renderAlternatif();
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(v) {
  if (typeof v !== "number") return v;
  return Number.isInteger(v) ? v : v.toFixed(6);
}

function makeTable(headers, rows, rowClass) {
  const ths = headers.map(h => `<th>${h}</th>`).join("");
  const trs = rows.map((r, i) => {
    const cls = rowClass ? rowClass(i, r) : "";
    const tds = r.map(c => `<td>${c}</td>`).join("");
    return `<tr class="${cls}">${tds}</tr>`;
  }).join("");
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

// ─── KRITERIA table ───────────────────────────────────────────────
function renderKriteria() {
  const tbody = document.getElementById("body-kriteria");
  tbody.innerHTML = kriteria.map((k, i) => `
    <tr>
      <td><input type="text" value="${k.kode}" onchange="updateKriteria(${i},'kode',this.value)" style="width:60px"/></td>
      <td><input type="text" value="${k.nama}" onchange="updateKriteria(${i},'nama',this.value)" style="width:220px"/></td>
      <td>
        <select onchange="updateKriteria(${i},'sifat',this.value)">
          <option value="benefit" ${k.sifat==="benefit"?"selected":""}>Benefit</option>
          <option value="cost"    ${k.sifat==="cost"   ?"selected":""}>Cost</option>
        </select>
      </td>
      <td><input type="number" value="${k.bobot}" min="1" onchange="updateKriteria(${i},'bobot',+this.value)" style="width:70px"/></td>
      <td><button class="btn-sm btn-danger" onclick="hapusKriteria(${i})">✕</button></td>
    </tr>`).join("");
}

function updateKriteria(i, field, val) {
  kriteria[i][field] = val;
  if (field === "kode") renderAlternatif(); // sync kolom
}

function tambahKriteria() {
  const n = kriteria.length + 1;
  kriteria.push({ kode: `C${n}`, nama: `Kriteria ${n}`, sifat: "benefit", bobot: 1 });
  alternatif.forEach(a => a[`C${n}`] = 0);
  renderKriteria();
  renderAlternatif();
}

function hapusKriteria(i) {
  if (kriteria.length <= 1) return alert("Minimal 1 kriteria.");
  const kode = kriteria[i].kode;
  kriteria.splice(i, 1);
  alternatif.forEach(a => delete a[kode]);
  renderKriteria();
  renderAlternatif();
}

// ─── ALTERNATIF table ─────────────────────────────────────────────
function renderAlternatif() {
  const wrap = document.getElementById("wrap-alternatif");
  const headers = ["No", "Nama Penulis", ...kriteria.map(k => `${k.kode}<br/><small style="font-weight:400;color:#94a3b8">${k.sifat}</small>`), ""];
  const rows = alternatif.map((a, i) => {
    const namaTd = `<td><input type="text" value="${a.nama}" onchange="updateAlt(${i},'nama',this.value)" style="width:150px"/></td>`;
    const nilaiTds = kriteria.map(k =>
      `<td><input type="number" value="${a[k.kode] ?? 0}" step="any" onchange="updateAlt(${i},'${k.kode}',+this.value)" style="width:80px"/></td>`
    ).join("");
    const hapusTd = `<td><button class="btn-sm btn-danger" onclick="hapusAlt(${i})">✕</button></td>`;
    return `<tr><td style="color:#94a3b8;font-size:.8rem">${i+1}</td>${namaTd}${nilaiTds}${hapusTd}</tr>`;
  }).join("");

  const ths = headers.map(h => `<th>${h}</th>`).join("");
  wrap.innerHTML = `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
}

function updateAlt(i, field, val) { alternatif[i][field] = val; }

function tambahAlternatif() {
  const newAlt = { nama: `Penulis ${alternatif.length + 1}` };
  kriteria.forEach(k => newAlt[k.kode] = 0);
  alternatif.push(newAlt);
  renderAlternatif();
}

function hapusAlt(i) {
  if (alternatif.length <= 1) return alert("Minimal 1 alternatif.");
  alternatif.splice(i, 1);
  renderAlternatif();
}

// ─── HITUNG ───────────────────────────────────────────────────────
async function hitungMoora() {
  const wrap = document.getElementById("hasil-wrap");
  wrap.style.display = "block";
  wrap.innerHTML = '<div class="spinner"></div>';

  const payload = { kriteria, alternatif };

  try {
    const res  = await fetch("/hitung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    renderHasil(json.data);
  } catch (e) {
    wrap.innerHTML = `<div class="card" style="color:var(--red)">⚠️ Error: ${e.message}</div>`;
  }
}

// ─── RENDER HASIL ─────────────────────────────────────────────────
function renderHasil(d) {
  const wrap = document.getElementById("hasil-wrap");
  wrap.innerHTML = `
    <section class="card result-card">
      <div class="card-head">
        <span class="step-badge green">①</span>
        <h2>Langkah 1 — Matriks Keputusan (X)</h2>
      </div>
      <div class="table-wrap" id="out-step1"></div>
    </section>

    <section class="card result-card">
      <div class="card-head">
        <span class="step-badge green">②</span>
        <h2>Langkah 2 — Matriks Normalisasi (X*)</h2>
      </div>
      <p class="formula">Xij* = Xij / √(Σ Xij²)</p>
      <div id="out-penyebut" class="info-box"></div>
      <div class="table-wrap" id="out-step2"></div>
    </section>

    <section class="card result-card">
      <div class="card-head">
        <span class="step-badge green">③</span>
        <h2>Langkah 3 — Matriks Normalisasi Terbobot</h2>
      </div>
      <p class="formula">Vij = Wj × Xij*</p>
      <div class="table-wrap" id="out-step3"></div>
    </section>

    <section class="card result-card">
      <div class="card-head">
        <span class="step-badge green">④</span>
        <h2>Langkah 4 — Nilai Optimasi (Yi)</h2>
      </div>
      <p class="formula">Yi = Σ Benefit − Σ Cost</p>
      <div id="out-cols-info" class="info-box"></div>
      <div class="table-wrap" id="out-step4"></div>
    </section>

    <section class="card result-card">
      <div class="card-head">
        <span class="step-badge gold">⑤</span>
        <h2>Langkah 5 — Hasil Perankingan</h2>
      </div>
      <div id="out-podium" class="podium-wrap"></div>
      <div class="table-wrap" id="out-step5"></div>
    </section>`;

  renderStep1(d);
  renderStep2(d);
  renderStep3(d);
  renderStep4(d);
  renderStep5(d);

  wrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Step 1 ────────────────────────────────────────────────────────
function renderStep1(d) {
  const { columns, index, data } = d.step1;
  const cols = d.kriteria;
  const headers = ["Alternatif", ...columns.map(c => {
    const k = cols.find(x => x.kode === c);
    const badge = k
      ? `<span class="badge badge-${k.sifat}">${k.sifat}</span>`
      : "";
    return `${c} ${badge}<br/><small style="font-weight:400;color:#94a3b8">W=${k?.bobot??""}</small>`;
  })];
  const rows = data.map((row, i) => [index[i], ...row.map(fmt)]);
  document.getElementById("out-step1").innerHTML =
    makeTable(headers, rows);
}

// ── Step 2 ────────────────────────────────────────────────────────
function renderStep2(d) {
  // penyebut info
  const p = d.step2.penyebut;
  document.getElementById("out-penyebut").innerHTML =
    "<strong>√(Σ Xij²) per kriteria:</strong><br>" +
    Object.entries(p).map(([k,v]) => `&nbsp;${k}: <b>${fmt(v)}</b>`).join(" &nbsp;|&nbsp; ");

  const { columns, index, data } = d.step2.matrix;
  const headers = ["Alternatif", ...columns];
  const rows = data.map((row, i) => [index[i], ...row.map(fmt)]);
  document.getElementById("out-step2").innerHTML =
    makeTable(headers, rows);
}

// ── Step 3 ────────────────────────────────────────────────────────
function renderStep3(d) {
  const { columns, index, data } = d.step3;
  const headers = ["Alternatif", ...columns];
  const rows = data.map((row, i) => [index[i], ...row.map(fmt)]);
  document.getElementById("out-step3").innerHTML =
    makeTable(headers, rows);
}

// ── Step 4 ────────────────────────────────────────────────────────
function renderStep4(d) {
  const s4 = d.step4;
  document.getElementById("out-cols-info").innerHTML =
    `<strong>Benefit:</strong> ${s4.benefit_cols.join(", ")} &nbsp;&nbsp;
     <strong>Cost:</strong> ${s4.cost_cols.join(", ")}`;

  const headers = ["Alternatif", "Σ Benefit", "Σ Cost", "Yi (Σ Ben − Σ Cost)"];
  const names   = Object.keys(s4.yi);
  const rows    = names.map(name => [
    name,
    fmt(s4.sum_benefit[name]),
    fmt(s4.sum_cost[name]),
    `<strong>${fmt(s4.yi[name])}</strong>`,
  ]);
  document.getElementById("out-step4").innerHTML =
    makeTable(headers, rows);
}

// ── Step 5 ────────────────────────────────────────────────────────
function renderStep5(d) {
  const ranking = d.step5;
  const podClasses = ["pod-1","pod-2","pod-3"];

  // Podium (top 3 atau semua jika < 3)
  const topN = ranking.slice(0, Math.min(3, ranking.length));
  // Reorder visual: 2nd | 1st | 3rd
  const visual = topN.length >= 3
    ? [topN[1], topN[0], topN[2]]
    : topN.length === 2
      ? [topN[1], topN[0]]
      : topN;

  const medals = ["🥇","🥈","🥉"];
  const podHtml = visual.map((p) => {
    const podIdx = p.rank - 1; // 0-based
    const cls = podClasses[podIdx] || "pod-other";
    const initial = p.nama.charAt(0).toUpperCase();
    return `
      <div class="podium-item ${cls}">
        <div class="podium-avatar">${medals[podIdx] || initial}</div>
        <div class="podium-name">${p.nama}</div>
        <div class="podium-yi">Yi = ${fmt(p.yi)}</div>
        <div class="podium-box">${p.rank === 1 ? "🏆 TERBAIK" : `Rank #${p.rank}`}</div>
      </div>`;
  }).join("");
  document.getElementById("out-podium").innerHTML = podHtml;

  // Full ranking table
  const headers = ["Rank", "Nama Penulis", "Nilai Yi", "Keterangan"];
  const rows = ranking.map(p => [
    `<strong>#${p.rank}</strong>`,
    p.nama,
    `<strong>${fmt(p.yi)}</strong>`,
    p.rank === 1
      ? `<span class="badge badge-benefit">🏆 TERBAIK</span>`
      : "",
  ]);
  document.getElementById("out-step5").innerHTML =
    makeTable(headers, rows, (i) => i === 0 ? "rank-1" : "");
}
