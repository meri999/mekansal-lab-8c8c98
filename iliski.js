/* Iliski kesfi arayuzu. Hesap: iliski-hesap.js (IliskiHesap). Veri: window.VERI. */
(function () {
  var V = window.VERI, H = window.IliskiHesap;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function f(v, d) { return v.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function isr(r) { return (r < 0 ? "−" : "+") + f(Math.abs(r), 2); }
  function say(v, g) { var d = g && typeof g.ondalik === "number" ? g.ondalik : 1; if (Math.abs(v) >= 1000) d = 0; return f(v, d); }

  if (!V || !V.gostergeler) { $("sonuc").innerHTML = '<p class="bos">Veri yüklenemedi. Sayfayı yenileyin.</p>'; return; }
  var G = V.gostergeler, iller = H.ilKodlari(V.yerler), ADI = {}, YER = {};
  V.yerler.forEach(function (y) { ADI[y.kod] = y.ad_tr; YER[y.kod] = y; });

  var KONU = { nufus: "Nüfus ve demografi", egitim: "Eğitim", goc: "Göç", kalkinma: "Kalkınma", yasam: "Yaşam koşulları",
    isgucu: "İşgücü", konut: "Konut", uretim: "Üretim", girisim: "Girişim", finans: "Finans", fiyat: "Fiyatlar", dis: "Dış ticaret", guven: "Güven" };
  var KSIRA = ["nufus", "goc", "egitim", "isgucu", "kalkinma", "yasam", "konut", "girisim", "uretim", "finans", "fiyat", "dis", "guven"];

  /* kullanilabilir gostergeler: il duzeyli, yillik, ayni baslik tek kez */
  var L = [], byId = {}, goreBaslik = {};
  G.forEach(function (g) {
    if (g.sik || !H.ilDuzeyli(g, iller)) return;
    if (goreBaslik[g.baslik]) { byId[g.id] = goreBaslik[g.baslik]; return; }
    goreBaslik[g.baslik] = g; byId[g.id] = g; L.push(g);
  });
  L.sort(function (a, b) {
    var ka = KSIRA.indexOf(a.konu), kb = KSIRA.indexOf(b.konu);
    return (ka < 0 ? 99 : ka) - (kb < 0 ? 99 : kb) || a.baslik.localeCompare(b.baslik, "tr");
  });
  var NUF = byId.g01 || null;
  var BUY = {};
  function buyuk(g) { /* nufusla birlikte buyuyen (rho >= 0,8): buyuk illerde hep buyuk */
    if (!NUF || g === NUF) return g === NUF;
    if (BUY[g.id] === undefined) { var r = H.buyuklukRho(g, NUF, iller); BUY[g.id] = (r !== null && Math.abs(r) >= 0.8) ? r : false; }
    return BUY[g.id] !== false;
  }

  /* ---- durum ve baglanti ---- */
  var S = { m: "iki", x: "", y: "", yil: "", v: "", yer: "TR", b: "", s: "", g: 0, e: 0.5, u: 0, d: 1 };
  var ESIK_VARS = { iki: 0.5, en: 0.5, zaman: 0.6 };
  function oku() {
    var h = location.hash.replace(/^#/, ""); if (!h) return;
    h.split("&").forEach(function (p) {
      var i = p.indexOf("="); if (i < 0) return;
      var k = p.slice(0, i), v = decodeURIComponent(p.slice(i + 1));
      if (k === "g" || k === "u" || k === "d") S[k] = +v ? +v : 0;
      else if (k === "e") S.e = +v || 0.5;
      else if (k in S) S[k] = v;
    });
    if (["iki", "en", "zaman"].indexOf(S.m) < 0) S.m = "iki";
  }
  function yaz() {
    var p = ["m=" + S.m, "x=" + S.x];
    if (S.m !== "en") p.push("y=" + S.y);
    if (S.m === "iki") { p.push("yil=" + S.yil); if (S.v) p.push("v=" + S.v); if (!S.d) p.push("d=0"); }
    if (S.m === "zaman") { p.push("yer=" + S.yer, "b=" + S.b, "s=" + S.s, "g=" + S.g); }
    if (S.m !== "iki") p.push("e=" + S.e);
    if (S.m === "en" && S.u) p.push("u=1");
    try { history.replaceState(null, "", "#" + p.join("&")); } catch (e) { }
  }
  function gos(id) { return byId[id] || null; }
  function bulBaslik(b) { return goreBaslik[b] || null; }

  /* ---- secici doldurma ---- */
  function gosterHTML() {
    var o = "", son = null;
    L.forEach(function (g) {
      if (g.konu !== son) { if (son !== null) o += "</optgroup>"; o += '<optgroup label="' + esc(KONU[g.konu] || g.konu) + '">'; son = g.konu; }
      o += '<option value="' + g.id + '">' + esc(g.baslik) + "</option>";
    });
    return o + "</optgroup>";
  }
  var GH = gosterHTML();
  $("gx").innerHTML = GH; $("gy").innerHTML = GH;
  var ilAd = iller.slice().sort(function (a, b) { return ADI[a].localeCompare(ADI[b], "tr"); });
  $("vur").innerHTML = '<option value="">(yok)</option>' + ilAd.map(function (k) { return '<option value="' + k + '">' + esc(ADI[k]) + "</option>"; }).join("");
  var yerler = [{ kod: "TR", ad: "Türkiye" }].concat(ilAd.map(function (k) { return { kod: k, ad: ADI[k] }; }));
  V.yerler.forEach(function (y) { if (y.duzey === "bolge") yerler.push({ kod: y.kod, ad: y.ad_tr + " (bölge)" }); });
  $("yer").innerHTML = yerler.map(function (y) { return '<option value="' + y.kod + '">' + esc(y.ad) + "</option>"; }).join("");

  var GORUNUR = {
    iki: ["xw", "yw", "degw", "yilw", "vurw", "dogw"],
    en: ["xw", "esikw", "buyw"],
    zaman: ["xw", "yw", "degw", "yerw", "basw", "sonw", "gecw", "esikw"]
  };
  var TUM = ["xw", "yw", "degw", "yilw", "vurw", "dogw", "yerw", "basw", "sonw", "gecw", "esikw", "buyw"];
  var IPUCU = {
    iki: "İki göstergenin son ortak yılında 81 ili karşılaştırın. Bir noktanın üzerine gelin; il adı ve değerleri görünür.",
    en: "Seçtiğiniz göstergeyle illerde en güçlü ilişkiyi veren diğer göstergeler, güce göre sıralanır. Bir satıra tıklayınca dağılım açılır.",
    zaman: "Bir ilin (ya da Türkiye'nin) iki serisinin yıllık değişimleri birlikte mi, ters yönde mi? Aynı ilişki 81 ilin kaçında görülüyor?"
  };

  function ornekler() {
    var o = [], el = $("ornek"), bas = "";
    if (S.m === "iki") {
      bas = "Örnekler:";
      [["Ortalama hanehalkı büyüklüğü", "Kaba doğum hızı"], ["Toplam doğurganlık hızı", "Okuma yazma bilmeyen pay"], ["Yükseköğretim mezunu pay", "Toplam doğurganlık hızı"],
        ["Yaşlı nüfus payı", "Kaba ölüm hızı"]].forEach(function (c) {
        var a = ara(c[0]), b = ara(c[1]); if (a && b) o.push({ t: a.baslik + " ↔ " + b.baslik, x: a.id, y: b.id });
      });
    } else if (S.m === "en") {
      bas = "Örnekler:";
      ["Toplam doğurganlık hızı", "Kişi başına GSYH (TL)", "Kaba ölüm hızı", "İşsizlik oranı"].forEach(function (c) { var a = ara(c); if (a) o.push({ t: a.baslik, x: a.id }); });
    } else {
      bas = "Örnekler:";
      [["Kaba doğum hızı", "Kaba evlenme hızı", "TR"], ["Kaba doğum hızı", "Kaba ölüm hızı", "TR"], ["Kaba evlenme hızı", "Kaba boşanma hızı", "TR"]].forEach(function (c) {
        var a = ara(c[0]), b = ara(c[1]); if (a && b) o.push({ t: a.baslik + " → " + b.baslik, x: a.id, y: b.id, yer: c[2] });
      });
    }
    el.innerHTML = o.length ? "<span>" + bas + "</span>" + o.map(function (q, i) { return '<button type="button" data-i="' + i + '">' + esc(q.t) + "</button>"; }).join("") : "";
    el._o = o;
  }
  function ara(oz) { /* basliga gore (oneki) gosterge bul */
    if (goreBaslik[oz]) return goreBaslik[oz];
    for (var i = 0; i < L.length; i++) if (L[i].baslik.indexOf(oz) === 0) return L[i];
    return null;
  }
  $("ornek").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; var q = $("ornek")._o[+b.dataset.i];
    S.x = q.x; if (q.y) S.y = q.y; if (q.yer) S.yer = q.yer; S.yil = ""; S.b = ""; S.s = ""; render();
  });

  /* ---- ciktilar ---- */
  var balon = $("balon");
  function ipucuGoster(e, h) { balon.innerHTML = h; balon.style.display = "block"; var x = e.clientX + 14, y = e.clientY + 14; if (x + balon.offsetWidth > innerWidth - 8) x = e.clientX - balon.offsetWidth - 14; balon.style.left = x + "px"; balon.style.top = y + "px"; }
  function ipucuGizle() { balon.style.display = "none"; }
  function tikler(mn, mx, say_) {
    if (!(mx > mn)) return [mn];
    var ham = (mx - mn) / (say_ || 5), us = Math.pow(10, Math.floor(Math.log(ham) / Math.LN10)), n = ham / us;
    var ad = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10; ad *= us;
    var r = [], t = Math.ceil(mn / ad - 1e-9) * ad; for (; t <= mx + ad * 1e-9; t += ad) r.push(Math.round(t / ad) * ad);
    return r;
  }
  function tk(v) { return f(v, Math.abs(v) >= 100 || v === Math.round(v) ? 0 : Math.abs(v) >= 10 ? 1 : 2); }
  function birimli(g) { return g.baslik + (g.birim ? " (" + g.birim + ")" : ""); }

  var SON = null; /* son kesit: indirme icin */
  function serpilme(k, gx, gy, yil, dis) {
    var W = 720, Hh = dis ? 520 : 380, sol = 64, sag = 18, ust = dis ? 74 : 14, alt = dis ? 92 : 54;
    var mnx = Math.min.apply(null, k.x), mxx = Math.max.apply(null, k.x), mny = Math.min.apply(null, k.y), mxy = Math.max.apply(null, k.y);
    var px = (mxx - mnx) * 0.04 || 1, py = (mxy - mny) * 0.06 || 1; mnx -= px; mxx += px; mny -= py; mxy += py;
    function sx(v) { return sol + (v - mnx) / (mxx - mnx) * (W - sol - sag); }
    function sy(v) { return Hh - alt - (v - mny) / (mxy - mny) * (Hh - alt - ust); }
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="' + esc(gx.baslik + " ve " + gy.baslik + ", " + yil + ", " + k.n + " il serpilme grafiği") + '" font-family="Montserrat,Segoe UI,Arial,sans-serif">';
    if (dis) o += '<rect width="' + W + '" height="' + Hh + '" fill="#fff"/><text x="' + sol + '" y="30" font-size="19" font-weight="700" fill="#7b0828">' + esc(gx.baslik + " ve " + gy.baslik) + '</text><text x="' + sol + '" y="52" font-size="13" fill="#555">' + k.n + " il, " + esc(yil) + " · Spearman ρ = " + isr(k.rho) + " (" + H.guc(k.rho) + (k.rho > 0 ? " pozitif" : " negatif") + ')</text>';
    tikler(mnx, mxx, 6).forEach(function (t) { var x = sx(t); o += '<line x1="' + x.toFixed(1) + '" y1="' + ust + '" x2="' + x.toFixed(1) + '" y2="' + (Hh - alt) + '" stroke="#eee"/><text class="tikyazi" font-size="10.5" fill="#777" x="' + x.toFixed(1) + '" y="' + (Hh - alt + 15) + '" text-anchor="middle">' + tk(t) + "</text>"; });
    tikler(mny, mxy, 5).forEach(function (t) { var y = sy(t); o += '<line x1="' + sol + '" y1="' + y.toFixed(1) + '" x2="' + (W - sag) + '" y2="' + y.toFixed(1) + '" stroke="#eee"/><text class="tikyazi" font-size="10.5" fill="#777" x="' + (sol - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + tk(t) + "</text>"; });
    o += '<line x1="' + sol + '" y1="' + (Hh - alt) + '" x2="' + (W - sag) + '" y2="' + (Hh - alt) + '" stroke="#bbb"/><line x1="' + sol + '" y1="' + ust + '" x2="' + sol + '" y2="' + (Hh - alt) + '" stroke="#bbb"/>';
    if (S.d && k.dogru) {
      var a = k.dogru.a, b = k.dogru.b, x1 = Math.max(mnx, Math.min.apply(null, k.x)), x2 = Math.min(mxx, Math.max.apply(null, k.x));
      o += '<line x1="' + sx(x1).toFixed(1) + '" y1="' + sy(a + b * x1).toFixed(1) + '" x2="' + sx(x2).toFixed(1) + '" y2="' + sy(a + b * x2).toFixed(1) + '" stroke="#7b0828" stroke-width="1.6" stroke-dasharray="6 4" opacity=".7"/>';
    }
    var etk = H.aykirilar(k, 4); if (S.v && etk.indexOf(S.v) < 0) etk.push(S.v);
    k.kodlar.forEach(function (kod, i) {
      var vur = kod === S.v;
      o += '<circle class="nokta' + (vur ? " vur" : "") + '" data-i="' + i + '" cx="' + sx(k.x[i]).toFixed(1) + '" cy="' + sy(k.y[i]).toFixed(1) + '" r="' + (vur ? 7.5 : 5) + '" fill="' + (vur ? "#7b0828" : "#d8232a") + '" fill-opacity="' + (vur ? 1 : 0.55) + '" stroke="#fff" stroke-width="' + (vur ? 2 : 1) + '"/>';
    });
    etk.forEach(function (kod) {
      var i = k.kodlar.indexOf(kod); if (i < 0) return; var x = sx(k.x[i]), y = sy(k.y[i]), sagda = x < W - 120;
      o += '<text class="ilyazi" font-size="11" fill="#17171a" stroke="#fff" stroke-width="3" paint-order="stroke" x="' + (x + (sagda ? 9 : -9)).toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" text-anchor="' + (sagda ? "start" : "end") + '">' + esc(ADI[kod]) + "</text>";
    });
    o += '<text class="eksenyazi" font-size="12" fill="#444" x="' + ((sol + W - sag) / 2) + '" y="' + (Hh - alt + 38) + '" text-anchor="middle">' + esc(birimli(gx)) + "</text>";
    o += '<text class="eksenyazi" font-size="12" fill="#444" transform="translate(16,' + ((ust + Hh - alt) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(birimli(gy)) + "</text>";
    if (dis) o += '<text x="' + sol + '" y="' + (Hh - 14) + '" font-size="11" fill="#777">Kaynak: TÜİK; Enstitü Portal · İlişki nedensellik değildir.</text>';
    return o + "</svg>";
  }

  function indir(ad, blob) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); }
  function dosyaAdi() { return "iliski-" + SON.gx.id + "-" + SON.gy.id + "-" + SON.yil; }
  function pngIndir() {
    if (!SON) return; var svg = serpilme(SON.k, SON.gx, SON.gy, SON.yil, true), im = new Image();
    im.onload = function () {
      var c = document.createElement("canvas"); c.width = 1440; c.height = 1040; var x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(function (b) { if (b) indir(dosyaAdi() + ".png", b); }, "image/png");
    };
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  /* ---- Excel (.xlsx): kutuphanesiz, sikistirmasiz zip ---- */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(dosyalar) {
    var enc = new TextEncoder(), parcalar = [], merkez = [], ofs = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; } function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    dosyalar.forEach(function (d) {
      var ad = enc.encode(d[0]), v = enc.encode(d[1]), c = crc32(v);
      var yer = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(v.length), u32(v.length), u16(ad.length), u16(0));
      parcalar.push(new Uint8Array(yer), ad, v);
      merkez.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(v.length), u32(v.length), u16(ad.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(ofs))), ad);
      ofs += yer.length + ad.length + v.length;
    });
    var mb = 0; merkez.forEach(function (m) { mb += m.length; });
    var son = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(dosyalar.length), u16(dosyalar.length), u32(mb), u32(ofs), u16(0)));
    return new Blob(parcalar.concat(merkez, [son]), { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }
  function xesc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function sayfa(satirlar) {
    var o = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="3" width="42" customWidth="1"/></cols><sheetData>';
    satirlar.forEach(function (r, i) {
      o += '<row r="' + (i + 1) + '">';
      r.forEach(function (h, j) {
        var ref = String.fromCharCode(65 + j) + (i + 1);
        o += typeof h === "number" ? '<c r="' + ref + '"><v>' + h + "</v></c>" : '<c r="' + ref + '" t="inlineStr"><is><t>' + xesc(h) + "</t></is></c>";
      });
      o += "</row>";
    });
    return o + "</sheetData></worksheet>";
  }
  function excelIndir() {
    if (!SON) return; var k = SON.k, gx = SON.gx, gy = SON.gy, il = [];
    ilAd.forEach(function (c) { var i = k.kodlar.indexOf(c); if (i >= 0) il.push([ADI[c], k.x[i], k.y[i]]); });
    var deger = [["İl", birimli(gx), birimli(gy)]].concat(il);
    var ozet = [["Gösterge 1", gx.baslik, birimli(gx)], ["Gösterge 2", gy.baslik, birimli(gy)], ["Yıl", SON.yil, ""], ["İl sayısı", k.n, ""],
      ["Sıra ilişkisi (Spearman ρ)", k.rho, ""], ["Doğrusal ilişki (Pearson r)", k.pearson === null ? "" : k.pearson, ""],
      ["Kaynak 1", gx.kaynak || "", ""], ["Kaynak 2", gy.kaynak || "", ""]];
    var ns = "http://schemas.openxmlformats.org/", ctx = "application/vnd.openxmlformats-officedocument.spreadsheetml.";
    var dosyalar = [
      ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="' + ctx + 'sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="' + ctx + 'worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="' + ctx + 'worksheet+xml"/></Types>'],
      ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + ns + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + ns + 'officeDocument/2006/relationships"><sheets><sheet name="Değerler" sheetId="1" r:id="rId1"/><sheet name="Özet" sheetId="2" r:id="rId2"/></sheets></workbook>'],
      ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + ns + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + ns + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>'],
      ["xl/worksheets/sheet1.xml", sayfa(deger)], ["xl/worksheets/sheet2.xml", sayfa(ozet)]];
    indir(dosyaAdi() + ".xlsx", zip(dosyalar));
  }
  $("sonuc").addEventListener("click", function (e) {
    var b = e.target.closest("[data-is]"); if (b) { var i = b.dataset.is; if (i === "xlsx") excelIndir(); else if (i === "png") pngIndir(); return; }
    var r = e.target.closest("tr.tik"); if (r) { S.m = "iki"; S.y = r.dataset.y; S.yil = r.dataset.yil; render(); window.scrollTo(0, 0); }
  });
  $("sonuc").addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr.tik")) { e.preventDefault(); e.target.click(); } });
  $("sonuc").addEventListener("mouseover", function (e) {
    var c = e.target.closest && e.target.closest("circle.nokta"); if (!c || !SON) return; var i = +c.dataset.i, k = SON.k;
    ipucuGoster(e, "<b>" + esc(ADI[k.kodlar[i]]) + "</b><br>" + esc(SON.gx.baslik) + ": " + say(k.x[i], SON.gx) + "<br>" + esc(SON.gy.baslik) + ": " + say(k.y[i], SON.gy));
  });
  $("sonuc").addEventListener("mousemove", function (e) { if (balon.style.display === "block") ipucuGoster(e, balon.innerHTML); });
  $("sonuc").addEventListener("mouseout", function (e) { if (e.target.closest && e.target.closest("circle.nokta")) ipucuGizle(); });

    function notlar(l) { return l.length ? '<ul class="notlar">' + l.join("") + "</ul>" : ""; }
  function kart(b, d, a, sin) { return "<div><small>" + b + '</small><b class="' + (sin || "") + '">' + d + "</b><em>" + a + "</em></div>"; }

  /* ---- mod 1: iki gosterge ---- */
  function moduIki() {
    var gx = gos(S.x), gy = gos(S.y), s = $("sonuc"); SON = null;
    if (!gx || !gy) { s.innerHTML = '<p class="bos">İki gösterge seçin.</p>'; return; }
    if (gx === gy) { s.innerHTML = '<p class="bos">Aynı göstergeyi iki eksene koydunuz; farklı bir gösterge seçin.</p>'; return; }
    var yillar = H.ortakYillar(gx, gy, iller);
    $("yil").innerHTML = yillar.map(function (y) { return '<option value="' + y + '">' + y + "</option>"; }).join("");
    if (!yillar.length) { s.innerHTML = '<p class="bos">Bu iki göstergenin 70 ilde birlikte verisi olan ortak yılı yok. Başka bir çift deneyin.</p>'; return; }
    if (yillar.indexOf(S.yil) < 0) S.yil = yillar[yillar.length - 1];
    $("yil").value = S.yil;
    var k = H.kesit(gx, gy, S.yil, iller);
    if (k.rho === null) { s.innerHTML = '<p class="bos">Bu yılda iki gösterge de sabit ya da yetersiz; ilişki hesaplanamadı.</p>'; return; }
    SON = { k: k, gx: gx, gy: gy, yil: S.yil };
    var n = [];
    [gx, gy].forEach(function (g) { if (g !== NUF && buyuk(g)) n.push("<li class=\"onemli\"><b>" + esc(g.baslik) + "</b> nüfusla birlikte büyüyor (ρ = " + isr(BUY[g.id]) + "). Büyük illerde değeri her zaman yüksek çıkar; ilişki yalnızca büyüklükten gelebilir. Kişi başı ya da oran göstergelerini deneyin.</li>"); });
    if (gx === NUF || gy === NUF) n.push("<li>Nüfus bir büyüklük göstergesidir; yüksek ρ çoğu zaman \"büyük ilde her şey çok\" demektir.</li>");
    if (k.pearson !== null && Math.abs(k.rho - k.pearson) > 0.25) n.push("<li>Sıra ilişkisi (ρ) ile doğrusal ilişki (r) birbirinden ayrışıyor: ilişkiyi birkaç aşırı il belirliyor olabilir.</li>");
    if (k.n < 78) n.push("<li>" + k.n + " ilde veri var; eksik iller hesaba katılmadı.</li>");
    if (yillar.length === 1) n.push("<li>Ortak tek yıl var: " + yillar[0] + ".</li>");
    var vurgu = S.v && k.kodlar.indexOf(S.v) >= 0 ? k.kodlar.indexOf(S.v) : -1;
    if (S.v && vurgu < 0) n.push("<li>" + esc(ADI[S.v]) + " için bu yılda veri yok.</li>");
    s.innerHTML =
      '<h2 class="sonuc-baslik">' + esc(gx.baslik) + " ve " + esc(gy.baslik) + " · " + S.yil + "</h2>" +
      '<div class="izgara-iki"><div>' + serpilme(k, gx, gy, S.yil, false) + '</div><div class="yan"><div class="ozet">' +
      kart("Sıra ilişkisi (Spearman ρ)", isr(k.rho), H.guc(k.rho) + (k.rho > 0 ? " pozitif" : " negatif") + " ilişki", k.rho > 0 ? "pozitif" : "negatif") +
      kart("Doğrusal ilişki (Pearson r)", k.pearson === null ? "—" : isr(k.pearson), k.pearson === null ? "" : "ρ ile karşılaştırın") +
      kart("İl sayısı", String(k.n), "81 il içinde, " + S.yil) + "</div>" +
      '<div class="cikti-dugme"><button type="button" class="dugme cizgi" data-is="png">Görsel olarak indir</button><button type="button" class="dugme cizgi" data-is="xlsx">Excel olarak indir</button></div>' +
      notlar(n) + "</div></div>" ;
    $("kaynak").innerHTML = "Kaynak: TÜİK. " + esc(gx.baslik) + ": " + esc(gx.kaynak || "") + ". " + esc(gy.baslik) + ": " + esc(gy.kaynak || "") + ".";
  }

  /* ---- mod 2: bir gostergenin en guclu iliskileri ---- */
  function moduEn() {
    var g = gos(S.x), s = $("sonuc"); SON = null;
    if (!g) { s.innerHTML = '<p class="bos">Bir gösterge seçin.</p>'; return; }
    var r = H.enGuclu(g, L, iller, { esik: S.e }), gizli = 0, tabanBuyuk = buyuk(g);
    var liste = r.liste.filter(function (q) { if (!S.u && !tabanBuyuk && buyuk(q.g)) { gizli++; return false; } return true; });
    var goster = liste.slice(0, 25);
    var n = [];
    if (tabanBuyuk) n.push("<li class=\"onemli\"><b>" + esc(g.baslik) + "</b> nüfusla birlikte büyüyen bir gösterge; sonuçlar büyük illerle küçük iller farkını yansıtır.</li>");
    if (gizli) n.push("<li>" + gizli + " gösterge nüfusla birlikte büyüdüğü için gizlendi (yalnızca büyüklük farkını ölçerler). Göstermek için kutuyu işaretleyin.</li>");
    n.push("<li>" + r.denenen + " gösterge denendi. 81 ilde |ρ| ≈ " + f(H.kritikR(81), 2) + " ve üstü tesadüf sayılmaz, ama çok sayıda gösterge denendiğinde ortak nedenlerden gelen (gelişmişlik, kentleşme) ilişkiler çok olur: sıralamayı keşif için kullanın, kanıt olarak değil.</li>");
    var satir = goster.map(function (q) {
      var w = Math.round(Math.abs(q.rho) * 90);
      return '<tr class="tik" tabindex="0" data-y="' + q.g.id + '" data-yil="' + q.yil + '"><td><button type="button" class="gor" tabindex="-1">' + esc(q.g.baslik) + '</button><span class="grup">' + esc(KONU[q.g.konu] || q.g.konu) + (buyuk(q.g) ? " · nüfusla büyür" : "") + '</span></td><td class="sa">' + q.yil + '</td><td class="sa">' + isr(q.rho) + '</td><td><span class="cubuk ' + (q.rho > 0 ? "p" : "n") + '" style="width:' + w + 'px"></span></td><td class="sa">' + q.n + "</td></tr>";
    }).join("");
    s.innerHTML = '<h2 class="sonuc-baslik">' + esc(g.baslik) + " ile en güçlü ilişkiler</h2>" +
      (goster.length ? '<div class="kaydir"><table class="siralama"><thead><tr><th>Gösterge</th><th class="sa">Yıl</th><th class="sa">ρ</th><th><span class="sr">Güç</span></th><th class="sa">İl</th></tr></thead><tbody>' + satir + "</tbody></table></div>" +
        (liste.length > 25 ? '<p class="alt" style="margin-top:8px">' + liste.length + " ilişkiden ilk 25'i gösteriliyor. Daha fazlası için alt sınırı yükseltin.</p>" : "")
        : '<p class="bos">Alt sınır |ρ| ≥ ' + f(S.e, 1) + " için ilişki bulunamadı. Sınırı düşürmeyi deneyin.</p>") +
      notlar(n);
    $("kaynak").innerHTML = "Kaynak: TÜİK; il düzeyli " + L.length + " gösterge. Her gösterge için, seçilen göstergeyle ortak en son yılda 81 ilin sıra ilişkisi (Spearman).";
  }

  /* ---- mod 3: bir yerde zaman icinde ---- */
  var ZAMAN_RENK = ["#d8232a", "#2b6f8a"];
  function yilAraligi(a, b) {
    var y = {}; [a, b].forEach(function (g) { g.yillar.forEach(function (t) { if (/^\d{4}$/.test(t)) y[t] = 1; }); });
    return Object.keys(y).sort();
  }
  function cizgiGrafik(gx, gy, kod, bas, son) {
    var W = 720, Hh = 300, sol = 50, sag = 16, ust = 16, alt = 42, seri = [];
    [gx, gy].forEach(function (g, j) {
      var p = [], mn = Infinity, mx = -Infinity;
      g.yillar.forEach(function (t, i) { var v = g.veri[kod] && g.veri[kod][i]; if (/^\d{4}$/.test(t) && +t >= +bas && +t <= +son && typeof v === "number" && isFinite(v)) { p.push([+t, v]); if (v < mn) mn = v; if (v > mx) mx = v; } });
      seri.push({ g: g, p: p, mn: mn, mx: mx, c: ZAMAN_RENK[j] });
    });
    var ty = []; seri.forEach(function (q) { q.p.forEach(function (a) { ty.push(a[0]); }); });
    if (!ty.length) return "";
    var y0 = Math.min.apply(null, ty), y1 = Math.max.apply(null, ty);
    function sx(t) { return sol + (t - y0) / ((y1 - y0) || 1) * (W - sol - sag); }
    function sy(v) { return Hh - alt - v / 100 * (Hh - alt - ust); }
    var o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="' + esc(gx.baslik + " ve " + gy.baslik + " zaman serisi (her seri kendi aralığında 0-100)") + '">';
    [0, 25, 50, 75, 100].forEach(function (t) { o += '<line x1="' + sol + '" y1="' + sy(t) + '" x2="' + (W - sag) + '" y2="' + sy(t) + '" stroke="#eee"/><text class="tikyazi" x="' + (sol - 6) + '" y="' + (sy(t) + 3.5) + '" text-anchor="end">' + t + "</text>"; });
    for (var t = y0; t <= y1; t++) if ((y1 - y0) <= 14 || t % 2 === (y1 % 2) || t === y0) o += '<text class="tikyazi" x="' + sx(t).toFixed(1) + '" y="' + (Hh - alt + 15) + '" text-anchor="middle">' + t + "</text>";
    seri.forEach(function (q) {
      if (!q.p.length) return;
      var d = q.p.map(function (a, i) { var v = q.mx > q.mn ? (a[1] - q.mn) / (q.mx - q.mn) * 100 : 50; return (i ? "L" : "M") + sx(a[0]).toFixed(1) + " " + sy(v).toFixed(1); }).join(" ");
      o += '<path d="' + d + '" fill="none" stroke="' + q.c + '" stroke-width="2.4" stroke-linejoin="round"/>';
      q.p.forEach(function (a) { var v = q.mx > q.mn ? (a[1] - q.mn) / (q.mx - q.mn) * 100 : 50; o += '<circle cx="' + sx(a[0]).toFixed(1) + '" cy="' + sy(v).toFixed(1) + '" r="3" fill="' + q.c + '"/>'; });
    });
    o += '<text class="eksenyazi" transform="translate(13,' + ((ust + Hh - alt) / 2) + ') rotate(-90)" text-anchor="middle">her seri kendi en düşük-en yüksek aralığında (0-100)</text></svg>';
    return o;
  }
  var teyitSay = 0;
  function moduZaman() {
    var gx = gos(S.x), gy = gos(S.y), s = $("sonuc"), kod = S.yer || "TR"; SON = null;
    if (!gx || !gy) { s.innerHTML = '<p class="bos">İki gösterge seçin.</p>'; return; }
    if (gx === gy) { s.innerHTML = '<p class="bos">Farklı iki gösterge seçin.</p>'; return; }
    var aralik = yilAraligi(gx, gy);
    if (!aralik.length) { s.innerHTML = '<p class="bos">Bu göstergelerde yıllık seri yok.</p>'; return; }
    var op = aralik.map(function (y) { return '<option value="' + y + '">' + y + "</option>"; }).join("");
    $("bas").innerHTML = op; $("son").innerHTML = op;
    if (aralik.indexOf(S.b) < 0) S.b = aralik[0]; if (aralik.indexOf(S.s) < 0) S.s = aralik[aralik.length - 1];
    if (+S.b > +S.s) { var t0 = S.b; S.b = S.s; S.s = t0; }
    $("bas").value = S.b; $("son").value = S.s;
    var sec = { gecikme: S.g, bas: S.b, son: S.s }, z = H.zamanIliski(gx, gy, kod, sec), yerAd = kod === "TR" ? "Türkiye" : (ADI[kod] || kod);
    var cizgi = cizgiGrafik(gx, gy, kod, S.b, S.s);
    var ust = '<h2 class="sonuc-baslik">' + esc(yerAd) + ": " + esc(gx.baslik) + (S.g ? " → (1 yıl sonra) " : " ve ") + esc(gy.baslik) + "</h2>";
    var lej = '<p class="alt" style="margin:8px 0 0"><span class="cizgi-ad" style="background:' + ZAMAN_RENK[0] + '"></span>' + esc(birimli(gx)) + ' &nbsp; <span class="cizgi-ad" style="background:' + ZAMAN_RENK[1] + '"></span>' + esc(birimli(gy)) + "</p>";
    if (z.rho === null) {
      s.innerHTML = ust + '<p class="bos">' + (z.n < H.MIN_YIL_DEGISIM ? "Bu yer ve dönemde ortak yıllık değişim sayısı " + z.n + "; en az " + H.MIN_YIL_DEGISIM + " gerekir. Dönemi genişletin ya da başka bir yer seçin." : "Bir seri sabit; ilişki hesaplanamadı.") + "</p>" + (cizgi ? cizgi + lej : "");
      $("kaynak").textContent = ""; return;
    }
    var kr = H.kritikR(z.n), etkin = H.etkinEsik(S.e, z.n), a = Math.abs(z.rho);
    var guvenli = a < kr ? "tesadüf düzeyinde" : a < S.e ? "zayıf" : (z.n >= 12 && a >= 0.7) ? "güçlü" : "orta";
    var n = ["<li>Seviyeler değil <b>yıllık değişimler</b> karşılaştırıldı: yıllar içinde her şeyin birlikte yükselmesinden doğan sahte birliktelik böylece ayıklanır. Yine de " + z.n + " gözlem kısa bir seridir.</li>"];
    if (a < kr) n.push("<li>İlişki, " + z.n + " gözlem için tesadüf sınırının (|ρ| ≈ " + f(kr, 2) + ") altında; yön hakkında bir şey söylemek zor.</li>");
    else if (a < S.e) n.push("<li>İlişki tesadüf sınırının (|ρ| ≈ " + f(kr, 2) + ") üstünde ama seçtiğiniz alt sınırın (" + f(S.e, 1) + ") altında; zayıf bir işaret olarak okuyun.</li>");
    n.push("<li>Çok sayıda gösterge çifti denendiğinde bazıları tesadüfen yüksek çıkar; bu aracı keşif için kullanın.</li>");
    s.innerHTML = ust +
      '<div class="ozet">' +
      kart("Yıllık değişim ilişkisi (ρ)", isr(z.rho), (z.rho > 0 ? "birlikte" : "ters yönde") + " hareket", z.rho > 0 ? "pozitif" : "negatif") +
      kart("Yıllık değişim sayısı", String(z.n), z.yillar[0] + "–" + z.yillar[z.yillar.length - 1]) +
      kart("Güven", guvenli, "tesadüf sınırı |ρ| ≈ " + f(kr, 2)) +
      '<div id="teyit"><small>Başka illerde</small><b>…</b><em>hesaplanıyor</em></div></div>' +
      cizgi + lej +
      notlar(n);
    $("kaynak").innerHTML = "Kaynak: TÜİK. " + esc(gx.baslik) + ": " + esc(gx.kaynak || "") + ". " + esc(gy.baslik) + ": " + esc(gy.kaynak || "") + ".";
    var id = ++teyitSay;
    setTimeout(function () { /* 81 il icin tembel teyit */
      if (id !== teyitSay) return;
      var t = H.teyit(gx, gy, iller, z.rho, etkin, sec), el = $("teyit"); if (!el) return;
      var oran = t.pay ? t.say / t.pay : 0;
      el.innerHTML = "<small>Başka illerde aynı yönde</small><b>" + t.say + " / " + t.pay + "</b><em>il (|ρ| ≥ " + f(etkin, 2) + ", aynı işaret)</em><div class=\"teyit" + (oran < 1 / 3 ? " zayif" : "") + '"><i style="width:' + Math.round(oran * 100) + '%"></i></div>';
      if (t.pay && oran < 1 / 3) { var ul = $("sonuc").querySelector(".notlar"); if (ul) ul.insertAdjacentHTML("beforeend", "<li>Aynı ilişki illerin üçte birinden azında görülüyor: bu yerel bir örüntü olabilir.</li>"); }
      else if (t.pay && oran >= 0.5) { var u2 = $("sonuc").querySelector(".notlar"); if (u2) u2.insertAdjacentHTML("beforeend", "<li>Aynı ilişki illerin yarısından fazlasında da görülüyor: yaygın bir örüntü.</li>"); }
    }, 30);
  }

  /* ---- ana cizim ---- */
  function render() {
    ipucuGizle();
    if (!gos(S.x)) S.x = (ara("Ortalama hanehalkı büyüklüğü") || L[0]).id;
    if (!gos(S.y)) S.y = (ara("Kaba doğum hızı") || L[1]).id;
    if (!S.yDen && gos(S.y) === gos(S.x)) S.y = (L[0] === gos(S.x) ? L[1] : L[0]).id; /* ilk açılışta aynı çift olmasın */
    S.yDen = 1;
    document.querySelectorAll("#modlar button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.m === S.m ? "true" : "false"); });
    TUM.forEach(function (id) { $(id).hidden = GORUNUR[S.m].indexOf(id) < 0; });
    $("gxEtk").textContent = S.m === "iki" ? "Gösterge 1 (yatay eksen)" : S.m === "en" ? "Gösterge" : "Gösterge 1 (önce değişen)";
    $("ipucu").textContent = IPUCU[S.m];
    $("gx").value = S.x; $("gy").value = S.y; $("vur").value = S.v || ""; $("yer").value = S.yer; $("esik").value = String(S.e);
    $("buy").checked = !!S.u; $("dog").checked = !!S.d;
    document.querySelectorAll("#gec button").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.dataset.g === +S.g)); });
    ornekler();
    if (S.m === "iki") moduIki(); else if (S.m === "en") moduEn(); else moduZaman();
    yaz();
  }

  $("modlar").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.dataset.m === S.m) return;
    S.m = b.dataset.m; S.e = ESIK_VARS[S.m]; render();
  });
  $("gx").addEventListener("change", function () { S.x = this.value; S.yil = ""; S.b = ""; S.s = ""; render(); });
  $("gy").addEventListener("change", function () { S.y = this.value; S.yil = ""; S.b = ""; S.s = ""; render(); });
  $("degis").addEventListener("click", function () { var t = S.x; S.x = S.y; S.y = t; render(); });
  $("yil").addEventListener("change", function () { S.yil = this.value; render(); });
  $("vur").addEventListener("change", function () { S.v = this.value; render(); });
  $("yer").addEventListener("change", function () { S.yer = this.value; render(); });
  $("bas").addEventListener("change", function () { S.b = this.value; render(); });
  $("son").addEventListener("change", function () { S.s = this.value; render(); });
  $("esik").addEventListener("change", function () { S.e = +this.value; render(); });
  $("buy").addEventListener("change", function () { S.u = this.checked ? 1 : 0; render(); });
  $("dog").addEventListener("change", function () { S.d = this.checked ? 1 : 0; render(); });
  $("gec").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; S.g = +b.dataset.g; render(); });

  oku();
  if (S.m === "zaman" && !/[?&]e=|#.*\be=/.test(location.hash)) S.e = ESIK_VARS.zaman;
  S.x = S.x && byId[S.x] ? byId[S.x].id : ""; S.y = S.y && byId[S.y] ? byId[S.y].id : "";
  render();
})();
