# Veri yükleme standardı

Yüklediğiniz dosya aşağıdaki iki biçimden birine uymalıdır. Önce **Veri türünü** seçin, sonra dosyayı yükleyin.
Dosya biçimi: **CSV** (noktalı virgül, virgül veya sekme ayracı) ya da **XLSX**. Excel'de tek sayfa, ilk satır başlık olmalıdır.

## 1. Kesit verisi (il bazında tek gözlem)

Her il için **tek bir gözlem** (tek yıl veya tek dönem). Zaman boyutu dosyada değil, yükleme formundaki **Gözlem dönemi** alanındadır.

| il | Profesör [kişi] | Kadın akademisyen payı [%] |
|---|---|---|
| Türkiye | 42195 | 47,2 |
| Adana | 681 | 48,7 |
| Adıyaman | 149 | 34,1 |

Kurallar
- **İlk sütun `il`** olmalı. İl adı (Adana, Şanlıurfa…) ya da kodu (TR100…) olabilir. Büyük/küçük harf ve Türkçe karakter farkı sorun olmaz.
- **Her satır bir il.** Bir ilin tek satırı olmalı. Veriniz kurum, ilçe veya üniversite düzeyindeyse önce **il düzeyine toplayın**; portal sizin yerinize toplamaz.
- **Her sonraki sütun bir gösterge**, yani bir kart. Aynı dosyada istediğiniz kadar gösterge sütunu olabilir.
- **Sütun başlığı `Gösterge adı [birim]`** biçiminde: birim köşeli parantez içinde (`[kişi]`, `[%]`, `[TL]`, `[‰]`…). Başlık, kartın adı olur. Aynı ad iki kez kullanılamaz.
- **`Türkiye` satırı (isteğe bağlı).** Sayım göstergelerinde (kişi, adet) bölge ve Türkiye değerini illerin toplamından üretebiliriz. **Oran ve pay göstergelerinde (%, ‰, kişi başı) toplama yanlış olur**; bu sütunlarda bölge boş kalır, Türkiye değerini isterseniz kendiniz bir `Türkiye` satırına yazın.
- **Sayılar:** `1234,5`, `1.234,5` ve `1234.5` kabul edilir. Boş hücre = veri yok. `%` işareti veya birim yazmayın.
- Tüm illeri (81) doldurmaya çalışın. Eksik il olursa uyarı verilir ve o ilde kart boş görünür.

Boş şablon (81 il hazır): `sablon/sablon-kesit.xlsx`. Zaman serisi (Türkiye): `sablon/sablon-zaman-serisi-turkiye.xlsx`. Şablonların ilk sayfası VERİ, ikincisi açıklama, üçüncüsü dolu örnektir.

## 2. Zaman serisi (Türkiye)

Türkiye geneli için zaman içinde değişen değerler.

| dönem | Gösterge adı [birim] | İkinci gösterge adı [%] |
|---|---|---|
| 2024-01 | 1234,5 | 12,3 |
| 2024-02 | 1300 | 12,9 |
| 2024-03 | 1410,7 | 13,4 |

Kurallar
- **İlk sütun `dönem`.** Dönemler tek sıklıkta olmalı:
  - Yıllık: `2023`
  - Aylık: `2024-03` (ya da `2024 Mart`, `03.2024`)
  - Üç aylık: `2024-Q1` (ya da `2024Q1`)
- Yıllık, aylık ve üç aylığı **aynı dosyada karıştırmayın**; ayrı dosya yükleyin.
- **Her satır bir dönem.** Aynı dönem iki kez olamaz. En az 2 dönem gerekir.
- Sonraki sütunlar, kesit verisindeki gibi `Gösterge adı [birim]` başlıklı serilerdir. Her sütun bir kart olur.
- Sayı kuralları kesit verisiyle aynı.

## Yüklemeden önce kontrol listesi
1. Veri türü doğru mu (il bazında tek gözlem / Türkiye zaman serisi)?
2. İlk sütun `il` ya da `dönem` mi?
3. Her sütun başlığında `[birim]` var mı?
4. Satırlar doğru düzeyde mi (kesitte il, zaman serisinde dönem)?
5. Kesitte gözlem dönemini formda yazdınız mı?

Yükleme ekranı bu kuralları dosyanıza uygular; hata varsa kartı yayınlamaz, uyarıları satır satır gösterir.
