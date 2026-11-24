/* Kırılım Gezgini sayfası: menüler ve çizim. Hesap: kirilim-hesap.js */
(function () {
  var D = window.KIRILIM_DIZIN, H = window.KirilimHesap;
  var $ = function (id) { return document.getElementById(id); };
  var durum = { sutun: "_T", konu: 0, tablo: null, roller: null, yer: "TR", donem: 0, cikti: "matris", deger: "sayi", kars: false, sabit: {} };
  var tablo = null;
  // Adres: ?tablo=<kod> o tabloyu açar; &gomulu=1 başka sayfanın içine gömülür (üst bar ve tablo seçimi gizli)
  var Q = new URLSearchParams(location.search), GOMULU = Q.get("gomulu") === "1";
  if (GOMULU) document.documentElement.classList.add("gomulu");
  function yukseklikBildir() {
    if (GOMULU && window.parent !== window) setTimeout(function () { window.parent.postMessage({ kirilimYukseklik: document.documentElement.scrollHeight }, "*"); }, 0);
  }
  window.__kirilim = { durum: durum, hatalar: 0, konuSec: function (i) { konuSec(i); } };
  window.addEventListener("error", function () { window.__kirilim.hatalar++; });

  function kacis(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function secenekler(liste) {
    return liste.map(function (x) { return '<option value="' + kacis(x[0]) + '">' + kacis(x[1]) + "</option>"; }).join("");
  }
  function dizinTablo(kod) {
    for (var i = 0; i < D.konular.length; i++)
      for (var j = 0; j < D.konular[i].tablolar.length; j++)
        if (D.konular[i].tablolar[j].kod === kod) return D.konular[i].tablolar[j];
    return null;
  }

  /* --- menüler ----------------------------------------------------------- */
  function konuSekmeleri() {
    $("konu").innerHTML = D.konular.map(function (k, i) {
      return '<button role="tab" data-k="' + i + '" aria-selected="' + (i === durum.konu) + '">' + kacis(k.ad) + "</button>";
    }).join("");
  }

  function konuSec(i, kod) {
    durum.konu = i;
    konuSekmeleri();
    var liste = D.konular[i].tablolar;
    $("tablo").innerHTML = secenekler(liste.map(function (x) { return [x.kod, x.baslik]; }));
    tabloSec(kod || liste[0].kod);
  }

  function tabloYukle(kod) {
    return new Promise(function (coz, red) {
      if (window.KIRILIM_TABLO && window.KIRILIM_TABLO[kod]) return coz(window.KIRILIM_TABLO[kod]);
      var s = document.createElement("script");
      s.src = dizinTablo(kod).dosya;
      s.onload = function () { window.KIRILIM_TABLO && window.KIRILIM_TABLO[kod] ? coz(window.KIRILIM_TABLO[kod]) : red(new Error("boş dosya")); };
      s.onerror = function () { red(new Error("dosya yüklenemedi")); };
      document.head.appendChild(s);
    });
  }

  var son = 0;
  function tabloSec(kod) {
    var sira = ++son;
    $("tablo").value = kod;
    $("sonuc").innerHTML = '<div class="yukleniyor">Yükleniyor…</div>';
    tabloYukle(kod).then(function (t) {
      if (sira !== son) return;
      tablo = t;
      durum.tablo = kod;
      roller();
      menuKur();
      yerSecenekleri();
      ciz();
    }, function () {
      if (sira !== son) return;
      $("sonuc").innerHTML = '<div class="bos">Bu tablo yüklenemedi. Sayfayı yenileyip yeniden deneyin.</div>';
    });
  }

  // Eski seçimler yeni tabloda geçerliyse korunur, değilse tablonun varsayılanı gelir
  function roller() {
    var kollar = tablo.kirilimlar.map(function (k) { return k.kol; }), e = durum.roller;
    var gecerli = e && (kollar.indexOf(e.k1) >= 0 || (e.k1 === H.IL && tablo.yerler.length > 1)) && kollar.indexOf(e.k2) >= 0 && e.k1 !== e.k2 &&
      (e.k3 === "-" || (kollar.length > 2 && kollar.indexOf(e.k3) >= 0 && e.k3 !== e.k1 && e.k3 !== e.k2));
    durum.roller = gecerli ? e : H.varsayilanRoller(tablo);
    durum.sabit = {};
    durum.donem = tablo.donemler.length - 1;
    if (tablo.yerler.indexOf(durum.yer) < 0) durum.yer = "TR";
  }

  function menuKur() {
    var n = tablo.kirilimlar.length;
    var liste = tablo.kirilimlar.map(function (k) { return [k.kol, k.ad]; });
    $("k1").innerHTML = secenekler((tablo.yerler.length > 1 ? [[H.IL, "İl"]] : []).concat(liste));
    $("k2").innerHTML = secenekler(liste);
    $("k3").innerHTML = secenekler(liste.concat([["-", "Yok (toplamı al)"]]));
    $("k2w").hidden = n < 2;
    $("k3w").hidden = n < 3;
    esitle();
    $("baslik").textContent = tablo.baslik;
    $("aciklama").textContent = tablo.aciklama + ".";
  }

  function esitle() {
    $("k1").value = durum.roller.k1;
    $("k2").value = durum.roller.k2;
    $("k3").value = durum.roller.k3;
  }

  function rolDegisti(rol, kol) {
    durum.roller = H.rolDuzelt(tablo, durum.roller, rol, kol);
    esitle();
    ciz();
  }

  /* --- biçimler ----------------------------------------------------------- */
  var RENKLER = ["#7b0828", "#d8232a", "#e8836f", "#e9b44c", "#7aa6b4", "#2b6f8a", "#4b4b6b", "#9a9a9a"];
  function say(v) { return v.toLocaleString("tr-TR"); }
  function ond(v, n) { return v.toLocaleString("tr-TR", { minimumFractionDigits: n, maximumFractionDigits: n }); }
  function yuz(v) { return ond(v, 1) + "%"; }
  function renkTek(o) { return "rgba(216,35,42," + (0.06 + Math.min(1, o) * 0.9).toFixed(3) + ")"; }
  function renkFark(f, en) {
    var o = en ? Math.min(1, Math.abs(f) / en) : 0, a = (0.06 + o * 0.85).toFixed(3);
    return f >= 0 ? "rgba(216,35,42," + a + ")" : "rgba(43,111,138," + a + ")";
  }
  function yazi(o) { return o > 0.55 ? "#fff" : "#1d1d1d"; }
  function oranMi() { return tablo.olcu === "oran"; }
  function hm(v) { return oranMi() ? (v === null ? "–" : ond(v, 1)) : say(v || 0); }
  // Tamamen boş satır/sütundaki hücre "yayımlanmıyor" demektir: 0 değil "–"
  function hucre(v, bc, ri, ci) { return v === null && (bc.satir[ri] || bc.sutun[ci]) ? "–" : hm(v); }
  function toplamMetni(v) { return v === null ? "–" : (oranMi() ? ond(v, 1) : say(v)); }
  function kir(kol) {
    if (kol === H.IL) return { kol: H.IL, ad: "İl", kodlar: [], etiketler: [], ortusen: false };
    for (var i = 0; i < tablo.kirilimlar.length; i++) if (tablo.kirilimlar[i].kol === kol) return tablo.kirilimlar[i];
    return null;
  }

  /* --- çıktılar ----------------------------------------------------------- */
  function enHucre(paneller) {
    var en = 0;
    paneller.forEach(function (p) { p.m.forEach(function (s) { s.forEach(function (v) { if (v !== null && v > en) en = v; }); }); });
    return en;
  }

  function matrisHtml(p, tr, en, enFark) {
    var pay = durum.deger === "pay" && !oranMi(), a1 = kir(durum.roller.k1).ad, a2 = kir(durum.roller.k2).ad;
    var pp = H.pay(p), fk = tr ? H.fark(p, tr, tablo.olcu) : null, bc = H.bosCizgi(p);
    var h = '<div class="kaydir"><table class="mat"><thead><tr><th class="sol">' + kacis(a1) + " ↓ / " + kacis(a2) + " →</th>";
    p.sutunEtiket.forEach(function (e) { h += "<th>" + kacis(e) + "</th>"; });
    h += '<th class="top">Toplam</th></tr></thead><tbody>';
    p.satirEtiket.forEach(function (e, ri) {
      h += '<tr><th class="sol">' + kacis(e) + "</th>";
      p.m[ri].forEach(function (v, ci) {
        var goster, o, stil, oz = "";
        if (fk) {
          var f = fk[ri][ci];
          o = f === null ? 0 : Math.min(1, Math.abs(f) / (enFark || 1));
          goster = f === null ? "–" : (f > 0 ? "+" : "") + ond(f, 1) + (oranMi() ? "" : " p");
          stil = f === null ? "" : "background:" + renkFark(f, enFark) + ";color:" + yazi(o);
          oz = ' data-fark="' + (f === null ? "" : f.toFixed(2)) + '"';
        } else if (pay) {
          o = pp[ri][ci] === null ? 0 : Math.min(1, pp[ri][ci] / 100 * 1.4);
          goster = pp[ri][ci] === null ? "–" : yuz(pp[ri][ci]);
          stil = pp[ri][ci] === null ? "" : "background:" + renkTek(o) + ";color:" + yazi(o);
        } else {
          o = v === null || !en ? 0 : v / en;
          goster = hucre(v, bc, ri, ci);
          stil = v === null ? "" : "background:" + renkTek(o) + ";color:" + yazi(o);
        }
        h += '<td style="' + stil + '"' + oz + ' title="' + kacis(e + " / " + p.sutunEtiket[ci] + ": " + hucre(v, bc, ri, ci)) + '">' + goster + "</td>";
      });
      h += '<td class="top">' + toplamMetni(p.satirT[ri]) + "</td></tr>";
    });
    h += '<tr><th class="sol top">Toplam</th>';
    p.sutunT.forEach(function (v) { h += '<td class="top">' + toplamMetni(v) + "</td>"; });
    return h + '<td class="top">' + toplamMetni(p.toplam) + "</td></tr></tbody></table></div>";
  }

  function cubukHtml(p) {
    var h = "", pp = H.pay(p);
    p.satirEtiket.forEach(function (e, ri) {
      h += '<div class="cubuk"><span class="e">' + kacis(e) + '</span><div class="r">';
      p.sutunEtiket.forEach(function (c, ci) {
        var pv = pp[ri][ci] || 0;
        h += '<i style="width:' + pv.toFixed(1) + "%;background:" + RENKLER[ci % RENKLER.length] + '" title="' +
          kacis(c + ": " + hm(p.m[ri][ci]) + " (" + yuz(pv) + ")") + '"></i>';
      });
      h += "</div></div>";
    });
    return h;
  }

  function piramitHtml(p, en) {
    var h = "", pay = durum.deger === "pay", pp = H.pay(p);
    p.satirEtiket.forEach(function (e, ri) {
      var l = pay ? (pp[ri][0] || 0) : (p.m[ri][0] || 0), r = pay ? (pp[ri][1] || 0) : (p.m[ri][1] || 0), ens = pay ? 100 : en || 1;
      h += '<div class="piramit"><div class="sl"><i style="width:' + (l / ens * 100).toFixed(1) + "%;background:" + RENKLER[0] +
        '" title="' + kacis(p.sutunEtiket[0] + ": " + (pay ? yuz(l) : say(l))) + '"></i></div>' +
        '<div class="m">' + kacis(e) + '</div><div><i style="width:' + (r / ens * 100).toFixed(1) + "%;background:" + RENKLER[1] +
        '" title="' + kacis(p.sutunEtiket[1] + ": " + (pay ? yuz(r) : say(r))) + '"></i></div></div>';
    });
    return h;
  }

  function tabloHtml(p) {
    var pay = durum.deger === "pay" && !oranMi(), pp = H.pay(p), a1 = kir(durum.roller.k1).ad, bc = H.bosCizgi(p);
    var h = '<div class="kaydir"><table class="duz"><thead><tr><th class="t">' + kacis(a1) + "</th>";
    p.sutunEtiket.forEach(function (e) { h += "<th>" + kacis(e) + "</th>"; });
    h += "<th>Toplam</th></tr></thead><tbody>";
    p.satirEtiket.forEach(function (e, ri) {
      h += '<tr><td class="t">' + kacis(e) + "</td>";
      p.m[ri].forEach(function (v, ci) { h += "<td>" + (pay ? (pp[ri][ci] === null ? "–" : yuz(pp[ri][ci])) : hucre(v, bc, ri, ci)) + "</td>"; });
      h += "<td><b>" + toplamMetni(p.satirT[ri]) + "</b></td></tr>";
    });
    h += '<tr class="g"><td class="t">Toplam</td>';
    p.sutunT.forEach(function (v) { h += "<td>" + toplamMetni(v) + "</td>"; });
    return h + "<td>" + toplamMetni(p.toplam) + "</td></tr></tbody></table></div>";
  }

  /* --- seçici durumları --------------------------------------------------- */
  function yerAdi(kod) {
    for (var i = 0; i < D.yerler.length; i++) if (D.yerler[i].kod === kod) return D.yerler[i].ad_tr;
    return kod;
  }
  function kontrolleriKur() {
    var oran = oranMi(), k2 = kir(durum.roller.k2), ilMod = durum.roller.k1 === H.IL;
    var k2n = k2 ? k2.kodlar.filter(function (k) { return k !== "_T"; }).length : 0;
    var secenek = [["matris", "Isı matrisi", false], ["cubuk", "Yığılmış çubuk", oran || (k2 && k2.ortusen)],
      ["piramit", "Karşılıklı çubuk", oran || (k2 && k2.ortusen) || k2n !== 2], ["tablo", "Tablo", false],
      ["zaman", "Zaman serisi", ilMod || tablo.donemler.length < 2, ilMod ? "İl kırılımında zaman serisi yoktur" : "Tek dönemli tabloda zaman serisi yoktur"],
      ["harita", "Harita", !ilMod, "İl kırılımı seçilince açılır"]];
    var gecerli = secenek.filter(function (x) { return x[0] === durum.cikti && !x[2]; }).length;
    if (!gecerli) durum.cikti = "matris";
    $("cikti").innerHTML = secenek.map(function (x) {
      return '<button data-c="' + x[0] + '" aria-pressed="' + (x[0] === durum.cikti) + '"' + (x[2] ? ' disabled title="' + (x[3] || "") + '"' : "") + ">" + x[1] + "</button>";
    }).join("");
    if (oran) durum.deger = "sayi";
    Array.prototype.forEach.call($("deger").querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.d === durum.deger);
      if (b.dataset.d === "pay") b.disabled = oran;
    });
    var coklu = tablo.yerler.length > 1;
    $("yerw").hidden = !coklu || ilMod;
    $("karsw").hidden = !coklu || ilMod;
    var cz = durum.cikti === "zaman" || durum.cikti === "harita";
    $("sutunw").hidden = !cz;
    if (cz) {
      var opts = [["_T", "Toplam"]].concat(k2.kodlar.map(function (c, i) { return [c, k2.etiketler[i]]; }).filter(function (x) { return x[0] !== "_T"; }));
      if (!opts.some(function (x) { return x[0] === durum.sutun; })) durum.sutun = "_T";
      $("sutun").innerHTML = secenekler(opts);
      $("sutun").value = durum.sutun;
    }
    $("kars").disabled = durum.yer === "TR";
    $("kars").checked = durum.kars && durum.yer !== "TR";
    $("donemw").hidden = tablo.donemler.length < 2;
    $("donem").max = tablo.donemler.length - 1;
    $("donem").value = durum.donem;
    $("donemYazi").textContent = H.donemEtiketi(tablo.donemEtiket[durum.donem]);
  }

  function yerSecenekleri() {
    $("yer").innerHTML = secenekler(tablo.yerler.map(function (y) { return [y, yerAdi(y)]; }));
    $("yer").value = durum.yer;
  }

  /* --- zaman serisi ve harita --------------------------------------------- */
  function guzelUst(m) {
    if (!m) return 1;
    var e = Math.pow(10, Math.floor(Math.log(m) / Math.LN10)), f = m / e;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
  }
  function degerMetni(v) { return v === null ? "–" : (durum.deger === "pay" && durum.sutun !== "_T" && !oranMi() ? yuz(v) : toplamMetni(v)); }

  function zamanHtml(z) {
    var son = function (s) { for (var i = s.v.length - 1; i >= 0; i--) if (s.v[i] !== null) return s.v[i]; return -1; };
    var dolu = z.seriler.filter(function (s) { return son(s) >= 0; });
    if (!dolu.length) return '<div class="bos">Bu seçim için veri yok.</div>';
    var kesik = dolu.length > 8;
    var ser = dolu.slice().sort(function (a, b) { return son(b) - son(a); }).slice(0, 8);
    var W = 640, Hh = 280, ml = 76, mr = 16, mt = 12, mb = 30, n = z.donemler.length, mx = 0;
    ser.forEach(function (s) { s.v.forEach(function (x) { if (x !== null && x > mx) mx = x; }); });
    var ust = guzelUst(mx);
    function X(i) { return ml + (n > 1 ? i * (W - ml - mr) / (n - 1) : 0); }
    function Y(v) { return mt + (1 - v / ust) * (Hh - mt - mb); }
    var g = "";
    for (var t = 0; t <= 4; t++) {
      var tv = ust * t / 4, yy = Y(tv);
      g += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#e2e2e2"/><text x="' + (ml - 8) + '" y="' + (yy + 4) + '" font-size="12" text-anchor="end" fill="#666">' +
        (durum.deger === "pay" && durum.sutun !== "_T" && !oranMi() ? ond(tv, 0) + "%" : (tv >= 1e6 ? ond(tv / 1e6, 1) + " mn" : say(Math.round(tv)))) + "</text>";
    }
    var adim = Math.ceil(n / 6), etk = "";
    for (var i = 0; i < n; i += adim) etk += '<text x="' + X(i) + '" y="' + (Hh - 8) + '" font-size="12" text-anchor="middle" fill="#666">' + kacis(z.etiketler[i]) + "</text>";
    var yollar = "", lej = "";
    ser.forEach(function (s, k) {
      var d = "", acik = false, renk = RENKLER[k % RENKLER.length];
      s.v.forEach(function (x, i) {
        if (x === null) { acik = false; return; }
        d += (acik ? "L" : "M") + X(i).toFixed(1) + " " + Y(x).toFixed(1); acik = true;
      });
      yollar += '<path class="seri" d="' + d + '" fill="none" stroke="' + renk + '" stroke-width="2.4"><title>' + kacis(s.ad + ": " + degerMetni(son(s))) + "</title></path>";
      lej += '<span class="r" style="--r:' + renk + '">' + kacis(s.ad) + "</span>";
    });
    return '<svg viewBox="0 0 ' + W + " " + Hh + '" class="zsvg" role="img" aria-label="Zaman serisi">' + g + yollar + etk + "</svg>" +
      '<div class="lejant">' + lej + "</div>" + (kesik ? '<p class="uyari">Son dönem değeri en yüksek 8 satır gösteriliyor.</p>' : "");
  }

  function haritayiYukle() {
    if (window.HARITA_IL) return true;
    if (!document.getElementById("haritaJs")) {
      var s = document.createElement("script");
      s.id = "haritaJs"; s.src = "veri/harita_il.js";
      s.onload = function () { ciz(); };
      document.head.appendChild(s);
    }
    return false;
  }

  function haritaHtml(p) {
    var ci = durum.sutun === "_T" ? -1 : p.sutunKodlar.indexOf(durum.sutun);
    var pay = durum.deger === "pay" && ci >= 0 && !oranMi(), pp = pay ? H.pay(p) : null, v = {};
    p.satirKodlar.forEach(function (y, ri) { v[y] = ci < 0 ? p.satirT[ri] : (pay ? pp[ri][ci] : p.m[ri][ci]); });
    var liste = Object.keys(v).map(function (y) { return v[y]; }).filter(function (x) { return x !== null; }).sort(function (a, b) { return a - b; });
    if (!liste.length) return '<div class="bos">Bu seçim için veri yok.</div>';
    var esik = [0.2, 0.4, 0.6, 0.8].map(function (q) { return liste[Math.floor(q * liste.length)]; });
    var renk = ["#fbeaea", "#f1b9bc", "#e5767b", "#d8232a", "#7b0828"];
    function sinif(x) { var i = 0; while (i < 4 && x >= esik[i]) i++; return i; }
    var k = Math.cos(39 * Math.PI / 180);
    var yol = window.HARITA_IL.features.map(function (f) {
      var g = f.geometry, poli = g.type === "Polygon" ? [g.coordinates] : g.coordinates, d = "";
      poli.forEach(function (halka) { halka.forEach(function (r) {
        r.forEach(function (c, i) { d += (i ? "L" : "M") + ((c[0] - 25.5) * k * 60).toFixed(1) + " " + ((42.4 - c[1]) * 60).toFixed(1); });
        d += "Z";
      }); });
      var x = v[f.properties.kod];
      return '<path class="il" d="' + d + '" fill="' + (x === undefined || x === null ? "#eee" : renk[sinif(x)]) + '" stroke="#fff" stroke-width=".6"><title>' +
        kacis(f.properties.ad + ": " + degerMetni(x === undefined ? null : x)) + "</title></path>";
    }).join("");
    var lej = renk.map(function (r) { return '<i style="display:inline-block;width:40px;height:10px;background:' + r + '"></i>'; }).join("");
    return '<svg viewBox="0 0 ' + ((44.9 - 25.5) * k * 60).toFixed(0) + " " + ((42.4 - 35.7) * 60).toFixed(0) + '" class="hsvg" role="img" aria-label="İllere göre harita">' + yol + "</svg>" +
      '<div class="lejant"><span>' + degerMetni(liste[0]) + "</span>" + lej + "<span>" + degerMetni(liste[liste.length - 1]) + "</span></div>";
  }

  /* --- çizim -------------------------------------------------------------- */
  function notlar(paneller, kesildi, toplamPanel) {
    var h = "", r = durum.roller, p0 = paneller[0];
    if (p0.sabitlenen.length) {
      h += '<p class="uyari" id="sabit">Bu tabloda toplamı anlamlı olmayan kırılımlar tek bir değere sabitlendi: ';
      h += p0.sabitlenen.map(function (s) {
        var k = kir(s.kol);
        var opts = k.kodlar.map(function (c, i) {
          return c === "_T" ? "" : '<option value="' + kacis(c) + '"' + (k.etiketler[i] === s.etiket ? " selected" : "") + ">" + kacis(k.etiketler[i]) + "</option>";
        }).join("");
        return kacis(s.ad) + ' <select data-sabit="' + kacis(s.kol) + '" aria-label="' + kacis(s.ad) + '">' + opts + "</select>";
      }).join(" · ");
      h += ".</p>";
    }
    if (kesildi) h += '<p class="uyari">Seçilen kırılımın ' + toplamPanel + " değeri var; ilk altısı gösteriliyor. Daha az değerli bir kırılım seçebilirsiniz.</p>";
    if (paneller.some(function (p) { return H.kucukUyari(p, tablo.olcu); })) {
      h += '<p class="uyari">Bazı panellerde gözlem az (toplam 1.000’in altında); değerler yıldan yıla dalgalanabilir.</p>';
    }
    [r.k1, r.k2, r.k3].forEach(function (kol) {
      var k = kol && kol !== "-" ? kir(kol) : null;
      if (k && k.ortusen) h += '<p class="uyari">“' + kacis(k.ad) + "” kırılımında bazı gruplar iç içedir (örneğin 60+ ile 75+); satırları kendiliğinden toplamayın, toplamlar kaynağın kendi toplamıdır.</p>";
    });
    if (oranMi()) h += '<p class="uyari">Değerler oran ya da yüzdedir; toplanmaz, satır payı hesaplanmaz.</p>';
    $("notlar").innerHTML = h;
  }

  function ciz() {
    var k = tablo.kirilimlar, r = durum.roller;
    kontrolleriKur();
    $("ipucu").textContent = "Satır: " + kir(r.k1).ad + " · Sütun: " + kir(r.k2).ad +
      (r.k3 === "-" ? (k.length > 2 ? " · Üçüncü kırılım toplamı alınıyor" : "") : " · " + kir(r.k3).ad + " paneller olarak ayrıldı");
    var donem = tablo.donemler[durum.donem];
    var ilMod = r.k1 === H.IL, yerMap = {};
    tablo.yerler.forEach(function (y) { yerMap[y] = yerAdi(y); });
    var tum = ilMod ? H.ilKesit(tablo, donem, r, durum.sabit, yerMap) : H.kesit(tablo, donem, durum.yer, r, durum.sabit);
    $("lejant").innerHTML = "";
    $("kaynak").textContent = "Kaynak: TÜİK (" + tablo.df_id + "). Birim: " + tablo.birim + ". Yer: " + (ilMod ? "81 il" : yerAdi(durum.yer)) +
      ", dönem: " + H.donemEtiketi(tablo.donemEtiket[durum.donem]) + ".";
    if (!tum.length) {
      $("sonuc").innerHTML = '<div class="bos">Bu seçim için veri yok. Başka bir yer ya da dönem deneyin.</div>';
      $("notlar").innerHTML = "";
      return;
    }
    var kes = H.ilkAlti(tum), paneller = kes.paneller;
    if (durum.cikti === "zaman") {
      var zs = H.zamanSerisi(tablo, durum.yer, r, durum.sabit, durum.sutun, durum.deger === "pay" && durum.sutun !== "_T" && !oranMi());
      var zk = H.ilkAlti(zs);
      $("sonuc").innerHTML = '<div class="paneller">' + zk.paneller.map(function (z) {
        return '<div class="panelkutu">' + (z.ad ? "<h4>" + kacis(kir(r.k3).ad + ": " + z.ad) + "</h4>" : "") + zamanHtml(z) + "</div>";
      }).join("") + "</div>";
      notlar(paneller, zk.kesildi, zs.length);
      yukseklikBildir();
      return;
    }
    if (durum.cikti === "harita") {
      if (!haritayiYukle()) { $("sonuc").innerHTML = '<div class="yukleniyor">Harita yükleniyor…</div>'; return; }
      $("sonuc").innerHTML = '<div class="paneller">' + paneller.map(function (p) {
        return '<div class="panelkutu">' + (p.ad ? "<h4>" + kacis(kir(r.k3).ad + ": " + p.ad) + "</h4>" : "") + haritaHtml(p) + "</div>";
      }).join("") + "</div>";
      notlar(paneller, kes.kesildi, tum.length);
      yukseklikBildir();
      return;
    }
    var trP = durum.kars && durum.yer !== "TR" && !ilMod ? H.kesit(tablo, donem, "TR", r, durum.sabit) : null;
    if (trP && trP.length !== paneller.length) trP = null;
    var en = enHucre(paneller), enFark = 0;
    if (trP) paneller.forEach(function (p, i) {
      H.fark(p, trP[i], tablo.olcu).forEach(function (s) { s.forEach(function (v) { if (v !== null && Math.abs(v) > enFark) enFark = Math.abs(v); }); });
    });
    var h = '<div class="paneller">';
    paneller.forEach(function (p, i) {
      h += '<div class="panelkutu">' + (p.ad ? "<h4>" + kacis(kir(r.k3).ad + ": " + p.ad) + "</h4>" : "");
      if (durum.cikti === "cubuk") h += cubukHtml(p);
      else if (durum.cikti === "piramit") h += piramitHtml(p, en);
      else if (durum.cikti === "tablo") h += tabloHtml(p);
      else h += matrisHtml(p, trP ? trP[i] : null, en, enFark);
      h += "</div>";
    });
    $("sonuc").innerHTML = h + "</div>";
    var c = paneller[0].sutunEtiket, lej = "";
    if (durum.cikti === "cubuk" || durum.cikti === "piramit") {
      lej = c.map(function (e, i) { return '<span class="r" style="--r:' + RENKLER[i % RENKLER.length] + '">' + kacis(e) + "</span>"; }).join("");
    } else if (durum.cikti === "matris") {
      lej = trP ? '<span class="r" style="--r:rgba(216,35,42,.9)">Yer, Türkiye’den yüksek</span><span class="r" style="--r:rgba(43,111,138,.9)">Düşük</span>'
        : '<span class="r" style="--r:rgba(216,35,42,.9)">Koyu: değer yüksek</span>';
    }
    $("lejant").innerHTML = lej;
    notlar(paneller, kes.kesildi, tum.length);
    yukseklikBildir();
  }
  window.__kirilim.ciz = function () { ciz(); };

  /* --- olaylar ----------------------------------------------------------- */
  $("konu").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-k]");
    if (b) konuSec(+b.dataset.k);
  });
  $("tablo").addEventListener("change", function () { tabloSec(this.value); });
  $("k1").addEventListener("change", function () { rolDegisti("k1", this.value); });
  $("k2").addEventListener("change", function () { rolDegisti("k2", this.value); });
  $("k3").addEventListener("change", function () { rolDegisti("k3", this.value); });
  $("cikti").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    durum.cikti = b.dataset.c; ciz();
  });
  $("deger").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    durum.deger = b.dataset.d; ciz();
  });
  $("sutun").addEventListener("change", function () { durum.sutun = this.value; ciz(); });
  $("yer").addEventListener("change", function () { durum.yer = this.value; ciz(); });
  $("donem").addEventListener("input", function () { durum.donem = +this.value; ciz(); });
  $("kars").addEventListener("change", function () { durum.kars = this.checked; ciz(); });
  $("notlar").addEventListener("change", function (e) {
    var kol = e.target.dataset && e.target.dataset.sabit;
    if (kol) { durum.sabit[kol] = e.target.value; ciz(); }
  });

  var ilk = Q.get("tablo"), ilkKonu = 0;
  D.konular.forEach(function (k, i) { k.tablolar.forEach(function (x) { if (x.kod === ilk) ilkKonu = i; }); });
  konuSec(ilkKonu, ilk && dizinTablo(ilk) ? ilk : null);
  window.addEventListener("resize", yukseklikBildir);
})();
