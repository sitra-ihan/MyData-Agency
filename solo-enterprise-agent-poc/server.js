require("rootpath")();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("./_helpers/jwt");
const errorHandler = require("./_helpers/error-handler");
const apiRouter = require("./api");
const indy = require("./indy");
const config = require("./config");
const indyHandler = require("./indy/src/handler")({
  defaultHandlers: true,
  eventHandlers: []
});

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use("/api", require("./auth/auth.controller"));

//NS CONSENT DAEMON
const consent_daemon = require("./services-etl/ns/enterprise-agent/ns.enterprise.controller");
app.use(consent_daemon);

app.use("/api", apiRouter);
app.use("/api/service/", require("./services-etl/services"));
app.post("/indy", indyHandler.middleware);

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
