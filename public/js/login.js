const first_load = () => {
  new Vue({
    el: '#form',
    data: {
      sdu_id: '',
      password: '',
      err: '',
      loging: false
    },
    methods: {
      submit: function (e) {
        e.preventDefault();
        if (!this.sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
          this.err = '学号格式错误';
          return;
        }
        this.loging = true;
        axiosPost('/rjrusr/login', {
          password: this.password,
          sduid: this.sdu_id
        })
        .then(response => {
          var data = response.data;
          this.loging = false;
          if (data.err != '')
            this.err = data.err;
          else {
            this.err = '';
            var d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            localStorage.setItem('jwt', data.jwt);
            if (window.login_succ)
              window.login_succ();
            else
              location.href = (location.search.match(/fb=[^&]*/) || ['fb=/'])[0].replace(/^fb=/, '');
          }
        })
        .catch(e => {
          var msg = '';
          this.loging = false;
          if (e.response.data) msg = e.response.data.err;
          alert("登录发生问题：" + e.message + ' ' + msg);
        });
      }
    }
  });
};