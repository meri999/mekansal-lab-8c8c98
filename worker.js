/* Enstitü Portal (lab) Worker: statik dosyalar + enstitü girişi.
   Gizli değerler depoda yoktur; Cloudflare Secret olarak tutulur:
     PAROLA            enstitü ortak parolası
     OTURUM_ANAHTARI   çerez imzası için uzun rastgele metin
   KV bağlaması: VERI (giriş denemesi sayacı, ileride yüklenen kartlar) */

const OTURUM_SN = 8 * 3600;
const DENEME_SINIR = 5, DENEME_SN = 15 * 60;
const enc = new TextEncoder();

const json = (o, durum = 200, baslik = {}) =>
  new Response(JSON.stringify(o), { status: durum, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...baslik } });

async function imza(anahtar, metin) {
  const k = await crypto.subtle.importKey("raw", enc.encode(anahtar), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const b = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(metin)));
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
}

/* sabit zamanlı karşılaştırma: iki metnin özetini karşılaştırır, uzunluk sızmaz */
async function esit(a, b) {
  const [x, y] = await Promise.all([a, b].map(async s => new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))));
  let f = 0; for (let i = 0; i < x.length; i++) f |= x[i] ^ y[i];
  return f === 0;
}

function cerez(istek, ad) {
  const m = (istek.headers.get("cookie") || "").match(new RegExp("(?:^|; )" + ad + "=([^;]*)"));
  return m ? m[1] : null;
}

export async function girisliMi(istek, env) {
  const c = cerez(istek, "oturum");
  if (!c || !env.OTURUM_ANAHTARI) return false;
  const [bitis, im] = c.split(".");
  if (!/^\d+$/.test(bitis || "") || Number(bitis) < Date.now() / 1000) return false;
  return esit(im || "", await imza(env.OTURUM_ANAHTARI, "oturum." + bitis));
}

const CEREZ_OZ = "Path=/; HttpOnly; Secure; SameSite=Strict";

async function giris(istek, env) {
  if (!env.PAROLA || !env.OTURUM_ANAHTARI) return json({ hata: "Giriş henüz kurulmadı." }, 503);
  const ip = istek.headers.get("cf-connecting-ip") || "bilinmiyor";
  const anah = "deneme:" + ip;
  const say = env.VERI ? Number(await env.VERI.get(anah)) || 0 : 0;
  if (say >= DENEME_SINIR) return json({ hata: "Çok fazla deneme. Biraz sonra yeniden deneyin." }, 429);
  let govde; try { govde = await istek.json(); } catch { return json({ hata: "Geçersiz istek." }, 400); }
  if (!(await esit(String(govde.parola || ""), env.PAROLA))) {
    if (env.VERI) await env.VERI.put(anah, String(say + 1), { expirationTtl: DENEME_SN });
    return json({ hata: "Parola yanlış." }, 401);
  }
  if (env.VERI) await env.VERI.delete(anah);
  const bitis = Math.floor(Date.now() / 1000) + OTURUM_SN;
  const deger = bitis + "." + await imza(env.OTURUM_ANAHTARI, "oturum." + bitis);
  return json({ girisli: true }, 200, { "set-cookie": `oturum=${deger}; ${CEREZ_OZ}; Max-Age=${OTURUM_SN}` });
}

/* ---- elle yüklenen kartlar (KV anahtarı "manuel") ----
   Okuma herkese açık; yazma ve silme yalnız girişli. Gelen kart burada yeniden doğrulanır: tarayıcıya güvenilmez. */
const MAX_KART = 300, MAX_BAYT = 8_000_000;
const DONEM = /^\d{4}(-(0[1-9]|1[0-2]|Q[1-4]))?$/;
const YER_KOD = /^TR[0-9A-C]?[0-9A-Z]{0,2}$/;
const metin = (v, n) => typeof v === "string" && v.trim() !== "" && v.length <= n;
const seçMetin = (v, n) => v === null || v === undefined || v === "" ? null : (typeof v === "string" && v.length <= n ? v : false);

