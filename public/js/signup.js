// 已废弃、长期不维护的代码
const first_load =  () => {
  var salts;
  axios.get('/rjrusr/getsalt')
  .then(response => {
    salts = response.data;
  })
  .catch(err => {
    console.error(err);
  });
  new Vue({
    el: '#form',
    data: {
      sdu_id: '',
      password: '',
      confirm: '',
      password_err: '',
      sdu_id_err: '',
      signing: false
    },
    methods: {
      submit: function (e) {
        e.preventDefault();
        if (this.sdu_id.length != 12) {
          this.sdu_id_err = '学号长度不满足12位';
          return;
        }
        if (!this.passwd_correct || this.password != this.confirm) return;
        if (!this.sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
          this.sdu_id_err = '学号格式错误';
          return;
        }
        this.password_err = this.sdu_id_err = '';
        this.signing = true;

        axios.post('/rjrusr/signup', {
          sduid: this.sdu_id,
          password: CryptoJS.HmacSHA256(this.password, salts.salt1).toString()
        })
        .then(response => {
          var data = response.data;
          this.signing = false;
          if (data.err != '')
            this.sdu_id_err = data.err;
          else {
            this.sdu_id_err = '';
            var d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            localStorage.setItem('jwt', data.jwt);
            location.href = '/terms';
          }
        })
        .catch(e => {
          var msg = '';
          this.signing = false;
          if (e.response.data) msg = e.response.data.err;
          alert("登录发生问题：" + e.message + ' ' + msg);
        })
      }
    },
    computed: {
      passwd_correct: function () {
        if (this.password.length < 8) {
          this.password_err = '密码长度不足8位';
          return false;
        }
        if (!this.password.match(/[a-z]/g) || !this.password.match(/[A-Z]/g) || !this.password.match(/[()_0-9]/g)) {
          this.password_err = '密码最好由大小写字母以及“数字或括号下划线”构成';
          return true;
        }
        this.password_err = '';
        return true;
      }
    }
  });
};