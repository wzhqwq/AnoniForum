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

  if (location.pathname.match('login')) return;

  var login_el = document.createElement('div');
  login_el.innerHTML = 
`<div id="login-needed" v-bind:class="{ show: show2 }" v-bind:style="{ display: show1 ? 'block' : '' }">
  <div class="center-loader" v-if="loading">
    <div class="spinner-border"></div>
    <span>登录页面加载中</span>
  </div>
  <iframe id="login-frame" v-bind:src="show1 ? (setName ? '/login/setname.html' : '/login') : ''" v-on:load="loaded">
  </iframe>
</div>`;
  const getData = () => JSON.parse(atob(jwt.split('.')[0]));
  document.body.appendChild(login_el);
  var login_vm = new Vue({
    el: '#login-needed',
    data: {
      show1: false,
      show2: false,
      loading: true,
      setName: false
    },
    methods: {
      loaded: function () {
        this.loading = false;
        $('#login-frame')[0].contentWindow.login_succ = () => {
          last_obj.jwt = jwt = localStorage.getItem('jwt');
          window.u_id = jwt ? getData().u_id : -1;
          if (getData().nick_name != '_unset_') {
            this.show2 = false;
            setTimeout(() => {
              this.show1 = false;
            }, 0);
          }
          else {
            this.setName = true;
            this.loading = true;
          }
          axios.post(last_url, last_obj).then(data => last_res(data)).catch(err => last_rej(err));
        }
      }
    }
  });
  var jwt = localStorage.getItem('jwt');
  
  window.u_id = jwt ? getData().u_id : -1;

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
          login_vm.show1 = true;
          setTimeout(() => {
            login_vm.show2 = true;
          }, 0);
          return new Promise((res, rej) => {
            last_res = res;
            last_rej = rej;
          });
        }
        return new Promise((_, rej) => rej(err));
      });
  };
  window.axiosGet = (url, obj) => {
    if (obj) {
      let queries = [];
      for (key in obj)
        queries.push(`${key}=${encodeURI(obj[key])}`);
      url += '?' + queries.join('&');
    }
    return axios.get(url);
  }
});