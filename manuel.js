/* Elle yüklenen kartları (Worker /api/manuel) window.VERI.gostergeler listesine ekler.
   Eşzamanlı istek kullanılır: portal, veriyi açılışta okuduğu için kartlar ondan önce eklenmeli.
   API yoksa (yerel dosya, çevrimdışı) sessizce atlanır; site eskisi gibi çalışır. */
(function () {
  try {
    if (!window.VERI || location.protocol === "file:") return;
    var x = new XMLHttpRequest();
    x.open("GET", "/api/manuel", false);
    x.send();
    if (x.status !== 200) return;
    var k = JSON.parse(x.responseText).kartlar, G = window.VERI.gostergeler, var_ = {};
    G.forEach(function (g) { var_[g.id] = 1; });
    (k || []).forEach(function (g) { if (!var_[g.id]) G.push(g); });
  } catch (e) { /* kartlar eklenemedi; ana veri etkilenmez */ }
})();
