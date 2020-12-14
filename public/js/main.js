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
  $('.container').css('display', 'block');

  if (location.pathname == 'login' || location.pathname == 'signup') return;

  var login_el = document.createElement('div');
  login_el.innerHTML = `
<div class="modal fade" id="login-needed" v-bind:class="{ show: login_note != '' }" v-bind:style="{ display: login_needed ? 'block' : '' }">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-body">
        {{ login_note }}
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" v-on:click="location.href='/login'">登录</button>
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
      location: location
    }
  });
  var jwt = localStorage.getItem('jwt');

  window.axiosPost = function (url, obj = {}) {
    obj.jwt = jwt;
    return axios.post(url, obj)
      .catch(err => {
        if (err?.response.status == 403) {
          login_vm.login_needed = true;
          setTimeout(() => {
            login_vm.login_note = err.response.data.code == 'LOGIN' ? '您还没有登录' : (data.note + '，请重新登录');
          }, 0);
        }
        return new Promise((r, rej) => rej(err));
      });
  };

});