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
  /* Genel arama: gosterge, il, arac ve "il + gosterge" birlesimi. En cok 8 sonuc. */
  function sozcukler(m) { return katla(m).split(/[\s\-–—,.:;()\/]+/).filter(Boolean); }
  function onekler(q, kelimeler) {
    return q.every(function (t) { return kelimeler.some(function (w) { return w.indexOf(t) === 0; }); });
  }
  function araBul(metin, kaynak) {
    var q = sozcukler(metin); if (!q.length) return [];
    var G = (kaynak && kaynak.gostergeler) || [], Y = (kaynak && kaynak.yerler) || [], A = (kaynak && kaynak.araclar) || [];
    var gor = {}, tek = [];
    G.forEach(function (g) { /* ayni baslik tek kez; il surumu (sadece_tr olmayan) tercih edilir */
      var k = g.baslik, var_ = gor[k];
      if (var_ === undefined) { gor[k] = tek.length; tek.push(g); }
      else if (tek[var_].sadece_tr && !g.sadece_tr) tek[var_] = g;
    });
    function gKel(g) { return sozcukler(g.baslik + " " + (g.grup || "")); }
    function gSonuc(g, ek, il) {
      return { tur: il ? "birlesik" : "gosterge", ad: il ? il.ad_tr + " · " + g.baslik : g.baslik, ek: ek || g.grup || "",
        href: "veri-portali.html#g=" + g.id + (il ? "&yer=" + il.kod : ""), pasif: false };
    }
    var iller = Y.filter(function (y) { return y.duzey === "il"; });
    var birlesik = [], ilSon = [], gSon = [], aSon = [];
    /* il + gosterge: bir sozcuk il adinin onekiyse, kalanlar gosterge ile eslesir */
    if (q.length > 1) {
      q.forEach(function (t, i) {
        if (t.length < 3) return;
        var es = iller.filter(function (y) { return katla(y.ad_tr).indexOf(t) === 0; });
        if (!es.length || es.length > 3) return;
        var kalan = q.filter(function (_, j) { return j !== i; });
        tek.forEach(function (g) {
          if (g.sadece_tr || !onekler(kalan, gKel(g))) return;
          es.forEach(function (y) { if (birlesik.length < 3) birlesik.push(gSonuc(g, "", y)); });
        });
      });
    }
    iller.forEach(function (y) {
      if (onekler(q, sozcukler(y.ad_tr))) ilSon.push({ tur: "il", ad: y.ad_tr, ek: "İl", href: "veri-portali.html#yer=" + y.kod, pasif: false });
    });
    ilSon.sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
    var gEs = tek.filter(function (g) { return onekler(q, gKel(g)); });
    gEs.sort(function (a, b) {
      var pa = katla(a.baslik).indexOf(q[0]) === 0 ? 0 : 1, pb = katla(b.baslik).indexOf(q[0]) === 0 ? 0 : 1;
      return pa - pb;
    });
    gEs.forEach(function (g) { gSon.push(gSonuc(g)); });
    var aAd = [];
    A.forEach(function (a) { /* adiyla eslesen arac, gostergelerden once; yalniz aciklamasiyla eslesen sonda */
      var r = { tur: "arac", ad: a.ad, ek: a.aciklama || "Araç", href: a.href, pasif: !!a.pasif };
      if (onekler(q, sozcukler(a.ad))) aAd.push(r);
      else if (onekler(q, sozcukler(a.aciklama || ""))) aSon.push(r);
    });
    return birlesik.concat(ilSon.slice(0, 3), aAd.slice(0, 3), gSon.slice(0, 5), aSon.slice(0, 2)).slice(0, 8);
  }
  /* portaldaki gibi n esit sayili sinif: esik[i-1]=vals[min(len-1,floor(len*i/n))]; sinif = x>=esik sayisi */
  function sinifla(d, n) {
    n = n || 5;
    var vals = [], sinif = {};
    Object.keys(d).forEach(function (k) { if (typeof d[k] === "number" && isFinite(d[k])) vals.push(d[k]); });
    vals.sort(function (a, b) { return a - b; });
    var esik = [];
    if (vals.length) for (var i = 1; i < n; i++) esik.push(vals[Math.min(vals.length - 1, Math.floor(vals.length * i / n))]);
    Object.keys(d).forEach(function (k) {
      var x = d[k];
      if (typeof x !== "number" || !isFinite(x)) { sinif[k] = null; return; }
      var c = 0; while (c < esik.length && x >= esik[c]) c++;
      sinif[k] = c;
    });
    return { esik: esik, sinif: sinif };
  }
  /* harita paleti (portaldaki RENK) ve secili il tonlari: her koyu ton hem kendi sinifindan hem ust sinifin renginden ayirt edilir */
  var PAL5 = ["#f7e1e2", "#eeb3b6", "#e0777c", "#c63a41", "#7b0828"], KOYU5 = ["#d27f84", "#b24348", "#8f1f27", "#2a0310", "#1a0108"];
  function turkiye(g, i) {
    var v = g.veri.TR ? g.veri.TR[i] : null; return (typeof v === "number" && isFinite(v)) ? v : null;
  }
  global.GirisHesap = { sonYil: sonYil, ilDegerleri: ilDegerleri, fark: fark, sirala: sirala, bul: bul, turkiye: turkiye, sinifla: sinifla, PAL5: PAL5, KOYU5: KOYU5, katla: katla, araBul: araBul, MIN_IL: MIN_IL };
})(window);
