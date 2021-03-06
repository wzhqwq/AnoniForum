const first_load = () => {
  var type = location.pathname.replace(/#.*$/, '').replace('index.html', '').replace(/\/$/, '').match(/[^/]*$/)[0];
  var last_search = '';
  var id_name = type.replace(/s$/, '_id');

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
        axiosGet('/rjrpst/getposts', {
          type: type[0],
          wd: this.search_text,
          start: more ? `${this.posts.length}` : '0',
          tag: this.tag_now == -1 ? '' : `${this.tag_now}`,
          res: this.resolved == -1 ? '' : `${this.resolved}`,
          sort: this.sortByPop ? 'h' : ''
        })
        .then(resp => {
          this.isEnd = resp.data.length < 10;
          this.loading = false;
          var data = resp.data;
          data.forEach(post => post.url = `detail?id=${post[id_name]}`)
          if (more)
            this.posts.concat(data);
          else
            this.posts = data;
        })
        .catch(err => {
          alert('请求出现问题，请联系王子涵：' + (err.response.data ? err.response.data.err : ''))
        });
      }
    }
  });
  axiosGet('/rjrres/jsons/tags.json')
  .then(resp => {
    common_vm.tags = resp.data.map((tag, i) => {
      return {name: tag, id: i};
    });
    common_vm.load();
  })
  .catch(err => {
    alert('获取标签时出现问题：' + err.message);
  });

  var atBottom = false;
  document.addEventListener('scroll', e => {
    if (document.documentElement.scrollTop >= 70) {
      if (!atBottom) {
        $('#create-post').addClass('bottom-btn');
        atBottom = true;
      }
    }
    else {
      if (atBottom) {
        $('#create-post').removeClass('bottom-btn');
        atBottom = false;
      }
    }
  });
};