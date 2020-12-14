const express = require('express');
const http = require('http');
const log = require('../helper/logger').log;
const DB = require('../helper/db');
const bodyParser = require('body-parser');
const route = require('./postRoutes');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

DB.connect().then(() => {
  server.listen(20717, 'localhost', () => {
    log('Post server is running.');
  });
  /*DB.create('bulletin', [
    {name: 'b_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'title', type: DB.SHORT},
    {name: 'toTop', type: DB.INT},
    {name: 'date', type: DB.SHORT},
  ]);
  DB.create('issues', [
    {name: 'issue_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'topic', type: DB.SHORT},
    {name: 'tags', type: DB.SHORT},
    {name: 'essential', type: DB.INT},
    {name: 'resolved', type: DB.INT},
    {name: 'time', type: DB.SHORT}
  ]);
  DB.create('articles', [
    {name: 'article_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'topic', type: DB.SHORT},
    {name: 'tags', type: DB.SHORT},
    {name: 'essential', type: DB.INT},
    {name: 'date', type: DB.SHORT}
  ]);
  DB.create('issues_tags', [
    {name: 'issue_id', type: DB.INT},
    {name: 'tag_id', type: DB.INT}
  ]);
  DB.create('articles_tags', [
    {name: 'article_id', type: DB.INT},
    {name: 'tag_id', type: DB.INT}
  ]);
  DB.create('comments', [
    {name: 'comment_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'article_id', type: DB.INT},
    {name: 'content', type: DB.TEXT},
    {name: 'u_id', type: DB.INT},
    {name: 'reply', type: DB.INT}
  ])*/
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require('../helper/auth').checkBefore);

exports.close = function () {
  return new Promise(res => {
    DB.disconnect().then(() => {
      server.close();
      res();
    });
  })
};

route.getBulletins.post((req, res) => {
  (new DB())
    .select('bulletin', 'to_top = 1')
    .appendSelect('bulletin', null, 5)
    .query()
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      res.status(500).json({ code: 'DBERR', err: '数据库出错: ' + err.message });
    });
});

route.getEssentials.post((req, res) => {
  var ret = {};
  (new DB())
    .select('issues', 'essential = 1')
    .append(
      (new DB).select('issues', 'essential = 0')
        .sort('issue_id', 'DESC', null, 15)
    )
    .query()
    .then(data => {
      ret.issues = data;
      return (new DB())
        .select('articles', 'essential = 1', 20)
        .query()
    })
    .then(data => {
      ret.articles = data;
      res.json(ret);
    })
    .catch(err => {
      res.status(500).json({ code: 'DBERR', err: '数据库出错: ' + err.message });
    });
});

route.getPosts.post((req, res) => {
  var type = req.body.type || '';
  var start = req.body.start || '';
  var word = req.body.wd || '';
  var tag = req.body.tag || '';
  var resolved = req.body.res || '';
  var sort = req.body.sort || '';
  var where = word ? `topic LIKE '%${word}%'` : '';
  if (type == 'i' && (resolved == '0' || resolved == '1')) {
    if (where != '')
      where += ' AND ';
    where += `resolved=${resolved}`;
  }

  if (start.match(/[\D]/g))
    res.status(400).json({ code: 'INVNUM', note: 'start不合法' });
  else if (type == 'a' || type == 'i') {
    var name = type == 'a' ? 'article' : 'issue';
    start = parseInt(start);
    var fromTable = `${name}s`;

    if (tag != '') {
      if (tag.match(/[\D]/g) != null) {
        res.status(400).json({ code: 'INVTAG', note: 'tags不合法' });
        return;
      }
      fromTable = (new DB())
        .joinSelect(
          (new DB())
            .select(`${name}_tags a`, `tag_id = ${tag}`)
            .asTable(),
          fromTable,
          `${name}_id`
        ).asTable();
    }
    var q = new DB();
    q.select(fromTable, where == '' ? null : where, `${start} ${start + 10}`);

    if (sort == 'h')
      q.sort('watch', 'DESC');

    q.query()
      .then(post => {
        if (post.length == 0)
          res.status(404).json({ code: 'NOPOST', note: '没有了' });
        else
          res.json(post);
      })
      .catch(err => {
        res.status(500).json({ code: 'DBERR', err: '数据库出错: ' + err.message });
      });
  }
  else
    res.status(400).json({ code: 'INVTP', note: 'type不合法' });
});

route.getPost.post((req, res) => {
  var type = req.body.type;
  var p_id = req.body.p_id;

  if (p_id.match(/[\D]/g))
    res.status(400).json({ code: 'INVID', note: 'p_id不合法' });
  else if (type == 'a' || type == 'i') {
    var name = type == 'a' ? 'article' : 'issue';
    (new DB())
      .select(`${name}s`, `${name}_id = ${p_id}`)
      .query()
      .then(post => {
        if (post.length == 0)
          res.status(404).json({ code: 'NOID', note: 'p_id不存在' });
        else {
          var ret = post[0];
          // read post
        }
      })
      .catch(err => {
        res.status(500).json({ code: 'DBERR', err: '数据库出错: ' + err.message });
      });
  }
  else
    res.status(400).json({ code: 'INVTP', note: 'type不合法' });
});

app.use('/posts', route.router);