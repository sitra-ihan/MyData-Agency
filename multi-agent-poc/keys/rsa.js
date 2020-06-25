const NodeRSA = require("node-rsa");
const config = require("../config");
const fs = require("fs");
const homedir = require("home-dir");
const RSA_BITS = 256;

module.exports = {
  RSAKeyPair,
  RSAKeyBuffer,
  encryptMessage,
  encryptMessageWithExtrnalKey,
  decryptMessage,
  RSA_BITS
};

const path = homedir("/.indy_client/");
const public_key_path = path + config.agentType + "_public.key";
const private_key_path = path + config.agentType + "_private.key";

function RSAKeyPair() {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    if (!fs.existsSync(public_key_path) && !fs.existsSync(private_key_path)) {
      let key = new NodeRSA({
        b: RSA_BITS
      });
      key.generateKeyPair();
      let keypair = {};

      keypair.public = key.exportKey("pkcs8-public-pem");
      keypair.private = key.exportKey("pkcs1-private-pem");

      fs.writeFileSync(public_key_path, keypair.public, function(err) {
        if (err) {
          return console.log(err);
        }
      });

      fs.writeFileSync(private_key_path, keypair.private, function(err) {
        if (err) {
          return console.log(err);
        }
      });

      return keypair;
    } else {
      let keypair = {};
      keypair.public = fs.readFileSync(public_key_path, "utf-8");
      keypair.private = fs.readFileSync(private_key_path, "utf-8");
      return keypair;
    }
  } catch (err) {
    console.error(err);
  }
}

function encryptMessage(message) {
  if (fs.existsSync(public_key_path) && fs.existsSync(private_key_path)) {
    var keyData = fs.readFileSync(public_key_path, "utf-8");
    var key = new NodeRSA(keyData);
    return key.encrypt(message, "base64");
  } else {
    let keypair = RSAKeyPair();
    var key = new NodeRSA(keypair.public);
    return key.encrypt(message, "base64");
  }
}

function encryptMessageWithExtrnalKey(message, pubKey) {
  var key = new NodeRSA(pubKey);
  return key.encrypt(message, "base64");
}

function decryptMessage(message) {
  if (fs.existsSync(public_key_path) && fs.existsSync(private_key_path)) {
    var keyData = fs.readFileSync(private_key_path, "utf-8");
    var key = new NodeRSA(keyData);
    return key.decrypt(message, "utf8");
  } else {
    let keypair = RSAKeyPair();
    var key = new NodeRSA(keypair.private);
    return key.decrypt(message, "base64");
  }
}

function RSAKeyBuffer() {
  let keypair = {};
  keypair.public = fs.readFileSync(public_key_path);
  keypair.private = fs.readFileSync(private_key_path);
  return keypair;
}
