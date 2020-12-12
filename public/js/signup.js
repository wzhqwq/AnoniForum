window.addEventListener('load', () => {
  var salts;
  axios.get('/user/getsalt')
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
      sdu_id_err: ''
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

        axios.post('/user/signup', {
          sduid: this.sdu_id,
          password: CryptoJS.HmacSHA256(this.password, salts.salt1).toString()
        })
        .then(response => {
          var data = response.data;
          if (data.err != '')
            this.sdu_id_err = data.err;
          else {
            this.sdu_id_err = '';
            var d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            document.cookie = `jwt=${data.jwt};expires=${d.toUTCString()};path=/`;
            location.href = '/terms';
          }
        })
        .catch(e => {
          console.error(e);
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
          this.password_err = '密码必须包含大小写字母以及“数字或括号下划线”构成';
          return false;
        }
        this.password_err = '';
        return true;
      }
    }
  });
});