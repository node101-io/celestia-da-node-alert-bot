const { Cron } = require('croner');

// Her 5 saniyede bir çalışacak cron job
const job = new Cron('*/5 * * * * *', () => {
    console.log('test');
});

// Programın sürekli çalışması için
process.stdin.resume(); 