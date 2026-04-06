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
    {
      id: 'video',
      label: 'Video',
      icon: '🎬',
      description: 'Download video dengan kualitas HD'
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: '🎵',
      description: 'Ekstrak audio saja (format MP3)'
    },
    {
      id: 'image',
      label: 'Gambar',
      icon: '🖼️',
      description: 'Download thumbnail/gambar'
    }
  ];

  // Helper functions
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      default: return '📁';
    }
  };

  const getMediaLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      case 'image': return 'Gambar';
      default: return 'Media';
    }
  };

  // Load from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const savedHistory = localStorage.getItem('downloadHistory');
    
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    if (savedHistory) setDownloadHistory(JSON.parse(savedHistory));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
  }, [downloadHistory]);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Masukkan URL TikTok');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadData(null);
    setDownloadError('');

    try {
      const response = await axios.post('/api/download', { 
        url,
        mediaType: selectedMedia 
      });
      
      if (response.data.success) {
        const downloadItem = {
          ...response.data.data,
          timestamp: Date.now()
        };
        
        setDownloadData(downloadItem);
        
        // Add to history
        const newHistoryItem: DownloadHistory = {
          id: Date.now().toString(),
          url: downloadItem.images ? downloadItem.images[0] : downloadItem.url,
          title: downloadItem.title || 'TikTok Media',
          thumbnail: downloadItem.thumbnail,
          timestamp: downloadItem.timestamp,
          type: downloadItem.type
        };
        
        setDownloadHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
      } else {
        setError(response.data.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Terjadi kesalahan saat memproses video');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async (downloadUrl: string, filename: string) => {
  let originalText = ''; // Deklarasi variable di luar try-catch
  
  try {
    if (!downloadUrl || !downloadUrl.startsWith('http')) {
      setDownloadError('URL download tidak valid');
      return;
    }

    // Reset error dan set downloading state
    setDownloadError('');
    setIsDownloading(true);

    // Show loading for download
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      originalText = downloadBtn.innerHTML; // Simpan text asli
      downloadBtn.innerHTML = '⬇️ Mengunduh...';
      downloadBtn.setAttribute('disabled', 'true');
    }

    // Use fetch dengan timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    console.log('Starting download from:', downloadUrl);

    const response = await fetch(downloadUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.tiktok.com/'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server mengembalikan error: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Check if blob is valid
    if (blob.size === 0) {
      throw new Error('File yang didownload kosong (0 bytes)');
    }

    // Check file type
    const fileType = blob.type;
    if (fileType.includes('text/html') || fileType.includes('application/json')) {
      throw new Error('URL mengembalikan halaman web, bukan file media');
    }

    console.log('Download successful, file size:', blob.size, 'bytes');

    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    // Success feedback
    setDownloadError('');

  } catch (err: any) {
    console.error('Download error:', err);
    
    let errorMessage = 'Gagal mengunduh file: ';
    
    if (err.name === 'AbortError') {
      errorMessage += 'Download timeout (45 detik). File mungkin terlalu besar atau koneksi lambat.';
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage += 'Tidak dapat terhubung ke server. Cek koneksi internet Anda.';
    } else if (err.message.includes('CORS')) {
      errorMessage += 'Terhalang oleh kebijakan keamanan browser.';
    } else if (err.message.includes('0 bytes')) {
      errorMessage += 'File yang didownload kosong. URL mungkin tidak valid.';
    } else if (err.message.includes('halaman web')) {
      errorMessage += 'URL mengarah ke halaman web, bukan file media.';
    } else {
      errorMessage += err.message || 'Unknown error occurred';
    }
    
    setDownloadError(errorMessage);
    
    // Fallback: open in new tab
    console.log('Trying fallback: open in new tab');
    window.open(downloadUrl, '_blank');
    
  } finally {
    // Reset states
    setIsDownloading(false);
    
    // Reset button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.innerHTML = originalText || '⬇️ Download Ulang';
      downloadBtn.removeAttribute('disabled');
    }
  }
};
  
  // Function untuk download semua images dengan progress
const downloadAllImages = async (images: string[], title: string) => {
  try {
    setDownloadError('');
    setIsDownloading(true);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_gambar_${i + 1}.jpg`;
      
      try {
        console.log(`Downloading image ${i + 1}/${images.length}:`, filename);
        
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        if (blob.size === 0) throw new Error('File kosong');

        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        
        successCount++;
        
      } catch (err) {
        console.error(`Failed to download image ${i + 1}:`, err);
        failedCount++;
      }
      
      // Small delay between downloads
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Show summary
    if (failedCount === 0) {
      setDownloadError('');
    } else {
      setDownloadError(
        `Download selesai: ${successCount} berhasil, ${failedCount} gagal. ` +
        `Gambar yang gagal bisa didownload manual satu per satu.`
      );
    }
    
  } catch (err: any) {
    console.error('Download images error:', err);
    setDownloadError(`Gagal mengunduh gambar: ${err.message}`);
  } finally {
    setIsDownloading(false);
  }
};

  const getFilename = (type: string, title?: string) => {
    const baseName = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'tiktok';
    const extensions = {
      video: 'mp4',
      audio: 'mp3',
      image: 'jpg'
    };
    return `${baseName}_${Date.now()}.${extensions[type as keyof typeof extensions] || 'mp4'}`;
  };

  const validateDownloadUrl = (url: string): string | null => {
    if (!url) return 'URL tidak boleh kosong';
    if (!url.startsWith('http')) return 'URL harus dimulai dengan http:// atau https://';
    return null;
  };

  const clearHistory = () => {
    setDownloadHistory([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID');
  };

  return (
    <div className={`tiktok-downloader ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">
        
        {/* Top Bar */}
        <div className="top-bar">
          <div className="logo">
            <div className="logo-icon">⬇️</div>
            <h1 className="title">TikTok Downloader</h1>
          </div>

          <div className="controls">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-secondary"
            >
              📜 {showHistory ? 'Sembunyikan' : 'Riwayat'} 
              {downloadHistory.length > 0 && ` (${downloadHistory.length})`}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary"
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        <div className={`main-grid ${showHistory ? 'with-history' : ''}`}>
          
          {/* Main Content */}
          <div className="main-content">
            <p className="subtitle">
              Download video, audio, dan gambar dari TikTok • Cepat & Gratis
            </p>

            {/* Media Type Selection */}
            <div className="card">
              <h3 className="success-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                📁 Pilih Jenis Media
              </h3>
              
              <div className="features-grid">
                {mediaTypes.map((media) => (
                  <div 
                    key={media.id}
                    className={`feature-card ${selectedMedia === media.id ? 'selected-media' : ''}`}
                    style={{
                      border: selectedMedia === media.id ? '2px solid #00f2ea' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selectedMedia === media.id ? 'rgba(0, 242, 234, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setSelectedMedia(media.id)}
                  >
                    <div className="feature-icon">{media.icon}</div>
                    <h4 className="feature-title">{media.label}</h4>
                    <p className="feature-desc">{media.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Section */}
            <div className="card">
              <div className="input-group">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="🔗 Paste URL TikTok di sini (vt.tiktok.com, vm.tiktok.com, tiktok.com)"
                  className={`url-input ${darkMode ? '' : 'light'}`}
                />
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="loading-spinner"></div>
                      Memproses...
                    </div>
                  ) : (
                    `🚀 Download ${getMediaLabel(selectedMedia)}`
                  )}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  <span>⚠️</span>
                  {error}
                </div>
              )}
            </div>

            {/* Result Section untuk Video & Audio */}
            {downloadData && downloadData.type !== 'image' && (
              <div className="card">
                <div className="success-header">
                  <div className="success-icon">
                    {getMediaIcon(downloadData.type)}
                  </div>
                  <div>
                    <h3 className="success-title">
                      {getMediaLabel(downloadData.type)} Siap Download!
                    </h3>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '14px', 
                      margin: '5px 0 0 0' 
                    }}>
                      Klik tombol di bawah untuk mulai mengunduh
                    </p>
                  </div>
                </div>
                
                {/* Media Info */}
                <div style={{
                  background: 'rgba(0, 242, 234, 0.1)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '20px'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '10px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <strong style={{ color: '#00f2ea' }}>Jenis</strong>
                      <p style={{ color: 'white', margin: '5px 0 0 0' }}>
                        {downloadData.type.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: '#00f2ea' }}>Format</strong>
                      <p style={{ color: 'white', margin: '5px 0 0 0' }}>
                        {downloadData.type === 'video' ? 'MP4' : 'MP3'}
                      </p>
                    </div>
                    {downloadData.duration && (
                      <div>
                        <strong style={{ color: '#00f2ea' }}>Durasi</strong>
                        <p style={{ color: 'white', margin: '5px 0 0 0' }}>
                          {Math.floor(downloadData.duration / 60)}:
                          {(downloadData.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Thumbnail Preview */}
                {downloadData.thumbnail && downloadData.type !== 'audio' && (
                  <div className="thumbnail">
                    <img src={downloadData.thumbnail} alt="Thumbnail" />
                  </div>
                )}

                {downloadData.type === 'audio' && (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    background: 'rgba(0, 242, 234, 0.1)',
                    borderRadius: '15px',
                    marginBottom: '20px',
                    border: '2px dashed rgba(0, 242, 234, 0.3)'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🎵</div>
                    <p style={{ color: 'white', margin: 0, fontSize: '16px' }}>
                      Audio TikTok siap untuk diunduh
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '5px 0 0 0', fontSize: '14px' }}>
                      Format: MP3 • Kualitas: Original
                    </p>
                  </div>
                )}

                {/* Download Error Display */}
                {downloadError && (
                  <div style={{ 
                    background: 'rgba(255, 100, 100, 0.2)',
                    color: '#ff6b6b',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 100, 100, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>❌</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>
                          Gagal Mengunduh
                        </strong>
                        <p style={{ margin: 0, fontSize: '14px' }}>{downloadError}</p>
                        <p style={{ margin: '10px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                          Tips: Coba gunakan "Buka di Tab Baru" atau periksa koneksi internet Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Progress Indicator */}
                {isDownloading && (
                  <div style={{
                    background: 'rgba(0, 242, 234, 0.1)',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: '1px solid rgba(0, 242, 234, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                      <span style={{ color: '#00f2ea', fontWeight: '600' }}>
                        Sedang mengunduh...
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '10px 0 0 0', fontSize: '12px' }}>
                      Harap tunggu, file sedang diproses. Jangan tutup halaman ini.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    id="download-btn"
                    onClick={() => {
                      const validationError = validateDownloadUrl(downloadData.url);
                      if (validationError) {
                        setDownloadError(validationError);
                      } else {
                        handleFileDownload(downloadData.url, getFilename(downloadData.type, downloadData.title));
                      }
                    }}
                    className="btn-success"
                    disabled={isDownloading}
                  >
                    {isDownloading ? '⬇️ Mengunduh...' : `⬇️ Download ${getMediaLabel(downloadData.type)}`}
                  </button>

                  <a
                    href={downloadData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      const validationError = validateDownloadUrl(downloadData.url);
                      if (validationError) {
                        e.preventDefault();
                        setDownloadError(validationError);
                      }
                    }}
                  >
                    🔗 Buka di Tab Baru
                  </a>

                  <button
                    onClick={() => {
                      setDownloadData(null);
                      setDownloadError('');
                    }}
                    className="btn btn-secondary"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    ✕ Tutup
                  </button>
                </div>

                {/* Video Title */}
                {downloadData.title && (
                  <p className="video-title">
                    "{downloadData.title}"
                  </p>
                )}
              </div>
            )}

            {/* Result Section untuk Images */}
{downloadData && downloadData.type === 'image' && downloadData.images && (
  <div className="card">
    <div className="success-header">
      <div className="success-icon">
        {getMediaIcon(downloadData.type)}
      </div>
      <div>
        <h3 className="success-title">
          {downloadData.images.length} Gambar Ditemukan!
        </h3>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '14px', 
          margin: '5px 0 0 0' 
        }}>
          Pilih gambar yang ingin didownload
        </p>
      </div>
    </div>
    
    {/* Media Info */}
    <div style={{
      background: 'rgba(0, 242, 234, 0.1)',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '10px',
        textAlign: 'center'
      }}>
        <div>
          <strong style={{ color: '#00f2ea' }}>Jenis</strong>
          <p style={{ color: 'white', margin: '5px 0 0 0' }}>
            {downloadData.type.toUpperCase()}
          </p>
        </div>
        <div>
          <strong style={{ color: '#00f2ea' }}>Jumlah</strong>
          <p style={{ color: 'white', margin: '5px 0 0 0' }}>
            {downloadData.images.length} Gambar
          </p>
        </div>
        <div>
          <strong style={{ color: '#00f2ea' }}>Format</strong>
          <p style={{ color: 'white', margin: '5px 0 0 0' }}>
            JPG
          </p>
        </div>
      </div>
    </div>
    
    {/* Image Gallery dengan Download Buttons */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    }}>
      {downloadData.images.map((image, index) => (
        <div key={index} style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '15px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          {/* Image Preview */}
          <div style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '10px',
            cursor: 'pointer'
          }}>
            <img 
              src={image} 
              alt={`Slide ${index + 1}`}
              style={{ 
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                display: 'block'
              }}
              onClick={() => window.open(image, '_blank')}
            />
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              borderRadius: '50%',
              width: '25px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {index + 1}
            </div>
          </div>

          {/* Download Button untuk Individual Image */}
          <button
            onClick={() => handleFileDownload(
              image, 
              `${downloadData.title || 'tiktok'}_gambar_${index + 1}.jpg`
            )}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'linear-gradient(45deg, #00f2ea, #00b894)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            ⬇️ Download {index + 1}
          </button>

          {/* Quick View Link */}
          <button
            onClick={() => window.open(image, '_blank')}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              marginTop: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            👁️ Lihat
          </button>
        </div>
      ))}
    </div>

    {/* Download Error Display */}
    {downloadError && (
      <div style={{ 
        background: 'rgba(255, 100, 100, 0.2)',
        color: '#ff6b6b',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 100, 100, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>❌</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '5px' }}>
              Gagal Mengunduh
            </strong>
            <p style={{ margin: 0, fontSize: '14px' }}>{downloadError}</p>
          </div>
        </div>
      </div>
    )}

    {/* Download Progress Indicator */}
    {isDownloading && (
      <div style={{
        background: 'rgba(0, 242, 234, 0.1)',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid rgba(0, 242, 234, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
          <span style={{ color: '#00f2ea', fontWeight: '600' }}>
            Sedang mengunduh gambar...
          </span>
        </div>
      </div>
    )}

    {/* Bulk Action Buttons */}
    <div className="action-buttons" style={{ justifyContent: 'center' }}>
      <button
        onClick={() => downloadAllImages(downloadData.images!, downloadData.title || 'tiktok')}
        className="btn-success"
        disabled={isDownloading}
        style={{ minWidth: '200px' }}
      >
        {isDownloading ? '⬇️ Mengunduh...' : `⬇️ Download Semua (${downloadData.images.length})`}
      </button>

      <button
        onClick={() => {
          setDownloadData(null);
          setDownloadError('');
        }}
        className="btn btn-secondary"
        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
      >
        ✕ Tutup
      </button>
    </div>

    {/* Info Text */}
    <div style={{
      textAlign: 'center',
      marginTop: '15px',
      padding: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px'
    }}>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.7)', 
        margin: 0, 
        fontSize: '12px' 
      }}>
        💡 <strong>Tips:</strong> Klik tombol "Download" di bawah setiap gambar untuk download satu per satu, 
        atau gunakan "Download Semua" untuk mendapatkan semua gambar sekaligus.
      </p>
    </div>

    {/* Video Title */}
    {downloadData.title && (
      <p className="video-title">
        "{downloadData.title}"
      </p>
    )}
  </div>
)}

            {/* Features Section */}
            <div className="card">
              <h3 className="success-title" style={{ textAlign: 'center', marginBottom: '25px' }}>
                🎯 Kenapa Pilih Kami?
              </h3>
              
              <div className="features-grid">
                {[
                  { icon: '🚀', title: 'Super Cepat', desc: 'Proses download dalam hitungan detik' },
                  { icon: '🎨', title: 'HD Quality', desc: 'Kualitas terbaik tanpa watermark' },
                  { icon: '🎵', title: 'Multiple Format', desc: 'Video, audio, dan gambar' },
                  { icon: '💯', title: 'Gratis', desc: 'Tanpa biaya, tanpa registrasi' }
                ].map((feature, index) => (
                  <div key={index} className="feature-card">
                    <div className="feature-icon">{feature.icon}</div>
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-desc">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="history-sidebar">
              <div className="history-header">
                <h3 className="history-title">📜 Riwayat Download</h3>
                {downloadHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="btn-clear"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="history-list">
                {downloadHistory.length === 0 ? (
                  <div className="history-empty">
                    📝 Belum ada riwayat download
                  </div>
                ) : (
                  downloadHistory.map((item) => (
                    <div
                      key={item.id}
                      className="history-item"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <div className="history-content">
                        {item.thumbnail && item.type !== 'audio' && (
                          <img 
                            src={item.thumbnail} 
                            alt="Thumb"
                            className="history-thumb"
                          />
                        )}
                        {item.type === 'audio' && (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(0, 242, 234, 0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                          }}>
                            🎵
                          </div>
                        )}
                        <div className="history-details">
                          <p className="history-item-title">
                            {item.title}
                          </p>
                          <p className="history-time">
                            {formatTime(item.timestamp)}
                          </p>
                          <p className="history-type">
                            {getMediaIcon(item.type)} {item.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>© 2025 TikTok Downloader • Made with Nextjs by Ki</p>
        </div>
      </div>
    </div>
  );
}
