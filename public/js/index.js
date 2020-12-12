window.addEventListener('load', () => {
  var login_vm = new Vue({
    el: '#login-needed',
    data: {
      login_needed: true,
      login_note: '',
      location: location
    }
  });
  var bulletin_vm = new Vue({
    el: '#bulletin-board',
    data: {
      loading: true,
      bulletins: [],
    }
  });

  var top_vm = new Vue({
    el: '#top-10',
    data: {
      loading: true,
      users: [],
    }
  });

  var fav_vm = new Vue({
    el: '#fav-posts',
    data: {
      issues: [],
      articles: [],
      loading: false,
    }
  });

  var jwt = localStorage.getItem('jwt');
  axios.post('/posts/getbulletin', {jwt: jwt})
  .then(response => {
    login_vm.login_needed = false;
    bulletin_vm.loading = false;
    bulletin_vm.bulletins = response.data;
  })
  .then(() => axios.post('/user/gettop', {jwt: jwt}))
  .then(response => {
    top_vm.loading = false;
    top_vm.users = response.data;
  })
  .then(() => axios.post('/posts/getess', {jwt: jwt}))
  .then(response => {
    fav_vm.loading = false;
    fav_vm.issues = response.data.issues;
    fav_vm.articles = response.data.articles;
  })
  .catch(error => {
    if (error.response) {
      let data = error.response.data;
      if (error.response.status == '403')
        login_vm.login_note = data.code == 'LOGIN' ? '您还没有登录' : (data.note + '，请重新登录');
      else
        login_vm.login_note = '获取数据失败，请联系王子涵，错误码：' + error.response.status + '详细原因：' + (data ? data.note : '');
    }
    else
      login_vm.login_note = '获取数据失败，请联系王子涵，错误信息：' + error.message;
  });
});