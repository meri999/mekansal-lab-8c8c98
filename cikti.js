/* Ortak cikti parcalari: indirme, Excel (.xlsx, kutuphanesiz), SVG -> PNG, tablo gorseli. window.Cikti */
(function (global) {
  function indir(ad, blob) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ---- zip (sikistirmasiz) ---- */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(dosyalar, tur) {
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
    return new Blob(parcalar.concat(merkez, [son]), { type: tur });
  }
  function kolon(j) { return String.fromCharCode(65 + j); }
  function sayfaXml(satirlar) {
    var o = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="44" customWidth="1"/><col min="2" max="12" width="20" customWidth="1"/></cols><sheetData>';
    satirlar.forEach(function (r, i) {
      o += '<row r="' + (i + 1) + '">';
      r.forEach(function (h, j) {
        var ref = kolon(j) + (i + 1);
        if (typeof h === "number" && isFinite(h)) o += '<c r="' + ref + '"><v>' + h + "</v></c>";
        else if (h !== "" && h !== null && h !== undefined) o += '<c r="' + ref + '" t="inlineStr"><is><t>' + esc(h) + "</t></is></c>";
      });
      o += "</row>";
    });
    return o + "</sheetData></worksheet>";
  }
  /* sayfalar: [{ad, satirlar:[[...],...]}]; ilk satir baslik */
  function xlsx(sayfalar, ad) {
    var ns = "http://schemas.openxmlformats.org/", ctx = "application/vnd.openxmlformats-officedocument.spreadsheetml.";
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="' + ctx + 'sheet.main+xml"/>';
    var sh = "", rel = "";
    sayfalar.forEach(function (s, i) {
      ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="' + ctx + 'worksheet+xml"/>';
      sh += '<sheet name="' + esc(String(s.ad).replace(/[\[\]\*\?\/\\:]/g, " ").slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      rel += '<Relationship Id="rId' + (i + 1) + '" Type="' + ns + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
    });
    var d = [
      ["[Content_Types].xml", ct + "</Types>"],
      ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + ns + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + ns + 'officeDocument/2006/relationships"><sheets>' + sh + "</sheets></workbook>"],
      ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rel + "</Relationships>"]
    ];
    sayfalar.forEach(function (s, i) { d.push(["xl/worksheets/sheet" + (i + 1) + ".xml", sayfaXml(s.satirlar)]); });
    indir(ad + ".xlsx", zip(d, ctx + "sheet"));
  }

  /* ---- SVG -> PNG (genislik w, yukseklik h: svg viewBox boyutu; cikti 2 kat) ---- */
  function png(svg, w, h, ad) {
    var im = new Image();
    im.onload = function () {
      var c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; var x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(function (b) { if (b) indir(ad + ".png", b); }, "image/png");
    };
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---- tablo gorseli: o = {baslik, alt, kolonlar:[{ad, w (oran), sag}], satirlar:[[metin...]], kaynak, vurguKolon} ---- */
  function tabloSvg(o) {
    var W = 900, sol = 28, ust = 96, sat = 27, n = o.satirlar.length, H = ust + 34 + n * sat + 54;
    var top = o.kolonlar.reduce(function (a, k) { return a + k.w; }, 0), ic = W - sol * 2, x = [], t = sol;
    o.kolonlar.forEach(function (k) { x.push(t); t += ic * k.w / top; });
    function kes(m, gen) { m = String(m); var kar = Math.floor(gen / 6.6); return m.length > kar ? m.slice(0, Math.max(1, kar - 1)) + "…" : m; }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" font-family="Montserrat,Segoe UI,Arial,sans-serif"><rect width="' + W + '" height="' + H + '" fill="#fff"/>';
    s += '<rect x="0" y="0" width="' + W + '" height="6" fill="#d8232a"/><text x="' + sol + '" y="40" font-size="22" font-weight="700" fill="#7b0828">' + esc(o.baslik) + '</text><text x="' + sol + '" y="64" font-size="13" fill="#555">' + esc(o.alt || "") + "</text>";
    s += '<line x1="' + sol + '" y1="' + (ust + 22) + '" x2="' + (W - sol) + '" y2="' + (ust + 22) + '" stroke="#bbb"/>';
    o.kolonlar.forEach(function (k, j) {
      var gen = ic * k.w / top - 10, ax = k.sag ? x[j] + gen : x[j];
      s += '<text x="' + ax + '" y="' + (ust + 14) + '" font-size="11.5" font-weight="700" fill="#666" text-anchor="' + (k.sag ? "end" : "start") + '">' + esc(kes(k.ad, gen)) + "</text>";
    });
    o.satirlar.forEach(function (r, i) {
      var y = ust + 34 + i * sat + 18;
      if (i % 2) s += '<rect x="' + sol + '" y="' + (y - 18) + '" width="' + ic + '" height="' + sat + '" fill="#fafafa"/>';
      r.forEach(function (m, j) {
        var k = o.kolonlar[j], gen = ic * k.w / top - 10, ax = k.sag ? x[j] + gen : x[j], on = j === o.vurguKolon;
        s += '<text x="' + ax + '" y="' + y + '" font-size="12.5" fill="' + (on ? "#7b0828" : "#222") + '"' + (on ? ' font-weight="700"' : "") + ' text-anchor="' + (k.sag ? "end" : "start") + '">' + esc(kes(m, gen)) + "</text>";
      });
    });
    s += '<text x="' + sol + '" y="' + (H - 20) + '" font-size="11" fill="#777">' + esc(o.kaynak || "Kaynak: TÜİK; Enstitü Portal") + "</text></svg>";
    return { svg: s, w: W, h: H };
  }

  global.Cikti = { indir: indir, xlsx: xlsx, png: png, tabloSvg: tabloSvg, esc: esc };
})(window);
