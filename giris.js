/* Enstitü Sosyal Portal: giris sayfasi. Veri: window.VERI, window.HARITA_IL, window.GIRIS; hesap: window.GirisHesap */
(function () {
  var V = window.VERI, C = window.GIRIS, H = window.GirisHesap, F = (window.HARITA_IL || {}).features;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  if (!C) {
    $("kahraman").innerHTML = '<p class="hata">Sayfa ayarları yüklenemedi. Sayfayı yenileyin; araçlara aşağıdaki bağlantılardan ulaşabilirsiniz.</p>';
    return;
  }
  var VERI_OK = !!(V && H && F && F.length), HERO_OK = false, CTX = {};

  /* ---- yardimcilar ---- */
  var ADLAR = {}, IL = [];
  if (V) V.yerler.forEach(function (y) { ADLAR[y.kod] = y.ad_tr; if (y.duzey === "il") IL.push(y); });
  function gOf(b) { for (var i = 0; i < V.gostergeler.length; i++) if (V.gostergeler[i].baslik === b) return V.gostergeler[i]; return null; }
  function sayi(v, o) { return v.toLocaleString("tr-TR", { minimumFractionDigits: o, maximumFractionDigits: o }); }
  function isaretli(v, o) { return (v > 0 ? "+" : v < 0 ? "−" : "") + sayi(Math.abs(v), o); }
  function kisalt(v, o) { return Math.abs(v) >= 1e6 ? sayi(v / 1e6, 1) + " mn" : sayi(v, o); }
  function sablon(t, d) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return d[k] === undefined ? "—" : d[k]; }); }

  /* ---- kahraman: soru, harita. Hata olursa yalniz bu bolum hata gosterir; konular, arama, alt bilgi kurulmaya devam eder ---- */
  try {
  if (!VERI_OK) throw new Error("Veri yüklenemedi. Sayfayı yenileyin; sorun sürerse veri dosyalarının (veri/*.js) yerinde olduğunu kontrol edin.");
  var gt = gOf(C.harita_gosterge);
  if (!gt) throw new Error("Gösterge bulunamadı: " + C.harita_gosterge);
  var oy = gt.ondalik, s = H.sonYil(gt), deg = H.ilDegerleri(gt, s.i), fk = H.fark(gt, s.i, C.fark_yil);
  var dusus = H.sirala(fk, ADLAR, 1, true)[0], dusuk = H.sirala(deg, ADLAR, 3, true), yuksek = H.sirala(deg, ADLAR, 1, false)[0];
  var tr = H.turkiye(gt, s.i);
  var fgercek = Math.max(1, s.i - Math.max(0, s.i - C.fark_yil)); /* verinin izin verdigi yil farki */
  CTX = {
    tr_son: tr === null ? "—" : sayi(tr, oy), tr_son_yil: s.yil, fark_yil: fgercek,
    en_cok_dusen: dusus ? dusus.ad : "—", en_cok_dusen_deger: dusus ? isaretli(dusus.deger, oy) : "—",
    en_dusuk: dusuk[0] ? dusuk[0].ad : "—", en_dusuk_deger: dusuk[0] ? sayi(dusuk[0].deger, oy) : "—",
    en_dusuk3: dusuk.map(function (x) { return x.ad; }).join(", ") || "—",
    en_yuksek: yuksek ? yuksek.ad : "—", en_yuksek_deger: yuksek ? sayi(yuksek.deger, oy) : "—"
  };

  /* portal haritasindaki gibi bes esit sayili sinif; en cok dusen en koyu */
  var PAL5 = H.PAL5, KOYU5 = H.KOYU5;
  var ters = {}; Object.keys(fk).forEach(function (k) { ters[k] = fk[k] === null ? null : -fk[k]; });
  var SN = H.sinifla(ters).sinif;
  function boya(kod) { var c = SN[kod]; return c === null || c === undefined ? "#ececec" : PAL5[c]; }
  function koyu(kod) { var c = SN[kod]; return c === null || c === undefined ? "#ececec" : KOYU5[c]; }

  /* ---- kahraman ---- */
  $("kahraman").innerHTML =
    '<div><h1>' + esc(C.soru) + '</h1>' +
    '<p class="lead">' + esc(sablon(C.cevap_sablonu, CTX)) + '</p>' +
    '<p style="font-size:13px;color:var(--mut);margin-top:14px">Kaynak: TÜİK, ' + esc(gt.kaynak || "Doğum İstatistikleri") + '. Harita, ' + fgercek + ' yıllık değişimi gösterir (' + esc(String(gt.yillar[s.i - fgercek])) + '–' + esc(s.yil) + ').</p></div>' +
    '<div class="harita-kutu">' +
    '<div id="ilKart" role="status"></div><svg id="harita" role="group" aria-label="İllere göre ' + esc(gt.baslik) + ' değişimi haritası"></svg>' +
    '<div class="lejant"' + (Object.keys(SN).some(function (k) { return SN[k] !== null; }) ? '' : ' hidden') + '>az düşüş' + PAL5.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + 'çok düşüş</div></div>';

  /* ---- harita ---- */
  var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  function halkalar(g) { return g.type === "Polygon" ? [g.coordinates] : g.coordinates; }
  F.forEach(function (f) { halkalar(f.geometry).forEach(function (p) { p[0].forEach(function (c) { minx = Math.min(minx, c[0]); maxx = Math.max(maxx, c[0]); miny = Math.min(miny, c[1]); maxy = Math.max(maxy, c[1]); }); }); });
  var K = 1.28, W = (maxx - minx) * K, HH = maxy - miny;
  var svg = $("harita"); svg.setAttribute("viewBox", "0 0 " + W.toFixed(2) + " " + HH.toFixed(2));
  var yol = "";
  F.forEach(function (f) {
    var kod = f.properties.kod, d = halkalar(f.geometry).map(function (p) {
      return p.map(function (r) { return "M" + r.map(function (c) { return ((c[0] - minx) * K).toFixed(2) + "," + (maxy - c[1]).toFixed(2); }).join("L") + "Z"; }).join("");
    }).join("");
    yol += '<path d="' + d + '" data-k="' + esc(kod) + '" fill="' + boya(kod) + '" tabindex="-1" role="button" aria-label="' + esc(ADLAR[kod] || f.properties.ad || kod) + '"></path>';
  });
  svg.innerHTML = yol;
  var YOLLAR = Array.prototype.slice.call(svg.querySelectorAll("path")).sort(function (a, b) {
    return (ADLAR[a.dataset.k] || "").localeCompare(ADLAR[b.dataset.k] || "", "tr");
  });
  if (YOLLAR.length) YOLLAR[0].setAttribute("tabindex", "0");

  /* ---- il secimi ---- */
  var sirali = H.sirala(deg, ADLAR, 200, true);
  function sec(kod) {
    Array.prototype.forEach.call(svg.querySelectorAll("path.sec"), function (q) { q.classList.remove("sec"); q.setAttribute("fill", boya(q.dataset.k)); });
    var p = svg.querySelector('path[data-k="' + kod + '"]'); if (p) { var odak = document.activeElement === p; p.classList.add("sec"); p.setAttribute("fill", koyu(kod)); svg.appendChild(p); if (odak) p.focus({ preventScroll: true }); }
    var v = deg[kod], f = fk[kod], sira = sirali.map(function (x) { return x.kod; }).indexOf(kod) + 1;
    var kart = $("ilKart");
    kart.innerHTML = '<button type="button" aria-label="Kapat">×</button><h3>' + esc(ADLAR[kod] || kod) + '</h3>' +
      '<div class="b">' + (v === null || v === undefined ? "—" : sayi(v, oy)) + '</div><small>' + esc(gt.baslik) + ', ' + esc(s.yil) + '</small>' +
      (sira ? '<small>' + sirali.length + ' il içinde en düşükten ' + sira + '. sıra</small>' : '') +
      (tr !== null && v !== null && v !== undefined ? '<small>Türkiye ortalamasından ' + isaretli(v - tr, oy) + '</small>' : '') +
      (f !== null && f !== undefined ? '<small>' + fgercek + ' yılda ' + isaretli(f, oy) + '</small>' : '') +
      '<small><a href="veri-portali.html#konu=nufus">Veri portalında aç →</a></small>';
    kart.classList.add("acik");
    kart.querySelector("button").onclick = function () { kart.classList.remove("acik"); if (p) { p.classList.remove("sec"); p.setAttribute("fill", boya(kod)); } };
  }
  svg.addEventListener("click", function (e) { var p = e.target.closest("path"); if (p) sec(p.dataset.k); });
  var ip = $("ipucu");
  svg.addEventListener("mousemove", function (e) {
    var p = e.target.closest("path"); if (!p || !ip) return;
    var v = deg[p.dataset.k];
    ip.style.display = "block"; ip.style.left = (e.clientX + 14) + "px"; ip.style.top = (e.clientY + 14) + "px";
    ip.textContent = (ADLAR[p.dataset.k] || p.dataset.k) + " · " + (v === null || v === undefined ? "veri yok" : sayi(v, oy));
  });
  svg.addEventListener("mouseleave", function () { if (ip) ip.style.display = "none"; });
  svg.addEventListener("keydown", function (e) {
    var p = e.target.closest("path"); if (!p || !p.dataset.k) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sec(p.dataset.k); return; }
    var yon = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
    if (!yon) return;
    e.preventDefault();
    var j = (YOLLAR.indexOf(p) + yon + YOLLAR.length) % YOLLAR.length;
    YOLLAR.forEach(function (q) { q.setAttribute("tabindex", "-1"); });
    YOLLAR[j].setAttribute("tabindex", "0"); YOLLAR[j].focus();
    var ad = ADLAR[YOLLAR[j].dataset.k] || YOLLAR[j].dataset.k, v = deg[YOLLAR[j].dataset.k];
    YOLLAR[j].setAttribute("aria-label", ad + (v === null || v === undefined ? ", veri yok" : ", " + sayi(v, oy)));
  });
  HERO_OK = true;
  } catch (hata) {
    $("kahraman").innerHTML = '<p class="hata">' + esc(hata.message) + '</p>';
  }


  function tarihTr(t) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}:\d{2}))?/.exec(String(t));
    if (!m) return String(t);
    var AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return parseInt(m[3], 10) + " " + AY[parseInt(m[2], 10) - 1] + " " + m[1] + (m[4] ? " " + m[4] : "");
  }
  /* ---- araclar, konular, bulgular, alt bilgi ---- */
  if (V) $("gSay").textContent = V.gostergeler.length;
  $("konuIzgara").innerHTML = C.konular.map(function (k) {
    return '<a class="kart konu" href="veri-portali.html#konu=' + esc(k.kod) + '"><b>' + esc(k.ad) + '</b><span>' + esc(k.alt) + '</span></a>';
  }).join("");
  /* bulgu karti: "gosterge" verilmisse o gostergenin il siralamasindan, verilmemisse kahraman gostergesinden uretilir */
  function bulguCtx(ad) {
    try {
      var g = gOf(ad); if (!g) return null;
      var y = H.sonYil(g), d = H.ilDegerleri(g, y.i), o = g.ondalik;
      var ust = H.sirala(d, ADLAR, 1, false)[0], alt = H.sirala(d, ADLAR, 1, true)[0], t = H.turkiye(g, y.i);
      if (!ust || !alt) return null;
      return { yil: y.yil, tr_son: t === null ? "—" : sayi(t, o), en_yuksek: ust.ad, en_yuksek_deger: sayi(ust.deger, o), en_dusuk: alt.ad, en_dusuk_deger: sayi(alt.deger, o) };
    } catch (e) { return null; }
  }
  if (HERO_OK) {
    var kartlar = C.bulgular.map(function (b) {
      var c = b.gosterge ? bulguCtx(b.gosterge) : CTX;
      if (!c) return ""; /* verisi hesaplanamayan bulgu bos kart olarak gosterilmez */
      return '<a class="hik" href="' + esc(b.link) + '"><div class="t"><h3>' + esc(sablon(b.baslik, c)) + '</h3><p>' + esc(sablon(b.metin, c)) + '</p></div></a>';
    }).filter(Boolean);
    $("bulguIzgara").innerHTML = kartlar.join("");
    if (!kartlar.length) $("bulgular").hidden = true;
  } else {
    $("bulgular").hidden = true; /* bulgular hesaplanan veriye bagli: veri yoksa bos kart gostermek yerine gizlenir */
  }
  $("alt").innerHTML = '<span><b>Kaynak:</b> <a href="https://veriportali.tuik.gov.tr" rel="noopener">TÜİK Veri Portalı</a> (SDMX API)</span>' +
    (V ? '<span><b>Son güncelleme:</b> ' + esc(tarihTr(V.uretim)) + '</span>' : '') +
    '<span>Veri portalındaki "hesaplanmış" göstergeler TÜİK tarafından yayımlanmaz, ilgili tablolardan türetilir. İlişki nedensellik değildir.</span><span>Sınırlar: © EuroGeographics, <a href="https://ec.europa.eu/eurostat/web/gisco" rel="noopener">GISCO</a> (Eurostat)</span><span>Enstitü Sosyal</span>';
  /* ---- genel arama: gosterge, il, arac ---- */
  if (V && H) (function () {
    var gir = $("gAra"), lst = $("gListe"), ac = -1, bulunan = [];
    var araclar = Array.prototype.map.call(document.querySelectorAll("#araclar .arac"), function (k) {
      var h = k.querySelector("h3"), p = k.querySelector("p");
      return { ad: (h.firstChild ? h.firstChild.textContent : h.textContent).trim(), aciklama: p ? p.textContent.trim() : "",
        href: k.getAttribute("href") || "#", pasif: k.classList.contains("yakinda") };
    });
    var ETIKET = { gosterge: "Gösterge", il: "İl", arac: "Araç", birlesik: "İl + gösterge" };
    function ciz() {
      var q = gir.value.trim();
      bulunan = q ? H.araBul(q, { gostergeler: V.gostergeler, yerler: V.yerler, araclar: araclar }) : []; ac = -1;
      if (!q) { lst.hidden = true; gir.setAttribute("aria-expanded", "false"); gir.removeAttribute("aria-activedescendant"); return; }
      lst.innerHTML = bulunan.length ? bulunan.map(function (b, i) {
        return '<li role="option" id="gO' + i + '" data-i="' + i + '"' + (b.pasif ? ' class="pasif" aria-disabled="true"' : '') + '><b class="et">' + ETIKET[b.tur] + '</b><span>' + esc(b.ad) +
          (b.pasif ? ' <em>yakında</em>' : '') + '</span></li>';
      }).join("") : '<li class="yok">Sonuç bulunamadı. Bir gösterge adı (ör. "işsizlik") ya da il adı deneyin.</li>';
      lst.hidden = false; gir.setAttribute("aria-expanded", "true"); gir.removeAttribute("aria-activedescendant");
    }
    function git(i) { var b = bulunan[i]; if (b && !b.pasif) location.href = b.href; }
    function sonraki(yon) {
      for (var n = 1; n <= bulunan.length; n++) {
        var j = (ac + yon * n + bulunan.length * 2) % bulunan.length;
        if (!bulunan[j].pasif) { ac = j; break; }
      }
      Array.prototype.forEach.call(lst.children, function (li, i) { li.classList.toggle("on", i === ac); li.setAttribute("aria-selected", i === ac ? "true" : "false"); });
      if (ac >= 0) gir.setAttribute("aria-activedescendant", "gO" + ac);
    }
    /* "/" tusu aramaya odaklanir (yazi alani, secim kutusu ya da duzenlenebilir alan odaktayken calismaz) */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target, ad = t && t.tagName ? t.tagName.toLowerCase() : "";
      if (ad === "input" || ad === "textarea" || ad === "select" || (t && t.isContentEditable)) return;
      e.preventDefault(); gir.focus(); gir.select();
    });
    gir.addEventListener("input", ciz);
    gir.addEventListener("focus", ciz);
    gir.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (bulunan.length) sonraki(e.key === "ArrowDown" ? 1 : -1); }
      else if (e.key === "Enter") { e.preventDefault(); if (ac < 0) { for (var i = 0; i < bulunan.length; i++) if (!bulunan[i].pasif) { ac = i; break; } } if (ac >= 0) git(ac); }
      else if (e.key === "Escape") { lst.hidden = true; gir.value = ""; gir.setAttribute("aria-expanded", "false"); }
    });
    lst.addEventListener("mousedown", function (e) { var li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); git(+li.dataset.i); } });
    gir.addEventListener("blur", function () { lst.hidden = true; gir.setAttribute("aria-expanded", "false"); });
    Array.prototype.forEach.call(document.querySelectorAll("#aramaBlok .gornek button"), function (b) {
      b.addEventListener("click", function () { gir.value = b.dataset.q; gir.focus(); ciz(); });
    });
    var ilS = V.yerler.filter(function (y) { return y.duzey === "il"; }).length;
    var ilG = V.gostergeler.filter(function (g) { return !g.sadece_tr && g.yillar && g.yillar.length; });
    var y0 = Math.min.apply(null, ilG.map(function (g) { return parseInt(g.yillar[0], 10); }));
    var y1 = Math.max.apply(null, ilG.map(function (g) { return parseInt(g.yillar[g.yillar.length - 1], 10); }));
    $("gRozet").innerHTML = [V.gostergeler.length + " gösterge", ilS + " il", y0 + "–" + y1, "açık veri"].map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
  })();
})();
