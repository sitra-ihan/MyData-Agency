var logEvent = function logEvent(message) {
  console.log("\x1b[33m%s\x1b[0m", message);
};

var logResult = function(message) {
  console.log("\x1b[36m%s\x1b[0m", message);
};

var logAction = function logAction(message) {
  console.log("\x1b[35m%s\x1b[0m", message);
};

module.exports = {
  logEvent,
  logResult,
  logAction
};
