const router = require('express').Router();

var routers = {router: router};

routers.signUp = router.route('/signup');
routers.logIn = router.route('/login');
routers.getSalt = router.route('/getsalt');

module.exports = routers;