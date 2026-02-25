# 💧 HydroTrack – Su Takibi Uygulaması

Günlük su tüketiminizi takip edin, hedeflerinize ulaşın, rozetler kazanın!

## 🌐 Canlı Demo
**GitHub Pages:** `https://<kullanıcı-adın>.github.io/hydrotrack/`

## ✨ Özellikler

- **Görsel Bardak** – Gerçek zamanlı su seviyesi animasyonu
- **Karanlık / Aydınlık Mod** – Tek tıkla tema geçişi
- **Favori Bardaklar** – Hızlı ekleme için bardak boyutları, özel bardak ekleme/silme
- **İstatistikler** – Gün / Hafta / Ay görünümü ile grafik analizi
- **Rozetler** – 8 farklı başarı rozeti (İlk Yudum, Hedef!, 7 Günlük Seri…)
- **Geri Al** – Son eklemeyi iptal etme
- **Veri Yedekleme** – JSON dışa/içe aktarma
- **PWA** – Chrome'dan telefona uygulama olarak kurulabilir (offline çalışır)

## 📱 Telefona Kurulum (Chrome PWA)

1. Siteyi Chrome'da aç
2. Sağ üstte `⋮` menüsüne tıkla
3. **"Ana ekrana ekle"** veya **"Uygulamayı yükle"** seç
4. Kur – artık uygulamana masaüstünden erişebilirsin!

## 🚀 GitHub Pages'e Yayınlama

### 1. Repo oluştur
```bash
git init
git add .
git commit -m "🚀 Initial commit – HydroTrack"
git branch -M main
git remote add origin https://github.com/<KULLANıCı-ADI>/hydrotrack.git
git push -u origin main
```

### 2. GitHub Pages'i aç
- Repo → **Settings** → **Pages**
- Source: `Deploy from a branch`
- Branch: `main` / `/ (root)`
- **Save**

### 3. Birkaç dakika bekle, URL hazır!
`https://<kullanıcı-adın>.github.io/hydrotrack/`

> **NOT:** Service Worker `start_url: "/"` ile çalışır. GitHub Pages'de subdirectory kullanıyorsan `manifest.json` içindeki `start_url`'i güncelle: `"/hydrotrack/"` → ve `sw.js` içindeki asset yollarını da güncelle.

## 🗂️ Dosya Yapısı

```
hydrotrack/
├── index.html       # Ana HTML
├── style.css        # Tüm stiller (dark/light mode)
├── app.js           # Uygulama mantığı
├── sw.js            # Service Worker (offline PWA)
├── manifest.json    # PWA manifest
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

## 🛠️ Teknolojiler

- Vanilla HTML / CSS / JavaScript (framework yok)
- Chart.js – istatistik grafikleri
- LocalStorage – veri saklama
- Service Worker – offline destek ve PWA

## 📄 Lisans
MIT
