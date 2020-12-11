exports.log = function (... msg) {
  var date = new Date();
  console.log(`[${date.getMonth()}月${date.getDate()}日${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`, ... msg);
};
exports.error = function (... msg) {
  var date = new Date();
  console.error(`[${date.getMonth()}月${date.getDate()}日${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`, ... msg);
}