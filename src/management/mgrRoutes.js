const router = require('express').Router();

var routes = {router: router};

routes.reloadAllServer = router.route('/reloadAllServer');
routes.closeMainServer = router.route('/closeMainServer');
routes.startMainServer = router.route('/startMainServer');

routes.mysqlAdmin = function (prefix, middleware) {
  if (!middleware && prefix) {
    middleware = prefix;
    prefix = '';
  }
  router.use('/mysql' + prefix, middleware);
}

module.exports = routes;