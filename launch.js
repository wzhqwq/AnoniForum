const fork = require('child_process').fork('./worker.js');
var worker = fork('./worker.js');

var reload = false;
worker.on('message', msg => {
  if (msg == 'reload') {
    reload = true;
    worker.kill('SIGHUP');
  }
});

worker.on('exit', code => {
  console.log('Master: Server closed with code:', code);
  if (reload)
    worker = fork('./worker.js');
});