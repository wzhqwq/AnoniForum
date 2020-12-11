window.addEventListener('load', () => {
  var salts;
  axios.get('/user/getsalt')
  .then(data => {
    salts = data;
  })
  .catch(err => {
    console.error(err);
  });
  new Vue({
    el: '#form',
    data: {
      sdu_id: '',
      password: '',
      err: ''
    },
    method: {
      submit: function (e) {
        e.preventDefault();
        if (!this.sdu_id.match(/2020[02]{2,2}3[\d]{5,5}/)) {
          this.err = '学号格式错误';
          return;
        }
        axios.post('/user/login', {
          password: this.password,
          sdu_id: this.sdu_id
        })
        .then(data => {
          if (data.err != '')
            this.err = data.err;
          else {
            this.err = '';
            var d = new Date();
            d.setTime(d.getTime() + (7*24*60*60*1000));
            document.cookies = `wjt=${data.wjt};expires=${d.toUTCString()};path=/`;
            location.href = (location.search.match(/fb=[^&]*/) || ['fb=/'])[0].replace(/^fb=/, '');
          }
        })
        .catch(e => {
          console.error(e);
        });
      }
    }
  });
});