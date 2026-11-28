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
  function tur() { return document.querySelector('input[name="tur"]:checked').value; }
  function api(yol, yontem, govde) {
    return fetch(yol, { method: yontem || "GET", credentials: "same-origin", cache: "no-store", headers: govde ? { "content-type": "application/json" } : {}, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, durum: r.status, j: j }; }); });
  }

  /* ---- giriş denetimi ---- */
  api("/api/ben").then(function (r) {
    if (r.j && r.j.girisli) { $("icerik").hidden = false; $("cikis").hidden = false; listele(); }
    else $("kapi").hidden = false;
  }, function () { $("kapi").hidden = false; $("kapi").querySelector("p").textContent = "Sunucuya ulaşılamadı. Bu sayfa yalnızca yayındaki sitede çalışır."; });
  $("cikis").addEventListener("click", function () { api("/api/cikis", "POST", {}).then(function () { location.href = "./"; }); });

  /* ---- form ---- */
  /* Konu / alt başlık listeleri sitenin kendi verisinden gelir (veri.js + daha önce yüklenen kartlar); elle yazılmaz.
     Ekonomi dışında: konu -> alt başlık (= grup). Ekonomi'de portal bir kademe daha açar: alt başlık (Üretim, Fiyatlar…) -> grup. */
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
    var k = $("konu").value, e = k === "ekonomi", onceAlt = korun ? $("alt").value : "", onceGrup = korun ? $("grup").value : "";
    $("altEt").firstChild.nodeValue = e ? "Alt başlık (Ekonomi)" : "Alt başlık";
    $("alt").innerHTML = !k ? secenekler([], "Önce konuyu seçin", false)
      : e ? secenekler(TRALT, "Seçiniz…", false)
      : secenekler(gruplar(k).map(function (g) { return [g, g]; }), "Seçiniz…", true);
    if (onceAlt && $("alt").querySelector('option[value="' + onceAlt.replace(/"/g, '\\"') + '"]')) $("alt").value = onceAlt;
    var a = $("alt").value;
    $("grupEt").hidden = !(e && a);
    if (e && a) {
      $("grup").innerHTML = secenekler(gruplar(a).map(function (g) { return [g, g]; }), "Seçiniz…", true);
      if (onceGrup && $("grup").querySelector('option[value="' + onceGrup.replace(/"/g, '\\"') + '"]')) $("grup").value = onceGrup;
    }
    $("yeniEt").hidden = !(($("alt").value === "__yeni") || (!$("grupEt").hidden && $("grup").value === "__yeni"));
  }
  /* seçilen kapsam: kart konusu + grup; eksik kalan alanların adları */
  function kapsam() {
    var k = $("konu").value, eksik = [], konuKey = k, grup = "";
    if (!k) { eksik.push("Konu"); return { eksik: eksik }; }
    var a = $("alt").value;
    if (!a) { eksik.push("Alt başlık"); return { eksik: eksik }; }
    if (k === "ekonomi") {
      konuKey = a; var g = $("grup").value;
      if (!g) eksik.push("Grup"); else grup = g === "__yeni" ? $("yeni").value.trim() : g;
    } else grup = a === "__yeni" ? $("yeni").value.trim() : a;
    if (!eksik.length && !grup) eksik.push("Yeni alt başlığın adı");
    return { konuKey: konuKey, grup: grup, eksik: eksik };
  }
  $("konu").innerHTML = secenekler(KONULAR, "Seçiniz…", false);
  gruplariKur(); listeKur(false);
  $("konu").addEventListener("change", function () { $("alt").value = ""; listeKur(false); });
  $("alt").addEventListener("change", function () { $("grup").value = ""; listeKur(true); });
  $("grup").addEventListener("change", function () { listeKur(true); });
  function turGoster() {
    var k = tur() === "kesit";
    $("donemEt").hidden = !k; $("bolgeEt").hidden = !k;
    uret();
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="tur"]'), function (r) { r.addEventListener("change", turGoster); });
  ["donem", "konu", "alt", "grup", "yeni", "kaynak", "not", "bolge"].forEach(function (i) { $(i).addEventListener("input", uret); $(i).addEventListener("change", uret); });

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
    var k = kapsam();
    return { donem: $("donem").value.trim(), konu: k.konuKey, grup: k.grup,
      kaynak: $("kaynak").value.trim() || null, not: $("not").value.trim() || null, bolge: $("bolge").value };
  }
  function uret() {
    sonuc = null;
    if (!satirlar) { $("a3").hidden = true; $("a4").hidden = true; return; }
    /* dosya değil form eksik: standart hatası göstermeyip eksik alanları işaret et */
    var eksik = kapsam().eksik.slice(), d = $("donem").value.trim();
    if (tur() === "kesit" && !Y.donemOku(d)) eksik.unshift(d ? "Gözlem dönemi (“" + d + "” anlaşılamadı; yalnız yıl yazın, örn. 2025)" : "Gözlem dönemi (örn. 2025)");
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
    var il = gk.filter(function (c) { return Y.duzeyOf(c) === "il" && k.veri[c][0] !== null; }).sort(function (a, b) { return k.veri[b][0] - k.veri[a][0]; });
    var bol = gk.filter(function (c) { return Y.duzeyOf(c) === "bolge"; }).length;
    function sat(c) { return "<tr><td>" + esc(ADLAR[c] || c) + "</td><td>" + sayi(k.veri[c][0], k.ondalik) + " " + esc(k.birim) + "</td></tr>"; }
    return '<div class="alt">' + il.length + " il" + (bol ? ", " + bol + " bölge" : "") + (k.veri.TR ? ", Türkiye: " + sayi(k.veri.TR[0], k.ondalik) + " " + esc(k.birim) : ", Türkiye değeri yok") + "</div>" +
      (il.length >= 6 ? '<table><tr><th colspan="2">En yüksek 3</th></tr>' + il.slice(0, 3).map(sat).join("") + '<tr><th colspan="2">En düşük 3</th></tr>' + il.slice(-3).map(sat).join("") + "</table>" : "");
  }
  function onizle() {
    var gh = $("genelHata"), kd = $("kartlar"), iyi = 0, kotu = 0;
    $("a3").hidden = false;
    gh.hidden = !sonuc.genel.length; gh.innerHTML = sonuc.genel.length ? "<b>Dosya standarda uymuyor:</b><ul>" + sonuc.genel.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "";
    kd.innerHTML = sonuc.kartlar.map(function (r) {
      var k = r.kart; if (k) iyi++; else kotu++;
      var ad = k ? k.baslik : (r.sutun || "?");
      return '<div class="kart' + (k ? "" : " kotu") + '"><h3>' + esc(ad) + (k ? '<span class="rozet">' + esc(k.birim) + '</span><span class="rozet">' + (k.sadece_tr ? "Türkiye serisi" : "il kesiti · " + esc(k.yillar[0])) + "</span>" : "") + "</h3>" +
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
          return "<tr><td>" + esc(g.baslik) + " <span class='mut'>[" + esc(g.birim) + "]</span></td><td>" + esc((KONU_AD[g.konu] || g.konu) + " → " + g.grup) + "</td><td>" + (g.sadece_tr ? "Türkiye serisi" : "İl kesiti") +
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
