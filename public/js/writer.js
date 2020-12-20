var writer_vm, writer = {};

var images = [];
var codes = [];
var formulas = [];
var movingEl = null;

writer.insert_img = function (e) {
  var range = getRange();
  if (!range) return;
  lineFormat();
  if (range.collapsed) {
    let now = range.startContainer;
    if (now.parentElement.id == 'writer-content' || now.id == 'writer-content') {
      window.image_vm.get_image().then((obj) => {
        obj.id = images.length;
        images.push(obj);
        let el1 = document.createElement('block');
        el1.contentEditable = false;
        let el2 = document.createElement('img');
        el2.src = obj.src;
        el2.id = `img-${obj.id}`;
        el2.addEventListener('click', e => {
          window.pop_vm.open(e.clientX, e.clientY, 0, obj.id);
        });
        el1.appendChild(el2);

        let line = document.createElement('div');
        line.appendChild(el1);
        if (now.id == 'writer-content') {
          let newLine = document.createElement('div');
          newLine.innerHTML = '<br/>';
          now.appendChild(line);
          now.appendChild(newLine);
        }
        else
          now.parentElement.insertBefore(line, now);
        range.setStart(now, 0);
        range.collapse(true);
      });
    }
    else
      alert("请在空行插入图片")
  }
  else
    alert("请不要在选中状态下插入图片")
};
writer.insert_code = function () {
  var range = getRange();
  if (!range) return;
  lineFormat();
  if (range.collapsed) {
    let now = range.startContainer;
    if (now.parentElement.id == 'writer-content' || now.id == 'writer-content') {
      window.code_vm.get_code().then((obj) => {
        obj.id = codes.length;
        codes.push(obj);
        let el1 = document.createElement('block');
        el1.contentEditable = false;

        el1.innerHTML = `<pre class="code-block code-${obj.type == 0 ? 'java' : 'cpp'}" id="code-${obj.id}"><code>${obj.code}</code></pre>`;

        el1.addEventListener('click', e => {
          window.pop_vm.open(e.clientX, e.clientY, 1, obj.id);
        });

        let line = document.createElement('div');
        line.appendChild(el1);
        line.appendChild(document.createElement('br'));
        if (now.id == 'writer-content') {
          let newLine = document.createElement('div');
          newLine.innerHTML = '<br/>';
          now.appendChild(line);
          now.appendChild(newLine);
        }
        else
          now.parentElement.insertBefore(line, now);
        range.setStart(now, 0);
        range.collapse(true);
      });
    }
    else
      alert("请在空行插入代码")
  }
  else
    alert("请不要在选中状态下插入代码")
};
writer.insert_formula = function () {

};
writer.set_bold = function (el) {
  var range = getRange();
  var isStart = false;
  if (!range) return;
  lineFormat();
  if (writer.is_bold) {
    var node = range.commonAncestorContainer;
    if (node.nodeName == '#text') {
      if (node.parentElement.tagName == 'B')
        node.parentElement.outerHTML = node.parentElement.innerHTML;
    }
    else {
      let start = range.startContainer, end = range.endContainer;
      let clearer = item => {
        if (item == start.parentNode || item == start)
          isStart = true;
        if (item == start.parentNode.parentNode)
          Array.prototype.every.call(item.childNodes, clearer);
        if (!isStart) return true;
        if (item == end.parentNode.parentNode) {
          if (item.childNodes.length) {
            start = item.childNodes[0];
            Array.prototype.every.call(item.childNodes, clearer);
          }
          return false;
        }

        if (item.nodeName == '#text') return true;
        if (item.innerHTML.match(/<\/b>/))
          item.innerHTML = item.innerHTML.replace(/<b[^>]*>/, '').replace(/<\/b>/, '');
        if (item.tagName == 'B')
          item.outerHTML = item.innerHTML;

        if (item == end.parentNode || end.endContainer)
          return false;
        return true;
      };
      Array.prototype.every.call(node.childNodes, clearer);
    }
    writer.is_bold = false;
  }
  else {
    if (range.collapsed) return;
    if (range.commonAncestorContainer.id == 'writer-content') {
      alert('无法跨行设置加粗，但可以在设置加粗后在内部换行');
      return;
    }
    if (hasFormat()) {
      alert('无法在设置有格式的文本区域内设置加粗');
      return;
    }
    var b = document.createElement('b');
    range.surroundContents(b);
    writer.is_bold = true;
    range.setStart(b.childNodes[0], 0);
    range.setEnd(b.childNodes[0], b.childNodes[0].nodeValue.length);
  }
};
writer.set_header = function () {
  var range = getRange();
  var isStart = false;
  if (!range) return;
  lineFormat();
  if (writer.is_header) {
    var node = range.commonAncestorContainer;
    if (range.collapsed && node.nodeName == 'DIV' && node.id == 'writer-content' && node.childNodes.length)
      node = node.childNodes[range.startOffset];
    if (node.nodeName == 'H1') {
      node.outerHTML = `<div>${node.innerHTML}</div>`;
      return;
    }
    if (node.nodeName == '#text') {
      if (node.parentElement.tagName == 'H1')
        node.parentElement.outerHTML = `<div>${node.parentElement.innerHTML}</div>`;
    }
    else {
      let start = range.startContainer, end = range.endContainer;
      Array.prototype.every.call(node.childNodes, item => {
        if (item == start.parentNode.parentNode || item == start.parentNode || item == start)
          isStart = true;
        if (!isStart) return true;

        if (item.nodeName == '#text') return true;
        if (item.innerHTML.match(/<\/h1>/))
          item.innerHTML = item.innerHTML.replace(/<h1[^>]*>/, '<div>').replace(/<\/h1>/, '</div>');
        if (item.tagName == 'H1')
          item.outerHTML = `<div>${item.innerHTML}</div>`;

        if (item == end.parentNode.parentNode || item == end.parentNode || item == end)
          return false;
        return true;
      });
    }
    writer.is_header = false;
  }
  else {
    var line = range.commonAncestorContainer;
    if (line.id == 'writer-content') {
      if (range.collapsed) {
        if (line.innerHTML == '') {
          alert('无法将空的第一行设为标题，请先键入内容');
          return;
        }
        line = line.childNodes[range.startOffset];
      }
      else {
        alert('无法跨行设置标题，但可以设置标题后在内部换行');
        return;
      }
    }
    if (line.parentElement.id != 'writer-content')
      line = getLine(line);
    if (line.nodeName == '#text') {
      let wrap = document.createElement('div');
      line.parentElement.insertBefore(wrap, line);
      wrap.appendChild(line);
      line = wrap;
    }
    if (elHasFormat(line)) {
      alert('无法将含格式的文本行设置为标题');
      return;
    }
    line.outerHTML = `<h1>${line.innerHTML}</h1>`;
  }
};
writer.set_link = function () {
  var range = getRange();
  var isStart = false;
  if (!range) return;
  lineFormat();
  if (writer.is_link) {
    var node = range.commonAncestorContainer;
    if (node.nodeName == '#text') {
      if (node.parentElement.tagName == 'A')
        node.parentElement.outerHTML = node.parentElement.innerHTML;
    }
    else {
      let start = range.startContainer, end = range.endContainer;
      let clearer = item => {
        if (item == start.parentNode || item == start)
          isStart = true;
        if (item == start.parentNode.parentNode)
          Array.prototype.every.call(item.childNodes, clearer);
        if (!isStart) return true;
        if (item == end.parentNode.parentNode) {
          if (item.childNodes.length) {
            start = item.childNodes[0];
            Array.prototype.every.call(item.childNodes, clearer);
          }
          return false;
        }

        if (item.nodeName == '#text') return true;
        if (item.innerHTML.match(/<\/a>/))
          item.innerHTML = item.innerHTML.replace(/<a[^>]*>/, '').replace(/<\/a>/, '');
        if (item.tagName == 'A')
          item.outerHTML = item.innerHTML;

        if (item == end.parentNode || end.endContainer)
          return false;
        return true;
      };
      Array.prototype.every.call(node.childNodes, clearer);
    }
    writer.is_link = false;
  }
  else {
    if (range.collapsed) return;
    if (range.commonAncestorContainer.id == 'writer-content') {
      alert('无法设置跨行超链接，但是可以设置超链接后在内部换行');
      return;
    }
    if (hasFormat()) {
      alert('无法在设置有格式的文本区域内设置超链接');
      return;
    }
    window.link_vm.get_link().then(url => {
      var link = document.createElement('a');
      link.href = url;
      range.surroundContents(link);
      link_res = null;
    });
  }
};
writer.get_post = function () {
  var el = document.getElementById('writer-content');
  var doc = el.innerHTML;
  /*var upload_imgs = [];
  Array.prototype.forEach.call(el.getElementsByTagName('img'), img => {
    var id = img.id.split('-');
    if (id.length != 2) return;
    id = parseInt(id[1]);
    if (images[id] && images[id].file) {
      doc = doc.replace(`src="[^"]*" id="img-${id}`, `src="%${upload_imgs}%" id="img-${id}"`);
      upload_imgs.push(images[id].file);
    }
  });*/
  doc = doc.replace(/(src="[^"]")/g, 'lazy-$0');
  return doc;
};
writer.load_post = function (post) {
  document.getElementById('writer-content').innerHTML = post.replace('lazy-', '');
}

function getLine(el) {
  while (el.parentElement.id != 'writer-content')
    el = el.parentElement;
  return el;
}

function lineFormat(format_current) {
  var range = getRange();
  var el = document.getElementById('writer-content');
  if (el.innerHTML == '') return;
  var temp = {start: [range.startContainer, range.startOffset], end: [range.endContainer, range.endOffset]};
  (format_current ? [getLine(range.startContainer)] : el.childNodes).forEach(line => {
    if (line.nodeName == '#text' || (line.tagName != 'DIV' && line.tagName != 'H1')) {
      let wrap = document.createElement('div');
      line.parentElement.insertBefore(wrap, line);
      while (el.childNodes.length != 1 && (el.childNodes[1].tagName || '') != 'DIV')
        wrap.appendChild(el.childNodes[1]);
      line = wrap;
    }
    var last = null;
    var nodelist = line.childNodes;
    for(let i = 0; i < nodelist.length; i++) {
      let node = nodelist[i];
      if (node.nodeName == '#text' || node.tagName == 'SPAN') {
        if (last) {
          if (node == temp.start[0] || (node.nodeName != '#text' && node.childNodes[0] == temp.start[0]))
            temp.start = [last, last.nodeValue.length + temp.start[1]];
          if (node == temp.end[0] || (node.nodeName != '#text' && node.childNodes[0] == temp.end[0]))
            temp.end = [last, last.nodeValue.length + temp.end[1]];
          last.nodeValue += node.nodeValue || node.childNodes[0].nodeValue;
          node.parentNode.removeChild(node);
          i--;
        }
        else {
          if (node.nodeName != '#text') {
            let text = node.childNodes[0];
            node.parentNode.insertBefore(text, node);
            node.parentNode.removeChild(node);
            node = text;
          }
          last = node;
        }
      }
      else {
        if (node.tagName == 'BLOCK') continue;
        if (i && nodelist[i - 1].nodeName != '#text' && nodelist[i - 1].tagName == node.tagName) {
          let last = nodelist[i - 1];
          if (node == temp.start[0] || node.childNodes[0] == temp.start[0])
            temp.start = [last, last.nodeValue.length + temp.start[1]];
          if (node == temp.end[0] || node.childNodes[0] == temp.end[0])
            temp.end = [last, last.nodeValue.length + temp.end[1]];
          last.childNodes[0].nodeValue += node.childNodes[0].nodeValue;
          node.parentNode.removeChild(node);
          i--;
        }
        last = null;
      }
    }
  });
  range.setStart(temp.start[0], temp.start[1]);
  range.setEnd(temp.end[0], temp.end[1]);
}

const hasFormat = () => writer.is_bold || writer.is_link || writer.is_header;
const elHasFormat = el => el.innerHTML.match(/<\/a>|<h1>|<b>/) != null;

writer.is_bold = false;
writer.is_link = false;
writer.is_header = false;


const getRange = function () {
  if (typeof window.getSelection != "undefined") {
    let sel = window.getSelection();
    if (sel.rangeCount > 0) {//选中的区域
      return sel.getRangeAt(0);
    }
    else
      return null;
  }
  else
    alert('您所使用的浏览器不支持该功能，请使用Chrome、火狐、Edge或国内主流浏览器')
  return null;
}

const refresh_status = () => {
  setTimeout(() => {
    var range = getRange();
    if (!range) return;

    if (movingEl) {
      if (range.collapsed) {
        if (range.startContainer.parentElement.id == 'writer-content') {
          range.insertNode(movingEl);
          movingEl.className = '';
          movingEl = null;
          range.collapse(true);
        }
        else
          alert('只能移动至空行位置');
      }
      else
        alert('请不要在选中状态下移动');
    }

    var isStart = false;
    var node = range.commonAncestorContainer;
    if (range.collapsed && node.nodeName == 'DIV' && node.id == 'writer-content' && node.childNodes.length)
      node = node.childNodes[range.startOffset];
    writer.is_bold = false;
    writer.is_link = false;
    writer.is_header = node.nodeName == 'H1';
    if (node.nodeName == '#text') {
      writer.is_bold = node.parentElement.tagName == 'B';
      writer.is_link = node.parentElement.tagName == 'A';
      writer.is_header = node.parentElement.tagName == 'H1';
    }
    else {
      let start = range.startContainer, end = range.endContainer;
      let clearer = item => {
        if (item == start.parentNode || item == start)
          isStart = true;
        if (item == start.parentNode.parentNode)
          Array.prototype.every.call(item.childNodes, clearer);
        if (!isStart) return true;
        if (item == end.parentNode.parentNode) {
          if (item.childNodes.length) {
            start = item.childNodes[0];
            Array.prototype.every.call(item.childNodes, clearer);
          }
          return false;
        }
        if (item == end.parentNode && end.parentNode.nodeName == 'DIV')
          return false;

        if (node.nodeName != '#text') {
          writer.is_bold = writer.is_bold || node.innerHTML.match(/<b>/) || node.tagName == 'B';
          writer.is_link = writer.is_link || node.innerHTML.match(/<\/a>/) || node.tagName == 'A';
          writer.is_header = writer.is_header || node.innerHTML.match(/<h1>/) || node.tagName == 'H1';
        }

        if (item == end.parentNode || end.endContainer)
          return false;
        return true;
      };
      Array.prototype.every.call(node.childNodes, clearer);
    }
  }, 50);
};

const secondly_load =  () => {
  var element = document.getElementById('writer-content');
  element.parentElement.addEventListener('mouseup', refresh_status);
  element.parentElement.addEventListener('keyup', e => {
    if (e.key == 'Delete' || e.key == 'Backspace')
      lineFormat(true);
    if (e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == 'ArrowLeft' || e.key == 'ArrowRight' || e.key == 'Enter' || e.key == 'Backspace' || e.key == 'Delete')
      refresh_status();
  });
  element.parentElement.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key == 'b') {
      e.preventDefault();
      writer.set_bold();
    }
  });
  element.parentElement.addEventListener("paste", function(e) {
    e.stopPropagation();
    e.preventDefault();
    var text = '', event = (e.originalEvent || e);
    if (event.clipboardData && event.clipboardData.getData) {
        text = event.clipboardData.getData('text/plain');
    } else if (window.clipboardData && window.clipboardData.getData) {
        text = window.clipboardData.getData('Text');
    }
    if (document.queryCommandSupported('insertText')) {
        document.execCommand('insertText', false, text);
    } else {
        document.execCommand('paste', false, text);
    }
  });
  window.writer_vm = new Vue({
    el: '#writer',
    data: {
      saving: false,
      publishing: false,
      writer: writer,
      loaded: false
    },
    methods: {
      load: function (content) {
        element.innerHTML = content;
        this.loaded = true;
      },
      save: function () {
        window.publish_vm.save();
      },
      publish: function () {
        window.publish_vm.publish();
      }
    }
  });
  var types = ['img', 'code', 'formula'];
  window.pop_vm = new Vue({
    el: '#block-popper',
    data: {
      controler: null,
      show: false,
      x: 0,
      y: 0,
      type: -1,
      id: -1,
      dir: 'column',
    },
    methods: {
      open: function (mx, my, type, id) {
        if (movingEl) {
          movingEl.className = '';
          movingEl = null;
        }
        this.show = true;
        var w = window.innerWidth;
        this.x = (mx + 50 > w) ? (w - 60) : (mx + 20);
        this.y = (my - 190 < 0) ? (my + 60) : (my - 60);
        this.dir = (my - 190 < 0) ? 'column-reverse' : 'column';
        this.type = type;
        this.id = id;
      },
      edit: function () {
        this.show = false;
        switch (this.type) {
          case 0:
            window.image_vm.get_image().then(obj => {
              document.getElementById(`img-${this.id}`).src = obj.src;
              images[this.id].src = obj.src;
              images[this.id].file = obj.file;
            });
            break;
          case 1:
            window.code_vm.get_code(codes[this.id].code).then(obj => {
              var el = document.getElementById(`code-${this.id}`);
              if (obj.code == '') {
                el.parentElement.parentElement.removeChild(el.parentElement);
                return;
              }
              el.firstElementChild.innerHTML = obj.code;
              el.className = `code-block code-${obj.type == 0 ? 'java' : 'cpp'}`;
              codes[this.id].code = obj.code;
              codes[this.id].type = obj.type;
            });
        }
      },
      remove: function () {
        this.show = false;
        var el = document.getElementById(`${types[this.type]}-${this.id}`).parentElement;
        el.parentElement.removeChild(el);
      },
      cancel: function () {
        this.show = false;
      },
      move: function () {
        this.show = false;
        movingEl = document.getElementById(`${types[this.type]}-${this.id}`).parentElement;
        movingEl.className = 'move-tip';
      }
    }
  })
};