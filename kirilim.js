/* Kırılım matrisi sayfası: menüler ve çizim. Hesap: kirilim-hesap.js */
(function () {
  var D = window.KIRILIM_DIZIN, H = window.KirilimHesap;
  var $ = function (id) { return document.getElementById(id); };
  var durum = { konu: 0, tablo: null, roller: null, yer: "TR", donem: 0, cikti: "matris", deger: "sayi", kars: false, sabit: {} };
  var tablo = null;
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

  function konuSec(i) {
    durum.konu = i;
    konuSekmeleri();
    var liste = D.konular[i].tablolar;
    $("tablo").innerHTML = secenekler(liste.map(function (x) { return [x.kod, x.baslik]; }));
    tabloSec(liste[0].kod);
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
    var gecerli = e && kollar.indexOf(e.k1) >= 0 && kollar.indexOf(e.k2) >= 0 && e.k1 !== e.k2 &&
      (e.k3 === "-" || (kollar.length > 2 && kollar.indexOf(e.k3) >= 0 && e.k3 !== e.k1 && e.k3 !== e.k2));
    durum.roller = gecerli ? e : H.varsayilanRoller(tablo);
    durum.sabit = {};
    durum.donem = tablo.donemler.length - 1;
    if (tablo.yerler.indexOf(durum.yer) < 0) durum.yer = "TR";
  }

  function menuKur() {
    var n = tablo.kirilimlar.length;
    var liste = tablo.kirilimlar.map(function (k) { return [k.kol, k.ad]; });
    $("k1").innerHTML = secenekler(liste);
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
  function toplamMetni(v) { return v === null ? "–" : (oranMi() ? ond(v, 1) : say(v)); }
  function kir(kol) {
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
    var pp = H.pay(p), fk = tr ? H.fark(p, tr, tablo.olcu) : null;
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
          o = Math.min(1, pp[ri][ci] / 100 * 1.4);
          goster = yuz(pp[ri][ci]);
          stil = "background:" + renkTek(o) + ";color:" + yazi(o);
        } else {
          o = v === null || !en ? 0 : v / en;
          goster = hm(v);
          stil = v === null ? "" : "background:" + renkTek(o) + ";color:" + yazi(o);
        }
        h += '<td style="' + stil + '"' + oz + ' title="' + kacis(e + " / " + p.sutunEtiket[ci] + ": " + hm(v)) + '">' + goster + "</td>";
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
        h += '<i style="width:' + pp[ri][ci].toFixed(1) + "%;background:" + RENKLER[ci % RENKLER.length] + '" title="' +
          kacis(c + ": " + hm(p.m[ri][ci]) + " (" + yuz(pp[ri][ci]) + ")") + '"></i>';
      });
      h += "</div></div>";
    });
    return h;
  }

  function piramitHtml(p, en) {
    var h = "", pay = durum.deger === "pay", pp = H.pay(p);
    p.satirEtiket.forEach(function (e, ri) {
      var l = pay ? pp[ri][0] : (p.m[ri][0] || 0), r = pay ? pp[ri][1] : (p.m[ri][1] || 0), ens = pay ? 100 : en || 1;
      h += '<div class="piramit"><div class="sl"><i style="width:' + (l / ens * 100).toFixed(1) + "%;background:" + RENKLER[0] +
        '" title="' + kacis(p.sutunEtiket[0] + ": " + (pay ? yuz(l) : say(l))) + '"></i></div>' +
        '<div class="m">' + kacis(e) + '</div><div><i style="width:' + (r / ens * 100).toFixed(1) + "%;background:" + RENKLER[1] +
        '" title="' + kacis(p.sutunEtiket[1] + ": " + (pay ? yuz(r) : say(r))) + '"></i></div></div>';
    });
    return h;
  }

  function tabloHtml(p) {
    var pay = durum.deger === "pay" && !oranMi(), pp = H.pay(p), a1 = kir(durum.roller.k1).ad;
    var h = '<div class="kaydir"><table class="duz"><thead><tr><th class="t">' + kacis(a1) + "</th>";
    p.sutunEtiket.forEach(function (e) { h += "<th>" + kacis(e) + "</th>"; });
    h += "<th>Toplam</th></tr></thead><tbody>";
    p.satirEtiket.forEach(function (e, ri) {
      h += '<tr><td class="t">' + kacis(e) + "</td>";
      p.m[ri].forEach(function (v, ci) { h += "<td>" + (pay ? yuz(pp[ri][ci]) : hm(v)) + "</td>"; });
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
    var oran = oranMi(), k2 = kir(durum.roller.k2);
    var k2n = k2 ? k2.kodlar.filter(function (k) { return k !== "_T"; }).length : 0;
    var secenek = [["matris", "Isı matrisi", false], ["cubuk", "Yığılmış çubuk", oran],
      ["piramit", "Karşılıklı çubuk", oran || k2n !== 2], ["tablo", "Tablo", false]];
    var gecerli = secenek.filter(function (x) { return x[0] === durum.cikti && !x[2]; }).length;
    if (!gecerli) durum.cikti = "matris";
    $("cikti").innerHTML = secenek.map(function (x) {
      return '<button data-c="' + x[0] + '" aria-pressed="' + (x[0] === durum.cikti) + '"' + (x[2] ? " disabled" : "") + ">" + x[1] + "</button>";
    }).join("");
    if (oran) durum.deger = "sayi";
    Array.prototype.forEach.call($("deger").querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.d === durum.deger);
      if (b.dataset.d === "pay") b.disabled = oran;
    });
    var coklu = tablo.yerler.length > 1;
    $("yerw").hidden = !coklu;
    $("karsw").hidden = !coklu;
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
    var tum = H.kesit(tablo, donem, durum.yer, r, durum.sabit);
    $("lejant").innerHTML = "";
    $("kaynak").textContent = "Kaynak: TÜİK (" + tablo.df_id + "). Birim: " + tablo.birim + ". Yer: " + yerAdi(durum.yer) +
      ", dönem: " + H.donemEtiketi(tablo.donemEtiket[durum.donem]) + ".";
    if (!tum.length) {
      $("sonuc").innerHTML = '<div class="bos">Bu seçim için veri yok. Başka bir yer ya da dönem deneyin.</div>';
      $("notlar").innerHTML = "";
      return;
    }
    var kes = H.ilkAlti(tum), paneller = kes.paneller;
    var trP = durum.kars && durum.yer !== "TR" ? H.kesit(tablo, donem, "TR", r, durum.sabit) : null;
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
  $("yer").addEventListener("change", function () { durum.yer = this.value; ciz(); });
  $("donem").addEventListener("input", function () { durum.donem = +this.value; ciz(); });
  $("kars").addEventListener("change", function () { durum.kars = this.checked; ciz(); });
  $("notlar").addEventListener("change", function (e) {
    var kol = e.target.dataset && e.target.dataset.sabit;
    if (kol) { durum.sabit[kol] = e.target.value; ciz(); }
  });

  konuSec(0);
})();
