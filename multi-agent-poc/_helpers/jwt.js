const expressJwt = require("express-jwt");
var blacklist = require("express-jwt-blacklist");
const rsa = require("../keys/rsa");
const jswt = require("jsonwebtoken");

module.exports = {
  jwt,
  canAccess
};

const dataAccessRoutes = [
  "/api/data_request/ns",
  "/api/data_request/ok/getUserInfo",
  "/api/data_request/ok/getUserActivities",
  "/api/data_request/ok/getUserExercises",
  "/api/data_request/ok/getUserPhysicals",
  "/api/data_request/pv/workouts",
  "/api/data_request/pv/activities"
];

const serviceRegRoutes = ["/api/service/register"];

function jwt() {
  let key = rsa.RSAKeyBuffer();
  return expressJwt({
    secret: key.public,
    isRevoked: blacklist.isRevoked
  }).unless({
    path: [
      "/indy",
      "/api/create_wallet",
      "/api/open_wallet",
      "/.well-known/jwks.json"
      // "/api/requestHAGAuth" //For testing
      // '/api/create_open_wallet'
    ]
  });
}

function canAccess(req, res, next) {
  checkAuthorization(req, function(err, authorized) {
    if (!authorized) {
      res.send({ message: "Unauthorized", status: 401 });
    } else {
      next();
    }
  });

  function checkAuthorization(req, callback) {
    let decodedToken = undefined;
    try {
      let token = req.headers["authorization"].split(" ")[1];
      let key = rsa.RSAKeyBuffer();

      decodedToken = jswt.verify(token, key.public, {
        algorithms: "RS256"
      });
    } catch (error) {
      //Ignore
    }

    if (decodedToken !== undefined) {
      switch (decodedToken.accessType) {
        case "auth": {
          callback("authorized", true);
          break;
        }
        case "data": {
          if (dataAccessRoutes.includes(req.path)) {
            callback("authorized", true);
          } else {
            callback("authorized", false);
          }
          break;
        }
        case "service": {
          if (serviceRegRoutes.includes(req.path)) {
            callback("authorized", true);
          } else {
            callback("authorized", false);
          }
          break;
        }
        default: {
          callback("authorized", false);
          break;
        }
      }
    } else {
      //Security handled in next steps by jwt auth
      callback("authorized", true);
    }
  }
}
