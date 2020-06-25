require("rootpath")();
var httpContext = require("express-http-context");
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("./_helpers/jwt");
const path = require("path");
const errorHandler = require("./_helpers/error-handler");
const apiRouter = require("./api");
const indy = require("./indy");
const config = require("./config");
const indyHandler = require("./indy/src/handler")({
  defaultHandlers: true,
  eventHandlers: []
});
const authService = require("./auth/auth.service");
const rsa = require("./keys/rsa");
const accessType = require("./_helpers/accessTypes");

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use(cors());

app.use(httpContext.middleware);

//Securing JWT unauthorize access for data access token
app.use(jwt.canAccess);

//***************** Multi-Wallet Request Handling **********************
app.use((req, res, next) => {
  let decodedToken = undefined;
  try {
    let token = req.headers["authorization"].split(" ")[1];
    let key = rsa.RSAKeyBuffer();
    decodedToken = authService.verifyToken(token, key.public);
  } catch (error) {
    //Ignore
  }
  if (decodedToken !== undefined) {
    var DID = decodedToken.sub;
    indy.wallet
      .getWalletNameByEndpointDid(DID) //Resolving walletName by DID
      .then(function(walletName) {
        if (walletName) {
          httpContext.set("walletName", walletName);
          next();
        } else {
          res.status(400).send({
            status: "Wallet vault error! contact administrator for support."
          });
        }
      });
  } else {
    next();
  }
});
//******************************************************************

// use JWT auth to secure the api
app.use(jwt.jwt());

// api routes
app.use("/api", require("./auth/auth.controller"));

// NS data plugin
app.use(
  "/api/data_request/",
  require("./services-etl/ns/personal-agent/ns.personal.controller")
);
// PV data plugin
app.use(
  "/api/data_request/",
  require("./services-etl/pv/personal-agent/pv.personal.controller")
);
// OK data plugin
app.use(
  "/api/data_request/",
  require("./services-etl/ok/personal-agent/ok.personal.controller")
);

app.use("/api", apiRouter);
app.use("/api/service/", require("./services-etl/services"));
app.post("/indy", indyHandler.middleware);

//Serve RSA jwks.json
//Refer: https://auth0.com/docs/tokens/concepts/jwks
app.get("/.well-known/jwks.json", (req, res) => {
  res.sendFile(path.join(__dirname + "/.well-known/jwks.json"));
});

// global error handler
app.use(errorHandler);

// start server
const port = parseInt(config.port);

indy
  .setupAgent()
  .then(() => {
    app.listen(port, function() {
      console.log("Server listening on port " + port);
    });
  })
  .catch(e => {
    console.error(e);
  });
