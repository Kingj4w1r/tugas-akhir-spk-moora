# SPK Penulis Terbaik — LTC Indonesia
### Metode MOORA (Multi-Objective Optimization on the basis of Ratio Analysis)

Sistem Penunjang Keputusan (SPK) berbasis web untuk menentukan **Penulis Terbaik** di Yayasan Lab Teater Ciputat (LTC) Indonesia menggunakan metode MOORA.

---

## Fitur
- Input kriteria & bobot yang dapat diedit langsung
- Input data alternatif (penulis) yang fleksibel
- Perhitungan MOORA step-by-step (5 langkah)
- Visualisasi hasil ranking dengan podium 🥇🥈🥉
- UI modern berbasis Flask + Vanilla JS

## Kriteria
| Kode | Nama | Sifat | Bobot |
|------|------|-------|-------|
| C1 | Jumlah Karya Dipentaskan | Benefit | 4 |
| C2 | Jumlah Penghargaan | Benefit | 2 |
| C3 | Jumlah Karya Diproduksi | Benefit | 2 |
| C4 | Durasi Penyelesaian Naskah (bln) | Cost | 1 |
| C5 | Anggaran Produksi (Jt Rp) | Cost | 1 |

## Cara Menjalankan

```bash
# Install dependencies
pip install flask pandas numpy

# Jalankan server
python app.py
```

Buka browser → **http://127.0.0.1:5000**

## Struktur Proyek
```
├── app.py              # Flask backend + MOORA engine
├── templates/
│   └── index.html      # Halaman utama
├── static/
│   ├── style.css       # Styling
│   └── app.js          # Front-end logic
└── README.md
```

## Metode MOORA
1. **Matriks Keputusan** — Data mentah alternatif × kriteria
2. **Normalisasi** — `Xij* = Xij / √(Σ Xij²)`
3. **Pembobotan** — `Vij = Wj × Xij*`
4. **Nilai Optimasi** — `Yi = Σ Benefit − Σ Cost`
5. **Perankingan** — Urut Yi terbesar → terbaik
