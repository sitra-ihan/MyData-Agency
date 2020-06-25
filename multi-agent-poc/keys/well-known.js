const fs = require("fs");
const path = "./.well-known/";
const jwks_path = path + "jwks.json";
const rsa = require("./rsa");
const pemToJWKS = require("./pem-to-jwk").convertPEMtoJWKS;

//Refer: https://tools.ietf.org/html/rfc7517
async function createJWKS() {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

  let key = rsa.RSAKeyPair();
  let JWKS = await pemToJWKS(key.public, "public");

  // jwk.alg = "RSA" + rsa.RSA_BITS;
  fs.writeFileSync(jwks_path, JWKS, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = {
  createJWKS
};
