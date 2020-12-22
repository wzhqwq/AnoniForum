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
    data: {
      post: '',
      topic: '',
      author: '',
      tags: []
    }
  });
  axiosPost('/posts/getpost', {
    type: type[0],
    p_id: p_id
  }).then(resp => {
    var post = resp.data.post;
    post_vm.post = post.content;
    post_vm.topic = post.topic;
    post_vm.tags = post.tags.split(',');
    post_vm.author = post.u_id;
  }).catch(err => {
    alert("获取内容时发生了错误：" + err.message);
  });
}