/* Il karnesi hesaplari: saf fonksiyonlar, DOM'a dokunmaz. */
(function (global) {
  var MIN_IL = 70;
  function sayi(v) { return typeof v === "number" && isFinite(v); }

  /* Bir gostergenin son yilindaki (en az MIN_IL ilin dolu oldugu) il dagilimi ozeti */
  function ozet(g, iller) {
    for (var i = g.yillar.length - 1; i >= 0; i--) {
      var d = {}, v = [];
      iller.forEach(function (k) { var x = g.veri[k] && g.veri[k][i]; if (sayi(x)) { d[k] = x; v.push(x); } });
      if (v.length < MIN_IL) continue;
      var n = v.length, ort = 0, j; for (j = 0; j < n; j++) ort += v[j]; ort /= n;
      var vk = 0; for (j = 0; j < n; j++) vk += (v[j] - ort) * (v[j] - ort);
      var sd = Math.sqrt(vk / n), kodlar = Object.keys(d).sort(function (a, b) { return d[b] - d[a]; }), sira = {};
      kodlar.forEach(function (k, r) { sira[k] = r + 1; });
      var tr = g.veri.TR && sayi(g.veri.TR[i]) ? g.veri.TR[i] : null;
      return { g: g, i: i, yil: g.yillar[i], d: d, n: n, ort: ort, sd: sd, min: Math.min.apply(null, v), max: Math.max.apply(null, v), tr: tr, sira: sira };
    }
    return null;
  }
  /* yuzdelik konum 0..1 (1 = en yuksek): carpik dagilimlarda z'den daha saglam */
  function pc(o, kod) { return (typeof o.sira[kod] === "number" && o.n > 1) ? (o.n - o.sira[kod]) / (o.n - 1) : null; }
  function z(o, kod) { return (sayi(o.d[kod]) && o.sd > 0) ? (o.d[kod] - o.ort) / o.sd : null; }

  /* tek il: her gosterge icin satir; Turkiye'den (il ortalamasindan) en cok ayrisandan baslar */
  function satirlar(ozetler, kod) {
    var r = [];
    ozetler.forEach(function (o) {
      if (!sayi(o.d[kod])) return;
      r.push({ o: o, deger: o.d[kod], tr: o.tr, sira: o.sira[kod], n: o.n, z: z(o, kod) });
    });
    r.forEach(function (q) { q.p = pc(q.o, kod); q.uzak = Math.abs((q.n + 1) / 2 - q.sira); });
    r.sort(function (a, b) { return (b.uzak - a.uzak) || (Math.abs(b.z || 0) - Math.abs(a.z || 0)); });
    return r;
  }

  /* karsilastirma: secili illerin degerleri; yayilim = en yuksek ve en dusuk z farki */
  function karsilastir(ozetler, kodlar) {
    var r = [];
    ozetler.forEach(function (o) {
      var ps = [], zs = [], dg = {};
      for (var i = 0; i < kodlar.length; i++) { var q = pc(o, kodlar[i]), w = z(o, kodlar[i]); if (q === null || w === null) return; ps.push(q); zs.push(w); dg[kodlar[i]] = o.d[kodlar[i]]; }
      r.push({ o: o, degerler: dg, z: zs, p: ps, yayilim: Math.max.apply(null, ps) - Math.min.apply(null, ps), zyayilim: Math.max.apply(null, zs) - Math.min.apply(null, zs) });
    });
    r.sort(function (a, b) { return (b.yayilim - a.yayilim) || (b.zyayilim - a.zyayilim); });
    return r;
  }

  /* benzerlik: ortak gostergelerde yuzdelik konum farklarinin karekok ortalamasi, 0..1 (kucuk = benzer) */
  function benzerlik(ozetler, kod, iller, enAz) {
    var gerek = enAz || 20, sonuc = [];
    iller.forEach(function (b) {
      if (b === kod) return;
      var t = 0, n = 0;
      ozetler.forEach(function (o) { var a = pc(o, kod), c = pc(o, b); if (a === null || c === null) return; t += (a - c) * (a - c); n++; });
      if (n >= gerek) sonuc.push({ kod: b, uzaklik: Math.sqrt(t / n), ortak: n });
    });
    sonuc.sort(function (a, b) { return a.uzaklik - b.uzaklik; });
    return sonuc;
  }
  /* iki il arasinda gosterge bazli fark (z): en benzer ve en farkli gostergeler */
  function ciftFark(ozetler, a, b) {
    var r = [];
    ozetler.forEach(function (o) { var x = pc(o, a), y = pc(o, b); if (x === null || y === null) return; r.push({ o: o, fark: Math.abs(x - y), za: x, zb: y }); });
    r.sort(function (p, q) { return p.fark - q.fark; });
    return r;
  }

  /* "Oneyi" cumlesi icin en buyuk fark */
  function enBuyukFark(satirlarKars) { return satirlarKars.length ? satirlarKars[0] : null; }

  global.KarneHesap = { MIN_IL: MIN_IL, ozet: ozet, z: z, pc: pc, satirlar: satirlar, karsilastir: karsilastir, benzerlik: benzerlik, ciftFark: ciftFark, enBuyukFark: enBuyukFark };
})(window);
