const router = require('express').Router();

var route = {
  router: router,
  getBulletins: router.route('/getbulletins'),
  getEssentials: router.route('/getess'),
  getPosts: router.route('/getposts'),
  getPost: router.route('/getpost'),
  getBulletin: router.route('/getbulletin'),
  getComments: router.route('/getcomments'),
  sendPost: router.route('/sendpost'),
  sendComment: router.route('/sendcomment')
};

module.exports = route;