window.addEventListener('load', () => {
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

  axiosPost('/posts/getbulletins')
  .then(response => {
    login_vm.login_needed = false;
    bulletin_vm.loading = false;
    bulletin_vm.bulletins = response.data;
  })
  .then(() => axiosPost('/user/gettop'))
  .then(response => {
    top_vm.loading = false;
    top_vm.users = response.data;
  })
  .then(() => axiosPost('/posts/getess'))
  .then(response => {
    fav_vm.loading = false;
    fav_vm.issues = response.data.issues;
    fav_vm.articles = response.data.articles;
  })
  .catch(error => {
    if (error.response) {
      let data = error.response.data;
      if (error.response.status == '500')
      login_vm.login_note = '服务器出错，请联系王子涵' + ', 详细原因：' + (data ? data.note : '');
      else
        login_vm.login_note = '获取数据失败，请联系王子涵，错误码：' + error.response.status;
    }
    else
      login_vm.login_note = '获取数据失败，请检查网络环境：' + error.message;
  });
});