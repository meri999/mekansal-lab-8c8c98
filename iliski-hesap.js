/* Iliski kesfi hesaplari: saf fonksiyonlar, DOM'a dokunmaz. window.VERI (yerler, gostergeler) gerekir. */
(function (global) {
  var MIN_IL = 70;          /* kesitte bir gostergenin "il duzeyli" sayilmasi icin gereken il sayisi */
  var MIN_YIL_DEGISIM = 8;  /* zaman modunda en az ortak yillik degisim */

  function sayi(v) { return typeof v === "number" && isFinite(v); }

  function ilKodlari(yerler) {
    var r = []; (yerler || []).forEach(function (y) { if (y.duzey === "il") r.push(y.kod); });
    return r;
  }

  /* ---- istatistik ---- */
  function sirala(a) { /* ortalama sira (esit degerler icin) */
    var o = a.map(function (v, i) { return [v, i]; }).sort(function (x, y) { return x[0] - y[0]; }), r = [], i = 0;
    while (i < o.length) {
      var j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++;
      var m = (i + j) / 2 + 1; for (var k = i; k <= j; k++) r[o[k][1]] = m; i = j + 1;
    }
    return r;
  }
  function pearson(a, b) {
    var n = a.length; if (n < 3) return null;
    var ma = 0, mb = 0, i; for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
    var sa = 0, sb = 0, sp = 0;
    for (i = 0; i < n; i++) { sa += (a[i] - ma) * (a[i] - ma); sb += (b[i] - mb) * (b[i] - mb); sp += (a[i] - ma) * (b[i] - mb); }
    if (sa === 0 || sb === 0) return null; /* sabit seri: korelasyon tanimsiz */
    return sp / Math.sqrt(sa * sb);
  }
  function spearman(a, b) { return a.length < 3 ? null : pearson(sirala(a), sirala(b)); }
  /* %5 (iki yonlu) anlamlilik icin kritik |r|; t dagilimi Cornish-Fisher yaklasimi */
  function kritikR(n) {
    var df = n - 2; if (df < 1) return 1;
    var z = 1.959964, t = z + (z * z * z + z) / (4 * df) + (5 * Math.pow(z, 5) + 16 * z * z * z + 3 * z) / (96 * df * df)
      + (3 * Math.pow(z, 7) + 19 * Math.pow(z, 5) + 17 * z * z * z - 15 * z) / (384 * df * df * df);
    return t / Math.sqrt(df + t * t);
  }
  function dogru(x, y) { /* en kucuk kareler dogrusu y = a + b x */
    var n = x.length, mx = 0, my = 0, i; for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; } mx /= n; my /= n;
    var sxx = 0, sxy = 0; for (i = 0; i < n; i++) { sxx += (x[i] - mx) * (x[i] - mx); sxy += (x[i] - mx) * (y[i] - my); }
    if (sxx === 0) return null; var b = sxy / sxx; return { a: my - b * mx, b: b };
  }
  function guc(r) { var m = Math.abs(r); return m >= 0.7 ? "güçlü" : m >= 0.4 ? "orta" : "zayıf"; }

  /* ---- veri erisimi ---- */
  function yilIndeks(g) { var m = {}; g.yillar.forEach(function (y, i) { m[y] = i; }); return m; }
  function ilSayisi(g, i, iller) {
    var n = 0; iller.forEach(function (k) { var s = g.veri[k]; if (s && sayi(s[i])) n++; }); return n;
  }
  /* gosterge il duzeyli mi (herhangi bir yilda en az MIN_IL il dolu) */
  function ilDuzeyli(g, iller) {
    if (g.sadece_tr) return false;
    for (var i = g.yillar.length - 1; i >= 0; i--) if (ilSayisi(g, i, iller) >= MIN_IL) return true;
    return false;
  }
  /* iki gostergenin ortak yillari (metin), her ikisinde de en az MIN_IL il dolu olanlar */
  function ortakYillar(gx, gy, iller) {
    var ix = yilIndeks(gx), iy = yilIndeks(gy), r = [];
    gx.yillar.forEach(function (y) {
      if (iy[y] === undefined) return;
      if (ilSayisi(gx, ix[y], iller) >= MIN_IL && ilSayisi(gy, iy[y], iller) >= MIN_IL) r.push(y);
    });
    return r;
  }
  /* kesit: bir yilda iller arasi ciftler */
  function kesit(gx, gy, yil, iller) {
    var ix = yilIndeks(gx)[yil], iy = yilIndeks(gy)[yil], c = [];
    if (ix === undefined || iy === undefined) return { kodlar: [], x: [], y: [], n: 0, rho: null, pearson: null, dogru: null };
    iller.forEach(function (k) {
      var a = gx.veri[k] && gx.veri[k][ix], b = gy.veri[k] && gy.veri[k][iy];
      if (sayi(a) && sayi(b)) c.push([k, a, b]);
    });
    var x = c.map(function (q) { return q[1]; }), y = c.map(function (q) { return q[2]; });
    return { kodlar: c.map(function (q) { return q[0]; }), x: x, y: y, n: c.length,
      rho: spearman(x, y), pearson: pearson(x, y), dogru: c.length > 2 ? dogru(x, y) : null };
  }
  /* dogruya gore en uzak (artik) noktalar: kesit ciktisindan kod listesi */
  function aykirilar(k, say) {
    if (!k.dogru) return [];
    var l = k.kodlar.map(function (kod, i) { return { kod: kod, art: k.y[i] - (k.dogru.a + k.dogru.b * k.x[i]) }; });
    l.sort(function (a, b) { return Math.abs(b.art) - Math.abs(a.art); });
    return l.slice(0, say || 4).map(function (q) { return q.kod; });
  }
  /* son yil: ortak yillarin en sonu; yoksa null */
  function sonOrtakYil(gx, gy, iller) { var o = ortakYillar(gx, gy, iller); return o.length ? o[o.length - 1] : null; }

  /* ---- buyukluk etkisi: gosterge nufusla (g01) birlikte mi buyuyor ---- */
  function buyuklukRho(g, nufus, iller) {
    var y = sonOrtakYil(g, nufus, iller); if (!y) return null;
    var k = kesit(g, nufus, y, iller); return k.rho;
  }

  /* ---- bir gostergenin en guclu iliskileri (kesit) ---- */
  function enGuclu(gx, adaylar, iller, secenek) {
    var o = secenek || {}, esik = o.esik === undefined ? 0.5 : o.esik, sonuc = [], denenen = 0;
    adaylar.forEach(function (g) {
      if (g === gx || g.baslik === gx.baslik) return;
      var y = o.yil && ortakYillar(gx, g, iller).indexOf(o.yil) >= 0 ? o.yil : sonOrtakYil(gx, g, iller);
      if (!y) return;
      var k = kesit(gx, g, y, iller); if (k.n < MIN_IL || k.rho === null) return;
      denenen++;
      if (Math.abs(k.rho) >= esik) sonuc.push({ g: g, yil: y, n: k.n, rho: k.rho });
    });
    sonuc.sort(function (a, b) { return Math.abs(b.rho) - Math.abs(a.rho); });
    return { liste: sonuc, denenen: denenen, tesadufBeklenen: denenen * 0.05 };
  }

  /* ---- zaman: bir yerin iki serisi, yillik degisim uzerinden ---- */
  var FARK_BIRIM = { "%": 1, "‰": 1, "yıl": 1, "yaş": 1, "puan": 1, "endeks": 1, "100 binde": 1, "ay": 1, "gün": 1 };
  function degisimTuru(g, seri) {
    if (FARK_BIRIM[g.birim]) return "fark";
    for (var i = 0; i < seri.length; i++) if (sayi(seri[i]) && seri[i] <= 0) return "fark";
    return "yuzde";
  }
  /* yillik degisim: ardisik YILLAR arasinda (aradaki bosluk varsa degisim yok). Donus: { yil: deger } */
  function yillikDegisim(g, kod, tur) {
    var s = g.veri[kod], r = {}; if (!s) return r;
    tur = tur || degisimTuru(g, s);
    for (var i = 1; i < g.yillar.length; i++) {
      var a = s[i - 1], b = s[i];
      if (!sayi(a) || !sayi(b)) continue;
      if (+g.yillar[i] - +g.yillar[i - 1] !== 1) continue;
      if (tur === "yuzde") { if (a === 0) continue; r[g.yillar[i]] = (b - a) / Math.abs(a) * 100; }
      else r[g.yillar[i]] = b - a;
    }
    return r;
  }
  /* zaman iliskisi: X'in t'deki degisimi ile Y'nin t+gecikme'deki degisimi; donem [bas, son] (yil, sinirlar dahil) */
  function zamanIliski(gx, gy, kod, secenek) {
    var o = secenek || {}, gec = o.gecikme || 0;
    var dx = yillikDegisim(gx, kod), dy = yillikDegisim(gy, kod), x = [], y = [], yl = [];
    Object.keys(dx).forEach(function (yr) {
      var yy = String(+yr + gec);
      if (dy[yy] === undefined) return;
      if (o.bas && +yr < +o.bas) return; if (o.son && +yy > +o.son) return;
      x.push(dx[yr]); y.push(dy[yy]); yl.push(yr);
    });
    yl = yl.map(Number);
    var n = x.length;
    return { n: n, x: x, y: y, yillar: yl, rho: n >= MIN_YIL_DEGISIM ? spearman(x, y) : null };
  }
  /* teyit: ayni cift icin tum illerde; esigi gecip ayni yonde olanlar */
  function teyit(gx, gy, iller, rho, esik, secenek) {
    var pay = 0, say = 0, kodlar = [];
    iller.forEach(function (k) {
      var z = zamanIliski(gx, gy, k, secenek);
      if (z.rho === null) return;
      pay++;
      if (Math.abs(z.rho) >= esik && z.rho * rho > 0) { say++; kodlar.push(k); }
    });
    return { pay: pay, say: say, kodlar: kodlar };
  }
  /* etkin esik: kullanicinin esigi ile ortak yil sayisina gore %5 kritik r'nin buyugu */
  function etkinEsik(esik, n) { return Math.max(esik, kritikR(n)); }


  /* iki yonlu tesadufi gecme olasiligi: Fisher z, normal yaklasim */
  function erfc(x) { var z = Math.abs(x), t = 1 / (1 + 0.5 * z), r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; }
  function pTesadufi(r, n) { if (n < 4) return 1; var q = Math.min(0.999999, Math.abs(r)), z = 0.5 * Math.log((1 + q) / (1 - q)) * Math.sqrt(n - 3); return erfc(z / Math.SQRT2); }

  /* ---- gosterge agi: bir yerde tum gostergeler arasi yillik degisim iliskileri ---- */
  /* gostergeler: dizi; donus: { id: { yil: degisim } } (en az MIN_YIL_DEGISIM degisimi olanlar), donem [bas, son] */
  function degisimHaritasi(gostergeler, kod, bas, son) {
    var r = {};
    gostergeler.forEach(function (g) {
      var d = yillikDegisim(g, kod), a = {}, n = 0;
      Object.keys(d).forEach(function (y) { if (bas && +y < +bas) return; if (son && +y > +son) return; a[y] = d[y]; n++; });
      if (n >= MIN_YIL_DEGISIM) r[g.id] = a;
    });
    return r;
  }
  function hizala(da, db, gec) { /* a'nin t, b'nin t+gec degisimleri */
    var x = [], y = [];
    Object.keys(da).forEach(function (t) { var u = String(+t + gec); if (db[u] !== undefined) { x.push(da[t]); y.push(db[u]); } });
    return { x: x, y: y };
  }
  /* o: { bas, son, esik, gecikme (true: 1 yil gecikmeli baglar da), merkez (gosterge id ya da ""), disla (fn(g1,g2) true ise cift atlanir) }
     donus: { baglar: [{a, b, rho, n, gec}], denenen } ; gec 0 = ayni yil, 1 = a'nin degisimi b'yi bir yil sonra izler */
  function agBaglari(gostergeler, kod, o) {
    var dm = degisimHaritasi(gostergeler, kod, o.bas, o.son), ids = Object.keys(dm), byId = {}, baglar = [], denenen = 0, beklenen = 0;
    gostergeler.forEach(function (g) { byId[g.id] = g; });
    function dene(a, b, gec) {
      if (a === b) return;
      var h = hizala(dm[a], dm[b], gec); if (h.x.length < MIN_YIL_DEGISIM) return;
      var rho = spearman(h.x, h.y); if (rho === null) return; denenen++;
      var es = etkinEsik(o.esik, h.x.length); beklenen += pTesadufi(es, h.x.length);
      if (Math.abs(rho) >= es) baglar.push({ a: a, b: b, rho: rho, n: h.x.length, gec: gec });
    }
    function atla(a, b) { return o.disla && o.disla(byId[a], byId[b]); }
    for (var i = 0; i < ids.length; i++) {
      for (var j = i + 1; j < ids.length; j++) {
        var a = ids[i], b = ids[j];
        if (o.merkez && a !== o.merkez && b !== o.merkez) continue;
        if (atla(a, b)) continue;
        dene(a, b, 0);
        if (o.gecikme) { dene(a, b, 1); dene(b, a, 1); }
      }
    }
    baglar.sort(function (p, q) { return Math.abs(q.rho) - Math.abs(p.rho); });
    return { baglar: baglar, denenen: denenen, beklenen: beklenen };
  }
  /* en guclu baglardan baslayarak en cok dugumLimit dugum ve bagLimit bag sec */
  function agSec(baglar, dugumLimit, bagLimit) {
    var dugum = {}, nd = 0, sec = [];
    for (var i = 0; i < baglar.length && sec.length < bagLimit; i++) {
      var q = baglar[i], yeni = (dugum[q.a] ? 0 : 1) + (dugum[q.b] ? 0 : 1);
      if (nd + yeni > dugumLimit) continue;
      if (!dugum[q.a]) { dugum[q.a] = 1; nd++; } if (!dugum[q.b]) { dugum[q.b] = 1; nd++; }
      sec.push(q);
    }
    return { baglar: sec, dugumler: Object.keys(dugum) };
  }

  global.IliskiHesap = {
    MIN_IL: MIN_IL, MIN_YIL_DEGISIM: MIN_YIL_DEGISIM,
    ilKodlari: ilKodlari, sirala: sirala, pearson: pearson, spearman: spearman, kritikR: kritikR, dogru: dogru, guc: guc,
    ilDuzeyli: ilDuzeyli, ortakYillar: ortakYillar, kesit: kesit, aykirilar: aykirilar, sonOrtakYil: sonOrtakYil,
    buyuklukRho: buyuklukRho, enGuclu: enGuclu, degisimTuru: degisimTuru, yillikDegisim: yillikDegisim,
    zamanIliski: zamanIliski, teyit: teyit, etkinEsik: etkinEsik,
    degisimHaritasi: degisimHaritasi, agBaglari: agBaglari, agSec: agSec, pTesadufi: pTesadufi
  };
})(window);
