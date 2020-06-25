const jose = require("node-jose");

async function convertPEMtoJWKS(data, type) {
  let isPrivate = false;
  if (type === "private") {
    isPrivate = true;
  }
  let JWK = await jose.JWK.asKey(data, "pem");
  let res = await JWK.toJSON(isPrivate);
  JWKS = {
    keys: [res]
  };
  return JSON.stringify(JWKS);
}

async function convertJWKtoPEM(data, type) {
  let isPrivate = false;
  if (type === "private") {
    isPrivate = true;
  }
  let key = await jose.JWK.asKey(data);
  let pem = await key.toPEM(isPrivate);
  return pem;
}

module.exports = {
  convertPEMtoJWKS,
  convertJWKtoPEM
};
