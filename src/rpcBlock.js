const remoteRpcUrl = 'https://rpc.celestia.pops.one/status';
const localRpcUrl = '127.0.0.1:26657/status';

// TODO: rpc çalışmıyorsa diğer rpc'yi dene
export const processLatestBlockFromAPI = async () => {
  try {
    const request = await fetch(remoteRpcUrl);
    const response = await request.json();

    const latest_block_height = response.data.result.sync_info.latest_block_height;

    console.log('En son blok yüksekliği:', latest_block_height);
    return latest_block_height;
  } catch (err) {
    console.error('Blok verileri işlenirken bir hata oluştu:', err.message);
    return null;
  }
};

export const processLatestBlockFromLocal = async () => {
  // TODO: Implement this function
};
