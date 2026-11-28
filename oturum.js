/* Enstitü girişi: parola penceresi + oturum durumu. Parola sunucuda (worker.js) doğrulanır. */
(function () {
  function $(i) { return document.getElementById(i); }
  var giris = $("enstituGiris"), cikis = $("enstituCikis"), yukle = $("yukleBag"), menu = $("girisMenu"), dugme = $("girisDugme");
  if (!giris) return;

  function durum(girisli) {
    giris.hidden = girisli; cikis.hidden = !girisli; yukle.hidden = !girisli;
  }
  function istek(yol, govde) {
    return fetch(yol, { method: govde ? "POST" : "GET", credentials: "same-origin",
      headers: govde ? { "content-type": "application/json" } : {}, body: govde ? JSON.stringify(govde) : undefined })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }

  var pencere = document.createElement("dialog");
  pencere.id = "girisPenceresi";
  pencere.innerHTML = '<form method="dialog" id="girisForm"><h2>Enstitü girişi</h2><p>Veri yüklemek için enstitü parolasını girin.</p>' +
    '<label for="girisParola" class="gizli" style="position:absolute;left:-9999px">Parola</label>' +
    '<input type="password" id="girisParola" autocomplete="current-password" required>' +
    '<p class="hata" id="girisHata" role="alert"></p>' +
    '<div class="satir"><button type="button" class="dugme cizgi" id="girisVazgec">Vazgeç</button><button type="submit" class="dugme" id="girisGonder">Giriş yap</button></div></form>';
  document.body.appendChild(pencere);

  giris.addEventListener("click", function () {
    if (menu) menu.hidden = true;
    $("girisHata").textContent = ""; $("girisParola").value = "";
    pencere.showModal(); $("girisParola").focus();
  });
  $("girisVazgec").addEventListener("click", function () { pencere.close(); });
  $("girisForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var g = $("girisGonder"); g.disabled = true;
    istek("/api/giris", { parola: $("girisParola").value }).then(function (r) {
      g.disabled = false;
      if (r.ok) { pencere.close(); durum(true); location.href = "veri-yukle.html"; }
      else $("girisHata").textContent = (r.j && r.j.hata) || "Giriş yapılamadı.";
    }, function () { g.disabled = false; $("girisHata").textContent = "Sunucuya ulaşılamadı."; });
  });
  cikis.addEventListener("click", function () { istek("/api/cikis", {}).then(function () { durum(false); }); });

  istek("/api/ben").then(function (r) { durum(!!(r.j && r.j.girisli)); }, function () { /* yerel/statik açılışta API yok: giriş kapalı kalır */ });
})();
