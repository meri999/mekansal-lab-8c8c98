/* Kırılım Gezgini hesapları: saf fonksiyonlar, DOM'a dokunmaz.
   Tablo biçimi: betikler/05f_kirilim_uret.R çıktısı (window.KIRILIM_TABLO[kod]).
   v[donem][yer] yoğun düz dizidir; en soldaki kırılım en yavaş değişir. */
(function (global) {
  var IL = "__IL";   // "İl" sanal kırılımı: satırlar iller olur (yalnız Kırılım 1)
  var BOLGE = "__BOLGE";   // "Bölge" sanal kırılımı: satırlar İBBS-2 bölgeleri (yalnız Kırılım 1)

  /* Yer kodları: TR (Türkiye), TRxx (İBBS-2, 4 karakter), TRxxx (il, 5 karakter) */
  function bolgeKoduMu(kod) { return typeof kod === "string" && /^TR[0-9A-C][0-9]$/.test(kod); }
  function ilBolgesi(kod) { return typeof kod === "string" && /^TR[0-9A-C][0-9][0-9]$/.test(kod) ? kod.slice(0, 4) : null; }
  // Tablonun coğrafi düzeyi: bir tablo il ya da bölge verisi taşır (karışık değil)
  function yerDuzeyi(tablo) {
    var y = tablo.yerler || [];
    if (y.some(bolgeKoduMu)) return "bolge";
    return y.some(function (k) { return k !== "TR"; }) ? "il" : "tr";
  }
  // Kırılım 1'e girebilecek sanal yer kırılımı (yoksa null)
  function yerRolu(tablo) { var d = yerDuzeyi(tablo); return d === "bolge" ? BOLGE : d === "il" ? IL : null; }
  /* Bölge değerlerinden il haritası için il -> değer: her il bağlı olduğu bölgenin değerini alır */
  function bolgeIlDegerleri(bolgeDeger, ilKodlari) {
    var s = {};
    ilKodlari.forEach(function (il) {
      var x = bolgeDeger[ilBolgesi(il)];
      s[il] = x === undefined ? null : x;
    });
    return s;
  }
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
    var kollar = kirKodlari(tablo), yeni = { k1: roller.k1, k2: roller.k2, k3: roller.k3 }, yr = yerRolu(tablo);
    if (yr) kollar.push(yr);
    if ((kol === IL || kol === BOLGE) && rol !== "k1") return yeni;
    if (kol !== "-" && kollar.indexOf(kol) < 0) return yeni;
    if (kol === "-" && rol !== "k3") return yeni;
    yeni[rol] = kol;
    ["k1", "k2", "k3"].forEach(function (r) {
      if (r === rol || kol === "-" || yeni[r] !== kol) return;
      var kullanilan = ["k1", "k2", "k3"].filter(function (x) { return x !== r; }).map(function (x) { return yeni[x]; });
      var bos = kollar.filter(function (k) { return k !== IL && k !== BOLGE && kullanilan.indexOf(k) < 0; })[0];
      yeni[r] = bos || (r === "k3" ? "-" : yeni[r]);
    });
    return yeni;
  }

  /* Eski seçim yeni tabloda geçerli mi (il/bölge rolü yalnız uygun tabloda) */
  function rollerGecerli(tablo, e) {
    var kollar = kirKodlari(tablo), yr = yerRolu(tablo);
    return !!(e && (kollar.indexOf(e.k1) >= 0 || (yr && e.k1 === yr)) && kollar.indexOf(e.k2) >= 0 && e.k1 !== e.k2 &&
      (e.k3 === "-" || (kollar.length > 2 && kollar.indexOf(e.k3) >= 0 && e.k3 !== e.k1 && e.k3 !== e.k2)));
  }

  /* "Bölge" düğmesi: Kırılım 1'i bölgelere çevirir; yeniden basınca önceki kırılım (onceki) ya da
     sütunda olmayan ilk kırılım döner. Bölge verisi olmayan tabloda roller değişmez. */
  function duzeyGecis(tablo, roller, onceki) {
    if (yerRolu(tablo) !== BOLGE) return { k1: roller.k1, k2: roller.k2, k3: roller.k3 };
    if (roller.k1 !== BOLGE) return rolDuzelt(tablo, roller, "k1", BOLGE);
    var kollar = kirKodlari(tablo);
    var kol = kollar.indexOf(onceki) >= 0 ? onceki : (kollar.filter(function (k) { return k !== roller.k2; })[0] || kollar[0]);
    return rolDuzelt(tablo, roller, "k1", kol);
  }

  /* Seçilen dönem ve yer için panel listesi. Boş dizi: bu seçim için veri yok. */
  function kesit(tablo, donem, yer, roller, sabit) {
    var vec = tablo.v[donem] && tablo.v[donem][yer];
    if (!vec) return [];
    sabit = sabit || {};
    var sayi = tablo.olcu === "sayi", kir = tablo.kirilimlar;
    var i1 = roller.k1 && roller.k1 !== "-" ? kirBul(tablo, roller.k1) : -1;
    var i2 = roller.k2 && roller.k2 !== "-" ? kirBul(tablo, roller.k2) : -1;
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
      if (i1 >= 0) spec[i1] = r === "_T" ? [kir[i1].kodlar.indexOf("_T")] : [r];
      if (i2 >= 0) spec[i2] = c === "_T" ? [kir[i2].kodlar.indexOf("_T")] : [c];
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
    function toplamKodu(i) { return i >= 0 && kir[i].kodlar.indexOf("_T") >= 0 ? "_T" : null; }
    var sT = toplamKodu(i1), cT = toplamKodu(i2);
    var satirlar = i1 >= 0 ? gercekler(kir[i1]) : [null], sutunlar = i2 >= 0 ? gercekler(kir[i2]) : [null];
    var panelKodlari = i3 >= 0 ? gercekler(kir[i3]) : [null];

    return panelKodlari.map(function (p) {
      var m = satirlar.map(function (r) { return sutunlar.map(function (c) { return deger(r, c, p); }); });
      function dizi(liste) {
        var t = 0, dolu = false;
        liste.forEach(function (x) { if (x !== null) { t += x; dolu = true; } });
        return dolu ? t : null;
      }
      var kapsayan2 = i2 >= 0 && kir[i2].ortusen, kapsayan1 = i1 >= 0 && kir[i1].ortusen;
      var satirT = satirlar.map(function (r, ri) {
        if (i2 < 0) return m[ri][0];
        var v = cT ? deger(r, "_T", p) : null;
        return v === null && sayi && !kapsayan2 ? dizi(m[ri]) : v;
      });
      var sutunT = sutunlar.map(function (c, ci) {
        if (i1 < 0) return m[0][ci];
        var v = sT ? deger("_T", c, p) : null;
        return v === null && sayi && !kapsayan1 ? dizi(m.map(function (row) { return row[ci]; })) : v;
      });
      var toplam = (i1 < 0 && i2 < 0) ? m[0][0] : (sT && cT ? deger("_T", "_T", p) : null);
      if (toplam === null && sayi && !kapsayan1 && !kapsayan2) toplam = dizi(satirT);
      return {
        kod: p === null ? null : kir[i3].kodlar[p],
        ad: p === null ? null : kir[i3].etiketler[p],
        satirKodlar: satirlar.map(function (i) { return i1 >= 0 ? kir[i1].kodlar[i] : null; }),
        satirEtiket: satirlar.map(function (i) { return i1 >= 0 ? kir[i1].etiketler[i] : "Toplam"; }),
        sutunKodlar: sutunlar.map(function (i) { return i2 >= 0 ? kir[i2].kodlar[i] : null; }),
        sutunEtiket: sutunlar.map(function (i) { return i2 >= 0 ? kir[i2].etiketler[i] : "Toplam"; }),
        m: m, satirT: satirT, sutunT: sutunT, toplam: toplam, sabitlenen: sabitlenen
      };
    });
  }

  /* İl (ya da Bölge) kırılımı: satırlar tablonun iller ya da İBBS-2 bölgeleri (Türkiye hariç), sütunlar roller.k2 (yoksa tek "Toplam" sütunu).
     Sütun toplamları Türkiye satırından gelir. yerAd: {kod: ad}. Boş dizi: Türkiye verisi yok. */
  function ilKesit(tablo, donem, roller, sabit, yerAd) {
    yerAd = yerAd || {};
    var kol = roller.k2 && roller.k2 !== "-" ? roller.k2 : null;
    var kt = { k1: kol, k2: null, k3: roller.k3 };
    var tr = kesit(tablo, donem, "TR", kt, sabit);
    if (!tr.length) return [];
    var iller = tablo.yerler.filter(function (y) { return y !== "TR"; });
    var per = {};
    iller.forEach(function (y) { per[y] = kesit(tablo, donem, y, kt, sabit); });
    return tr.map(function (trp, pi) {
      var m = [], satirT = [];
      iller.forEach(function (y) {
        var p = per[y][pi];
        m.push(trp.m.map(function (_, ci) { return p ? p.m[ci][0] : null; }));
        satirT.push(p ? p.sutunT[0] : null);
      });
      return {
        kod: trp.kod, ad: trp.ad,
        satirKodlar: iller, satirEtiket: iller.map(function (y) { return yerAd[y] || y; }),
        sutunKodlar: trp.satirKodlar, sutunEtiket: trp.satirEtiket,
        m: m, satirT: satirT, sutunT: trp.m.map(function (r) { return r[0]; }), toplam: trp.sutunT[0], sabitlenen: trp.sabitlenen
      };
    });
  }

  /* Zaman serisi: her panel için dönemlere göre satır başına bir seri. sutunKod "_T" ise
     satır toplamı, bir sütun kodu ise o sütunun değeri (pay=true: satır payı %). */
  function zamanSerisi(tablo, yer, roller, sabit, sutunKod, pay_) {
    var donemler = tablo.donemler, tum = donemler.map(function (d) { return kesit(tablo, d, yer, roller, sabit); });
    var son = tum[tum.length - 1];
    if (!son || !son.length) return [];
    return son.map(function (sp, pi) {
      var seriler = sp.satirKodlar.map(function (rk, ri) {
        var v = tum.map(function (panels) {
          var p = panels.filter(function (x) { return x.kod === sp.kod; })[0];
          if (!p) return null;
          var r = p.satirKodlar.indexOf(rk);
          if (r < 0) return null;
          var ci = sutunKod === "_T" ? -1 : p.sutunKodlar.indexOf(sutunKod);
          if (sutunKod !== "_T" && ci < 0) return null;
          if (ci < 0) return p.satirT[r];
          return pay_ ? pay(p)[r][ci] : p.m[r][ci];
        });
        return { kod: rk, ad: sp.satirEtiket[ri], v: v };
      });
      return { kod: sp.kod, ad: sp.ad, donemler: donemler, etiketler: tablo.donemEtiket || donemler, seriler: seriler };
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
    bosCizgi: bosCizgi, ilKesit: ilKesit, zamanSerisi: zamanSerisi, IL: IL, BOLGE: BOLGE,
    bolgeKoduMu: bolgeKoduMu, ilBolgesi: ilBolgesi, yerDuzeyi: yerDuzeyi, yerRolu: yerRolu, bolgeIlDegerleri: bolgeIlDegerleri,
    rollerGecerli: rollerGecerli, duzeyGecis: duzeyGecis, kucukUyari: kucukUyari, donemEtiketi: donemEtiketi, ilkAlti: ilkAlti
  };
})(window);
