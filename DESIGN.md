---
name: Enstitü Portal
description: Enstitü Sosyal'in TÜİK il verisi portalı; krem zeminde bordo ve kırmızı vurgu, düz çizgili kartlar.
colors:
  brand-red: "#d1181e"
  brand-burgundy: "#721530"
  ink: "#17171a"
  ink-muted: "#62626a"
  paper-cream: "#fbfbf2"
  paper-white: "#ffffff"
  hairline: "#e6e4d8"
  tint-hover: "#f6efe8"
  tint-label: "#f6e6e8"
  map-1: "#f7e1e2"
  map-2: "#eeb3b6"
  map-3: "#e0777c"
  map-4: "#c63a41"
  map-5: "#7b0828"
typography:
  display:
    fontFamily: "ClashDisplay, Segoe UI, system-ui, sans-serif"
    fontSize: "46px"
    fontWeight: 600
    lineHeight: 1.1
  headline:
    fontFamily: "ClashDisplay, Segoe UI, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "ClashDisplay, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Satoshi, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Satoshi, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.1em"
rounded:
  item: "8px"
  menu: "12px"
  card: "14px"
  map: "18px"
  pill: "30px"
  search: "34px"
spacing:
  xs: "6px"
  sm: "14px"
  md: "24px"
  gutter: "40px"
  gutter-narrow: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand-burgundy}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.pill}"
    padding: "8px 18px"
  button-primary-hover:
    backgroundColor: "{colors.brand-red}"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.brand-burgundy}"
    rounded: "{rounded.pill}"
    padding: "8px 18px"
  tool-card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.card}"
    padding: "16px"
  tool-card-featured:
    backgroundColor: "{colors.brand-burgundy}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.card}"
    padding: "16px"
  search-field:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.search}"
    padding: "4px 20px"
---

# Design System: Enstitü Portal

## Overview

**Creative North Star: "Kamu Arşivi Atölyesi"**

Enstitü Sosyal'in portalı, bir kamu arşivinin çalışma masası gibi davranır: krem bir zeminde düzenli, ince çizgili kartlar ve tek bir bordo-kırmızı ses. Bilgi önde durur, süs geri planda kalır. Sayfa sakin ve güvenilir okunur; araştırmacıya kendini göstermek yerine aradığını bulduran bir yüzeydir.

Yoğunluk orta: araçlar beş sütun, konular altı sütun, bulgular üç sütun. Hiyerarşiyi büyük başlık, bordo renk ve kart ağırlığı kurar; gölge ve hareket yalnız etkileşimde belirir. Marka kimliği Enstitü Sosyal'in mevcut temasından gelir (krem zemin, bordo ve kırmızı, ClashDisplay ve Satoshi, 30 px yuvarlak düğmeler) ve korunur. Limon yeşili ve siyah harita çerçevesi bu sistemin parçası değildir.

