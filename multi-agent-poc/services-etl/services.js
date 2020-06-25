const express = require("express");
const router = express.Router();
const service_registry = require("../storage/services");
const ns_service = require("./ns/personal-agent/ns.service");
var uuid = require("uuid");

router.post("/register", register);
router.post("/update", update);

module.exports = router;

async function register(req, res, next) {
  let service_id = uuid.v4();
  let service_name = req.body.service_name;
  let endpoint = req.body.endpoint;
  let port = req.body.port;
  let endpoint_token = req.body.endpoint_token;
  let refresh_token = req.body.refresh_token;
  let issued_token = req.headers.authorization.split(" ")[1];
  let cred_def_id = req.body.cred_def_id;

  let url = endpoint;
  if (port !== "") {
    url = endpoint + ":" + port;
  }

  try {
    service_registry.register_service(
      service_id,
      service_name,
      endpoint,
      port,
      endpoint_token,
      refresh_token,
      issued_token,
      cred_def_id,
      "none",
      "none"
    );
    let resp = {
      service_id: service_id
    };
    res.send(resp);
  } catch (error) {
    console.log(error);
    res.send(error);
  }

  // ns_service.validate_api(url, endpoint_token).then(result => {
  //     if (result === true) {
  //         service_registry.register_service(service_id, service_name, endpoint, port, endpoint_token, issued_token, cred_def_id, 'none', 'none');
  //         let resp = {
  //             service_id: service_id
  //         }
  //         res.send(resp);
  //     } else {
  //         res.send({
  //             "status": "invalid-api"
  //         });
  //     }
  // }).catch((err) => {
  //     console.log(err);
  //     res.send(err);
  // });
}

async function update(req, res, next) {
  try {
    await service_registry.update_service_by_id(
      req.body.service_id,
      req.body.endpoint,
      req.body.port,
      req.body.token
    );
    let resp = {
      status: 200,
      response: "Updated"
    };
    res.send(resp);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
}
