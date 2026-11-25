# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Birincil kullanıcı: Enstitü Sosyal'in araştırmacıları. TÜİK verisini il düzeyinde bulur, illeri ve Türkiye'yi karşılaştırır, sonucu rapora ve yazıya taşır. Sayfayı bir göstergeyi, bir ili ya da bir aracı hızla bulmak için açar; keşif gezintisi ikinci planda.

Başka kitleler (kamu ve belediye çalışanları, gazeteciler, genel okur) doğrulanmış değil; sayfa onlara da açık ama onlar için ayrıca tasarlanmaz.

## Product Purpose

Enstitü Portal, TÜİK'in resmi istatistiklerini illere göre okunabilir ve karşılaştırılabilir hâle getiren bir veri portalıdır. Başarı: araştırmacının bir soruya (ör. "bir ilin işsizliği komşularından nasıl ayrışıyor?") portal içinde, ham tabloları indirip kendi başına işlemeden cevap bulması.

## Positioning

Üç şey birlikte, başka bir TÜİK arayüzünün aynı anda sunmadığı biçimde:
- Ham tablolardan hesaplanmış il göstergeleri (bin kişiye düşen, değişim, bölge değeri gibi) ve Türkiye düzeyi bir arada.
- Kırılım Gezgini: aynı tabloyu iki ya da üç eksende çaprazlama ve harita, tablo, grafik çıktısı.
- Enstitü Sosyal'in öne çıkardığı bulgular.

## Operating Context

- Veri TÜİK veri portalı API'sinden ve TÜİK haber bültenlerinden gelir; bülten Excel'leri elle indirilir.
- Sayfa statik dosyalardan oluşur (HTML, CSS, JS ve gömülü veri dosyaları); sunucu tarafı yoktur ve GitHub Pages'te yayımlanır.
- İçerik Türkçedir. Yer adları il (81) ve İBBS-2 bölge (26) düzeyindedir.
- Bölge düzeyinde yayımlanan veriler ilde "bölge değeri" olarak gösterilir; bu ayrım kullanıcıya açıkça söylenmelidir.

## Capabilities and Constraints

- Araçlar: Veri portalı (harita ve gösterge kartları), Kırılım Gezgini, Göç ağı, Nitel analiz (taslak). İl karnesi, İlişki keşfi ve Gösterge atölyesi henüz yok.
- Sayfa arama kutusundan gösterge, il ve araç bulur.
- Veri yüklenemezse ya da JS kapalıysa ne gösterileceği tanımlı değil (açık karar).
- Yerel dosya olarak (file://) da çalışmalıdır; veri bu yüzden JS dosyaları olarak gömülüdür.

## Brand Commitments

- Marka: Enstitü Sosyal. Bu portal onun veri sayfasıdır; sitenin adı "Enstitü Portal" olarak kalır (başlık, logo ve menüde bu ad kullanılır).
- Kimlik (renk, yazı tipi, biçim) Enstitü Sosyal'in mevcut temasından gelir ve korunur.

## Evidence on Hand

- Yaklaşık 500 gösterge (il ve Türkiye düzeyi) ve 217 Kırılım Gezgini tablosu yayında.
- Gerçek kullanıcı sayısı, kullanım verisi ya da referans (müşteri, basın) yok; bunlar sayfaya uydurulmamalı.

## Product Principles

1. Önce bulmak: arama ve ana araçlar ilk bakışta erişilebilir olmalı.
2. Veriyi olduğu gibi göster, kaynağı ve düzeyini (il, bölge, Türkiye) saklama.
3. Hazır olmayanı hazır gibi sunma: taslak ve yakında olanlar açıkça ayrılır.
4. Araştırmacının zamanına saygı: gereksiz adım, süs ve geveze metin yok.

## Accessibility & Inclusion

Ürüne özgü bir standart belirlenmedi (açık karar). Klavye ile kullanım ve dar ekran bu ana sayfa için iyileştirme alanı olarak planlandı.