export function kartDogrula(k) {
  if (!k || typeof k !== "object") return "Kart nesne değil.";
  if (!metin(k.baslik, 160) || !metin(k.birim, 40) || !metin(k.konu, 40) || !/^[a-z]+$/.test(k.konu)) return "Başlık, birim veya konu geçersiz.";
  const grup = seçMetin(k.grup, 80), kaynak = seçMetin(k.kaynak, 160), not = seçMetin(k.not, 400);
  if (grup === false || kaynak === false || not === false) return "Grup, kaynak veya not geçersiz.";
  if (!Array.isArray(k.yillar) || k.yillar.length < 1 || k.yillar.length > 700 || !k.yillar.every(d => typeof d === "string" && DONEM.test(d))) return "Dönemler geçersiz.";
  if (new Set(k.yillar).size !== k.yillar.length) return "Dönemler tekrar ediyor.";
  if (!k.veri || typeof k.veri !== "object" || Array.isArray(k.veri)) return "Veri geçersiz.";
  const kodlar = Object.keys(k.veri);
  if (!kodlar.length || kodlar.length > 120) return "Yer sayısı geçersiz.";
  for (const kod of kodlar) {
    const d = k.veri[kod];
    if (!YER_KOD.test(kod) || !Array.isArray(d) || d.length !== k.yillar.length) return "Yer verisi geçersiz: " + kod;
    if (!d.every(x => x === null || (typeof x === "number" && Number.isFinite(x)))) return "Sayı olmayan değer: " + kod;
  }
  const tr = k.sadece_tr === true;
  if (tr && (kodlar.length !== 1 || kodlar[0] !== "TR")) return "Türkiye serisinde yalnız TR olmalı.";
  const sik = k.sik === "M" || k.sik === "Q" ? k.sik : null;
  const ond = Number.isInteger(k.ondalik) && k.ondalik >= 0 && k.ondalik <= 4 ? k.ondalik : 1;
  const oneri = (v, izin, var_) => izin.includes(v) ? v : var_;
  return {
    id: "m" + crypto.randomUUID().replace(/-/g, "").slice(0, 10),
    konu: k.konu, grup: grup || k.konu, baslik: k.baslik.trim(), birim: k.birim.trim(), ondalik: ond,
    degisim: oneri(k.degisim, ["yuzde", "fark", "puan"], "yuzde"), iyi: oneri(k.iyi, ["yukari", "asagi", "notr"], "notr"),
    ayrisma: "hayir", kaynak: kaynak || "Elle yüklendi", not: not || null, df_id: null, sonraki: null, sik,
    bolge_hesap: k.bolge_hesap === true ? true : null, oto: null, sadece_tr: tr ? true : null, manuel: true,
    yukleme: new Date().toISOString().slice(0, 10), yillar: k.yillar, veri: k.veri
  };
}

async function manuelOku(env) {
  const v = env.VERI ? await env.VERI.get("manuel", "json") : null;
  return Array.isArray(v) ? v : [];
}

async function manuelYukle(istek, env) {
  if (!(await girisliMi(istek, env))) return json({ hata: "Giriş gerekli." }, 401);
  if (!env.VERI) return json({ hata: "Depolama kurulmadı." }, 503);
  let g; try { g = await istek.json(); } catch { return json({ hata: "Geçersiz istek." }, 400); }
  if (!Array.isArray(g.kartlar) || !g.kartlar.length || g.kartlar.length > 40) return json({ hata: "1-40 kart gönderilmeli." }, 400);
  const yeni = [];
  for (const k of g.kartlar) { const r = kartDogrula(k); if (typeof r === "string") return json({ hata: r, kart: k && k.baslik }, 400); yeni.push(r); }
  const anahtar = k => [k.konu, k.baslik.toLocaleLowerCase("tr"), k.sadece_tr ? "tr" : "il"].join("|");
  const yeniAnahtar = new Set(yeni.map(anahtar));
  const var_ = (await manuelOku(env)).filter(k => !yeniAnahtar.has(anahtar(k)));
  const hepsi = var_.concat(yeni);
  if (hepsi.length > MAX_KART) return json({ hata: "En çok " + MAX_KART + " kart tutulabilir." }, 400);
  const govde = JSON.stringify(hepsi);
  if (govde.length > MAX_BAYT) return json({ hata: "Toplam veri çok büyük." }, 400);
  await env.VERI.put("manuel", govde);
  return json({ eklenen: yeni.length, toplam: hepsi.length, kartlar: yeni.map(k => ({ id: k.id, baslik: k.baslik })) });
}

async function manuelSil(istek, env, id) {
  if (!(await girisliMi(istek, env))) return json({ hata: "Giriş gerekli." }, 401);
  const var_ = await manuelOku(env), kalan = var_.filter(k => k.id !== id);
  if (kalan.length === var_.length) return json({ hata: "Kart bulunamadı." }, 404);
  await env.VERI.put("manuel", JSON.stringify(kalan));
  return json({ silinen: id, toplam: kalan.length });
}

export default {
  async fetch(istek, env) {
    const u = new URL(istek.url);
    if (u.pathname === "/api/giris" && istek.method === "POST") return giris(istek, env);
    if (u.pathname === "/api/cikis" && istek.method === "POST")
      return json({ girisli: false }, 200, { "set-cookie": `oturum=; ${CEREZ_OZ}; Max-Age=0` });
    if (u.pathname === "/api/ben") return json({ girisli: await girisliMi(istek, env) });
    if (u.pathname === "/api/manuel" && istek.method === "GET")
      /* önbellek yok: yayından hemen sonra görünmeli. Okuma herkese açıktır; enstitü sitesi (başka adres) de okuyabilsin diye CORS açık.
         Yazma ve silme açık değildir: çerez gerektirir ve çerez SameSite=Strict olduğundan başka sitelerden kullanılamaz. */
      return json({ kartlar: await manuelOku(env) }, 200, { "access-control-allow-origin": "*" });
    if (u.pathname === "/api/yukle" && istek.method === "POST") return manuelYukle(istek, env);
    if (u.pathname === "/api/manuel" && istek.method === "DELETE") return manuelSil(istek, env, u.searchParams.get("id") || "");
    if (u.pathname.startsWith("/api/")) return json({ hata: "Bulunamadı." }, 404);
    return env.ASSETS.fetch(istek);
  }
};