**Key Characteristics:**
- Krem kâğıt zemin (Enstitü Sosyal'in marka zemini, bilinçli seçim), beyaz kartlar, ince sıcak gri kenarlık.
- Bordo birincil eylem ve başlık rengi; kırmızı küçük vurgu ve etkileşim rengi.
- Başlıkta ClashDisplay, gövdede Satoshi.
- Yuvarlak ama gösterişsiz köşeler: düğme ve arama hap biçimli, kartlar 14 px.
- Düz yüzeyler; gölge yalnız açılır katmanda ve üzerine gelinen kartta.

## Colors

Sıcak, kısıtlı bir palet: krem ve beyaz zemin, bordo ve kırmızı iki vurgu, sıcak gri çizgiler.

### Primary
- **Bordo** (#721530): Başlıklar, birincil düğme, öne çıkan araç kartı zemini, arama kutusu kenarlığı, logo yazısı.
- **Enstitü Kırmızısı** (#d1181e): Küçük vurgular: araç kartı üst çizgisi, logo karesi, düğme üzerine gelme durumu, örnek arama bağlantıları, üst yazı etiketi.

### Neutral
- **Mürekkep** (#17171a): Gövde metni ve harita ipucu kutusu.
- **Sönük Gri** (#62626a): İkincil metin, kart alt yazıları, lejant.
- **Krem Kâğıt** (#fbfbf2): Sayfa zemini.
- **Beyaz** (#ffffff): Kartlar, üst çubuk, arama, açılır menü.
- **Sıcak Çizgi** (#e6e4d8): Kart ve bölüm kenarlıkları.
- **Sıcak Dokunuş** (#f6efe8): Menü ve öneri satırı üzerine gelme zemini.
- **Etiket Pembesi** (#f6e6e8): Arama sonucu tür etiketi zemini.

### Harita Sınıfları
Beş eşit sayılı sınıf, açıktan koyuya: #f7e1e2, #eeb3b6, #e0777c, #c63a41, #7b0828. Veri portalındaki haritayla aynıdır.

### Named Rules
**Tek Ses Kuralı.** Bordo ve kırmızı sayfanın azınlığında kalır; bir ekranda yüzeyin büyük kısmı krem ve beyazdır. Nadir olması vurguyu işe yarar kılar.

**Bordo Eylemdir Kuralı.** Bordo dolgu yalnız bir eylemi ya da en önemli aracı işaretler.

## Typography

**Display ve başlık yazı tipi:** ClashDisplay (Segoe UI ve sistem sans-serif yedekli)
**Gövde yazı tipi:** Satoshi (Segoe UI ve sistem sans-serif yedekli)

**Character:** ClashDisplay'in geometrik, hafif iddialı çizgisi başlığa karakter verir; Satoshi gövdeyi sakin ve okunur tutar. İkisi birlikte "kurumsal ama modern" bir ton kurar.

### Hierarchy
- **Display** (600, 46px, 1.1; dar ekranda 34px): Ana sayfa kahraman başlığı, bordo.
- **Headline** (600, 21px, 1.3): Bölüm başlıkları ("Araçlar", "Konulara göre gez"), bordo.
- **Title** (600, 16–18px, 1.3): Araç kartı ve il kartı başlıkları.
- **Body** (400, 14–18px, 1.4–1.5): Açıklamalar; kahraman girişi 18px, en çok 540px genişlikte.
- **Label** (700, 13px, 0.1em, büyük harf): Üst yazı ("ey") etiketi, kırmızı. Küçük etiketlerde 10,5–12px.

### Named Rules
**İki Aile Kuralı.** Başlıkta yalnız ClashDisplay, gövdede yalnız Satoshi; üçüncü bir aile eklenmez.

## Layout

Kenarlardan yatay boşluk masaüstünde 40 px, 1000 px altında 20 px, dar ekranda 16 px. Bölümler dikey sırayla akar: kahraman (metin ve harita iki sütun, 1fr / 1.1fr), arama (en çok 760 px, ortalı), araçlar (5 sütun), konular (6 sütun), bulgular (3 sütun), alt bilgi. Izgara boşlukları 14–16 px; bölümler arası boşluk bölüm başlığının üst iç boşluğuyla (yaklaşık 34 px) kurulur.

1000 px altında kahraman tek sütuna, araçlar iki sütuna, konular üç sütuna, bulgular tek sütuna iner; 560 px altında konular iki sütun olur, "Veri portalına git" düğmesi gizlenir ve harita 330 px yüksekliğe iner. Üst çubuk yapışkandır (sticky).

## Elevation & Depth

Sistem büyük ölçüde düzdür: derinlik kenar çizgisiyle ve zemin farkıyla (krem zemin, beyaz kart) kurulur. Gölge yalnız katmanlarda ve etkileşimde görünür.

### Shadow Vocabulary
- **Açılır katman** (`box-shadow: 0 8px 24px #0003`): Giriş menüsü.
- **Öneri listesi** (`box-shadow: 0 10px 26px #0002`): Arama sonuç listesi.
- **Kart üzerine gelme** (`box-shadow: 0 6px 18px #0002`): Tıklanabilir araç ve bulgu kartı.
- **Arama kutusu** (`box-shadow: 0 6px 20px #72153020`, odakta `0 6px 24px #72153038`): Bordo tonlu hafif parıltı.

### Named Rules
**Gölge Tepkidir Kuralı.** Yüzey sakin durumda gölgesizdir; gölge yalnız açılan bir katmanı ya da üzerine gelinen bir kartı ayırır.

## Shapes

Köşe dili yuvarlak ama ölçülü: düğmeler hap (30 px), arama kutusu daha yuvarlak hap (34 px), kartlar 14 px, harita kutusu 18 px, açılır menü 12 px, menü satırları ve küçük etiketler 8 px. Kenarlıklar 1 px sıcak çizgi (tam çerçeve; tek kenarlı vurgu çizgisi yok); arama kutusu 2 px bordo, düğmeler 1,5 px. Araç kartlarında imza, kırmızı çizgi simgedir: 26 px, 1,8 px kalınlıkta tek stil çizgi simgeler. Logo, iki küçük yuvarlatılmış kareden (kırmızı ve bordo) oluşur.

## Components

### Buttons
- **Shape:** Hap (30 px)
- **Primary:** Bordo dolgu, beyaz yazı, 8 × 18 px iç boşluk, 700 ağırlık 14 px.
- **Hover:** Dolgu ve kenarlık kırmızıya geçer.
- **Outline:** Beyaz zemin, bordo yazı ve kenarlık; üzerine gelince #f6efe8 zemin.

### Cards / Containers
- **Tool card (Araç kartı):** Beyaz zemin, 1 px sıcak çizgi, 14 px köşe, 16 px iç boşluk. En üstte 26 px kırmızı çizgi simge, altında bordo ClashDisplay başlık, 13 px sönük gri açıklama. Öne çıkan kart (Veri portalı) bordo dolgulu, beyaz metin ve beyaz simge. Hazır olan araçlar dört sütunda tek satırdır.
- **Yakında listesi:** Hazır olmayan araçlar kart değil, "Yakında" başlıklı düz bir listedir (çerçevesiz, sönük gri, tıklanamaz). Yarı saydamlık kullanılmaz; kontrast tam kalır. Taslak araçlar kartta "taslak" etiketi taşır (8 px köşe, açık bordo zemin).
- **Bulgu kartı:** Beyaz kart, bordo ClashDisplay başlık ve açıklama; üstte görsel bant yoktur (veri taşımayan süs kullanılmaz).
- **İl kartı:** Haritanın üstünde açılır, beyaz, 14 px köşe, hafif gölge.

### Inputs / Fields
- **Arama:** Beyaz zemin, 2 px bordo kenarlık, 34 px hap köşe, 17 px yazı; odakta gölge güçlenir. Altında örnek aramalar kırmızı altı çizili bağlantılar, sonuç listesi beyaz katman, tür etiketi küçük harf büyük harfli pembe rozet.

### Navigation
- **Üst çubuk:** Beyaz, 1 px alt çizgi, sticky; solda logo (ClashDisplay 18px, bordo), sağda "Veri portalına git" (outline) ve "Giriş yap" (birincil) düğmeleri. Giriş menüsü açılır katmandır; henüz kullanılamayan öğeler soluk ve "yakında" yazılıdır.

### Harita
- Beyaz kutu, 18 px köşe, ince beyaz il sınırı, beş sınıflı bordo-pembe skala; üzerine gelince koyu ipucu kutusu (#17171a, beyaz yazı, 6 px köşe). Lejant sağ altta yarı saydam beyaz.

## Do's and Don'ts

### Do:
- **Do** bordoyu (#721530) başlık ve birincil eylem için, kırmızıyı (#d1181e) küçük vurgu için kullan.
- **Do** kartları beyaz zeminde 1 px sıcak çizgiyle ayır; derinlik için önce çizgi ve zemin farkı.
- **Do** başlıkta ClashDisplay 600, gövdede Satoshi kullan.
- **Do** düğmeleri hap biçiminde (30 px) tut; sayfadaki tek dolgulu bordo düğme asıl eylemdir (Veri portalına git), "Giriş yap" metin düğmesidir.
- **Do** henüz hazır olmayan şeyi soluk ve "yakında" etiketli göster; hazır gibi sunma.
- **Do** haritada portaldaki beş sınıflı renk skalasını kullan.

### Don't:
- **Don't** limon yeşili (#cfff45) kullanma.
- **Don't** haritada seçili ile siyah çerçeve çizme; seçili il kendi tonunun koyusuna döner.
- **Don't** sakin yüzeye gölge ekleme; gölge yalnız açılan katmanda ve üzerine gelinen kartta.
- **Don't** emoji ya da Unicode karakterleri simge yerine kullanma; tek çizgi stilinde SVG simge kullan.
- **Don't** başlığın üstüne küçük etiket (kicker) koyma; başlık tek başına taşır.
- **Don't** yuvarlak kartın tek kenarına renkli çizgi çekme.
- **Don't** hazır olmayan öğeyi yarı saydam kartla gösterme; "Yakında" listesine koy.
- **Don't** üçüncü bir yazı tipi ailesi ekleme.
