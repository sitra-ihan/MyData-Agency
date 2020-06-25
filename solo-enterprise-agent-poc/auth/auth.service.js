// const user_config = require("../config");
const jwt = require("jsonwebtoken");
var blacklist = require("express-jwt-blacklist");
var store = require("../storage/users");
// var store_service = require("../storage/services");
const rsa = require("../keys/rsa");
const expires_in = "12h";
const accessType = require("../_helpers/accessTypes");

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
  authenticate_user,
  update_password
};

function issueToken(payload) {
  let key = rsa.RSAKeyBuffer();
  return jwt.sign(payload, key.private, {
    algorithm: "RS256",
    expiresIn: expires_in
  });
}

async function verifyToken(token, publicKey) {
  return jwt.verify(token, publicKey, {
    algorithms: "RS256"
  });
}

async function revokeToken(req, res) {
  blacklist.revoke(req.user);
  return {
    status: "revoked"
  };
}

async function authenticate_user({ username, password }) {
  return store.validate_user(username, password).then(user => {
    let token_type = "Bearer";
    if (user.user_id !== undefined) {
      const token = issueToken({
        sub: user.user_id,
        accessType: accessType.AUTH
      });
      user.token = token;
      return {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        access_token: user.token,
        token_type: token_type,
        expires_in: expires_in
      };
    } else {
      return {
        status: "invalid username or password"
      };
    }
  });
}

// TODO: dynamic password for wallets and api access
async function update_password({ username, oldPassword, newPassword }) {
  return store.validate_user(username, oldPassword, newPassword).then(user => {
    if (user.user_id !== undefined) {
      let encryptedPassword = rsa.encryptMessage(newPassword);
      let response = store.update_password(username, encryptedPassword);
      if (response !== undefined) {
        return { status: "updated" };
      } else {
        return { status: "Error!" };
      }
    } else {
      return {
        status: "invalid username or password"
      };
    }
  });
}
