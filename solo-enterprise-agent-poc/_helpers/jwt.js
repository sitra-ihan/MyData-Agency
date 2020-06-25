const expressJwt = require('express-jwt');
var blacklist = require('express-jwt-blacklist');
const rsa = require('../keys/rsa');

module.exports = jwt;

function jwt() {
    let key = rsa.RSAKeyBuffer();
    return expressJwt({
        secret: key.public,
        isRevoked: blacklist.isRevoked
    }).unless({
        path: [
            // public routes that don't require authentication
            '/api/authenticate_user',
            '/indy'
        ]
    });
}