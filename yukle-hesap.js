/* Elle yüklenen veriden gösterge kartı üretimi: saf fonksiyonlar, DOM'a dokunmaz.
   Kart şeması window.VERI.gostergeler ile aynıdır.
   Veri türleri (kullanıcı seçer):
     "il_yil"  il (ve/veya bölge) x dönem; çıktı veri{kod:[...]}, yillar ["2020",..]
     "tr_seri" yalnız Türkiye zaman serisi; çıktı sadece_tr, veri{TR:[...]}, sik null|"M"|"Q" */
(function (global) {
  var MIN_IL_UYARI = 81;
  function sayi(v) { return typeof v === "number" && isFinite(v); }

  /* ---- metin ayrıştırma ---- */
  function ayrac(ilk) {
    var s = { ";": 0, "\t": 0, ",": 0 }, tirnak = false, i, c;
    for (i = 0; i < ilk.length; i++) { c = ilk[i]; if (c === '"') tirnak = !tirnak; else if (!tirnak && s[c] !== undefined) s[c]++; }
    return s[";"] >= s["\t"] && s[";"] >= s[","] && s[";"] > 0 ? ";" : s["\t"] >= s[","] && s["\t"] > 0 ? "\t" : ",";
  }
  function csvAyristir(metin) {
    metin = String(metin).replace(/^﻿/, "");
    var d = ayrac(metin.split(/\r?\n/)[0] || ""), sat = [], h = [], a = "", t = false, i, c;
    for (i = 0; i < metin.length; i++) {
      c = metin[i];
      if (t) { if (c === '"') { if (metin[i + 1] === '"') { a += '"'; i++; } else t = false; } else a += c; }
      else if (c === '"') t = true;
      else if (c === d) { h.push(a); a = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && metin[i + 1] === "\n") i++; h.push(a); a = ""; sat.push(h); h = []; }
      else a += c;
    }
    if (a !== "" || h.length) { h.push(a); sat.push(h); }
    return sat.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ""; }); });
  }

  /* "1.234,5" "1234,5" "1,234.5" "%12,3" "12.3" -> sayı; boş/tire/anlamsız -> null */
  function sayiOku(s) {
    if (sayi(s)) return s;
    s = String(s === undefined || s === null ? "" : s).trim().replace(/[%\s ]/g, "");
    if (s === "" || /^[-–—.]+$/.test(s) || /^(na|nan|null|yok|x|\.\.)$/i.test(s)) return null;
    var vir = s.lastIndexOf(","), nok = s.lastIndexOf(".");
    if (vir >= 0 && nok >= 0) s = vir > nok ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (vir >= 0) s = (s.match(/,/g).length > 1 || /^-?\d{1,3}(,\d{3})+$/.test(s)) ? s.replace(/,/g, "") : s.replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
  }

  /* Dolu ama sayıya çevrilemeyen hücre mi? ("28.Haz": Excel'in tarihe çevirdiği ondalık sayı gibi).
     Boş, tire, "x", ".." gibi bilinçli "veri yok" işaretleri sayılmaz. */
  function okunamaz(s) {
    if (sayi(s) || s === undefined || s === null) return false;
    var t = String(s).trim();
    return t !== "" && sayiOku(t) === null && !/^[-–—.]+$/.test(t) && !/^(na|nan|null|yok|x|\.\.)$/i.test(t);
  }

  /* ---- yer adı eşleme ---- */
  function katla(s) {
    return String(s || "").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
      .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[’'`.]/g, "").replace(/\s+(ili|ilimiz|il|bolgesi|bolge)$/, "").replace(/\s+/g, " ").trim();
  }
  /* yerler: VERI.yerler; takma: {"ad": "kod"} (ayar/il_ad_takma.csv) */
  function yerIndeksi(yerler, takma) {
    var ad = {}, kod = {};
    yerler.forEach(function (y) {
      kod[y.kod.toUpperCase()] = y.kod;
      var k = katla(y.ad_tr);
      if (ad[k] === undefined) ad[k] = y.kod;
      else if (ad[k] !== y.kod && y.duzey === "il") ad[k] = y.kod; /* il adı, aynı adlı bölgeden önce gelir */
    });
    Object.keys(takma || {}).forEach(function (k) { ad[katla(k)] = takma[k]; });
    return { ad: ad, kod: kod };
  }
  function yerEsle(giris, idx) {
    var s = String(giris || "").trim();
    if (!s) return null;
    var u = s.toUpperCase().replace(/\s/g, "");
    if (idx.kod[u]) return idx.kod[u];
    var k = katla(s);
    if (k === "turkiye" || k === "turkiye geneli" || k === "toplam" || k === "genel") return "TR";
    return idx.ad[k] || null;
  }
  function duzeyOf(kod) { return kod === "TR" ? "ulke" : /^TR[0-9A-C]$/.test(kod) ? "bolge" : /^TR[0-9A-C][0-9A-Z]$/.test(kod) ? "alt_bolge" : "il"; }

  /* ---- dönem ---- */
  /* "2024" "2024-03" "2024/3" "2024 Mart" "2024Q1" "2024-Ç1" "03.2024" -> {d:"2024-03", sik:"M"} | {d:"2024",sik:"Y"} | {d:"2024-Q1",sik:"Q"} */
  var AYLAR = { ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6, temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12 };
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function donemOku(s) {
    s = String(s === undefined || s === null ? "" : s).trim();
    var m, k = katla(s);
    if ((m = /^(\d{4})(?:\.0+)?$/.exec(s))) return { d: m[1], sik: "Y" };
    if ((m = /^(\d{4})\s*[-\/. ]?\s*[qçc]\s*([1-4])$/i.exec(s))) return { d: m[1] + "-Q" + m[2], sik: "Q" };
    if ((m = /^[qçc]\s*([1-4])\s*[-\/. ]?\s*(\d{4})$/i.exec(s))) return { d: m[2] + "-Q" + m[1], sik: "Q" };
    if ((m = /^(\d{4})\s*[-\/.]\s*(\d{1,2})$/.exec(s)) && +m[2] >= 1 && +m[2] <= 12) return { d: m[1] + "-" + p2(+m[2]), sik: "M" };
    if ((m = /^(\d{1,2})\s*[-\/.]\s*(\d{4})$/.exec(s)) && +m[1] >= 1 && +m[1] <= 12) return { d: m[2] + "-" + p2(+m[1]), sik: "M" };
    if ((m = /^(\d{4})\s+([a-z]+)$/.exec(k)) && AYLAR[m[2]]) return { d: m[1] + "-" + p2(AYLAR[m[2]]), sik: "M" };
    if ((m = /^([a-z]+)\s+(\d{4})$/.exec(k)) && AYLAR[m[1]]) return { d: m[2] + "-" + p2(AYLAR[m[1]]), sik: "M" };
    return null;
  }

  /* ---- tablo tanıma: kullanıcıya öneri (son söz kullanıcıda) ---- */
  /* satirlar: csvAyristir çıktısı (ilk satır başlık). */
  function tani(satirlar, yerler, takma) {
    var idx = yerIndeksi(yerler, takma), bas = satirlar[0] || [], gov = satirlar.slice(1), c = bas.length;
    var yilSut = bas.map(function (b, j) { return donemOku(b) ? j : -1; }).filter(function (j) { return j >= 0; });
    var yerSut = -1, donSut = -1, j, say;
    for (j = 0; j < c; j++) { say = gov.filter(function (r) { return yerEsle(r[j], idx); }).length; if (gov.length && say / gov.length >= 0.5) { yerSut = j; break; } }
    for (j = 0; j < c; j++) { say = gov.filter(function (r) { return donemOku(r[j]); }).length; if (gov.length && say / gov.length >= 0.8) { donSut = j; break; } }
    var bicim = null, tur = null;
    if (yerSut >= 0 && yilSut.length >= 1 && yilSut.indexOf(yerSut) < 0) { bicim = "genis"; tur = "il_yil"; }
    else if (yerSut >= 0 && donSut >= 0) { bicim = "uzun"; tur = "il_yil"; }
    else if (donSut >= 0) { bicim = "uzun"; tur = "tr_seri"; }
    else if (yilSut.length >= 3 && gov.length <= 3) { bicim = "genis"; tur = "tr_seri"; } /* tek satır, sütunlar dönem */
    return { bicim: bicim, tur: tur, yerSutun: yerSut, donemSutun: donSut, donemSutunlari: yilSut };
  }

  function siklik(donemler) {
    var s = {}; donemler.forEach(function (d) { s[d.sik] = 1; });
    var k = Object.keys(s);
    return k.length === 1 ? k[0] : (k.length ? "karisik" : "yok");
  }

  /* kayitlar: [{yer, donem, deger}] -> seri */
  function serilestir(kayitlar, tur, idx) {
    var uyari = [], hata = [], seri = {}, donemler = {}, atlanan = {}, bozuk = [], bozukSay = 0, donemBozuk = {}, donemBozukSay = 0, sayac = {}, tekrar = [];
    kayitlar.forEach(function (k) {
      var dn = donemOku(k.donem), v = sayiOku(k.deger), kod = tur === "tr_seri" ? "TR" : yerEsle(k.yer, idx);
      if (!dn) { donemBozukSay++; donemBozuk[String(k.donem)] = 1; return; }
      if (!kod) { atlanan[k.yer] = 1; return; }
      if (okunamaz(k.deger)) { bozukSay++; if (bozuk.length < 5) bozuk.push((tur === "tr_seri" ? dn.d : String(k.yer).trim()) + ": “" + String(k.deger).trim() + "”"); }
      donemler[dn.d] = dn;
      seri[kod] = seri[kod] || {};
      var ak = kod + "|" + dn.d; sayac[ak] = (sayac[ak] || 0) + 1;
      if (sayac[ak] === 2) tekrar.push(tur === "tr_seri" ? dn.d : String(k.yer).trim());
      seri[kod][dn.d] = v;
    });
    if (bozukSay) hata.push(bozukSay + " hücre sayı olarak okunamadı (" + bozuk.join(", ") + (bozukSay > bozuk.length ? " …" : "") + "). Excel, ondalıklı sayıyı (örn. 28,6) tarih (28.Haz) yapmış olabilir: bu hücreleri “Sayı” biçimine çevirip değeri yeniden yazın. Gerçekten veri yoksa hücreyi boş bırakın.");
    if (donemBozukSay) {
      var dk = Object.keys(donemBozuk);
      hata.push(dk.length + " farklı değer dönem olarak okunamadı (örn. " + dk.slice(0, 3).map(function (x) { return "“" + x + "”"; }).join(", ") + "). Dönemi yıl için 2024, ay için 2024-03, üç ay için 2024-Q1 biçiminde ve metin olarak yazın.");
    }
    if (tekrar.length) {
      var ornek = tekrar.slice(0, 3).map(function (x) { return "“" + x + "”"; }).join(", ") + (tekrar.length > 3 ? " …" : "");
      hata.push(tur === "tr_seri" ? "Aynı dönem birden fazla satırda var (" + ornek + "). Her dönem tek satırda olmalı." : "Aynı il birden fazla satırda geçiyor (" + ornek + "). Her il tek satırda olmalı.");
    }
    var an = Object.keys(atlanan);
    if (an.length) uyari.push("Şu satırlar il olarak tanınmadı ve haritada görünmeyecek: " + an.slice(0, 8).join(", ") + (an.length > 8 ? " … (+" + (an.length - 8) + ")" : "") + ". Yazımı şablondaki gibi düzeltin.");
    var dl = Object.keys(donemler).sort();
    var sk = siklik(dl.map(function (d) { return donemler[d]; }));
    if (sk === "karisik") hata.push("Dosyada hem yıllık hem aylık ya da üç aylık dönem var. Yalnız birini bırakın, diğerini ayrı dosyada yükleyin.");
    return { seri: seri, donemler: dl, sik: sk, uyari: uyari, hata: hata };
  }

  /* il verisinden bölge ve Türkiye değeri: yöntem "topla" | "ortalama" | "yok" */
  function bolgeTopla(veri, donemSayisi, yontem) {
    var uyari = [];
    if (yontem !== "topla" && yontem !== "ortalama") return { veri: veri, uyari: uyari };
    var ilKodlari = Object.keys(veri).filter(function (k) { return duzeyOf(k) === "il"; }), grup = {};
    ilKodlari.forEach(function (k) { var b = k.slice(0, 3); (grup[b] = grup[b] || []).push(k); });
    function birlestir(kodlar) {
      var o = [], i;
      for (i = 0; i < donemSayisi; i++) {
        var v = kodlar.map(function (k) { return veri[k][i]; });
        if (v.some(function (x) { return !sayi(x); })) { o.push(null); continue; }
        var t = v.reduce(function (a, b) { return a + b; }, 0);
        o.push(yontem === "topla" ? t : t / v.length);
      }
      return o;
    }
    Object.keys(grup).forEach(function (b) { if (veri[b] === undefined) veri[b] = birlestir(grup[b]); });
    if (veri.TR === undefined && ilKodlari.length >= 81) veri.TR = birlestir(ilKodlari);
    if (yontem === "ortalama") uyari.push("Bölge ve Türkiye değerleri illerin sade ortalamasıdır (nüfus ağırlıklı değil).");
    return { veri: veri, uyari: uyari };
  }

  /* secenek: {tur, baslik, konu, grup, birim, ondalik, degisim:"yuzde"|"fark"|"puan", iyi:"yukari"|"asagi"|"notr",
               kaynak, not, bolge:"topla"|"ortalama"|"yok", id} */
  function kartUret(kayitlar, secenek, yerler, takma) {
    var idx = yerIndeksi(yerler, takma), hata = [], uyari = [];
    var ad = String(secenek.baslik || "").trim();
    if (!ad) hata.push("Kartın adı yok.");
    if (!String(secenek.konu || "").trim()) hata.push("Konu seçilmedi.");
    if (!String(secenek.birim || "").trim()) hata.push(secenek.birimYeri === "form" ? "Birimi seçin." : "“" + (ad || "?") + "” sütununda birim yok. Sütun adını “" + (ad || "Gösterge adı") + " [kişi]” gibi, birimi köşeli parantez içinde yazın.");
    if (secenek.tur !== "il_yil" && secenek.tur !== "tr_seri") hata.push("Veri türü seçilmedi.");
    var s = serilestir(kayitlar, secenek.tur, idx);
    hata = hata.concat(s.hata); uyari = uyari.concat(s.uyari);
    if (hata.length) return { kart: null, hata: hata, uyari: uyari };

    var n = s.donemler.length, veri = {}, bos = 0;
    if (n < (secenek.kesit ? 1 : 2)) hata.push("En az 2 dönem gerekir: zaman serisinde birden çok yıl ya da ay olmalı.");
    Object.keys(s.seri).forEach(function (k) {
      veri[k] = s.donemler.map(function (d) { var v = s.seri[k][d]; return sayi(v) ? v : null; });
    });
    if (secenek.tur === "tr_seri" && Object.keys(veri).length !== 1) hata.push("Türkiye serisinde tek seri olmalı.");
    if (secenek.tur === "il_yil") {
      var b = bolgeTopla(veri, n, secenek.bolge || "yok"); veri = b.veri; uyari = uyari.concat(b.uyari);
      var il = Object.keys(veri).filter(function (k) { return duzeyOf(k) === "il"; });
      if (il.length && il.length < MIN_IL_UYARI) uyari.push((MIN_IL_UYARI - il.length) + " il eksik (yalnız " + il.length + " il var); bu iller haritada boş görünecek. Bilerek böyleyse devam edebilirsiniz.");
      if (!Object.keys(veri).length) hata.push("Hiçbir il adı tanınmadı. İlk sütunda il adları olduğundan ve doğru dosya türünü seçtiğinizden emin olun.");
    }
    Object.keys(veri).forEach(function (k) {
      if (veri[k].every(function (x) { return x === null; })) { delete veri[k]; bos++; }
    });
    if (bos) uyari.push(bos + " yerin bütün değerleri boş; bu yerler kartta görünmeyecek.");
    if (!Object.keys(veri).length) hata.push("Hiç rakam bulunamadı: değer hücreleri boş görünüyor.");
    if (hata.length) return { kart: null, hata: hata, uyari: uyari };

    var ond = secenek.ondalik === undefined || secenek.ondalik === "" ? 1 : +secenek.ondalik;
    var tr = secenek.tur === "tr_seri";
    var kart = {
      id: secenek.id || "m" + Date.now().toString(36),
      konu: secenek.konu, grup: secenek.grup || secenek.konu, baslik: String(secenek.baslik).trim(),
      birim: String(secenek.birim).trim(), ondalik: ond,
      degisim: secenek.degisim || "yuzde", iyi: secenek.iyi || "notr",
      ayrisma: "hayir", kaynak: secenek.kaynak || "Elle yüklendi", not: secenek.not || null,
      df_id: null, sonraki: null, sik: tr && s.sik !== "Y" ? s.sik : null,
      bolge_hesap: !tr && (secenek.bolge === "topla" || secenek.bolge === "ortalama") ? true : null,
      oto: null, sadece_tr: tr ? true : null, manuel: true,
      yillar: s.donemler, veri: veri
    };
    return { kart: kart, hata: [], uyari: uyari };
  }

  /* tabloyu kayıt listesine çevir. sec: {bicim:"uzun"|"genis", yerSutun, donemSutun, degerSutun, donemSutunlari} */
  function kayitlar(satirlar, sec) {
    var bas = satirlar[0], gov = satirlar.slice(1), o = [];
    gov.forEach(function (r) {
      var yer = sec.yerSutun >= 0 ? r[sec.yerSutun] : "TR";
      if (sec.bicim === "uzun") o.push({ yer: yer, donem: r[sec.donemSutun], deger: r[sec.degerSutun] });
      else sec.donemSutunlari.forEach(function (j) { o.push({ yer: yer, donem: bas[j], deger: r[j] }); });
    });
    return o;
  }

  /* ---- standart yükleme biçimleri ----
     KESİT  : ilk sütun "il"; her sonraki sütun bir gösterge; her il tek satır; tek gözlem dönemi formdan.
     ZAMAN  : ilk sütun "dönem"; her sonraki sütun bir Türkiye serisi; her dönem tek satır.
     Sütun başlığı "Gösterge adı [birim]" biçimindedir; köşeli parantez içi birimdir. */
  function baslikAyir(b) {
    var m = /^(.*?)\s*\[([^\]]*)\]\s*$/.exec(String(b || "").trim());
    return m ? { baslik: m[1].trim(), birim: m[2].trim() } : { baslik: String(b || "").trim(), birim: "" };
  }
  function ondalikBul(degerler) {
    var mx = 0;
    degerler.forEach(function (x) { var v = sayiOku(x); if (sayi(v)) { var t = String(v), i = t.indexOf("."); if (i >= 0) mx = Math.max(mx, t.length - i - 1); } });
    return Math.min(mx, 2);
  }
  function sutunHarfi(j) { var h = "", n = j + 1; while (n > 0) { var m = (n - 1) % 26; h = String.fromCharCode(65 + m) + h; n = Math.floor((n - 1) / 26); } return h; }

  /* İL İL ZAMAN SERİSİ ("panel"): ilk sütun "il", diğer bütün sütun başlıkları YIL; dosya başına TEK kart.
     Kartın adı ve birimi dosyada olmadığı için formdan gelir (secenek.baslik, secenek.birim). Yalnız yıllık dönem. */
  function panelKart(satirlar, secenek, yerler, takma) {
    var bas = satirlar[0], gov = satirlar.slice(1), genel = [], yil = [], kotu = [], goruldu = {}, ikiKez = [], aylik = false, j;
    for (j = 1; j < bas.length; j++) {
      var d = donemOku(bas[j]);
      if (!d) { kotu.push(sutunHarfi(j) + " (“" + String(bas[j]).trim() + "”)"); continue; }
      if (d.sik !== "Y") aylik = true;
      if (goruldu[d.d]) ikiKez.push(d.d);
      goruldu[d.d] = 1; yil.push(j);
    }
    if (kotu.length) genel.push("İl il zaman serisinde “il” dışındaki bütün sütun başlıkları yıl olmalı (2021, 2022…). Yıl olmayan sütunlar: " + kotu.slice(0, 4).join(", ") + (kotu.length > 4 ? " …" : "") + ". Toplam ya da açıklama gibi sütunları silin; birden çok gösterge için ayrı dosya hazırlayın.");
    else if (aylik) genel.push("Sütun başlıkları aylık ya da üç aylık görünüyor (örn. “" + String(bas[1]).trim() + "”). İl il zaman serisi şimdilik yalnız yıllık veriyi destekliyor; başlıkları yıl olarak (2021, 2022…) yazın.");
    else if (ikiKez.length) genel.push("“" + ikiKez[0] + "” yılı iki sütunda var; her yıl bir kez yazılmalı.");
    else if (yil.length < 2) genel.push("En az 2 yıl sütunu gerekir: zaman serisinde birden çok yıl olmalı.");
    if (!String(secenek.baslik || "").trim()) genel.push("Kartın adını yazın.");
    if (!String(secenek.birim || "").trim()) genel.push("Birimi seçin.");
    if (genel.length) return { genel: genel, kartlar: [] };
    var kay = kayitlar(satirlar, { bicim: "genis", yerSutun: 0, donemSutunlari: yil });
    var oran = /%|oran|pay/i.test(secenek.birim);
    var r = kartUret(kay, {
      tur: "il_yil", baslik: secenek.baslik, birim: secenek.birim, birimYeri: "form", konu: secenek.konu, grup: secenek.grup, kaynak: secenek.kaynak, not: secenek.not,
      degisim: secenek.degisim || (oran ? "puan" : "yuzde"), iyi: secenek.iyi || "notr",
      bolge: oran ? "yok" : (secenek.bolge || "yok"),
      ondalik: ondalikBul(gov.reduce(function (a, r2) { return a.concat(yil.map(function (c) { return r2[c]; })); }, [])), id: secenek.idOnek ? secenek.idOnek + "1" : undefined
    }, yerler, takma);
    r.sutun = secenek.baslik;
    return { genel: [], kartlar: [r] };
  }

  /* Dosyaya bakıp hangi türe benzediğini söyler (öneri; son söz kullanıcıda): "zaman" | "panel" | "kesit" | null */
  function turOner(satirlar) {
    var bas = satirlar[0] || [], ilk = katla(bas[0]), diger = bas.slice(1);
    if (["donem", "zaman", "yil", "tarih"].indexOf(ilk) >= 0) return { tur: "zaman", neden: "İlk sütunun başlığı “dönem”: satırlarda dönemler var." };
    if (ilk === "il") {
      if (diger.length && diger.every(function (h) { return !!donemOku(h); }))
        return { tur: "panel", neden: "Sütun başlıklarınız yıl (“" + String(diger[0]).trim() + "”, …): iller satırlarda, yıllar sütunlarda." };
      return { tur: "kesit", neden: "İller satırlarda, sütun başlıkları gösterge adı." };
    }
    return null;
  }

  /* standart: "kesit" | "zaman" | "panel"; secenek: {donem (kesitte zorunlu), konu, grup, kaynak, not, bolge, degisim, iyi} */
  function standartKartlar(satirlar, standart, secenek, yerler, takma) {
    var bas = satirlar[0] || [], gov = satirlar.slice(1), genel = [], sonuc = [], j;
    var ilk = katla(bas[0]);
    function ilkHucre(beklenen) { return "Tablonun ilk satırı sütun adları olmalı ve ilk hücrede “" + beklenen + "” yazmalı; sizde “" + (bas[0] || "") + "” yazıyor. Üstteki fazla satırları (tablo adı, açıklama) silin."; }
    if ((standart === "kesit" || standart === "panel") && ilk !== "il") genel.push(ilkHucre("il"));
    if (standart === "zaman" && ["donem", "zaman", "yil", "tarih"].indexOf(ilk) < 0) genel.push(ilkHucre("dönem"));
    if (bas.length < 2) genel.push(standart === "panel" ? "En az bir yıl sütunu gerekir." : "En az bir gösterge sütunu gerekir.");
    if (!gov.length) genel.push("Veri satırı yok.");
    if (standart === "kesit") {
      var dn = donemOku(secenek.donem);
      if (!dn) genel.push("Gözlem dönemi girilmedi veya anlaşılamadı (örn. 2025).");
    }
    if (genel.length) return { genel: genel, kartlar: [] };
    if (standart === "panel") return panelKart(satirlar, secenek, yerler, takma);
    var ad = {};
    for (j = 1; j < bas.length; j++) {
      if (!String(bas[j]).trim()) { genel.push(sutunHarfi(j) + " sütununun başlığı boş. Her sütunun bir adı olmalı (Gösterge adı [birim])."); continue; }
      var k = katla(baslikAyir(bas[j]).baslik);
      if (ad[k]) genel.push("“" + baslikAyir(bas[j]).baslik + "” adı iki sütunda var; her göstergenin adı farklı olmalı.");
      ad[k] = 1;
    }
    if (genel.length) return { genel: genel, kartlar: [] };
    for (j = 1; j < bas.length; j++) {
      var ba = baslikAyir(bas[j]), kay = gov.map(function (r) {
        return standart === "kesit" ? { yer: r[0], donem: secenek.donem, deger: r[j] } : { yer: "TR", donem: r[0], deger: r[j] };
      });
      var oran = /%|oran|pay/i.test(ba.birim);
      var sec = {
        tur: standart === "kesit" ? "il_yil" : "tr_seri", kesit: standart === "kesit",
        baslik: ba.baslik, birim: ba.birim || secenek.birim || "", konu: secenek.konu, grup: secenek.grup, kaynak: secenek.kaynak, not: secenek.not,
        degisim: secenek.degisim || (oran ? "puan" : "yuzde"), iyi: secenek.iyi || "notr",
        bolge: standart === "kesit" ? (oran ? "yok" : (secenek.bolge || "yok")) : undefined,
        ondalik: ondalikBul(gov.map(function (r) { return r[j]; })), id: secenek.idOnek ? secenek.idOnek + j : undefined
      };
      var r = kartUret(kay, sec, yerler, takma);
      r.sutun = bas[j];
      sonuc.push(r);
    }
    return { genel: [], kartlar: sonuc };
  }

  global.YukleHesap = { standartKartlar: standartKartlar, baslikAyir: baslikAyir, csvAyristir: csvAyristir, sayiOku: sayiOku, katla: katla, yerIndeksi: yerIndeksi, yerEsle: yerEsle, duzeyOf: duzeyOf,
    donemOku: donemOku, turOner: turOner, tani: tani, kayitlar: kayitlar, kartUret: kartUret, bolgeTopla: bolgeTopla };
})(window);
