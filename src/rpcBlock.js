import dotenv from 'dotenv';
import config from './config.json' assert { type: "json" };

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
    console.error('No remote RPC responded!');
    return null;
  }

  const maxHeight = Math.max(...validHeights);
  console.log('Highest block:', maxHeight);
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
      throw new Error('Invalid API response format');
    }

    const latest_block_height = parseInt(response.result.network_head_height);
    const isCatchingUp = !response.result.catch_up_done;
    const isRunning = response.result.is_running;
    
    lastKnownLocalHeight = latest_block_height;
    console.log('Local RPC block height:', latest_block_height);
    return {
      height: latest_block_height,
      isCatchingUp,
      isRunning
    };
  } catch (err) {
    console.error('Error processing local RPC block data:', err.message);
    return {
      height: lastKnownLocalHeight,
      isCatchingUp: null,
      isRunning: false
    };
  }
};

// Mesaj formatlama yardımcı fonksiyonu
const formatMessage = (messageKey, params = {}, language = config.defaultLanguage) => {
  let message = config.messages[language][messageKey];
  
  // Parametreleri yerleştir
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key]);
  });
  
  return message;
};

// Status mesajını al
const getStatusMessage = (isRunning, isCatchingUp, language = config.defaultLanguage) => {
  if (!isRunning) return config.messages[language].status.stopped;
  if (isCatchingUp) return config.messages[language].status.syncing;
  return config.messages[language].status.running;
};

export const compareBlockHeights = async () => {
  const remoteHeight = await processLatestBlockFromAPI();
  const localData = await processLatestBlockFromLocal();

  if (!remoteHeight) {
    return {
      success: false,
      message: formatMessage('noRemoteResponse')
    };
  }

  if (!localData.height) {
    return {
      success: true,
      message: formatMessage('nodeNotResponding', {
        lastBlock: lastKnownLocalHeight || 'Unknown',
        remoteBlock: remoteHeight
      })
    };
  }

  const difference = Math.abs(remoteHeight - localData.height);
  
  if (difference < BLOCK_HEIGHT_DIFFERENCE_THRESHOLD && wasNodeBehind) {
    wasNodeBehind = false;
    const status = getStatusMessage(localData.isRunning, localData.isCatchingUp);
    return {
      success: true,
      message: formatMessage('nodeSyncRecovered', {
        localBlock: localData.height,
        remoteBlock: remoteHeight,
        status
      }),
      isRecovered: true
    };
  }

  if (difference >= BLOCK_HEIGHT_DIFFERENCE_THRESHOLD && difference % 5 === 0) {
    wasNodeBehind = true;
    const status = getStatusMessage(localData.isRunning, localData.isCatchingUp || difference > 0);

    if (difference >= BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD) {
      return {
        success: true,
        message: formatMessage('criticalWarning', {
          difference,
          localBlock: localData.height,
          remoteBlock: remoteHeight,
          status
        }),
        isConsecutive: true
      };
    } else {
      return {
        success: true,
        message: formatMessage('warning', {
          difference,
          localBlock: localData.height,
          remoteBlock: remoteHeight,
          status
        }),
        isConsecutive: false
      };
    }
  }

  return {
    success: true,
    message: null
  };
};