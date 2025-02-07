const axios = require('axios');

// API URL
const blockInfoUrl = 'https://rpc.celestia.pops.one/status';
const localBlock = '127.0.0.1:26657/status';
const processLatestBlockFromAPI = async () => {
    try {
        // Blok bilgilerini çek
        const response = await axios.get(blockInfoUrl);
        const latest_block_height = response.data.result.sync_info.latest_block_height;

        console.log('En son blok yüksekliği:', latest_block_height);
        return latest_block_height;
    } catch (err) {
        console.error('Blok verileri işlenirken bir hata oluştu:', err.message);
        return null;
    }
};

// Fonksiyonu çağır ve test et
processLatestBlockFromAPI();

module.exports = processLatestBlockFromAPI;
