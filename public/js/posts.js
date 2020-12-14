window.addEventListener('load', () => {
  var type = location.pathname.match('[^/]*/$')[0];
  var last_search = '';

  var common_vm = new Vue({
    el: '#posts',
    data: {
      posts: [],
      tags: [],
      search_text: '',
      sortByPop: false,
      tag_now: -1,
      loading: false,
      isEnd: false,
      resolved: -1
    },
    methods: {
      search: function () {
        if (this.search_text == last_search) return;
        last_search = this.search_text;
        this.load();
      },
      select_tag: function (id) {
        if (id == this.tag_now)
          this.tag_now = -1;
        else
          this.tag_now = id;
        this.load();
      },
      sort: function (isPop) {
        isPop = !!isPop;
        if (isPop == this.sortByPop) return;
        this.sortByPop = isPop;
        this.load();
      },
      set_res: function (res) {
        if (res == this.resolved)
          this.resolved = -1;
        else
          this.resolved = res;
        this.load();
      },
      load_more: function () {
        if (this.isEnd) return;
        this.load(true);
      },
      load: function (more) {
        this.loading = true;
        axiosPost('/posts/getposts', {
          type: type[0],
          wd: this.search_text,
          start: more ? `${this.posts.length}` : '0',
          tag: this.tag_now == -1 ? '' : `${this.tag_now}`,
          res: this.resolved == -1 ? '' : `${this.resolved}`,
          sort: this.sortByPop ? 'h' : ''
        })
        .then(resp => {
          this.isEnd = false;
          this.loading = false;
          if (more)
            this.posts.push(... resp.data);
          else
            this.posts = resp.data;
        })
        .catch(err => {
          if (err.response) {
            if (err.response.status == 500)
              alert('服务器出错，请联系王子涵');
            else if (err.response.status == 404) {
              this.loading = false;
              this.isEnd = true;
            }
            else if (err.response.status != 403)
              alert('请求出现问题，请联系王子涵：' + (err.response.data ? err.response.data.note : ''))
          }
          else {
            alert('发送请求失败，请检查网络环境: ' + err.message);
          }
        });
      }
    }
  });
  axios.get('/resource/jsons/tags.json')
  .then(resp => {
    common_vm.tags = resp.data;
    common_vm.load();
  })
  .catch(err => {
    alert('获取标签时出现问题：' + err.message);
  });
});