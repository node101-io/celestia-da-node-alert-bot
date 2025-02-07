import { Cron } from 'croner';

const BLOCK_HEIGHT_DIFFERENCE_THRESHOLD = 5;
const BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD = 50;

new Cron('*/5 * * * * *', () => {
  console.log('test');

  // processLatestBlockFromAPI ve processLatestBlockFromLocal fonksiyonlarını çağırarak blok yüksekliğini alın
  // Eğer iki blok yüksekliği farkı BLOCK_HEIGHT_DIFFERENCE_THRESHOLD değerinden büyükse, bir mesaj gönderin
  // Eğer iki blok yüksekliği farkı BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD değerinden büyükse, başka bir bir mesaj gönderin
});
