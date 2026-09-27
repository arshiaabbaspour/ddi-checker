
'use strict';

const DATA_VERSION = 'v4 / web 0.1';
let DRUGS = null;
let ALIASES = null;
let INTERACTIONS = null;
let SUGGESTIONS = null;
let dataPromise = null;

const $ = (id) => document.getElementById(id);

function normalizeDrugName(text) {
  let s = String(text || '').normalize('NFKC').toLocaleLowerCase().trim();
  s = s.replace(/\u200c/g, ' ');
  s = s.replace(/[–—−]/g, '-');
  s = s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه').replace(/ة/g, 'ه');
  s = s.replace(/&/g, ' and ');
  s = s.replace(/[\(\)\[\]\{\},.;:/_\\\-+%]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function htmlEscape(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function loadJSON(url) {
  const r = await fetch(url, {cache:'force-cache'});
  if (!r.ok) throw new Error(`خطا در دریافت ${url}: ${r.status}`);
  return r.json();
}

async function ensureData() {
  if (DRUGS && ALIASES && INTERACTIONS && SUGGESTIONS) return;
  if (!dataPromise) {
    dataPromise = (async () => {
      const [d,a,i,s] = await Promise.all([
        loadJSON('data/drugs.json'),
        loadJSON('data/aliases.json'),
        loadJSON('data/interactions.json'),
        loadJSON('data/suggestions.json')
      ]);
      DRUGS = d; ALIASES = a; INTERACTIONS = i; SUGGESTIONS = s;
      $('dataInfo').textContent = `${Object.keys(DRUGS).length.toLocaleString('fa-IR')} دارو • ${Object.keys(INTERACTIONS).length.toLocaleString('fa-IR')} زوج ثبت‌شده`;
    })();
  }
  return dataPromise;
}

function resolveDrug(text) {
  const n = normalizeDrugName(text);
  if (!n) return [];
  const keys = [`N|${n}`, `C|${n.replace(/ /g,'')}`];
  const ids = new Set();
  for (const k of keys) {
    for (const id of (ALIASES[k] || [])) ids.add(id);
  }
  return [...ids];
}

function displayDrug(ids) {
  return ids.map(id => {
    const d = DRUGS[id];
    if (!d) return id;
    return d.fa ? `${d.fa} (${d.en})` : d.en;
  }).join(' + ');
}

function pairKey(a,b) {
  return [a,b].sort().join('|');
}

function findInteractions(ids1, ids2) {
  const byLabel = new Map();
  for (const id1 of ids1) {
    for (const id2 of ids2) {
      const rows = INTERACTIONS[pairKey(id1,id2)] || [];
      for (const r of rows) {
        if (!byLabel.has(r.en)) {
          byLabel.set(r.en, {...r});
        } else {
          byLabel.get(r.en).n += Number(r.n || 0);
        }
      }
    }
  }
  return [...byLabel.values()].sort((a,b) =>
    (a.fa || a.en).localeCompare((b.fa || b.en), 'fa')
  );
}

function setStatus(text='', kind='') {
  $('status').innerHTML = text ? `<div class="status-box ${kind}">${htmlEscape(text)}</div>` : '';
}

function renderResolved(ids1, ids2) {
  $('resolved').hidden = false;
  $('resolved').innerHTML =
    `<div><strong>داروی اول:</strong> ${htmlEscape(displayDrug(ids1))}</div>` +
    `<div><strong>داروی دوم:</strong> ${htmlEscape(displayDrug(ids2))}</div>`;
}

function renderResults(rows) {
  if (!rows.length) {
    $('results').innerHTML = '';
    setStatus('در این دیتاست برای این زوج دارویی تداخلی ثبت نشده است.', 'empty');
    return;
  }
  setStatus(`${rows.length.toLocaleString('fa-IR')} نوع تداخل پیدا شد.`);
  $('results').innerHTML = rows.map(r => `
    <article class="result-card">
      <div class="result-top">
        <div>
          <div class="result-title">${htmlEscape(r.fa || r.en)}</div>
          <div class="result-en">${htmlEscape(r.en)}</div>
        </div>
        <span class="count">${Number(r.n || 0).toLocaleString('fa-IR')} شاهد</span>
      </div>
      ${(r.section || r.sentence) ? `
        <details>
          <summary>نمایش نمونه منبع</summary>
          <div class="evidence">
            ${r.section ? `<div class="section">${htmlEscape(r.section)}</div>` : ''}
            ${r.sentence ? `<div class="sentence">${htmlEscape(r.sentence)}</div>` : ''}
          </div>
        </details>` : ''}
    </article>`).join('');
}

async function checkInteraction() {
  const d1 = $('drug1').value.trim();
  const d2 = $('drug2').value.trim();
  $('results').innerHTML = '';
  $('resolved').hidden = true;
  setStatus('');

  if (!d1 || !d2) {
    setStatus('لطفاً نام هر دو دارو را وارد کنید.', 'error');
    return;
  }

  $('checkBtn').disabled = true;
  $('btnText').textContent = 'در حال بررسی…';
  $('spinner').hidden = false;
  try {
    await ensureData();
    const ids1 = resolveDrug(d1);
    const ids2 = resolveDrug(d2);
    if (!ids1.length) {
      setStatus(`داروی «${d1}» پیدا نشد. نام دیگری یا یکی از پیشنهادها را امتحان کنید.`, 'error');
      return;
    }
    if (!ids2.length) {
      setStatus(`داروی «${d2}» پیدا نشد. نام دیگری یا یکی از پیشنهادها را امتحان کنید.`, 'error');
      return;
    }
    renderResolved(ids1, ids2);
    renderResults(findInteractions(ids1, ids2));
  } catch (e) {
    console.error(e);
    setStatus('داده‌های برنامه بارگذاری نشد. اتصال اینترنت را برای اولین اجرا بررسی کنید و صفحه را دوباره باز کنید.', 'error');
  } finally {
    $('checkBtn').disabled = false;
    $('btnText').textContent = 'بررسی تداخل';
    $('spinner').hidden = true;
  }
}

function attachAutocomplete(inputId, boxId) {
  const input = $(inputId), box = $(boxId);
  let timer = null;

  function hide() { box.hidden = true; box.innerHTML = ''; }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await ensureData(); } catch { return; }
      const q = normalizeDrugName(input.value);
      if (q.length < 2) return hide();

      const compactQ = q.replace(/ /g,'');
      const matches = [];
      for (const s of SUGGESTIONS) {
        const n = normalizeDrugName(s);
        if (n.startsWith(q) || n.replace(/ /g,'').startsWith(compactQ) || n.includes(q)) {
          matches.push(s);
          if (matches.length >= 10) break;
        }
      }
      if (!matches.length) return hide();

      box.innerHTML = matches.map(s =>
        `<button type="button" class="suggestion" data-v="${htmlEscape(s)}">${htmlEscape(s)}</button>`
      ).join('');
      box.hidden = false;
    }, 80);
  });

  box.addEventListener('click', (e) => {
    const b = e.target.closest('.suggestion');
    if (!b) return;
    input.value = b.dataset.v;
    hide();
    input.focus();
  });

  document.addEventListener('click', (e) => {
    if (!box.contains(e.target) && e.target !== input) hide();
  });
}

$('checkBtn').addEventListener('click', checkInteraction);
$('swapBtn').addEventListener('click', () => {
  const a = $('drug1').value;
  $('drug1').value = $('drug2').value;
  $('drug2').value = a;
});
$('drug1').addEventListener('keydown', e => { if (e.key === 'Enter') $('drug2').focus(); });
$('drug2').addEventListener('keydown', e => { if (e.key === 'Enter') checkInteraction(); });

attachAutocomplete('drug1','sug1');
attachAutocomplete('drug2','sug2');

ensureData().catch(() => {
  $('dataInfo').textContent = 'داده‌ها پس از اولین اتصال بارگذاری می‌شوند';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
}
