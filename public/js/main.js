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
  <center-loader v-if="loading" text="页面加载中" style="margin-top: 100px;"></center-loader>
  <iframe id="login-frame" v-bind:src="show1 ? (setName ? '/rjrrjh/login/setname.html' : '/rjrrjh/login') : ''" v-on:load="loaded">
  </iframe>
</div>`;
  const getData = () => JSON.parse(atob(jwt.split('.')[0]));
  document.body.appendChild(login_el);
  Vue.component('center-loader', {
    props: ['text'],
    template: `<div class="center-loader">
  <div class="spinner-border"></div>
  <span>{{ text || '加载中' }}</span>
</div>`
  });
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
            }, 300);
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
    if (jwt) obj.jwt = jwt;
    last_url = url;
    last_obj = obj;
    return axios.post(url, obj)
      .catch(err => {
        if (!err.response)
          return alert('发送请求失败，请检查网络环境: ' + err.message + '，如果网络没有问题，请将问题反馈给王子涵'), fakePromise;
        if (err.response.status == 500)
          return alert(err.response?.data?.code == 'DBERR' ? '数据库出错，请联系王子涵' : ('服务器出错，请联系王子涵: ' + err.response.data.err || '')), fakePromise;
        if (err.response.status == 403) {
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
        if (obj[key] && obj[key] != '')
          queries.push(`${key}=${encodeURI(obj[key])}`);
      url += '?' + queries.join('&');
    }
    return axios.get(url)
      .catch(err => {
        if (!err.response)
          return alert('发送请求失败，请检查网络环境: ' + err.message + '，如果网络没有问题，请将问题反馈给王子涵'), fakePromise;
        if (err.response.status == 500)
          return alert(err.response?.data?.code == 'DBERR' ? '数据库出错，请联系王子涵' : '服务器出错，请联系王子涵'), fakePromise;

        return new Promise((_, rej) => rej(err))
      });
  }

  var fakePromise = {
    then: function () {
      return this;
    },
    catch: function () {
      return this;
    }
  };
});