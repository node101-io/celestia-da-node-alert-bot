import { Cron } from 'croner';
import { compareBlockHeights } from './rpcBlock.js';
import sendTelegramMessage from './sendTelegramMessages.js';
import config from './config.json' assert { type: "json" };

new Cron('*/5 * * * * *', async () => {
  const result = await compareBlockHeights();
  
  if (!result.success) {
    const errorMessage = formatMessage('rpcCheckError', { message: result.message });
    console.log(errorMessage);
    await sendTelegramMessage(errorMessage);
    return;
  }

  if (result.message) {
    console.log(result.message);
    await sendTelegramMessage(result.message);
  }
});
