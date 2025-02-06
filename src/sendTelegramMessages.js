const fetch = require('node-fetch');
require('dotenv').config();

const sendTelegramMessage = async (message) => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=Markdown`
    );
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error('Telegram API yanıt vermedi');
    }
    
    return true;
  } catch (error) {
    console.error('Mesaj gönderilirken hata oluştu:', error.message);
    return false;
  }
};

module.exports = sendTelegramMessage;