/* Küçük .xlsx okuyucu: dış kütüphane yok. .xlsx = zip içinde XML; açma için tarayıcının DecompressionStream'i kullanılır.
   oku(arrayBuffer) -> Promise<{ satirlar: [[hücre,...],...], sayfaAdi, sayfaSayisi }>
   Hücreler: metin -> string, sayı -> number (ondalık ayracı karışmasın), boş -> "". İlk sayfa okunur.
   Tarih biçimli hücreler (Excel'in 28,6 -> 28.Haz yapması gibi) sayı değil "28.06.2025" metni olarak döner; böylece sayı sütununda yakalanır.
   Desteklenmeyenler: .xls (eski ikili biçim), parolalı dosya, zip64. */
(function (global) {
  var SINIR_GIRIS = 40e6; /* tek bir XML parçası açılmış hâlde en çok 40 MB (zip bombasına karşı) */

  function u16(d, o) { return d[o] | (d[o + 1] << 8); }
  function u32(d, o) { return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0; }

  function zipDizin(d) {
    var i, son = -1;
    for (i = d.length - 22; i >= Math.max(0, d.length - 65558); i--) if (u32(d, i) === 0x06054b50) { son = i; break; }
    if (son < 0) throw new Error("Bu dosya geçerli bir .xlsx değil (zip yapısı yok).");
    var n = u16(d, son + 10), o = u32(d, son + 16), dizin = {}, k, ad;
    for (k = 0; k < n; k++) {
      if (u32(d, o) !== 0x02014b50) throw new Error("Zip dizini bozuk.");
      var yontem = u16(d, o + 10), boy = u32(d, o + 20), acik = u32(d, o + 24), adUz = u16(d, o + 28), exUz = u16(d, o + 30), yoUz = u16(d, o + 32), yer = u32(d, o + 42);
      if (boy === 0xffffffff || acik === 0xffffffff || yer === 0xffffffff) throw new Error("Çok büyük dosya (zip64) desteklenmiyor.");
      ad = new TextDecoder("utf-8").decode(d.subarray(o + 46, o + 46 + adUz));
      dizin[ad] = { yontem: yontem, boy: boy, acik: acik, yer: yer, bayrak: u16(d, o + 8) };
      o += 46 + adUz + exUz + yoUz;
    }
    return dizin;
  }

  function parcaAc(d, e) {
    if (e.bayrak & 1) return Promise.reject(new Error("Parolalı Excel dosyası açılamaz. Parolayı kaldırıp yeniden kaydedin."));
    if (e.acik > SINIR_GIRIS) return Promise.reject(new Error("Dosya içindeki sayfa çok büyük."));
    var o = e.yer;
    if (u32(d, o) !== 0x04034b50) return Promise.reject(new Error("Zip kaydı bozuk."));
    var bas = o + 30 + u16(d, o + 26) + u16(d, o + 28), veri = d.subarray(bas, bas + e.boy);
    if (e.yontem === 0) return Promise.resolve(veri);
    if (e.yontem !== 8) return Promise.reject(new Error("Desteklenmeyen sıkıştırma yöntemi."));
    if (typeof DecompressionStream === "undefined") return Promise.reject(new Error("Bu tarayıcı .xlsx açamıyor. Güncel Chrome, Edge veya Firefox kullanın ya da CSV yükleyin."));
    var ds = new DecompressionStream("deflate-raw");
    var w = ds.writable.getWriter(); w.write(veri); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) {
      if (b.byteLength > SINIR_GIRIS) throw new Error("Dosya içindeki sayfa çok büyük.");
      return new Uint8Array(b);
    });
  }
  function metin(d, e) { return parcaAc(d, e).then(function (b) { return new TextDecoder("utf-8").decode(b); }); }

  function xmlDecode(s) {
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, function (_, k) {
      if (k === "lt") return "<"; if (k === "gt") return ">"; if (k === "amp") return "&"; if (k === "quot") return '"'; if (k === "apos") return "'";
      return String.fromCodePoint(k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
    });
  }
  function nitelik(oz, ad) { var m = new RegExp("(?:^|\\s)" + ad + '="([^"]*)"').exec(oz); return m ? xmlDecode(m[1]) : null; }
  /* <t> parçalarını birleştirir (biçimli metinde birden çok <r><t>); phonetic (<rPh>) hariç */
  function metinParcalari(xml) {
    xml = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
    var out = "", re = /<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g, m;
    while ((m = re.exec(xml))) out += m[1] ? xmlDecode(m[1]) : "";
    return out;
  }
  function sutunNo(ref) {
    var h = /^[A-Z]+/.exec(ref)[0], n = 0, i;
    for (i = 0; i < h.length; i++) n = n * 26 + (h.charCodeAt(i) - 64);
    return n - 1;
  }

  /* biçim kodu tarih/saat mi? tırnak içi, köşeli parantez ve ters eğik çizgi kaçışları atılır */
  function tarihKodu(kod) {
    var k = String(kod).replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/\./g, "").replace(/_./g, "").replace(/\*./g, "");
    return /[dmyhs]/i.test(k) && !/^general$/i.test(k.trim());
  }
  /* styles.xml -> {hücre stil sırası: true} tarih biçimli stiller */
  function tarihStilleri(xml) {
    var ozel = {}, re = /<numFmt\b([^>]*?)\/?>/g, m;
    while ((m = re.exec(xml))) ozel[nitelik(m[1], "numFmtId")] = nitelik(m[1], "formatCode") || "";
    var dizi = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml), out = {}, i = 0;
    if (!dizi) return out;
    var rx = /<xf\b([^>]*?)(?:\/>|>[\s\S]*?<\/xf>)/g, mx;
    while ((mx = rx.exec(dizi[1]))) {
      var id = nitelik(mx[1], "numFmtId") || "0", n = +id;
      var yerlesik = (n >= 14 && n <= 22) || (n >= 27 && n <= 36) || (n >= 45 && n <= 47) || (n >= 50 && n <= 58);
      if (yerlesik || (ozel[id] !== undefined && tarihKodu(ozel[id]))) out[i] = true;
      i++;
    }
    return out;
  }
  function seriTarih(seri, t1904) {
    var g = Math.floor(seri), t = new Date(Date.UTC(t1904 ? 1904 : 1899, t1904 ? 0 : 11, t1904 ? 1 : 30) + g * 86400000);
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(t.getUTCDate()) + "." + p(t.getUTCMonth() + 1) + "." + t.getUTCFullYear();
  }

  function ortakMetinler(xml) {
    var o = [], re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g, m;
    while ((m = re.exec(xml))) o.push(m[1] ? metinParcalari(m[1]) : "");
    return o;
  }

  function sayfaOku(xml, ortak, tarihSt, t1904) {
    var satirlar = [], reS = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, ms, sonSat = 0;
    while ((ms = reS.exec(xml))) {
      var rn = nitelik(ms[1], "r"), si = rn ? +rn - 1 : sonSat; sonSat = si + 1;
      var satir = [], reC = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, mc, sonSut = 0;
      while ((mc = reC.exec(ms[2] || ""))) {
        var ref = nitelik(mc[1], "r"), ci = ref ? sutunNo(ref) : sonSut; sonSut = ci + 1;
        var t = nitelik(mc[1], "t"), ic = mc[2] || "", v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(ic), deger = "";
        if (t === "s") deger = v ? (ortak[+v[1]] === undefined ? "" : ortak[+v[1]]) : "";
        else if (t === "inlineStr") deger = metinParcalari(ic);
        else if (t === "str" || t === "e") deger = v ? xmlDecode(v[1]) : "";
        else if (t === "b") deger = v ? (v[1] === "1" ? "DOĞRU" : "YANLIŞ") : "";
        else if (v && v[1] !== "") {
          var s = Number(v[1]), st = nitelik(mc[1], "s");
          deger = !isFinite(s) ? xmlDecode(v[1]) : (st !== null && tarihSt[st] ? seriTarih(s, t1904) : s);
        }
        while (satir.length < ci) satir.push("");
        satir[ci] = deger;
      }
      while (satirlar.length < si) satirlar.push([]);
      satirlar[si] = satir;
    }
    return satirlar;
  }

  function oku(buf) {
    var d = new Uint8Array(buf), dizin;
    try { dizin = zipDizin(d); } catch (e) { return Promise.reject(e); }
    if (!dizin["xl/workbook.xml"]) return Promise.reject(new Error("Bu dosya bir Excel çalışma kitabı değil. Eski .xls ise .xlsx olarak kaydedin."));
    return Promise.all([metin(d, dizin["xl/workbook.xml"]), dizin["xl/_rels/workbook.xml.rels"] ? metin(d, dizin["xl/_rels/workbook.xml.rels"]) : Promise.resolve(""),
      dizin["xl/sharedStrings.xml"] ? metin(d, dizin["xl/sharedStrings.xml"]) : Promise.resolve(""),
      dizin["xl/styles.xml"] ? metin(d, dizin["xl/styles.xml"]) : Promise.resolve("")]).then(function (p) {
      var sayfalar = [], re = /<sheet\b([^>]*?)\/?>/g, m;
      while ((m = re.exec(p[0]))) sayfalar.push({ ad: nitelik(m[1], "name"), rid: nitelik(m[1], "r:id") });
      if (!sayfalar.length) throw new Error("Çalışma kitabında sayfa yok.");
      var hedef = null, reR = /<Relationship\b([^>]*?)\/?>/g, mr;
      while ((mr = reR.exec(p[1]))) if (nitelik(mr[1], "Id") === sayfalar[0].rid) hedef = nitelik(mr[1], "Target");
      var yol = hedef ? (hedef.charAt(0) === "/" ? hedef.slice(1) : "xl/" + hedef) : "xl/worksheets/sheet1.xml";
      if (!dizin[yol]) throw new Error("Sayfa verisi bulunamadı (" + yol + ").");
      return metin(d, dizin[yol]).then(function (x) {
        var satirlar = sayfaOku(x, ortakMetinler(p[2]), tarihStilleri(p[3]), /<workbookPr\b[^>]*date1904="(1|true)"/.test(p[0])).filter(function (r) { return r.some(function (h) { return String(h).trim() !== ""; }); });
        return { satirlar: satirlar, sayfaAdi: sayfalar[0].ad, sayfaSayisi: sayfalar.length };
      });
    });
  }

  global.XlsxOku = { oku: oku };
})(typeof window !== "undefined" ? window : globalThis);
