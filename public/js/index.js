const first_load =  () => {
  var bulletin_vm = new Vue({
    el: '#bulletin-board',
    data: {
      loading: true,
      bulletins: []
    }
  });

  var top_vm = new Vue({
    el: '#top-10',
    data: {
      loading: true,
      users: []
    }
  });

  var fav_vm = new Vue({
    el: '#fav-posts',
    data: {
      issues: [],
      articles: [],
      loading: true
    }
  });

  axios.get('/rjrpst/getbulletins')
  .then(response => {
    bulletin_vm.loading = false;
    bulletin_vm.bulletins = response.data;
  })
  .then(() => axios.get('/rjrusr/gettop'))
  .then(response => {
    top_vm.loading = false;
    top_vm.users = response.data;
  })
  .then(() => axios.get('/rjrpst/getess'))
  .then(response => {
    fav_vm.loading = false;
    fav_vm.issues = (issues => {
      issues.forEach(issue => issue.url = `/rjrrjh/issues/detail?id=${issue.issue_id}`);
      return issues;
    })(response.data.issues);
    fav_vm.articles = (articles => {
      articles.forEach(article => article.url = `/rjrrjh/articles/detail?id=${article.article_id}`);
      return articles;
    })(response.data.articles);
  })
  .catch(error => {
    if (error.response) {
      let data = error.response.data;
      if (error.response.status == '500')
      alert('服务器出错，请联系王子涵' + ', 详细原因：' + (data ? data.note : ''));
      else
        alert('获取数据失败，请联系王子涵，错误码：' + error.response.status);
    }
    else
      alert('获取数据失败，请检查网络环境：' + error.message);
  });
};