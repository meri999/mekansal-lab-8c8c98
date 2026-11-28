/* Il karnesi arayuzu. Hesap: karne-hesap.js (KarneHesap), iliski-hesap.js (IliskiHesap). Veri: window.VERI, window.HARITA_IL. */
(function () {
  var V = window.VERI, H = window.IliskiHesap, K = window.KarneHesap, C = window.Cikti;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return C.esc(s); }
  function f(v, d) { return v.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function say(v, g) { var d = g && typeof g.ondalik === "number" ? g.ondalik : 1; if (Math.abs(v) >= 1000) d = 0; return f(v, d); }
  function sapma(z) { return (z < 0 ? "−" : "+") + f(Math.abs(z), 1); }
  if (!V || !V.gostergeler) { $("sonuc").innerHTML = '<p class="bos">Veri yüklenemedi. Sayfayı yenileyin.</p>'; return; }

  var G = V.gostergeler, iller = H.ilKodlari(V.yerler), ADI = {};
  V.yerler.forEach(function (y) { ADI[y.kod] = y.ad_tr; });
  var ilAd = iller.slice().sort(function (a, b) { return ADI[a].localeCompare(ADI[b], "tr"); });
  var KONU = { nufus: "Nüfus ve demografi", egitim: "Eğitim", goc: "Göç", kalkinma: "Kalkınma", yasam: "Yaşam koşulları",
    isgucu: "İşgücü", konut: "Konut", uretim: "Üretim", girisim: "Girişim", finans: "Finans", fiyat: "Fiyatlar", dis: "Dış ticaret", guven: "Güven" };
  var KSIRA = ["nufus", "goc", "egitim", "isgucu", "kalkinma", "yasam", "konut", "girisim", "uretim", "finans", "fiyat", "dis", "guven"];
  var RENK = ["#721530", "#2b6f8a", "#d1181e", "#6a8f2a"];
  var PAL5 = ["#f7e1e2", "#eeb3b6", "#e0777c", "#c63a41", "#721530"];

  /* gostergeler: il duzeyli, yillik, ayni baslik tek kez; her biri icin il dagilimi ozeti */
  var seen = {}, NUF = null, OZ = [];
  G.forEach(function (g) { if (g.id === "g01") NUF = g; });
  G.forEach(function (g) {
    if (g.sik || seen[g.baslik] || !H.ilDuzeyli(g, iller)) return;
    var o = K.ozet(g, iller); if (!o) return; seen[g.baslik] = 1;
    var r = NUF && g !== NUF ? H.buyuklukRho(g, NUF, iller) : 1;
    o.buyuk = g === NUF || (r !== null && Math.abs(r) >= 0.8); OZ.push(o);
  });
  OZ.sort(function (a, b) { return (KSIRA.indexOf(a.g.konu) < 0 ? 99 : KSIRA.indexOf(a.g.konu)) - (KSIRA.indexOf(b.g.konu) < 0 ? 99 : KSIRA.indexOf(b.g.konu)) || a.g.baslik.localeCompare(b.g.baslik, "tr"); });

  var S = { m: "karne", il: "TR100", ls: ["TR100"], k: "", u: 0 };
  function varsayilanlar() {
    var ist = "TR100", urfa = ilAd.filter(function (k) { return ADI[k] === "Şanlıurfa"; })[0];
    S.il = iller.indexOf(S.il) >= 0 ? S.il : ist;
    S.ls = S.ls.filter(function (k) { return iller.indexOf(k) >= 0; }).slice(0, 4);
    if (!S.ls.length) S.ls = [S.il];
    if (S.m === "kars" && S.ls.length < 2) S.ls.push(S.ls[0] === urfa ? ist : urfa);
  }
  function oku() {
    location.hash.replace(/^#/, "").split("&").forEach(function (p) {
      var i = p.indexOf("="); if (i < 0) return; var k = p.slice(0, i), v = decodeURIComponent(p.slice(i + 1));
      if (k === "m" && ["karne", "kars", "benzer"].indexOf(v) >= 0) S.m = v; else if (k === "il") S.il = v;
      else if (k === "ls") S.ls = v.split(",").filter(Boolean); else if (k === "k") S.k = v; else if (k === "u") S.u = +v ? 1 : 0;
    });
    if (S.m === "kars" && S.ls.length && !/[#&]il=/.test(location.hash)) S.il = S.ls[0];
  }
  function yaz() {
    var p = ["m=" + S.m]; if (S.m !== "kars") p.push("il=" + S.il); else p.push("ls=" + S.ls.join(","));
    if (S.k) p.push("k=" + S.k); if (S.u) p.push("u=1");
    try { history.replaceState(null, "", "#" + p.join("&")); } catch (e) { }
  }

  /* ---- yardimcilar ---- */
  function kume() { return OZ.filter(function (o) { return (!S.k || o.g.konu === S.k) && (S.u || !o.buyuk); }); }
  /* dagilim seridi: konum, 81 ilin ortalamasindan sapmaya (z, -3..+3'e kirpilmis) gore; ortada il ortalamasi */
  function serit(o, kodlar) {
    var W = 150, a = 4, b = W - 4;
    function x(v) { var q = o.sd > 0 ? (v - o.ort) / o.sd : 0; q = Math.max(-3, Math.min(3, q)); return (a + (q + 3) / 6 * (b - a)).toFixed(1); }
    var d = ""; Object.keys(o.d).forEach(function (k) { d += "M" + x(o.d[k]) + " 4v8"; });
    var s = '<svg class="serit" viewBox="0 0 ' + W + ' 16" role="img" aria-label="Dağılım şeridi"><path d="M' + ((a + b) / 2) + ' 0v16" stroke="#e3e3e3" stroke-width="1"/><path d="' + d + '" stroke="#c4c4c4" stroke-width="1" fill="none"/>';
    if (o.tr !== null) s += '<path d="M' + x(o.tr) + ' 1v14" stroke="#17171a" stroke-width="2"/>';
    kodlar.forEach(function (k, j) { if (typeof o.d[k] === "number") s += '<circle cx="' + x(o.d[k]) + '" cy="8" r="4.6" fill="' + RENK[kodlar.length === 1 ? 0 : j] + '" stroke="#fff" stroke-width="1.2"/>'; });
    return s + "</svg>";
  }
  function birimYil(o) { return esc((o.g.birim ? o.g.birim + ", " : "") + o.yil); }
  function gAd(o) { return esc(o.g.baslik) + '<span class="alt2">' + esc(KONU[o.g.konu] || o.g.konu) + " · " + birimYil(o) + "</span>"; }
  function kart(b, d, a) { return "<div><small>" + b + "</small><b>" + d + "</b><em>" + a + "</em></div>"; }
  var balon = $("balon");
  function ipucu(e, h) { balon.innerHTML = h; balon.style.display = "block"; var x = e.clientX + 14, y = e.clientY + 14; if (x + balon.offsetWidth > innerWidth - 8) x = e.clientX - balon.offsetWidth - 14; balon.style.left = x + "px"; balon.style.top = y + "px"; }
  function gizle() { balon.style.display = "none"; }
  var SON = null; /* indirme icin: {tur, ad, excel:[...], png:{baslik, alt, kolonlar, satirlar, vurguKolon}} */

  var NOT_SERIT = "Şeritte gri çizgiler 81 ili (ortada il ortalaması), renkli nokta seçili ili, koyu çizgi Türkiye'yi gösterir.";
  function indirmeler() { return '<div class="cikti-dugme"><button type="button" class="dugme cizgi" data-is="png">Görsel olarak indir</button><button type="button" class="dugme cizgi" data-is="xlsx">Excel olarak indir</button></div>'; }

  /* ---- 1: tek il karnesi ---- */
  function karne() {
    var kod = S.il, set = kume(), r = K.satirlar(set, kod), s = $("sonuc");
    if (!r.length) { s.innerHTML = '<p class="bos">Bu konuda ' + esc(ADI[kod]) + ' için gösterge yok.</p>'; SON = null; return; }
    var ust = r.filter(function (q) { return q.sira <= 10; }).length, alt = r.filter(function (q) { return q.sira > q.n - 10; }).length, en = r[0];
    var satir = r.map(function (q) {
      var uc = Math.abs(q.z) >= 1.5, o = q.o;
      return "<tr><td>" + gAd(o) + '</td><td class="deger' + (uc ? " uc" : "") + '">' + say(q.deger, o.g) + '</td><td class="deger"' + (q.tr === null ? ' title="Bu gösterge için Türkiye değeri yok"' : "") + '>' + (q.tr === null ? "—" : say(q.tr, o.g)) + '</td><td class="sa">' + q.sira + " / " + q.n + '</td><td class="sa ' + (q.z > 0 ? "yukari" : "asagi") + '">' + (q.z === null ? "—" : (q.z > 0 ? "▲ " : "▼ ") + sapma(q.z)) + "</td><td>" + serit(o, [kod]) + "</td></tr>";
    }).join("");
    s.innerHTML = '<h2 class="sonuc-baslik">' + esc(ADI[kod]) + ": " + r.length + " göstergede karne</h2>" +
      '<div class="karne-ust">' + kart("İlk 10 il arasında", ust + " gösterge", "en yüksek 10 il içinde") + kart("Son 10 il arasında", alt + " gösterge", "en düşük 10 il içinde") +
      kart("En çok ayrışan", esc(en.o.g.baslik), sapma(en.z) + " standart sapma, " + say(en.deger, en.o.g) + " (" + en.sira + ". sıra)") + "</div>" +
      indirmeler() +
      '<div class="kaydir liste uzun"><table class="siralama"><thead><tr><th>Gösterge (en uçtaki sıralardan başlar)</th><th class="sa">Değer</th><th class="sa">Türkiye</th><th class="sa">Sıra</th><th class="sa">Sapma</th><th>Dağılım</th></tr></thead><tbody>' + satir + "</tbody></table></div>" +
      '<p class="not"><b>Not:</b> Sıra 1, en yüksek değerdir; liste ortanca sıradan en uzak göstergelerle başlar. Sapma, ilin 81 il ortalamasından kaç standart sapma uzak olduğunu gösterir; 1,5 ve üstü kalın yazılır. ' + NOT_SERIT + "</p>";
    SON = { ad: "karne-" + kod + (S.k ? "-" + S.k : ""),
      excel: [{ ad: "Karne", satirlar: [["Konu", "Gösterge", "Birim", "Yıl", "Değer", "Türkiye", "Sıra", "İl sayısı", "Sapma (standart sapma)"]].concat(r.map(function (q) { return [KONU[q.o.g.konu] || q.o.g.konu, q.o.g.baslik, q.o.g.birim || "", +q.o.yil, q.deger, q.tr === null ? "" : q.tr, q.sira, q.n, q.z === null ? "" : q.z]; })) },
        { ad: "Özet", satirlar: [["İl", ADI[kod]], ["Gösterge sayısı", r.length], ["İlk 10'da", ust], ["Son 10'da", alt], ["Konu", S.k ? KONU[S.k] : "Tümü"]] }],
      png: { baslik: ADI[kod] + " karnesi", alt: "İl ortalamasından en çok ayrışan " + Math.min(14, r.length) + " gösterge (toplam " + r.length + ")",
        kolonlar: [{ ad: "Gösterge", w: 5 }, { ad: "Değer", w: 1.5, sag: 1 }, { ad: "Türkiye", w: 1.5, sag: 1 }, { ad: "Sıra", w: 1.2, sag: 1 }, { ad: "Sapma", w: 1.2, sag: 1 }],
        satirlar: r.slice(0, 14).map(function (q) { return [q.o.g.baslik + " (" + q.o.yil + ")", say(q.deger, q.o.g), q.tr === null ? "—" : say(q.tr, q.o.g), q.sira + "/" + q.n, sapma(q.z)]; }), vurguKolon: 1 } };
    $("kaynak").textContent = "Kaynak: TÜİK; " + OZ.length + " il düzeyli göstergenin her birinin son ortak yılı.";
  }

  /* ---- 2: karsilastirma ---- */
  function kars() {
    var ls = S.ls, set = kume(), r = K.karsilastir(set, ls), s = $("sonuc");
    if (ls.length < 2) { s.innerHTML = '<p class="bos">Karşılaştırmak için en az iki il seçin.</p>'; SON = null; return; }
    if (!r.length) { s.innerHTML = '<p class="bos">Bu konuda ortak gösterge yok.</p>'; SON = null; return; }
    function dz(o, q) { return ls.map(function (k) { return esc(ADI[k]) + " " + say(q.degerler[k], o.g); }).join(" · ") + (o.tr !== null ? " · Türkiye " + say(o.tr, o.g) : ""); }
    var oneri = "<b>Öne çıkan:</b> en çok ayrışan gösterge <b>" + esc(r[0].o.g.baslik) + "</b> (" + dz(r[0].o, r[0]) + ")" + (r[1] ? "; ardından <b>" + esc(r[1].o.g.baslik) + "</b> (" + dz(r[1].o, r[1]) + ")" : "") + ".";
    var baslik = ls.map(function (k, j) { return '<th class="sa"><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + RENK[j] + ';margin-right:5px"></i>' + esc(ADI[k]) + "</th>"; }).join("");
    var satir = r.map(function (q) {
      var o = q.o; return "<tr><td>" + gAd(o) + "</td>" + ls.map(function (k) { return '<td class="deger">' + say(q.degerler[k], o.g) + "</td>"; }).join("") + '<td class="deger">' + (o.tr === null ? "—" : say(o.tr, o.g)) + "</td><td>" + serit(o, ls) + "</td></tr>";
    }).join("");
    s.innerHTML = '<h2 class="sonuc-baslik">' + ls.map(esc.bind(null)).length + " il: " + ls.map(function (k) { return esc(ADI[k]); }).join(" · ") + " (" + r.length + " gösterge)</h2>" +
      '<div class="oneri">' + oneri + "</div>" + indirmeler() +
      '<div class="kaydir liste kisa"><table class="siralama"><thead><tr><th>Gösterge (en çok ayrışandan başlar)</th>' + baslik + '<th class="sa">Türkiye</th><th>Dağılım</th></tr></thead><tbody>' + satir + "</tbody></table></div>" +
      '<p class="not"><b>Not:</b> Ayrışma, illerin 81 il içindeki sıra konumları arasındaki en büyük farka göre sıralanır. ' + NOT_SERIT.replace("seçili ili", "seçili illeri") + "</p>";
    var ilad = ls.map(function (k) { return ADI[k]; });
    SON = { ad: "karsilastirma-" + ls.join("-") + (S.k ? "-" + S.k : ""),
      excel: [{ ad: "Karşılaştırma", satirlar: [["Konu", "Gösterge", "Birim", "Yıl"].concat(ilad, ["Türkiye"])].concat(r.map(function (q) { return [KONU[q.o.g.konu] || q.o.g.konu, q.o.g.baslik, q.o.g.birim || "", +q.o.yil].concat(ls.map(function (k) { return q.degerler[k]; }), [q.o.tr === null ? "" : q.o.tr]); })) }],
      png: { baslik: ilad.join(" · ") + " karşılaştırması", alt: "En çok ayrışan " + Math.min(14, r.length) + " gösterge (toplam " + r.length + ")",
        kolonlar: [{ ad: "Gösterge", w: 4.4 }].concat(ilad.map(function (a) { return { ad: a, w: 1.5, sag: 1 }; }), [{ ad: "Türkiye", w: 1.4, sag: 1 }]),
        satirlar: r.slice(0, 14).map(function (q) { return [q.o.g.baslik + " (" + q.o.yil + ")"].concat(ls.map(function (k) { return say(q.degerler[k], q.o.g); }), [q.o.tr === null ? "—" : say(q.o.tr, q.o.g)]); }) } };
    $("kaynak").textContent = "Kaynak: TÜİK; her gösterge için son ortak yıl.";
  }

  /* ---- 3: benzer iller ---- */
  var HARITA = (function () {
    var F = (window.HARITA_IL || {}).features; if (!F || !F.length) return null;
    var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    function hal(g) { return g.type === "Polygon" ? [g.coordinates] : g.coordinates; }
    F.forEach(function (f) { hal(f.geometry).forEach(function (p) { p[0].forEach(function (c) { minx = Math.min(minx, c[0]); maxx = Math.max(maxx, c[0]); miny = Math.min(miny, c[1]); maxy = Math.max(maxy, c[1]); }); }); });
    var KK = 1.28, W = (maxx - minx) * KK, HH = maxy - miny, yol = {};
    F.forEach(function (f) { yol[f.properties.kod] = hal(f.geometry).map(function (p) { return p.map(function (r) { return "M" + r.map(function (c) { return ((c[0] - minx) * KK).toFixed(2) + "," + (maxy - c[1]).toFixed(2); }).join("L") + "Z"; }).join(""); }).join(""); });
    return { W: W, H: HH, yol: yol };
  })();
  function benzer() {
    var kod = S.il, set = kume(), b = K.benzerlik(set, kod, iller), s = $("sonuc");
    if (!b.length) { s.innerHTML = '<p class="bos">Bu konuda yeterli ortak gösterge yok (en az 20 gerekir). Konuyu genişletin.</p>'; SON = null; return; }
    var mx = b[b.length - 1].uzaklik || 1, sinif = {}; b.forEach(function (q, i) { sinif[q.kod] = 4 - Math.min(4, Math.floor(i / (b.length / 5))); });
    var satir = b.map(function (q, i) {
      return '<tr class="tik" tabindex="0" data-k="' + q.kod + '"><td class="sa">' + (i + 1) + '</td><td><button type="button" class="gor" tabindex="-1">' + esc(ADI[q.kod]) + '</button></td><td><span class="cubuk b" style="width:' + Math.max(2, Math.round((1 - q.uzaklik / mx) * 90)) + 'px"></span></td><td class="sa">' + f(q.uzaklik, 2) + '</td><td class="sa">' + q.ortak + "</td></tr>";
    }).join("");
    var harita = "";
    if (HARITA) {
      harita = '<div class="harita-k"><svg id="harita" viewBox="0 0 ' + HARITA.W.toFixed(1) + " " + HARITA.H.toFixed(1) + '" role="group" aria-label="Benzerlik haritası">' +
        iller.map(function (k) { var c = k === kod ? "#17171a" : (sinif[k] === undefined ? "#ececec" : PAL5[sinif[k]]); return '<path data-k="' + k + '" d="' + (HARITA.yol[k] || "") + '" fill="' + c + '"' + (k === kod ? ' class="secili"' : "") + "></path>"; }).join("") +
        '</svg><div class="lej"><span>daha farklı</span>' + PAL5.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + '<span>daha benzer</span><i style="background:#17171a;margin-left:10px"></i><span>seçili il</span></div></div>';
    }
    s.innerHTML = '<h2 class="sonuc-baslik">' + esc(ADI[kod]) + " ile en çok benzeşen iller (" + set.length + " gösterge)</h2>" + indirmeler() +
      '<div class="benzer-izgara"><div class="kaydir liste kisa"><table class="siralama"><thead><tr><th class="sa">#</th><th>İl</th><th><span class="sr">Benzerlik</span></th><th class="sa">Uzaklık</th><th class="sa">Ortak gösterge</th></tr></thead><tbody>' + satir + "</tbody></table></div>" + harita + "</div>" +
      '<p class="not"><b>Not:</b> Uzaklık, iki ilin ortak göstergelerdeki sıra konumları arasındaki farkların karekök ortalamasıdır (0 aynı, 1 en uzak); küçük olan daha benzerdir. Bir ile tıklayınca iki il karşılaştırılır.</p>';
    SON = { ad: "benzer-iller-" + kod + (S.k ? "-" + S.k : ""),
      excel: [{ ad: "Benzer iller", satirlar: [["Sıra", "İl", "Uzaklık", "Ortak gösterge sayısı"]].concat(b.map(function (q, i) { return [i + 1, ADI[q.kod], q.uzaklik, q.ortak]; })) },
        { ad: "Özet", satirlar: [["İl", ADI[kod]], ["Gösterge sayısı", set.length], ["Konu", S.k ? KONU[S.k] : "Tümü"]] }],
      png: { baslik: ADI[kod] + " ile benzer iller", alt: "En çok benzeşen 15 il (" + set.length + " gösterge)", kolonlar: [{ ad: "Sıra", w: 1, sag: 1 }, { ad: "İl", w: 4 }, { ad: "Uzaklık", w: 1.6, sag: 1 }, { ad: "Ortak gösterge", w: 2, sag: 1 }],
        satirlar: b.slice(0, 15).map(function (q, i) { return [String(i + 1), ADI[q.kod], f(q.uzaklik, 2), String(q.ortak)]; }), vurguKolon: 1 } };
    $("kaynak").textContent = "Kaynak: TÜİK; " + set.length + " göstergenin son ortak yılı.";
  }

  /* ---- ana cizim ---- */
  var GORUNUR = { karne: ["ilw", "konuw", "buyw"], kars: ["chipw", "eklew", "konuw", "buyw"], benzer: ["ilw", "konuw", "buyw"] };
  var TUM = ["ilw", "chipw", "eklew", "konuw", "buyw"];
  function chipler() {
    $("chipler").innerHTML = S.ls.map(function (k, j) { return '<span class="chip"><i style="background:' + RENK[j] + '"></i>' + esc(ADI[k]) + '<button type="button" data-k="' + k + '" aria-label="' + esc(ADI[k]) + ' ilini çıkar"' + (S.ls.length <= 2 ? " disabled" : "") + ">×</button></span>"; }).join("");
    $("ekle").innerHTML = '<option value="">+ il ekle</option>' + ilAd.filter(function (k) { return S.ls.indexOf(k) < 0; }).map(function (k) { return '<option value="' + k + '">' + esc(ADI[k]) + "</option>"; }).join("");
    $("eklew").style.visibility = S.ls.length >= 4 ? "hidden" : "visible";
  }
  function render() {
    gizle(); varsayilanlar();
    document.querySelectorAll("#modlar button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.m === S.m ? "true" : "false"); });
    TUM.forEach(function (id) { $(id).hidden = GORUNUR[S.m].indexOf(id) < 0; });
    $("il").value = S.il; $("konu").value = S.k; $("buy").checked = !!S.u; chipler();
    if (S.m === "karne") karne(); else if (S.m === "kars") kars(); else benzer();
    yaz();
  }

  $("il").innerHTML = ilAd.map(function (k) { return '<option value="' + k + '">' + esc(ADI[k]) + "</option>"; }).join("");
  var konular = {}; OZ.forEach(function (o) { konular[o.g.konu] = 1; });
  $("konu").innerHTML = '<option value="">Tüm konular</option>' + KSIRA.filter(function (k) { return konular[k]; }).map(function (k) { return '<option value="' + k + '">' + esc(KONU[k]) + "</option>"; }).join("");

  $("modlar").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.dataset.m === S.m) return;
    if (b.dataset.m === "kars") { S.ls = [S.il].concat(S.ls.filter(function (k) { return k !== S.il; })).slice(0, 4); }
    else if (S.m === "kars") S.il = S.ls[0];
    S.m = b.dataset.m; render();
  });
  $("il").addEventListener("change", function () { S.il = this.value; S.ls = [this.value]; render(); });
  $("konu").addEventListener("change", function () { S.k = this.value; render(); });
  $("buy").addEventListener("change", function () { S.u = this.checked ? 1 : 0; render(); });
  $("ekle").addEventListener("change", function () { if (this.value && S.ls.length < 4) S.ls.push(this.value); render(); });
  $("chipler").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b || S.ls.length <= 2) return; S.ls = S.ls.filter(function (k) { return k !== b.dataset.k; }); render(); });
  function karsilastirGit(a, b) { S.m = "kars"; S.ls = [a, b]; S.il = a; render(); window.scrollTo(0, 0); }
  $("sonuc").addEventListener("click", function (e) {
    var d = e.target.closest("[data-is]");
    if (d && SON) {
      if (d.dataset.is === "xlsx") C.xlsx(SON.excel, SON.ad);
      else { var t = C.tabloSvg(SON.png); C.png(t.svg, t.w, t.h, SON.ad); }
      return;
    }
    var r = e.target.closest("tr.tik"), p = e.target.closest("#harita path");
    var k = r ? r.dataset.k : p ? p.dataset.k : null; if (k && k !== S.il) karsilastirGit(S.il, k);
  });
  $("sonuc").addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr.tik")) { e.preventDefault(); e.target.click(); } });
  $("sonuc").addEventListener("mouseover", function (e) { var p = e.target.closest && e.target.closest("#harita path"); if (p) ipucu(e, esc(ADI[p.dataset.k])); });
  $("sonuc").addEventListener("mousemove", function (e) { if (balon.style.display === "block") ipucu(e, balon.innerHTML); });
  $("sonuc").addEventListener("mouseout", function (e) { if (e.target.closest && e.target.closest("#harita path")) gizle(); });

  oku(); render();
})();
