const router = require('express').Router();

var route = {
  router: router,
  getBulletins: router.route('/getbulletins'),
  getEssentials: router.route('/getess'),
  getPosts: router.route('/getposts'),
  getPost: router.route('/getpost'),
  getBulletin: router.route('/getbulletin'),
  savePost: router.route('/savepost'),
  publishPost: router.route('/publishpost'),
  deletePost: router.route('/deletepost'),

  getComments: router.route('/getcomments'),
  sendComment: router.route('/sendcomment'),
  voteComment: router.route('/votecomment')
};

module.exports = route;