/* Veri yükleme sihirbazı. Hesap: window.YukleHesap (yukle-hesap.js); kayıt: Worker /api/yukle */
(function () {
  var Y = window.YukleHesap, V = window.VERI;
  var KONULAR = [["nufus", "Nüfus ve demografi"], ["ekonomi", "Ekonomi"], ["egitim", "Eğitim"], ["kalkinma", "Kalkınma"], ["yasam", "Yaşam koşulları"], ["goc", "Göç"]];
  var TRALT = [["uretim", "Üretim"], ["fiyat", "Fiyatlar"], ["isgucu", "İşgücü"], ["dis", "Dış ticaret"], ["konut", "Konut ve taşıt"], ["guven", "Güven"], ["tarim", "Tarım ve hayvancılık"], ["sanayi", "Sanayi ve hizmet"], ["finans", "Finans"], ["girisim", "Girişimcilik"], ["kamu", "Kamu"]]; /* portalda Ekonomi'nin alt başlıkları */
  var KONU_AD = {}; KONULAR.concat(TRALT).forEach(function (k) { KONU_AD[k[0]] = k[1]; });
  var GRUPLAR = {};
  var yer = V.yerler, ADLAR = {}; yer.forEach(function (y) { ADLAR[y.kod] = y.ad_tr; });
  var satirlar = null, sonuc = null;

  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sayi(v, o) { return v.toLocaleString("tr-TR", { minimumFractionDigits: o, maximumFractionDigits: o }); }
  function tur() { var r = document.querySelector('input[name="tur"]:checked'); return r ? r.value : ""; }
  var TUR_AD = { zaman: "1- Zaman serisi · Türkiye geneli", panel: "2- Zaman serisi · il il", kesit: "3- Kesit veri · tek yıl, il il" };
  function turAdi(g) { return g.sadece_tr ? "Zaman serisi · Türkiye" : g.yillar.length > 1 ? "Zaman serisi · il il" : "Kesit"; }
  /* İki ortamda çalışır. window.PORTAL_API boşsa sayfa Worker ile aynı adrestedir ve giriş HttpOnly çerezle yürür (lab).
     Doluysa (enstitü sitesi) istekler o adrese gider ve giriş, tarayıcı oturumunda tutulan jetonla yürür; çerez kullanılmaz. */
  var TABAN = window.PORTAL_API || "", JETON = "portalJeton";
  function jeton() { try { return sessionStorage.getItem(JETON) || ""; } catch (e) { return ""; } }
  function api(yol, yontem, govde) {
    var h = govde ? { "content-type": "application/json" } : {}, j = TABAN ? jeton() : "";
    if (j) h.authorization = "Bearer " + j;
    return fetch(TABAN + yol, { method: yontem || "GET", credentials: TABAN ? "omit" : "same-origin", cache: "no-store", headers: h, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().then(function (j2) { return { ok: r.ok, durum: r.status, j: j2 }; }); });
  }

  /* Enstitü sitesinden (?k=e) gelen kişi için "geri dön" bağlantıları o siteye gider; lab ana sayfası gösterilmez. */
  var ENSTITU = "https://meri999.github.io/mekansal/";
  var DON = /[?&]k=e\b/.test(location.search) ? ENSTITU : "./";
  if (DON === ENSTITU) {
    var logo = document.querySelector("#ust .logo"), pg = document.querySelector("#ust .sag a.dugme");
    if (logo) logo.href = ENSTITU;
    if (pg) { pg.href = ENSTITU; pg.textContent = "Enstitü portalına dön"; }
    $("kapiDon").href = ENSTITU; $("kapiDon").textContent = "Enstitü portalına dön";
  }

  /* ---- giriş denetimi ---- */
  api("/api/ben").then(function (r) {
    if (r.j && r.j.girisli) { $("icerik").hidden = false; $("cikis").hidden = false; listele(); }
    else { $("kapi").hidden = false; $("kapiParola").focus(); }
  }, function () { $("kapi").hidden = false; $("kapiMesaj").textContent = "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip sayfayı yenileyin."; $("kapiForm").hidden = true; });
  $("kapiForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var g = $("kapiGonder"); g.disabled = true; $("kapiHata").textContent = "";
    api("/api/giris", "POST", { parola: $("kapiParola").value }).then(function (r) {
      if (r.ok) { if (TABAN && r.j && r.j.jeton) { try { sessionStorage.setItem(JETON, r.j.jeton); } catch (e) { /* oturum saklanamadı */ } } location.reload(); }
      else { g.disabled = false; $("kapiHata").textContent = (r.j && r.j.hata) || "Giriş yapılamadı."; $("kapiParola").select(); }
    }, function () { g.disabled = false; $("kapiHata").textContent = "Sunucuya ulaşılamadı."; });
  });
  $("cikis").addEventListener("click", function () {
    var bitir = function () { try { sessionStorage.removeItem(JETON); } catch (e) { /* yok say */ } location.href = DON; };
    api("/api/cikis", "POST", {}).then(bitir, bitir);
  });

  /* ---- form ---- */
  /* Konu / alt başlık listeleri sitenin kendi verisinden gelir (veri.js + daha önce yüklenen kartlar); elle yazılmaz.
     Konu -> alt başlık. Ekonomi'de alt başlıklar Üretim, Fiyatlar, İşgücü… gibi portaldaki bölümlerdir. */
  function gruplariKur(ek) {
    GRUPLAR = {};
    V.gostergeler.concat(ek || []).forEach(function (g) { (GRUPLAR[g.konu] = GRUPLAR[g.konu] || {})[g.grup] = 1; });
  }
  function gruplar(k) { return Object.keys(GRUPLAR[k] || {}).sort(function (a, b) { return a.localeCompare(b, "tr"); }); }
  function secenekler(liste, bos, yeni) {
    return '<option value="">' + bos + '</option>' + liste.map(function (x) { return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + '</option>'; }).join("") +
      (yeni ? '<option value="__yeni">+ Listede yok: yeni alt başlık ekle…</option>' : "");
  }
  function listeKur(korun) {
    var k = $("konu").value, e = k === "ekonomi", onceAlt = korun ? $("altSec").value : "";
    $("altSec").innerHTML = !k ? secenekler([], "Önce konuyu seçin", false)
      : e ? secenekler(TRALT, "Seçiniz…", false)
      : secenekler(gruplar(k).map(function (g) { return [g, g]; }), "Seçiniz…", true);
    if (onceAlt && $("altSec").querySelector('option[value="' + onceAlt.replace(/"/g, '\\"') + '"]')) $("altSec").value = onceAlt;
    $("yeniEt").hidden = $("altSec").value !== "__yeni";
  }
  /* seçilen kapsam: kart konusu + grup; eksik kalan alanların adları.
     Ekonomi dışında alt başlığın kendisi gruptur. Ekonomi'de alt başlık (Üretim, Fiyatlar…) kartın konusudur; grup olarak adı kullanılır. */
  function kapsam() {
    var k = $("konu").value, eksik = [], konuKey = k, grup = "";
    if (!k) { eksik.push("Konu"); return { eksik: eksik }; }
    var a = $("altSec").value;
    if (!a) { eksik.push("Alt başlık"); return { eksik: eksik }; }
    if (k === "ekonomi") { konuKey = a; grup = KONU_AD[a] || a; }
    else grup = a === "__yeni" ? $("yeni").value.trim() : a;
    if (!eksik.length && !grup) eksik.push("Yeni alt başlığın adı");
    return { konuKey: konuKey, grup: grup, eksik: eksik };
  }
  $("konu").innerHTML = secenekler(KONULAR, "Seçiniz…", false);
  gruplariKur(); listeKur(false);
  $("konu").addEventListener("change", function () { $("altSec").value = ""; listeKur(false); });
  $("altSec").addEventListener("change", function () { listeKur(true); });
  /* seçilen türe göre rehber ve form alanları görünür */
  function turGoster() {
    var t = tur();
    $("rehber").hidden = !t; $("a2").hidden = !t;
    Array.prototype.forEach.call(document.querySelectorAll(".rehber"), function (r) { r.hidden = r.getAttribute("data-rehber") !== t; });
    $("donemEt").hidden = t !== "kesit";
    $("kartAdEt").hidden = t !== "panel"; $("birimEt").hidden = t !== "panel";
    $("birimYazEt").hidden = !(t === "panel" && $("birim").value === "__diger");
    $("bolgeEt").hidden = !(t === "kesit" || t === "panel");
    uret();
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="tur"]'), function (r) { r.addEventListener("change", turGoster); });
  ["donem", "kartAd", "birimYaz", "konu", "altSec", "yeni", "kaynak", "not", "bolge"].forEach(function (i) { $(i).addEventListener("input", uret); $(i).addEventListener("change", uret); });
  $("birim").addEventListener("change", turGoster);

  function metinOku(buf) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); }
    catch (e) { return new TextDecoder("windows-1254").decode(buf); } /* Excel'in eski Türkçe CSV'si */
  }
  $("dosya").addEventListener("change", function () {
    var f = this.files[0];
    satirlar = null; $("dosyaDurum").className = "durum";
    if (!f) { $("dosyaDurum").textContent = ""; return uret(); }
    function hata(m) { $("dosyaDurum").className = "durum hata"; $("dosyaDurum").textContent = m; uret(); }
    if (/\.xls$/i.test(f.name)) return hata("Bu eski Excel biçimi (.xls). Excel'de Dosya → Farklı kaydet → “Excel Çalışma Kitabı (.xlsx)” seçip onu yükleyin.");
    if (f.size > 5e6) return hata("Dosya 5 MB'tan büyük.");
    var xlsx = /\.xlsx$/i.test(f.name);
    f.arrayBuffer().then(function (b) {
      if (!xlsx) return { satirlar: Y.csvAyristir(metinOku(b)) };
      return window.XlsxOku.oku(b);
    }).then(function (o) {
      satirlar = o.satirlar;
      $("dosyaDurum").textContent = f.name + ": " + (satirlar.length - 1) + " veri satırı, " + (satirlar[0] || []).length + " sütun." +
        (o.sayfaSayisi > 1 ? " Dosyada " + o.sayfaSayisi + " sayfa var; yalnız ilk sayfa (“" + o.sayfaAdi + "”) okundu." : "");
      uret();
    }, function (e) { hata("Dosya okunamadı: " + (e && e.message ? e.message : "bilinmeyen hata")); });
  });

  /* ---- üret ve önizle ---- */
  function secenek() {
    var k = kapsam(), birim = $("birim").value === "__diger" ? $("birimYaz").value.trim() : $("birim").value;
    return { donem: $("donem").value.trim(), baslik: $("kartAd").value.trim(), birim: birim, konu: k.konuKey, grup: k.grup,
      kaynak: $("kaynak").value.trim() || null, not: $("not").value.trim() || null, bolge: $("bolge").value };
  }
  /* dosya seçilen türe uymuyorsa nazikçe başka tür öner; karar kullanıcıda */
  function oneriGoster() {
    var kutu = $("oneri"), o = satirlar && tur() ? Y.turOner(satirlar) : null;
    if (!o || o.tur === tur()) { kutu.hidden = true; kutu.innerHTML = ""; return; }
    kutu.hidden = false;
    kutu.innerHTML = "Dosyanız <b>“" + esc(TUR_AD[o.tur]) + "”</b> türüne benziyor: " + esc(o.neden) + ' <button type="button" class="dugme cizgi" id="oneriSec">Bu türü seç</button>';
    $("oneriSec").addEventListener("click", function () {
      document.querySelector('input[name="tur"][value="' + o.tur + '"]').checked = true; turGoster();
    });
  }
  function uret() {
    sonuc = null;
    oneriGoster();
    if (!satirlar || !tur()) { $("a3").hidden = true; $("a4").hidden = true; return; }
    /* dosya değil form eksik: standart hatası göstermeyip eksik alanları işaret et */
    var eksik = kapsam().eksik.slice(), d = $("donem").value.trim(), sec = secenek();
    if (tur() === "kesit" && !Y.donemOku(d)) eksik.unshift(d ? "Gözlem dönemi (“" + d + "” anlaşılamadı; yalnız yıl yazın, örn. 2025)" : "Gözlem dönemi (örn. 2025)");
    if (tur() === "panel") { if (!sec.birim) eksik.unshift("Birim"); if (!sec.baslik) eksik.unshift("Kartın adı"); }
    if (eksik.length) {
      $("a4").hidden = true; $("a3").hidden = false; $("kartlar").innerHTML = "";
      var gh = $("genelHata"); gh.hidden = false; gh.className = "kutu uyari";
      gh.innerHTML = "Dosya okundu. Devam etmek için yukarıdaki formda şunları doldurun: " + eksik.map(function (m) { return "<b>" + esc(m) + "</b>"; }).join(", ") + ".";
      return;
    }
    $("genelHata").className = "kutu hata";
    sonuc = Y.standartKartlar(satirlar, tur(), secenek(), yer);
    onizle();
  }
  function ciz(k) {
    var gk = Object.keys(k.veri);
    if (k.sadece_tr) {
      var d = k.veri.TR, ok = d.filter(function (x) { return x !== null; }), mn = Math.min.apply(null, ok), mx = Math.max.apply(null, ok), W = 260, H = 46, n = d.length;
      var pts = d.map(function (v, i) { return v === null ? null : [(i / Math.max(1, n - 1)) * W, H - 4 - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * (H - 8)]; })
        .filter(Boolean).map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
      return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Seri önizlemesi"><polyline points="' + pts + '" fill="none" stroke="#721530" stroke-width="2"/></svg>' +
        '<div class="alt">' + esc(k.yillar[0]) + ": " + sayi(d[0], k.ondalik) + " → " + esc(k.yillar[n - 1]) + ": " + sayi(d[n - 1], k.ondalik) + " (" + n + " dönem)</div>";
    }
    var son = k.yillar.length - 1, donem = k.yillar.length > 1 ? esc(k.yillar[0]) + "–" + esc(k.yillar[son]) + " (" + k.yillar.length + " yıl); tablo " + esc(k.yillar[son]) + " için" : esc(k.yillar[0]);
    var il = gk.filter(function (c) { return Y.duzeyOf(c) === "il" && k.veri[c][son] !== null; }).sort(function (a, b) { return k.veri[b][son] - k.veri[a][son]; });
    var bol = gk.filter(function (c) { return Y.duzeyOf(c) === "bolge"; }).length;
    function sat(c) { return "<tr><td>" + esc(ADLAR[c] || c) + "</td><td>" + sayi(k.veri[c][son], k.ondalik) + " " + esc(k.birim) + "</td></tr>"; }
    return '<div class="alt">' + donem + ": " + il.length + " il" + (bol ? ", " + bol + " bölge" : "") + (k.veri.TR && k.veri.TR[son] !== null ? ", Türkiye: " + sayi(k.veri.TR[son], k.ondalik) + " " + esc(k.birim) : ", Türkiye değeri yok") + "</div>" +
      (il.length >= 6 ? '<table><tr><th colspan="2">En yüksek 3</th></tr>' + il.slice(0, 3).map(sat).join("") + '<tr><th colspan="2">En düşük 3</th></tr>' + il.slice(-3).map(sat).join("") + "</table>" : "");
  }
  function onizle() {
    var gh = $("genelHata"), kd = $("kartlar"), iyi = 0, kotu = 0;
    $("a3").hidden = false;
    gh.hidden = !sonuc.genel.length; gh.innerHTML = sonuc.genel.length ? "<b>Dosyada düzeltilmesi gereken bir şey var:</b><ul>" + sonuc.genel.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "";
    kd.innerHTML = sonuc.kartlar.map(function (r) {
      var k = r.kart; if (k) iyi++; else kotu++;
      var ad = k ? k.baslik : (r.sutun || "?");
      return '<div class="kart' + (k ? "" : " kotu") + '"><h3>' + esc(ad) + (k ? '<span class="rozet">' + esc(k.birim) + '</span><span class="rozet">' + esc(turAdi(k)) + (k.sadece_tr ? "" : k.yillar.length > 1 ? " · " + esc(k.yillar[0]) + "–" + esc(k.yillar[k.yillar.length - 1]) : " · " + esc(k.yillar[0])) + "</span>" : "") + "</h3>" +
        (k ? ciz(k) : "") +
        (r.hata.length ? '<div class="kutu hata yok-uyari"><ul>' + r.hata.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></div>" : "") +
        (r.uyari.length ? '<div class="kutu uyari yok-uyari"><ul>' + r.uyari.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></div>" : "") + "</div>";
    }).join("");
    var yayinlanabilir = !sonuc.genel.length && sonuc.kartlar.length && !kotu;
    $("a4").hidden = !yayinlanabilir;
    $("ozet").textContent = yayinlanabilir ? iyi + " kart yayınlanacak (" + (KONU_AD[$("konu").value] || $("konu").value) + " → " + kapsam().grup + "). Aynı konuda aynı başlıklı kart varsa yenisiyle değiştirilir." : "";
    $("yayinDurum").textContent = "";
  }

  /* ---- yayınla ---- */
  $("yayinla").addEventListener("click", function () {
    if (!sonuc) return;
    var kartlar = sonuc.kartlar.map(function (r) { return r.kart; });
    var d = $("yayinDurum"), b = $("yayinla"); b.disabled = true; d.className = "durum"; d.textContent = "Gönderiliyor…";
    api("/api/yukle", "POST", { kartlar: kartlar }).then(function (r) {
      b.disabled = false;
      if (r.ok) { d.textContent = r.j.eklenen + " kart yayınlandı. Veri portalında görünür."; listele(); }
      else { d.className = "durum hata"; d.textContent = r.durum === 401 ? "Oturum süresi doldu; ana sayfadan yeniden giriş yapın." : (r.j.hata || "Yayınlanamadı.") + (r.j.kart ? " (" + r.j.kart + ")" : ""); }
    }, function () { b.disabled = false; d.className = "durum hata"; d.textContent = "Sunucuya ulaşılamadı."; });
  });

  /* ---- yüklenenler ---- */
  function listele() {
    api("/api/manuel").then(function (r) {
      var k = (r.j && r.j.kartlar) || [], kutu = $("yuklenenler");
      gruplariKur(k); listeKur(true);
      if (!k.length) { kutu.innerHTML = '<p class="mut">Henüz elle yüklenmiş kart yok.</p>'; return; }
      kutu.innerHTML = '<table class="liste"><thead><tr><th>Kart</th><th>Konu</th><th>Tür</th><th>Dönem</th><th>Tarih</th><th></th></tr></thead><tbody>' +
        k.map(function (g) {
          return "<tr><td>" + esc(g.baslik) + " <span class='mut'>[" + esc(g.birim) + "]</span></td><td>" + esc((KONU_AD[g.konu] || g.konu) + " → " + g.grup) + "</td><td>" + esc(turAdi(g)) +
            "</td><td>" + esc(g.yillar.length > 1 ? g.yillar[0] + "–" + g.yillar[g.yillar.length - 1] : g.yillar[0]) + "</td><td>" + esc(g.yukleme || "") + '</td><td><button type="button" data-id="' + esc(g.id) + '">Sil</button></td></tr>';
        }).join("") + "</tbody></table>";
    });
  }
  $("yuklenenler").addEventListener("click", function (e) {
    var id = e.target.getAttribute && e.target.getAttribute("data-id");
    if (!id) return;
    if (!confirm("Bu kart portaldan kaldırılsın mı?")) return;
    api("/api/manuel?id=" + encodeURIComponent(id), "DELETE").then(function () { listele(); });
  });

  turGoster();
})();
