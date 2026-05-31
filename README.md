# TikTok Down

Download video, audio, dan gambar TikTok tanpa watermark.

## Stack

- **Next.js 14** — App Router
- **Tailwind CSS** — Styling
- **Framer Motion** — Animasi
- **next-pwa** — PWA & Service Worker
- **SWR** — Data fetching

## Fitur

- Download video HD tanpa watermark
- Ekstrak audio MP3
- Download slideshow images
- Preview video sebelum download
- Progress bar real-time
- Auto paste dari clipboard
- Batch downloader (multi URL)
- PWA — bisa diinstall di HP/Desktop
- Riwayat download (localStorage)
- Multi platform guide

## Deploy ke Vercel

1. Push repo ini ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Framework: **Next.js** (auto-detect)
4. Klik **Deploy**

## Jalankan Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Struktur

```
app/
├── layout.tsx              # Root layout + PWA meta
├── page.tsx                # Main page (state & komposisi)
├── globals.css             # Tailwind + custom utilities
├── api/download/route.ts   # API handler
└── components/
    ├── types.ts            # Types, interfaces, animasi, utils
    ├── Header.tsx
    ├── PWABanner.tsx
    ├── MediaTypeSelector.tsx
    ├── UrlInput.tsx
    ├── VideoResult.tsx
    ├── ImageResult.tsx
    ├── BatchDownloader.tsx
    ├── HistorySidebar.tsx
    ├── PlatformGuide.tsx
    └── ProgressBar.tsx
```
