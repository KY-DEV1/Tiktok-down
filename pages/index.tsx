import { useState, useEffect } from 'react';
import axios from 'axios';

interface DownloadData {
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail?: string;
  images?: string[];
  title?: string;
  duration?: number;
  timestamp: number;
}

interface DownloadHistory {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  timestamp: number;
  type: string;
}

interface MediaOption {
  id: 'video' | 'audio' | 'image';
  label: string;
  icon: string;
  description: string;
}

export default function TikTokDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<'video' | 'audio' | 'image'>('video');
  const [downloadError, setDownloadError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const mediaTypes: MediaOption[] = [
    { id: 'video', label: 'Video', icon: '▶', description: 'HD tanpa watermark' },
    { id: 'audio', label: 'Audio', icon: '♪', description: 'Ekstrak audio MP3' },
    { id: 'image', label: 'Gambar', icon: '⊞', description: 'Download thumbnail' },
  ];

  const getMediaIcon = (type: string) => ({ video: '▶', audio: '♪', image: '⊞' }[type] || '⊡');
  const getMediaLabel = (type: string) => ({ video: 'Video', audio: 'Audio', image: 'Gambar' }[type] || 'Media');

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const savedHistory = localStorage.getItem('downloadHistory');
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    if (savedHistory) setDownloadHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory)); }, [downloadHistory]);

  const handleDownload = async () => {
    if (!url.trim()) { setError('Masukkan URL TikTok terlebih dahulu'); return; }
    setLoading(true); setError(''); setDownloadData(null); setDownloadError('');
    try {
      const response = await axios.post('/api/download', { url, mediaType: selectedMedia });
      if (response.data.success) {
        const item = { ...response.data.data, timestamp: Date.now() };
        setDownloadData(item);
        const newHistory: DownloadHistory = {
          id: Date.now().toString(),
          url: item.images ? item.images[0] : item.url,
          title: item.title || 'TikTok Media',
          thumbnail: item.thumbnail,
          timestamp: item.timestamp,
          type: item.type,
        };
        setDownloadHistory(prev => [newHistory, ...prev.slice(0, 49)]);
      } else {
        setError(response.data.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Terjadi kesalahan saat memproses video');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async (downloadUrl: string, filename: string) => {
    if (!downloadUrl?.startsWith('http')) { setDownloadError('URL download tidak valid'); return; }
    setDownloadError(''); setIsDownloading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const response = await fetch(downloadUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Referer': 'https://www.tiktok.com/' },
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('File kosong (0 bytes)');
      if (blob.type.includes('text/html')) throw new Error('URL mengembalikan halaman web');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err: any) {
      let msg = 'Gagal mengunduh: ';
      if (err.name === 'AbortError') msg += 'Timeout (45 detik).';
      else if (err.message.includes('Failed to fetch')) msg += 'Tidak dapat terhubung ke server.';
      else msg += err.message;
      setDownloadError(msg);
      window.open(downloadUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAllImages = async (images: string[], title: string) => {
    setDownloadError(''); setIsDownloading(true);
    let fail = 0;
    for (let i = 0; i < images.length; i++) {
      try {
        const r = await fetch(images[i]);
        if (!r.ok) throw new Error();
        const blob = await r.blob();
        if (blob.size === 0) throw new Error();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${i + 1}.jpg`;
        a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch { fail++; }
      if (i < images.length - 1) await new Promise(r => setTimeout(r, 300));
    }
    if (fail > 0) setDownloadError(`${images.length - fail} berhasil, ${fail} gagal.`);
    setIsDownloading(false);
  };

  const getFilename = (type: string, title?: string) => {
    const base = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'tiktok';
    return `${base}_${Date.now()}.${type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4'}`;
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString('id-ID');

  const labelBtn = (t: string) => `Unduh ${getMediaLabel(t)}`;

  return (
    <div className={`tiktok-downloader ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">

        {/* ── Top Bar ─────────────────────────────────────── */}
        <div className="top-bar">
          <div className="logo">
            <div className="logo-icon">↓</div>
            <h1 className="title">TikTok&nbsp;Down</h1>
          </div>
          <div className="controls">
            <button onClick={() => setShowHistory(!showHistory)} className="btn btn-secondary">
              ≡&nbsp;{showHistory ? 'Sembunyikan' : 'Riwayat'}
              {downloadHistory.length > 0 && <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{downloadHistory.length}</span>}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="btn btn-secondary">
              {darkMode ? '◑ Light' : '● Dark'}
            </button>
          </div>
        </div>

        <div className={`main-grid ${showHistory ? 'with-history' : ''}`}>
          <div className="main-content">
            <p className="subtitle">Video · Audio · Gambar — Tanpa watermark, selamanya gratis</p>

            {/* ── Media Type ─────────────────────────────── */}
            <div className="card">
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Pilih format
              </p>
              <div className="features-grid">
                {mediaTypes.map((m) => (
                  <div
                    key={m.id}
                    className={`feature-card${selectedMedia === m.id ? ' selected-media' : ''}`}
                    onClick={() => setSelectedMedia(m.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="feature-icon" style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: selectedMedia === m.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{m.icon}</div>
                    <h4 className="feature-title">{m.label}</h4>
                    <p className="feature-desc">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Input ──────────────────────────────────── */}
            <div className="card">
              <div className="input-group">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                  placeholder="Tempel URL TikTok — vt.tiktok.com, vm.tiktok.com …"
                  className={`url-input${darkMode ? '' : ' light'}`}
                />
                <button onClick={handleDownload} disabled={loading} className="btn-primary">
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="loading-spinner" />Memproses…
                    </span>
                  ) : `↓ ${getMediaLabel(selectedMedia)}`}
                </button>
              </div>
              {error && (
                <div className="error-message">
                  <span style={{ fontSize: '16px' }}>!</span>{error}
                </div>
              )}
            </div>

            {/* ── Result: Video / Audio ───────────────────── */}
            {downloadData && downloadData.type !== 'image' && (
              <div className="card">
                <div className="success-header">
                  <div className="success-icon">{getMediaIcon(downloadData.type)}</div>
                  <div>
                    <h3 className="success-title">{getMediaLabel(downloadData.type)} siap diunduh</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Klik tombol di bawah untuk mulai mengunduh</p>
                  </div>
                </div>

                {/* Info row */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    ['Format', downloadData.type === 'video' ? 'MP4' : 'MP3'],
                    ['Kualitas', 'Original'],
                    ...(downloadData.duration ? [['Durasi', `${Math.floor(downloadData.duration/60)}:${(downloadData.duration%60).toString().padStart(2,'0')}`]] : []),
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', border: '1px solid var(--border)', textAlign: 'center', minWidth: '80px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', marginBottom: '4px' }}>{k}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {downloadData.thumbnail && downloadData.type !== 'audio' && (
                  <div className="thumbnail"><img src={downloadData.thumbnail} alt="Preview" /></div>
                )}

                {downloadData.type === 'audio' && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px dashed rgba(37,244,238,0.2)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>♪</div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Audio TikTok siap diunduh</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>MP3 · Kualitas Original</p>
                  </div>
                )}

                {downloadError && (
                  <div style={{ background: 'rgba(254,44,85,0.06)', color: '#ff6b81', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', border: '1px solid rgba(254,44,85,0.2)', fontSize: '13.5px' }}>
                    ✕ &nbsp;{downloadError}
                  </div>
                )}

                {isDownloading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(37,244,238,0.06)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', border: '1px solid rgba(37,244,238,0.15)' }}>
                    <span className="loading-spinner" />
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '14px' }}>Sedang mengunduh…</span>
                  </div>
                )}

                <div className="action-buttons">
                  <button
                    onClick={() => handleFileDownload(downloadData.url, getFilename(downloadData.type, downloadData.title))}
                    className="btn-success" disabled={isDownloading}
                  >
                    {isDownloading ? '… Mengunduh' : `↓ ${labelBtn(downloadData.type)}`}
                  </button>
                  <a href={downloadData.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">↗ Buka Tab Baru</a>
                  <button onClick={() => { setDownloadData(null); setDownloadError(''); }} className="btn btn-secondary">✕ Tutup</button>
                </div>

                {downloadData.title && <p className="video-title">"{downloadData.title}"</p>}
              </div>
            )}

            {/* ── Result: Images ─────────────────────────── */}
            {downloadData?.type === 'image' && downloadData.images && (
              <div className="card">
                <div className="success-header">
                  <div className="success-icon">⊞</div>
                  <div>
                    <h3 className="success-title">{downloadData.images.length} Gambar Ditemukan</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Pilih gambar yang ingin diunduh</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
                  {downloadData.images.map((img, i) => (
                    <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')}>
                        <img src={img} alt={`Slide ${i+1}`} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.65)', color: 'white', borderRadius: '4px', padding: '2px 7px', fontSize: '11px', fontWeight: 700 }}>{i+1}</div>
                      </div>
                      <button
                        onClick={() => handleFileDownload(img, `${(downloadData.title||'tiktok').replace(/[^a-zA-Z0-9]/g,'_')}_${i+1}.jpg`)}
                        style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg,var(--accent-cyan),#00c9c3)', color: '#080a0f', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}
                      >↓ Unduh {i+1}</button>
                      <button
                        onClick={() => window.open(img,'_blank')}
                        style={{ width: '100%', padding: '6px', background: 'var(--surface-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '11px' }}
                      >↗ Lihat</button>
                    </div>
                  ))}
                </div>

                {downloadError && (
                  <div style={{ background: 'rgba(254,44,85,0.06)', color: '#ff6b81', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', border: '1px solid rgba(254,44,85,0.2)', fontSize: '13px' }}>✕ &nbsp;{downloadError}</div>
                )}

                {isDownloading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(37,244,238,0.06)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', border: '1px solid rgba(37,244,238,0.15)' }}>
                    <span className="loading-spinner" />
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '14px' }}>Mengunduh gambar…</span>
                  </div>
                )}

                <div className="action-buttons">
                  <button onClick={() => downloadAllImages(downloadData.images!, downloadData.title||'tiktok')} className="btn-success" disabled={isDownloading}>
                    {isDownloading ? '… Mengunduh' : `↓ Unduh Semua (${downloadData.images.length})`}
                  </button>
                  <button onClick={() => { setDownloadData(null); setDownloadError(''); }} className="btn btn-secondary">✕ Tutup</button>
                </div>

                <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Tips:</strong> Unduh satu per satu atau gunakan "Unduh Semua" untuk sekaligus.
                </div>

                {downloadData.title && <p className="video-title">"{downloadData.title}"</p>}
              </div>
            )}

            {/* ── Features ───────────────────────────────── */}
            <div className="card">
              <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>Kenapa pilih kami</p>
              <div className="features-grid">
                {[
                  { icon: '⚡', title: 'Super Cepat', desc: 'Proses dalam hitungan detik' },
                  { icon: '✦', title: 'HD Quality', desc: 'Tanpa watermark, resolusi asli' },
                  { icon: '◈', title: 'Multi Format', desc: 'Video, audio, dan gambar' },
                  { icon: '◎', title: 'Gratis', desc: 'Tanpa biaya, tanpa registrasi' },
                ].map((f, i) => (
                  <div key={i} className="feature-card">
                    <div className="feature-icon" style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>{f.icon}</div>
                    <h4 className="feature-title">{f.title}</h4>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── History Sidebar ─────────────────────────── */}
          {showHistory && (
            <div className="history-sidebar">
              <div className="history-header">
                <h3 className="history-title">Riwayat Download</h3>
                {downloadHistory.length > 0 && (
                  <button onClick={() => setDownloadHistory([])} className="btn-clear">Hapus</button>
                )}
              </div>
              <div className="history-list">
                {downloadHistory.length === 0 ? (
                  <div className="history-empty">Belum ada riwayat.<br />Download pertamamu akan muncul di sini.</div>
                ) : (
                  downloadHistory.map((item) => (
                    <div key={item.id} className="history-item" onClick={() => window.open(item.url,'_blank')}>
                      <div className="history-content">
                        {item.thumbnail && item.type !== 'audio' ? (
                          <img src={item.thumbnail} alt="Thumb" className="history-thumb" />
                        ) : (
                          <div style={{ width: '44px', height: '44px', background: 'var(--surface-3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>♪</div>
                        )}
                        <div className="history-details">
                          <p className="history-item-title">{item.title}</p>
                          <p className="history-time">{formatTime(item.timestamp)}</p>
                          <p className="history-type">{item.type.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="footer">
          © 2025 TikTok Downloader · Built with Next.js by Ki
        </div>
      </div>
    </div>
  );
}
