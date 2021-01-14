const first_load = () => {
  var p_id = location.search.match(/[\d]+/);
  if (!p_id) {
    alert('路径不合法！');
    history.back();
    return;
  }
  p_id = parseInt(p_id[0]);
  var type = location.pathname.replace(/#.*$/, '').replace(/\?.*/).replace('index.html', '').replace('detail/', '').replace(/\/$/, '').match(/[^/]*$/)[0];
  var post_vm = new Vue({
    el: '#post',
    data: {
      post: '',
      topic: '',
      watcher: '0',
      tags: [],
      isIssue: type[0] == 'i',
      resolved: null
    }
  });
  var comment_vm = new Vue({
    el: '#comments',
    data: {
      comments: []
    }
  });
  axiosGet('/rjrres/jsons/tags.json')
  .then(resp => {
    var tags = resp.data;
    axiosPost('/rjrpst/getpost', {
      type: type[0],
      p_id: p_id
    }).then(resp => {
      var post = resp.data.post;
      post_vm.post = post.content;
      post_vm.topic = post.topic;
      if (post.tags != '')
        post_vm.tags = post.tags.split(',').map(id => tags[id]);
      post_vm.watcher = post.watch;
    }).catch(err => {
      alert("获取内容时发生了错误：" + err.message);
    });
  })
  .catch(err => {
    alert('获取标签时出现问题：' + err.message);
  });
  post_vm.post = '<h1>test</h1>';
  post_vm.topic = 'test';
  post_vm.tags = ['hehe'];
}