const userCtrl = require('./src/user/controler');
const postsCtrl = require('./src/posts/controler');

process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    userCtrl.close();
    postsCtrl.close();
    console.log('MainWorker: Main server closed.');
    process.exit(0);
  }
});