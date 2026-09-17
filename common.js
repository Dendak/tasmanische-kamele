// Gemeinsamer Code für alle Rätsel: Lehrermodus mit Passwort.
// Passwort ändern: in der Browser-Konsole kameleHash('neuesPasswort') eingeben
// und den ausgegebenen Wert unten bei PASSWORD_HASH eintragen.
(() => {
  const PASSWORD_HASH = '6f649a50a623917b31960e5c05fd7bd79bb9e37ebc75a8fce6b803d29b02ed71';

  function sha256(str) {
    const bytes = new TextEncoder().encode(str);
    const K = [], H = [];
    const isPrime = x => { for (let i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; };
    const frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
    for (let p = 2, c = 0; c < 64; p++) {
      if (!isPrime(p)) continue;
      if (c < 8) H[c] = frac(Math.sqrt(p));
      K[c++] = frac(Math.cbrt(p));
    }
    const len = bytes.length;
    const buf = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    buf.set(bytes); buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(buf.length - 8, Math.floor(len * 8 / 4294967296));
    dv.setUint32(buf.length - 4, (len * 8) >>> 0);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const W = new Int32Array(64);
    for (let off = 0; off < buf.length; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getInt32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const x = W[i - 15], y = W[i - 2];
        W[i] = (W[i - 16] + (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) + W[i - 7] + (rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10))) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = (t1 + (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = t2;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) | 0; });
    }
    return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }
  window.kameleHash = sha256;

  // Erwartet auf der Seite: #teacher (öffnet), #teacherTools (Bereich), #lock (beendet)
  function initTeacher(onChange) {
    const dlg = document.createElement('dialog');
    dlg.className = 'pw';
    dlg.innerHTML = `
      <form>
        <h2>Lehrermodus</h2>
        <p>Mit dem Passwort werden Lösung und Hilfen freigeschaltet.</p>
        <input type="password" autocomplete="off" aria-label="Passwort">
        <p class="error" aria-live="polite"></p>
        <div class="row">
          <button type="button" class="btn" data-cancel>Abbrechen</button>
          <button type="submit" class="btn primary">Freischalten</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    const openBtn = document.getElementById('teacher');
    const tools = document.getElementById('teacherTools');
    const lockBtn = document.getElementById('lock');
    const input = dlg.querySelector('input');
    const error = dlg.querySelector('.error');

    const set = on => {
      tools.hidden = !on;
      openBtn.hidden = on;
      if (onChange) onChange(on);
    };
    openBtn.addEventListener('click', () => {
      input.value = '';
      error.textContent = '';
      dlg.showModal();
      input.focus();
    });
    dlg.querySelector('[data-cancel]').addEventListener('click', () => dlg.close());
    dlg.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      if (sha256(input.value) === PASSWORD_HASH) {
        dlg.close();
        set(true);
      } else {
        error.textContent = 'Falsches Passwort. Versuch es noch einmal.';
        input.select();
      }
    });
    lockBtn.addEventListener('click', () => set(false));
  }

  // Knopf, der einen Lösungsbereich ein- und ausblendet. Liefert eine Funktion zum Verstecken.
  function toggleSolution(btn, box) {
    btn.addEventListener('click', () => {
      box.hidden = !box.hidden;
      btn.textContent = box.hidden ? 'Lösung zeigen' : 'Lösung ausblenden';
    });
    return () => { box.hidden = true; btn.textContent = 'Lösung zeigen'; };
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  window.Raetsel = { initTeacher, toggleSolution, wait, sha256 };
})();
