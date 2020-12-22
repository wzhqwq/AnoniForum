const express = require('express');
const http = require('http');
const log = require('../helper/logger').log;
const DB = require('../helper/db');
const bodyParser = require('body-parser');
require('./comment');
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
    {name: 'u_id', type: DB.INT},
    {name: 'topic', type: DB.SHORT},
    {name: 'brief', type: 'VARCHAR(200)'},
    {name: 'tags', type: DB.SHORT},
    {name: 'essential', type: DB.INT},
    {name: 'resolved', type: DB.INT},
    {name: 'time', type: DB.SHORT},
    {name: 'watch', type: DB.INT}
  ]);
  DB.create('articles', [
    {name: 'article_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'u_id', type: DB.INT},
    {name: 'topic', type: DB.SHORT},
    {name: 'tags', type: DB.SHORT},
    {name: 'essential', type: DB.INT},
    {name: 'date', type: DB.SHORT},
    {name: 'watch', type: DB.INT}
  ]);
  DB.create('issues_tags', [
    {name: 'issue_id', type: DB.INT},
    {name: 'tag_id', type: DB.INT}
  ]);
  DB.create('articles_tags', [
    {name: 'article_id', type: DB.INT},
    {name: 'tag_id', type: DB.INT}
  ]);
  DB.create('article_comments', [
    {name: 'comment_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'article_id', type: DB.INT},
    {name: 'content', type: DB.TEXT},
    {name: 'u_id', type: DB.INT},
    {name: 'reply', type: DB.INT}
  ]);
  DB.create('issue_comments', [
    {name: 'comment_id', isPrimary: true, autoInc: true, type: DB.INT},
    {name: 'issue_id', type: DB.INT},
    {name: 'content', type: DB.TEXT},
    {name: 'u_id', type: DB.INT},
    {name: 'reply', type: DB.INT},
    {name: 'vote', type: DB.INT}
  ]);
  DB.create('user_votes', [
    {name: 'comment_id', type: DB.INT},
    {name: 'u_id', type: DB.INT},
    {name: 'vote', type: DB.INT}
  ]);*/
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
    .append((new DB()).select('bulletin', null, 5))
    .query()
    .then(bulletins => {
      res.json(bulletins);
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
        .sort('issue_id', true)
        .selectSelf(null, 15)
    )
    .query()
    .then(issues => {
      ret.issues = issues;
      return (new DB())
        .select('articles', 'essential = 1', 20)
        .query()
    })
    .then(articles => {
      ret.articles = articles;
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
    return res.status(400).json({ code: 'INVNUM', note: 'start不合法' }), null;
  if (type != 'a' && type != 'i')
    return res.status(400).json({ code: 'INVTP', note: 'type不合法' }), null;

  var name = type == 'a' ? 'article' : 'issue';
  start = parseInt(start);
  var fromTable = `${name}s`;

  if (tag != '') {
    if (tag.match(/[\D]/g) != null)
      return res.status(400).json({ code: 'INVTAG', note: 'tags不合法' }), null;

    fromTable = (new DB())
      .joinSelect(
        (new DB())
          .select(`${name}s_tags`, `tag_id = ${tag}`)
          .asTable(),
        fromTable,
        `${name}_id`
      ).asTable();
  }
  var q = new DB();
  
  if (sort == 'h')
    q.select(fromTable, where == '' ? null : where).sort('watch', true).selectSelf(null, `10 OFFSET ${start}`);
  else
    q.select(fromTable, where == '' ? null : where, `10 OFFSET ${start}`);

  q.query()
    .then(posts => {
      res.json(posts);
    })
    .catch(err => {
      res.status(500).json({ code: 'DBERR', err: '数据库出错: ' + err.message });
    });
});

route.getPost.post((req, res) => {
  var type = req.body.type || '';
  var p_id = req.body.p_id;

  if (typeof p_id != 'number')
    return res.status(400).json({ code: 'INVID', note: 'p_id不合法' }), null;
  if (type != 'a' && type != 'i')
    return res.status(400).json({ code: 'INVTP', note: 'type不合法' }), null;
  var name = type == 'a' ? 'article' : 'issue';

  if (p_id == -1) {
    if (!fs.existsSync(__dirname + `/../../data/${name}s/drafts/${req.user_current.u_id}.html`))
      return res.status(404).json({ code: 'NODRAFT', note: '没有草稿'}), null;
    try {
      let content = fs.readFileSync(__dirname + `/../../data/${name}s/drafts/${req.user_current.u_id}.html`, ).toString('utf-8');
      res.json({code: 'SUCC', note: '', post: {content: content, u_id: req.user_current.u_id, isDraft: true}});
    }
    catch(err) {
      res.status(500).json({code: 'FSERR', note: '文件系统发生错误：' + err.message, post: null});
    }
  }
  else
    (new DB())
      .select(`${name}s`, `${name}_id = ${p_id}`)
      .query(true)
      .then(post => {
        if (!post)
          return res.status(404).json({ code: 'NOID', note: 'p_id不存在' }), null;

        try {
          post.content = fs.readFileSync(__dirname + `/../../data/${name}s/${p_id}.html`).toString('utf-8');
          res.json({code: 'SUCC', note: '', post: post});
        }
        catch(err) {
          res.status(500).json({code: 'FSERR', note: '文件系统发生错误：' + err.message, post: null});
        }
      })
      .catch(err => {
        res.status(500).json({ code: 'DBERR', note: '数据库出错: ' + err.message });
      });
});

route.savePost.post((req, res) => {
  var type = req.body.type || '';
  var p_id = req.body.p_id || '';
  // prevent XSS
  var content = (req.body.post || '').replace(/<script>/gi, '<xd>').replace(/<\/script>/gi, '</xd>');

  if (typeof p_id != 'number')
    return res.status(400).json({ code: 'INVID', note: 'p_id不合法' }), null;
  if (type != 'a' && type != 'i')
    return res.status(400).json({ code: 'INVTP', note: 'type不合法' }), null;
  
  var name = type == 'a' ? 'article' : 'issue';
  var path = __dirname + `/../../data/${name}s/`;
  if (p_id == -1)
    fs.writeFile(path + `drafts/${req.user_current.u_id}.html`, content, () => {
      res.json({ code: 'SUCC', note: ''});
    });
  else
    (new DB())
      .select(`${name}s`, `${name}_id = ${p_id}`)
      .query(true)
      .then(post => {
        if (!post)
          return res.status(403).json({code: 'NOID', note: 'p_id不存在'}), null;
        if (post.p_id != req.user_current)
          return res.status(403).json({code: 'INVUSER', note: '您没有权限编辑此内容'}), null;
        fs.writeFile(path + `${p_id}.html`, content, () => {
          res.json({ code: 'SUCC', note: ''});
        });
      })
      .catch(err => {
        res.status(500).json({ code: 'DBERR', note: '数据库出错: ' + err.message });
      });
});

route.publishPost.post((req, res) => {
  var type = req.body.type || '';
  var topic = req.body.topic || '';
  var tags = req.body.tags || '';
  var brief = req.body.brief || '';
  if (type != 'a' && type != 'i')
    return res.status(400).json({ code: 'INVTP', note: 'type不合法' }), null;
  if (topic == '' || topic.length > 40)
    return res.status(400).json({ node: 'NOTOPIC', note: '标题不合法'}), null;
  if (tags != '' && tags.match(/[^,\d]/g))
    return res.status(400).json({ code: 'INVTAG', note: 'tags不合法'}), null;
  
  var name = type == 'a' ? 'article' : 'issue';
  var path = __dirname + `/../../data/${name}s/`;

  if (!fs.existsSync(path + `drafts/${req.user_current.u_id}.html`))
    return res.json({ code: 'NODRAFT', note: '没有草稿要发送'}), null;
  
  var date = new Date();
  var post = {
    topic: topic,
    tags: tags,
    essential: 0,
    u_id: req.user_current.u_id,
    watch: 0
  };
  if (type == 'i') {
    post.resolved = 0;
    post.brief = brief;
    post.time = `${date.getMonth()}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}`;
  }
  else
    post.date = `${date.getMonth()}月${date.getDate()}日`;
  DB.insert(`${name}s`, post).then(result => {
    if (tags != '')
      tags.split(',').forEach(id => {
        var ins = {tag_id: id};
        ins[`${name}_id`] = result.lastID;
        DB.insert(`${name}s_tags`, ins);
      });
    fs.rename(path + `drafts/${req.user_current.u_id}.html`, path + `${result.lastID}.html`, () => {
      res.json({code: 'SUCC', note: '', id: result.lastID});
    });
  }).catch(err => {
    res.status(500).json({ code: 'DBERR', note: '数据库出错: ' + err.message });
  });
})

app.use('/posts', route.router);