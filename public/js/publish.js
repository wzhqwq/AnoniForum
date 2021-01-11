const first_load = () => {
  $(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
  });

  var type = location.pathname.replace(/#.*$/, '').replace('index.html', '').replace('write/', '').replace(/\/$/, '').match(/[^/]*$/)[0];
  var id = (location.search.match(/[\d]+$/) || [-1])[0];

  window.publish_vm = new Vue({
    el: '#publisher',
    data: {
      saving: false,
      publishing: false,
      // uploaded: [],
      post: '',
      err: '',
      tags: [],
      tags_s: [],
      topic: '',
      tag_collapsed: true,
      brief: '',
      loaded: false,
      load_note: '正在加载' + (id == -1 ? '草稿' : '内容'),
      is_draft: false
    },
    methods: {
      save: function () {
        var post = writer.get_post();
        if (post.post == this.post && id != -1) return;
        this.saving = true;
        /*var imgs_to_upload = [], imgs_to_delete = [];
        Promise.all(
          post.img_files.map(to_upload =>
            async () => {
              var md5 = await to_upload.arrayBuffer;
              md5 = cryptoJS.MD5(md5).toString();
              for (let i = 0; i < this.uploaded.length; i++)
                if (this.uploaded[i].file.size != to_upload.size && this.uploaded[i].md5 != md5)
                  imgs_to_upload.push(to_upload);
                else
                  imgs_to_delete.push(this.uploaded[i].name);
              return;
            }
          )
        ).then(() => {
          if (this.uploaded.length - imgs_to_delete.length + imgs_to_upload.length > 5) {
            alert('最多可以有五张图片留在服务器，若图片很多请考虑使用图床');
            this.saving = false;
            return;
          }
          for (let i = 0; i < imgs_to_delete.length; i++)
            for (let j = 0; j < this.uploaded.length; j++)
              if (this.uploaded[j].name == imgs_to_delete[i]) {
                this.uploaded = this.uploaded.splice(j, 1);
                break;
              }*/
          if (id == -1) {
            localStorage.setItem(type + '_draft_topic', this.topic);
            if (type == 'issues')
              localStorage.setItem('issues_draft_brief', this.brief);
          }
          axiosPost('/posts/savepost', {
            /*add_img: imgs_to_upload,
            delete_img: imgs_to_delete,*/
            post: post,
            p_id: id,
            type: type[0]
          }).then(resp => {
            /*resp.data.files.forEach((file, i) => {
              this.uploaded.push({name: file.name, md5: file.md5, file: imgs_to_upload[i]});
            });*/
            this.saving = false;
            this.post = post;
            if (this.publishing) {
              if (this.topic == '') {
                this.err = '需要键入标题';
                this.publishing = false;
                return;
              }
              if (this.topic.length > 40) {
                this.err = '标题不能超过40个字';
                this.publishing = false;
                return;
              }
              axiosPost('/posts/publishpost', {
                type: type[0],
                topic: this.topic,
                tags: this.tags_s.map(tag => tag.id).join(','),
                brief: this.brief
              })
              .then(resp => {
                this.publishing = false;
                localStorage.removeItem('')
                if (id == -1) {
                  localStorage.removeItem(type + '_draft_topic');
                  if (type == 'issues')
                    localStorage.removeItem('issues_draft_brief');
                }
                location.href = `/${type}/detail?id=${resp.data.id}`;
              })
              .catch(err => {
                this.publishing = false;
                alert('发布失败：' + err.message);
              });
            }
          })
          .catch(err => {
            this.saving = false;
            this.publishing = false;
            alert('保存失败' + err.message);
          });
        /*});*/
      },
      publish: function () {
        if (this.saving) return;
        this.publishing = true;
        this.save();
      },
      tag_click: function (id) {
        if (id < this.tags.length) {
          if (this.tags[id].selected) {
            for (let i = 0; i < this.tags_s.length; i++)
              if (this.tags_s[i].id == id) {
                this.tags_s.splice(i, 1);
                break;
              }
          }
          else {
            if (this.tags_s.length == 3)
              return alert('最多可以同时选择3个标签'), null;
            this.tags_s.push(this.tags[id]);
          }
          this.tags[id].selected = !this.tags[id].selected;
        }
      }
    },
    watch: {
      publishing(val) {
        window.writer_vm.publishing = val;
      },
      saving(val) {
        window.writer_vm.saving = val;
      }
    }
  });
  
  axios.get('/resource/jsons/tags.json')
  .then(resp => {
    window.publish_vm.tags = resp.data.map((tag, i) => {
      return {name: tag, id: i, selected: false};
    });
  })
  .catch(err => {
    alert('获取标签时发生错误：' + err.message);
  });
  
  axiosGet('/posts/getpost', {
    p_id: id,
    type: type[0] + 'e',
  }).then(resp => {
    var post = resp.data.post;
    window.publish_vm.topic = id == -1 ? localStorage.getItem(type + '_draft_topic') : post.topic;
    if (type == 'issues')
      window.publish_vm.brief = id == -1 ? localStorage.getItem('issues_draft_brief') : post.brief;
    window.writer_vm.load(window.publish_vm.post = post.content);
    if (id == -1)
      window.writer_vm.is_draft = window.publish_vm.is_draft = true;
    window.publish_vm.load_note = '';
  }).catch(err => {
    if (err.response) {
      if (err.response.status == 404) {
        if (err.response.data.code == 'NODRAFT') {
          window.writer_vm.load('');
          window.writer_vm.is_draft = window.publish_vm.is_draft = true;
          window.publish_vm.load_note = '';
        }
        else
          alert('内容不存在或者您不是该内容的作者');
      }
      else
        alert("服务器发生问题：" + err.message);
    }
    else
      alert("获取内容时发生错误：" + err.message);
  })

  window.link_vm = new Vue({
    el: '#set-link',
    data: {
      show: false,
      resolve: null,
      reject: null,
      link: ''
    },
    methods: {
      get_link: function () {
        this.link = '';
        this.show = true;
        return new Promise((res, rej) => {
          this.resolve = res;
          this.reject = rej;
        });
      },
      close: function () {
        this.show = false;
        if (this.reject) {
          this.reject();
          this.reject = null;
        }
      },
      set: function () {
        this.show = false;
        if (this.resolve) {
          this.resolve(this.link);
          this.resolve = null;
        }
      }
    }
  });

  window.image_vm = new Vue({
    el: '#insert-image',
    data: {
      show: false,
      resolve: null,
      reject: null,
      src: '',
      image_url: '',
      set_quantity: false,
      quantity: 0,
      file: null,
      canvas: null,
      processing: false,
      size: 100000000
    },
    methods: {
      get_image: function () {
        this.src = '';
        this.show = true;
        return new Promise((res, rej) => {
          this.resolve = res;
          this.reject = rej;
        });
      },
      close: function () {
        if (this.src != '') {
          this.src = '';
          this.processing = false;
          return;
        }
        this.file = null;
        this.canvas = null;
        this.image_url = '';
        this.size = 100000000;
        this.show = false;
        if (this.reject) {
          this.reject();
          this.reject = null;
        }
      },
      set: function () {
        if (this.src != '') {
          this.file = null;
          this.canvas = null;
          this.image_url = '';
          this.size = 100000000;
          this.show = false;
          if (this.resolve) {
            this.resolve({src: this.src, file: this.file});
            this.resolve = null;
          }
          return;
        }
        if (this.file) {
          let reader = new FileReader();
          reader.readAsDataURL(this.file)
          let img = new Image();
          reader.onload = () => {
            if (this.file.size <= 1024 * 1024) {
              this.src = reader.result;
              this.size = this.file.size / 1024;
            }
            else {
              this.processing = true;
              img.onload = () => {
                this.set_quantity = true;
                this.canvas = document.createElement('canvas');
                var context = this.canvas.getContext('2d');
                var w = this.canvas.width = img.width;
                var h = this.canvas.height = img.height;
                context.clearRect(0, 0, w, h);
                context.drawImage(img, 0, 0, w, h);
                this.processing = false;
                if (this.quantity == 100)
                  this.process(100);
                else
                  this.quantity = 100;
              }
              img.src = reader.result;
            }
          };
        }
        else
          this.src = this.image_url;
      },
      process: function (val) {
        if (this.processing) return;
        this.processing = true;
        this.canvas.toBlob(blob => {
          var reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            this.processing = false;
            this.src = reader.result;
            this.size = blob.size / 1024;
            this.file = blob;
            if (this.quantity != val)
              this.process(this.quantity);
          }
        }, 'image/jpeg', val / 100);
      }
    },
    watch: {
      quantity (val) {
        this.process(val);
      }
    }
  });
  window.code_vm = new Vue({
    el: '#set-code',
    data: {
      show: false,
      resolve: null,
      reject: null,
      type: 0,
      code_java: '',
      code_cpp: ''
    },
    methods: {
      get_code: function (code = '', type = 0) {
        (type == 0 ? code_editor_java : code_editor_cpp).getDoc().setValue(code);
        (type == 1 ? code_editor_java : code_editor_cpp).getDoc().setValue('');
        this.type = type;
        this.show = true;
        setTimeout(() => {
          code_editor_cpp.refresh();
          code_editor_java.refresh();
        }, 0);
        return new Promise((res, rej) => {
          this.resolve = res;
          this.reject = rej;
        });
      },
      close: function () {
        this.show = false;
        if (this.reject) {
          this.reject();
          this.reject = null;
        }
      },
      set: function () {
        this.show = false;
        if (this.resolve) {
          this.resolve({code: (this.type == 0 ? code_editor_java : code_editor_cpp).getDoc().getValue(), type: this.type});
          this.resolve = null;
        }
      }
    }
  });
  var code_editor_java = CodeMirror.fromTextArea(document.getElementById('input-code-java'), {
    lineNumbers: true,
    mode: "text/x-c++src"
  });
  var code_editor_cpp = CodeMirror.fromTextArea(document.getElementById('input-code-cpp'), {
    lineNumbers: true,
    mode: "text/x-java"
  });
};