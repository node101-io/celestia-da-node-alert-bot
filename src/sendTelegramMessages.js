import dotenv from 'dotenv';

dotenv.config();

const sendTelegramMessage = async (message) => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=Markdown`
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram message sending error:', data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Telegram message sending error:', error.message);
    return false;
  };
};


export default sendTelegramMessage;
