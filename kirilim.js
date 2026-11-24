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

  /* --- çizim (Task 6'da tamamlanır) -------------------------------------- */
  function ciz() {
    var k = tablo.kirilimlar, r = durum.roller;
    function ad(kol) { for (var i = 0; i < k.length; i++) if (k[i].kol === kol) return k[i].ad; return ""; }
    $("ipucu").textContent = "Satır: " + ad(r.k1) + " · Sütun: " + ad(r.k2) +
      (r.k3 === "-" ? " · Üçüncü kırılım toplamı alınıyor" : " · " + ad(r.k3) + " paneller olarak ayrıldı");
    $("sonuc").innerHTML = '<div class="bos">Çıktı hazırlanıyor.</div>';
  }

  /* --- olaylar ----------------------------------------------------------- */
  $("konu").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-k]");
    if (b) konuSec(+b.dataset.k);
  });
  $("tablo").addEventListener("change", function () { tabloSec(this.value); });
  $("k1").addEventListener("change", function () { rolDegisti("k1", this.value); });
  $("k2").addEventListener("change", function () { rolDegisti("k2", this.value); });
  $("k3").addEventListener("change", function () { rolDegisti("k3", this.value); });

  konuSec(0);
})();
