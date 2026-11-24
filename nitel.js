/* Nitel analiz: taslak. Yalnızca sekme geçişi; analiz işlevleri henüz yok. */
(function () {
  var sekmeler = document.getElementById("sekmeler");
  sekmeler.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-s]");
    if (!b) return;
    Array.prototype.forEach.call(sekmeler.querySelectorAll("button"), function (x) {
      x.setAttribute("aria-selected", String(x === b));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".sek"), function (p) {
      p.hidden = p.id !== "s-" + b.dataset.s;
    });
  });
})();
