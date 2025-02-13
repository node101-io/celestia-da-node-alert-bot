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

export const compareBlockHeights = async () => {
  const remoteHeight = await processLatestBlockFromAPI();
  const localData = await processLatestBlockFromLocal();

  if (!remoteHeight) {
    return {
      success: false,
      message: 'No response from Remote RPC servers.'
    };
  }

  if (!localData.height) {
    return {
      success: true,
      message: `⚠️ ATTENTION: Local node is not responding! \nLast known local block: ${lastKnownLocalHeight || 'Unknown'}\nRemote Block: ${remoteHeight}`
    };
  }

  const difference = Math.abs(remoteHeight - localData.height);
  
  if (difference < BLOCK_HEIGHT_DIFFERENCE_THRESHOLD && wasNodeBehind) {
    wasNodeBehind = false;
    return {
      success: true,
      message: `✅ Node synchronization recovered! \nLocal Block: ${localData.height}\nRemote Block: ${remoteHeight}`,
      isRecovered: true
    };
  }
  console.log(localData.isCatchingUp , difference , localData.isRunning);
  if (difference >= BLOCK_HEIGHT_DIFFERENCE_THRESHOLD && difference % 5 === 0) {
    wasNodeBehind = true;

    // Node durumu kontrolü
    let statusMessage;  // undefined yerine boş string ile başlatmayalım
    if (!localData.isRunning) {
      statusMessage = '⛔️ Node is stopped';
    } else if (localData.isCatchingUp || difference > 0) {  // Blok farkı varsa da syncing kabul et
      statusMessage = '🔄 Node is syncing';
    } else {
      statusMessage = '✅ Node is running';
    }

    if (difference >= BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD) {
      return {
        success: true,
        message: `🔴🔴 CRITICAL WARNING: Your node is ${difference} blocks behind! \nLocal Block: ${localData.height}\nRemote Block: ${remoteHeight}\nStatus: ${statusMessage}`,
        isConsecutive: true
      };
    } else {
      return {
        success: true,
        message: `🔴 WARNING: Your node is ${difference} blocks behind! \nLocal Block: ${localData.height}\nRemote Block: ${remoteHeight}\nStatus: ${statusMessage}`,
        isConsecutive: false
      };
    }
  }

  return {
    success: true,
    message: null
  };
};
