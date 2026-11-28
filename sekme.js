/* Sekme gezintisi: ok tuslari, Home/End; secili sekme tek Tab duragi (roving tabindex).
   Kullanim: Sekme.baglan(kapsayiciElemani). Dugmeler sonradan yeniden cizilse de calisir. */
(function (global) {
  function duzenle(kap) {
    var d = kap.querySelectorAll('[role="tab"], button[aria-selected]');
    for (var i = 0; i < d.length; i++) d[i].tabIndex = d[i].getAttribute("aria-selected") === "true" ? 0 : -1;
  }
  function baglan(kap) {
    if (!kap || kap.dataset.sekme) return; kap.dataset.sekme = "1";
    if (!kap.getAttribute("role")) kap.setAttribute("role", "tablist");
    duzenle(kap);
    new MutationObserver(function () { duzenle(kap); }).observe(kap, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    kap.addEventListener("keydown", function (e) {
      var t = e.target.closest && e.target.closest("button"); if (!t || !kap.contains(t)) return;
      var d = Array.prototype.slice.call(kap.querySelectorAll('[role="tab"], button[aria-selected]')), i = d.indexOf(t), j;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % d.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + d.length) % d.length;
      else if (e.key === "Home") j = 0; else if (e.key === "End") j = d.length - 1; else return;
      e.preventDefault(); d[j].focus(); d[j].click();
      var yeni = kap.querySelectorAll('[role="tab"], button[aria-selected]')[j]; if (yeni) yeni.focus();
    });
  }
  global.Sekme = { baglan: baglan };
})(window);
