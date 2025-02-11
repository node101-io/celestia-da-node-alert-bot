import dotenv from 'dotenv';
dotenv.config();
const BLOCK_HEIGHT_DIFFERENCE_THRESHOLD = 5;
const BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD = 50;

let lastKnownLocalHeight = null;
let wasNodeBehind = false; 

const getBlockHeightFromRemoteRPC = async (url) => {
  try {
    const request = await fetch(url);
    const response = await request.json();
    
    if (!response?.result?.sync_info?.latest_block_height) {
      if (!response?.sync_info?.latest_block_height) {
        return null;
      }
      return parseInt(response.sync_info.latest_block_height);
    }

    return parseInt(response.result.sync_info.latest_block_height);
  } catch (err) {
    console.error(`${url} için blok verisi alınamadı:`, err.message);
    return null;
  }
};

export const processLatestBlockFromAPI = async () => {
  const remoteUrls = [
    process.env.REMOTE_RPC_URL_1,
    process.env.REMOTE_RPC_URL_2,
    process.env.REMOTE_RPC_URL_3
  ];

  const heights = await Promise.all(
    remoteUrls.map(async (url) => {
      const height = await getBlockHeightFromRemoteRPC(url);
      return height;
    })
  );

  const validHeights = heights.filter(h => h !== null);
  
  if (validHeights.length === 0) {
    console.error('Hiçbir remote RPC yanıt vermedi!');
    return null;
  }

  const maxHeight = Math.max(...validHeights);
  console.log('En yüksek blok:', maxHeight);
  return maxHeight;
};

export const processLatestBlockFromLocal = async () => {
  try {
    const request = await fetch(process.env.LOCAL_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTH_TOKEN}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'das.SamplingStats'
      })
    });

    const response = await request.json();
    if (!response?.result?.network_head_height) {
      throw new Error('Geçersiz API yanıt formatı');
    }

    const latest_block_height = parseInt(response.result.network_head_height);
    lastKnownLocalHeight = latest_block_height; // Son blok yüksekliğini kaydet
    console.log('Yerel RPC blok yüksekliği:', latest_block_height);
    return latest_block_height;
  } catch (err) {
    console.error('Yerel RPC blok verileri işlenirken bir hata oluştu:', err.message);
    return lastKnownLocalHeight;
  }
};

export const compareBlockHeights = async () => {
  const remoteHeight = await processLatestBlockFromAPI();
  const localHeight = await processLatestBlockFromLocal();

  if (!remoteHeight) {
    return {
      success: false,
      message: 'Remote RPC sunucularından yanıt alınamıyor.'
    };
  }

  if (!localHeight) {
    return {
      success: true,
      message: `⚠️ DİKKAT: Local node yanıt vermiyor! \nSon bilinen yerel blok: ${lastKnownLocalHeight || 'Bilinmiyor'}\nUzak Blok: ${remoteHeight}`
    };
  }

  const difference = Math.abs(remoteHeight - localHeight);
  
  if (difference < BLOCK_HEIGHT_DIFFERENCE_THRESHOLD && wasNodeBehind) {
    wasNodeBehind = false;
    return {
      success: true,
      message: `✅ Node senkronizasyonu düzeldi! \nYerel Blok: ${localHeight}\nUzak Blok: ${remoteHeight}`,
      isRecovered: true
    };
  }

  if (difference >= BLOCK_HEIGHT_DIFFERENCE_THRESHOLD && difference % 5 === 0) {
    wasNodeBehind = true; 
    if (difference >= BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD) {
      return {
        success: true,
        message: `⚠️ KRİTİK UYARI: Node'unuz ${difference} blok geride kaldı! \nYerel Blok: ${localHeight}\nUzak Blok: ${remoteHeight}`,
        isConsecutive: true
      };
    } else {
      return {
        success: true,
        message: `⚠️ UYARI: Node'unuz ${difference} blok geride! \nYerel Blok: ${localHeight}\nUzak Blok: ${remoteHeight}`,
        isConsecutive: false
      };
    }
  }

  return {
    success: true,
    message: null
  };
};
