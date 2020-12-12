const router = require('express').Router();

var routes = {
  router: router,
  reloadAllServer: router.route('/reloadAllServer'),
  closeMainServer: router.route('/closeMainServer'),
  startMainServer: router.route('/startMainServer'),
  
  mysqlAdmin: function (prefix, middleware) {
    if (!middleware && prefix) {
      middleware = prefix;
      prefix = '';
    }
    router.use('/mysql' + prefix, middleware);
  }
};

module.exports = routes;