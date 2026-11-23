/* Giris sayfasi hesaplari: saf fonksiyonlar, DOM'a dokunmaz. window.VERI gerekir (yer listesi). */
(function (global) {
  var MIN_IL = 70;
  function ilKodlari() {
    var s = {}; ((global.VERI || {}).yerler || []).forEach(function (y) { if (y.duzey === "il") s[y.kod] = 1; });
    return s;
  }
  function katla(m) {
    return String(m || "").toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c").trim();
  }
  function ilDegerleri(g, i) {
    var il = ilKodlari(), r = {};
    Object.keys(g.veri).forEach(function (k) {
      if (!il[k]) return;
      var v = g.veri[k][i]; r[k] = (typeof v === "number" && isFinite(v)) ? v : null;
    });
    return r;
  }
  function doluSayi(d) { return Object.keys(d).filter(function (k) { return d[k] !== null; }).length; }
  /* en az MIN_IL ilin dolu oldugu son yil */
  function sonYil(g) {
    for (var i = g.yillar.length - 1; i >= 0; i--) if (doluSayi(ilDegerleri(g, i)) >= MIN_IL) return { i: i, yil: g.yillar[i] };
    var j = g.yillar.length - 1; return { i: j, yil: g.yillar[j] };
  }
  function fark(g, i, geri) {
    var a = ilDegerleri(g, i), b = ilDegerleri(g, Math.max(0, i - (geri || 1))), r = {};
    Object.keys(a).forEach(function (k) { r[k] = (a[k] === null || b[k] === null) ? null : a[k] - b[k]; });
    return r;
  }
  function sirala(degerler, adlar, n, artan) {
    var l = Object.keys(degerler).filter(function (k) { return degerler[k] !== null && degerler[k] !== undefined; })
      .map(function (k) { return { kod: k, ad: adlar[k] || k, deger: degerler[k] }; });
    l.sort(function (x, y) { return artan ? x.deger - y.deger : y.deger - x.deger; });
    return l.slice(0, n);
  }
  function bul(metin, yerler) {
    var q = katla(metin); if (!q) return [];
    var bas = [], ic = [];
    (yerler || []).forEach(function (y) {
      if (y.duzey !== "il") return;
      var k = katla(y.ad_tr).indexOf(q);
      if (k === 0) bas.push(y); else if (k > 0 && q.length > 2) ic.push(y);
    });
    function sirali(l) { return l.map(function (y) { return { kod: y.kod, ad: y.ad_tr }; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); }); }
    return sirali(bas).concat(sirali(ic)); /* once bastan eslesenler */
  }
  function turkiye(g, i) {
    var v = g.veri.TR ? g.veri.TR[i] : null; return (typeof v === "number" && isFinite(v)) ? v : null;
  }
  global.GirisHesap = { sonYil: sonYil, ilDegerleri: ilDegerleri, fark: fark, sirala: sirala, bul: bul, turkiye: turkiye, katla: katla, MIN_IL: MIN_IL };
})(window);
