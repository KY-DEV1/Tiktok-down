import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url, mediaType = 'video' } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const cleanUrl = url.trim();
    console.log('Processing URL:', cleanUrl, 'Media type:', mediaType);

    // Gunakan API yang lebih reliable
    const result = await getTikTokMedia(cleanUrl);
    
    if (!result.downloadUrl && mediaType === 'video') {
      return res.status(404).json({ success: false, error: 'Tidak dapat mengambil media dari URL tersebut' });
    }

    if (mediaType === 'image' && (!result.images || result.images.length === 0)) {
      return res.status(404).json({ success: false, error: 'Tidak ada gambar yang ditemukan' });
    }

    // Filter berdasarkan media type yang diminta
    let finalResult;
    if (mediaType === 'video') {
      finalResult = {
        type: 'video' as const,
        url: result.downloadUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else if (mediaType === 'audio' && result.audioUrl) {
      finalResult = {
        type: 'audio' as const,
        url: result.audioUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else if (mediaType === 'image') {
      finalResult = {
        type: 'image' as const,
        images: result.images || [], // Array of all images
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `Media type ${mediaType} tidak tersedia untuk video ini` 
      });
    }

    res.json({
      success: true,
      data: finalResult
    });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan: ' + error.message 
    });
  }
}

// FUNCTION UTAMA - Dapatkan semua media yang available
async function getTikTokMedia(url: string): Promise<{
  downloadUrl: string;
  audioUrl?: string;
  thumbnailUrl: string;
  images?: string[]; // Array untuk multiple images
  title: string;
  duration?: number;
}> {
  
  const apis = [
    // API 1: TikWM - Support video, audio, dan images
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST' as const,
      data: { url: url },
      parser: (data: any) => {
        if (data.data) {
          let downloadUrl = '';
          let audioUrl = '';
          let thumbnailUrl = '';
          let images: string[] = [];
          
          // Video URL
          if (data.data.play) {
            downloadUrl = data.data.play.startsWith('http') 
              ? data.data.play 
              : `https://www.tikwm.com${data.data.play}`;
          }
          
          // Audio URL
          if (data.data.music) {
            audioUrl = data.data.music.startsWith('http')
              ? data.data.music
              : `https://www.tikwm.com${data.data.music}`;
          }
          
          // Thumbnail URL
          if (data.data.cover) {
            thumbnailUrl = data.data.cover.startsWith('http')
              ? data.data.cover
              : `https://www.tikwm.com${data.data.cover}`;
          }

          // Multiple Images (slideshow)
          if (data.data.images && Array.isArray(data.data.images)) {
            images = data.data.images.map((img: string) => 
              img.startsWith('http') ? img : `https://www.tikwm.com${img}`
            );
          }

          if (downloadUrl || audioUrl || thumbnailUrl || images.length > 0) {
            return {
              downloadUrl: downloadUrl,
              audioUrl: audioUrl,
              thumbnailUrl: thumbnailUrl,
              images: images,
              title: data.data.title || 'TikTok Video',
              duration: data.data.duration
            };
          }
        }
        return null;
      }
    },
    // API 2: Alternative API untuk images
    {
      name: 'tikodl',
      url: `https://api.tikodl.com/video/?url=${encodeURIComponent(url)}`,
      method: 'GET' as const,
      parser: (data: any) => {
        let downloadUrl = '';
        let images: string[] = [];
        
        if (data.video && data.video.noWatermark) {
          downloadUrl = data.video.noWatermark;
        }
        
        // Jika ada multiple images
        if (data.images && Array.isArray(data.images)) {
          images = data.images;
        }

        if (downloadUrl || images.length > 0) {
          return {
            downloadUrl: downloadUrl,
            thumbnailUrl: data.thumbnail || '',
            images: images,
            title: data.title || 'TikTok Video',
            duration: data.duration
          };
        }
        return null;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Trying API: ${api.name}`);
      
      const config: any = {
        method: api.method,
        url: api.url,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, */*'
        }
      };

      if (api.method === 'POST' && api.data) {
        config.data = new URLSearchParams(api.data);
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const response = await axios(config);
      const result = api.parser(response.data);
      
      if (result) {
        console.log(`Success with API: ${api.name}`);
        console.log('Found images:', result.images?.length || 0);
        return result;
      }
    } catch (error: any) {
      console.log(`API ${api.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('Semua API gagal mengambil data TikTok');
  }
