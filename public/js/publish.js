window.addEventListener('load', () => {
  $(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
  });

  var publish_vm = new Vue({
    el: '#publish',
    data: {
      can_save: false,
      can_send: false,
      saving: false,
      writer: window.writer
    },
    methods: {
      save: function () {

      },
      publish: function () {

      }
    }
  });

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
});