import { Cron } from 'croner';
import { compareBlockHeights } from './rpcBlock.js';
import sendTelegramMessage from './sendTelegramMessages.js';

new Cron('*/5 * * * * *', async () => {
  const result = await compareBlockHeights();
  
  if (!result.success) {
    console.log('❌ RPC Check Error: ' + result.message);
    await sendTelegramMessage('❌ RPC Check Error: ' + result.message);
    return;
  }

  if (result.message) {
    console.log(result.message);
    await sendTelegramMessage(result.message);
  }
});
