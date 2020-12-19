const router = require('express').Router();

var route = {
  router: router,
  getBulletins: router.route('/getbulletins'),
  getEssentials: router.route('/getess'),
  getPosts: router.route('/getposts'),
  getPost: router.route('/getpost'),
  getBulletin: router.route('/getbulletin'),
  getComments: router.route('/getcomments'),
  savePost: router.route('/savepost'),
  publishPost: router.route('/publishpost'),
  deletePost: router.route('/deletepost'),
  sendComment: router.route('/sendcomment')
};

module.exports = route;