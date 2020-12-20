window.addEventListener('load', () => {
  document.body.querySelectorAll('img').forEach(img => {
    if (img.hasAttribute('lazy-src'))
      img.src = img.getAttribute('lazy-src');
  });
  Array.prototype.forEach.call(
    document.body.getElementsByClassName('lazy-bg'),
    el => {
      el.style.backgroundImage = `url(${el.getAttribute('lazy-src')})`;
    }
  );
  document.getElementsByClassName('container')[0].style.display = 'block';

  if (typeof first_load != 'undefined')
    setTimeout(first_load, 0);
  if (typeof secondly_load != 'undefined')
    setTimeout(secondly_load, 0);

  if (location.pathname == 'login' || location.pathname == 'signup') return;

  var login_el = document.createElement('div');
  login_el.innerHTML = `
<div class="modal fade" id="login-needed" v-bind:class="{ show: login_note != '' }" v-bind:style="{ display: login_needed ? 'block' : '' }">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-body">
        <div class="modal-header">
          <h5>{{ login_note }}</h5>
        </div>
        <div class="center-loader" v-if="loading">
          <div class="spinner-border"></div>
          <span>登录页面加载中</span>
        </div>
        <iframe id="login-frame" v-bind:src="login_needed ? '/login' : ''" v-on:load="loaded">
        </iframe>
      </div>
    </div>
  </div>
</div>`;
  document.body.appendChild(login_el);
  var login_vm = new Vue({
    el: '#login-needed',
    data: {
      login_needed: false,
      login_note: '',
      location: location,
      loading: true
    },
    methods: {
      loaded: function () {
        this.loading = false;
        $('#login-frame')[0].contentWindow.login_succ = () => {
          this.login_note = '';
          last_obj.jwt = jwt = localStorage.getItem('jwt');
          setTimeout(() => {
            this.login_needed = false;
          }, 0);
          axios.post(last_url, last_obj).then(data => last_res(data)).catch(err => last_rej(err));
        }
      }
    }
  });
  var jwt = localStorage.getItem('jwt');
  
  if (!jwt)
    window.u_id = -1;
  else {
    var data = JSON.parse(atob(jwt.split('.')[0]));
    window.u_id = data.u_id;
  }

  var last_url, last_obj;
  var last_res, last_rej;

  window.axiosPost = function (url, obj = {}) {
    obj.jwt = jwt;
    last_url = url;
    last_obj = obj;
    return axios.post(url, obj)
      .catch(err => {
        if (err?.response.status == 403) {
          login_vm.loading = true;
          login_vm.login_needed = true;
          setTimeout(() => {
            login_vm.login_note = err.response.data.code == 'LOGIN' ? '您还没有登录' : (data.note + '，请重新登录');
          }, 0);
          return new Promise((res, rej) => {
            last_res = res;
            last_rej = rej;
          });
        }
        return new Promise((r, rej) => rej(err));
      });
  };

});