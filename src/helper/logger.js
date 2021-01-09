exports.log = function (... msg) {
  var date = new Date();
  console.log(`[${date.getMonth() + 1}月${date.getDate()}日${zeroPrefix(date.getHours())}:${zeroPrefix(date.getMinutes())}:${zeroPrefix(date.getSeconds())}]`, ... msg);
};
exports.error = function (... msg) {
  var date = new Date();
  console.error(`[${date.getMonth() + 1}月${date.getDate()}日${zeroPrefix(date.getHours())}:${zeroPrefix(date.getMinutes())}:${zeroPrefix(date.getSeconds())}]`, ... msg);
}
const zeroPrefix = num => String(100 + num).substr(1, 2);