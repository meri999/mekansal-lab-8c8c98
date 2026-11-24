/* Kırılım matrisi hesapları: saf fonksiyonlar, DOM'a dokunmaz.
   Tablo biçimi: betikler/05f_kirilim_uret.R çıktısı (window.KIRILIM_TABLO[kod]).
   v[donem][yer] yoğun düz dizidir; en soldaki kırılım en yavaş değişir. */
(function (global) {
  function kirKodlari(tablo) { return tablo.kirilimlar.map(function (k) { return k.kol; }); }
  function kirBul(tablo, kol) {
    for (var i = 0; i < tablo.kirilimlar.length; i++) if (tablo.kirilimlar[i].kol === kol) return i;
    return -1;
  }
  // _T dışındaki kodların dizinleri
  function gercekler(kir) {
    var s = [];
    kir.kodlar.forEach(function (k, i) { if (k !== "_T") s.push(i); });
    return s;
  }
  function adimlar(tablo) {
    var n = tablo.kirilimlar.length, a = new Array(n), c = 1;
    for (var i = n - 1; i >= 0; i--) { a[i] = c; c *= tablo.kirilimlar[i].kodlar.length; }
    return a;
  }

  /* spec[i]: i. kırılım için toplanacak kod dizinleri; toplam null ise hepsi boş */
  function topla(tablo, vec, spec) {
    var adim = adimlar(tablo), t = 0, dolu = false;
    (function gez(i, ofs) {
      if (i === spec.length) {
        var x = vec[ofs];
        if (x !== null && x !== undefined) { t += x; dolu = true; }
        return;
      }
      for (var j = 0; j < spec[i].length; j++) gez(i + 1, ofs + spec[i][j] * adim[i]);
    })(0, 0);
    return dolu ? t : null;
  }

  function varsayilanRoller(tablo) {
    var kir = tablo.kirilimlar, r = { k1: kir[0].kol, k2: kir[1] ? kir[1].kol : null, k3: "-" };
    if (kir[2] && gercekler(kir[2]).length <= 6) r.k3 = kir[2].kol;
    return r;
  }

  /* Aynı kırılım iki rolde olmasın: çakışan eski rol boşta kalan kırılıma geçer */
  function rolDuzelt(tablo, roller, rol, kol) {
    var kollar = kirKodlari(tablo), yeni = { k1: roller.k1, k2: roller.k2, k3: roller.k3 };
    if (kol !== "-" && kollar.indexOf(kol) < 0) return yeni;
    if (kol === "-" && rol !== "k3") return yeni;
    yeni[rol] = kol;
    ["k1", "k2", "k3"].forEach(function (r) {
      if (r === rol || kol === "-" || yeni[r] !== kol) return;
      var kullanilan = ["k1", "k2", "k3"].filter(function (x) { return x !== r; }).map(function (x) { return yeni[x]; });
      var bos = kollar.filter(function (k) { return kullanilan.indexOf(k) < 0; })[0];
      yeni[r] = bos || (r === "k3" ? "-" : yeni[r]);
    });
    return yeni;
  }

  /* Seçilen dönem ve yer için panel listesi. Boş dizi: bu seçim için veri yok. */
  function kesit(tablo, donem, yer, roller, sabit) {
    var vec = tablo.v[donem] && tablo.v[donem][yer];
    if (!vec) return [];
    sabit = sabit || {};
    var sayi = tablo.olcu === "sayi", kir = tablo.kirilimlar;
    var i1 = kirBul(tablo, roller.k1), i2 = kirBul(tablo, roller.k2);
    var i3 = roller.k3 && roller.k3 !== "-" ? kirBul(tablo, roller.k3) : -1;
    // temel: seçilmeyen kırılım için kullanılacak dilim; alt: temel _T ise ve o hücre boşsa
    // kullanılacak toplam (yalnız sayı ve iç içe olmayan kırılımda)
    var sabitlenen = [], temel = [], alt = [];
    kir.forEach(function (k, i) {
      if (i === i1 || i === i2 || i === i3) { temel.push(null); alt.push(null); return; }
      var ti = k.kodlar.indexOf("_T"), topla_ = sayi && !k.ortusen && !k.toplamAnlamsiz;
      if (ti >= 0 && !k.toplamAnlamsiz) { temel.push([ti]); alt.push(topla_ ? gercekler(k) : null); return; }
      if (topla_) { temel.push(gercekler(k)); alt.push(null); return; }
      var ix = sabit[k.kol] ? k.kodlar.indexOf(sabit[k.kol]) : -1;
      if (ix < 0) ix = gercekler(k)[0];
      temel.push([ix]); alt.push(null);
      sabitlenen.push({ kol: k.kol, ad: k.ad, etiket: k.etiketler[ix] });
    });
    function dene(tm, r, c, p) {
      var spec = tm.slice();
      spec[i1] = r === "_T" ? [kir[i1].kodlar.indexOf("_T")] : [r];
      spec[i2] = c === "_T" ? [kir[i2].kodlar.indexOf("_T")] : [c];
      if (i3 >= 0) spec[i3] = [p];
      return topla(tablo, vec, spec);
    }
    function deger(r, c, p) {
      var v = dene(temel, r, c, p);
      if (v === null && alt.some(function (a) { return a; })) {
        v = dene(temel.map(function (x, i) { return alt[i] || x; }), r, c, p);
      }
      return v;
    }
    function toplamKodu(i) { return kir[i].kodlar.indexOf("_T") >= 0 ? "_T" : null; }
    var sT = toplamKodu(i1), cT = toplamKodu(i2);
    var satirlar = gercekler(kir[i1]), sutunlar = gercekler(kir[i2]);
    var panelKodlari = i3 >= 0 ? gercekler(kir[i3]) : [null];

    return panelKodlari.map(function (p) {
      var m = satirlar.map(function (r) { return sutunlar.map(function (c) { return deger(r, c, p); }); });
      function dizi(liste) {
        var t = 0, dolu = false;
        liste.forEach(function (x) { if (x !== null) { t += x; dolu = true; } });
        return dolu ? t : null;
      }
      var kapsayan2 = kir[i2].ortusen, kapsayan1 = kir[i1].ortusen;
      var satirT = satirlar.map(function (r, ri) {
        var v = cT ? deger(r, "_T", p) : null;
        return v === null && sayi && !kapsayan2 ? dizi(m[ri]) : v;
      });
      var sutunT = sutunlar.map(function (c, ci) {
        var v = sT ? deger("_T", c, p) : null;
        return v === null && sayi && !kapsayan1 ? dizi(m.map(function (row) { return row[ci]; })) : v;
      });
      var toplam = sT && cT ? deger("_T", "_T", p) : null;
      if (toplam === null && sayi && !kapsayan1 && !kapsayan2) toplam = dizi(satirT);
      return {
        kod: p === null ? null : kir[i3].kodlar[p],
        ad: p === null ? null : kir[i3].etiketler[p],
        satirKodlar: satirlar.map(function (i) { return kir[i1].kodlar[i]; }),
        satirEtiket: satirlar.map(function (i) { return kir[i1].etiketler[i]; }),
        sutunKodlar: sutunlar.map(function (i) { return kir[i2].kodlar[i]; }),
        sutunEtiket: sutunlar.map(function (i) { return kir[i2].etiketler[i]; }),
        m: m, satirT: satirT, sutunT: sutunT, toplam: toplam, sabitlenen: sabitlenen
      };
    });
  }

  /* Satır payı (%): satır toplamı yoksa null (uydurma 0 değil), gerçek 0 ise 0;
     eksik hücre toplam varken 0 */
  function pay(panel) {
    return panel.m.map(function (satir, ri) {
      var t = panel.satirT[ri];
      return satir.map(function (v) { return t === null || t === undefined ? null : (t ? (v || 0) / t * 100 : 0); });
    });
  }

  /* Yer ile Türkiye farkı: sayıda payların farkı (yüzde puanı), oranda değerlerin farkı;
     taraflardan biri bilinmiyorsa null */
  function fark(panel, panelTR, olcu) {
    if (olcu === "sayi") {
      var a = pay(panel), b = pay(panelTR);
      return a.map(function (s, ri) { return s.map(function (v, ci) { var w = b[ri][ci]; return v === null || w === null ? null : v - w; }); });
    }
    return panel.m.map(function (s, ri) {
      return s.map(function (v, ci) {
        var w = panelTR.m[ri][ci];
        return v === null || w === null ? null : v - w;
      });
    });
  }

  /* Tamamen boş (hiç gözlem yok) satır ve sütunlar: yapısal olarak yayımlanmayan kategoriler */
  function bosCizgi(panel) {
    var satir = panel.m.map(function (s) { return s.every(function (v) { return v === null; }); });
    var sutun = panel.m.length ? panel.m[0].map(function (_, ci) { return panel.m.every(function (s) { return s[ci] === null; }); }) : [];
    return { satir: satir, sutun: sutun };
  }

  function kucukUyari(panel, olcu) {
    return olcu === "sayi" && panel.toplam !== null && panel.toplam !== undefined && panel.toplam < 1000;
  }
  function donemEtiketi(kod) { return String(kod).replace(/^(\d{4})-Q([1-4])$/, "$1 Ç$2"); }
  function ilkAlti(paneller) { return { paneller: paneller.slice(0, 6), kesildi: paneller.length > 6 }; }

  global.KirilimHesap = {
    varsayilanRoller: varsayilanRoller, rolDuzelt: rolDuzelt, kesit: kesit, pay: pay, fark: fark,
    bosCizgi: bosCizgi, kucukUyari: kucukUyari, donemEtiketi: donemEtiketi, ilkAlti: ilkAlti
  };
})(window);
