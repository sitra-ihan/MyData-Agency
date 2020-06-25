'use strict';

exports.sleep = function(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms)
    })
};

exports.randomString = function(length) {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}