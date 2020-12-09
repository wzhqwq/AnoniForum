const userCtrl = require('./src/user/userControlers');
const postsCtrl = require('./src/posts/postControlers');

process.on('message', msg => {
  if (msg == 'exit') {
    // do some work
    userCtrl.close();
    postsCtrl.close();
    console.log('MainWorker: Main server closed.');
    process.exit(0);
  }
});