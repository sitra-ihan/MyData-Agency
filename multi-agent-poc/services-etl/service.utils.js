const rsa = require("../keys/rsa");
const authService = require("../auth/auth.service");

module.exports = {
  get_service_id_from_token,
  verify_service_wrt_token
};

async function get_service_id_from_token(req) {
  let decodedToken = undefined;
  try {
    let token = req.headers["authorization"].split(" ")[1];
    let key = rsa.RSAKeyBuffer();
    decodedToken = authService.verifyToken(token, key.public);
    return decodedToken.serviceId;
  } catch (error) {
    return undefined;
  }
}

async function verify_service_wrt_token(req, service_id) {
  let decodedToken = undefined;
  try {
    let token = req.headers["authorization"].split(" ")[1];
    let key = rsa.RSAKeyBuffer();
    decodedToken = authService.verifyToken(token, key.public);
  } catch (error) {
    //Ignore
  }
  if (decodedToken !== undefined) {
    if (decodedToken.serviceId !== service_id) {
      return {
        status: "invalid-service-id-wrt-token",
        response: 400
      };
    } else {
      return {
        status: "OK",
        response: 200
      };
    }
  } else {
    return {
      status: "invalid-token",
      response: 400
    };
  }
}
