const express = require("express");
const router = express.Router();
const ns_service = require("./ns.service");
const services = require("../../../storage/services");
const serviceUtil = require("../../service.utils");
// var zlib = require('zlib');

// routes
router.get("/ns", ns_data_request);

module.exports = router;

async function ns_data_request(req, res, next) {
  let date_from = req.query.date_from;
  let date_to = req.query.date_to;

  try {
    //Make data request
    let service_id = await serviceUtil.get_service_id_from_token(req);
    let result = await services.get_service_by_id(service_id);
    let service = result[0];
    let endpoint = service.endpoint;
    let port = service.port;
    let endpoint_token = service.endpoint_token;
    let counterparty_pubkey = service.identity_holder_key;

    let verfication = await serviceUtil.verify_service_wrt_token(
      req,
      service_id
    );

    if (verfication.response === 200) {
      var url = endpoint;
      if (port !== "") {
        url = url + ":" + port;
      }

      let entries = await ns_service.fetch_entries(
        url,
        date_from,
        date_to,
        endpoint_token,
        0
      );
      let treatments = await ns_service.fetch_treatments(
        url,
        date_from,
        date_to,
        endpoint_token,
        0
      );

      let entries_data = await entries.json();
      let treatments_data = await treatments.json();

      let resp = {
        status: "success",
        from: date_from,
        to: date_to,
        entries: JSON.stringify(entries_data),
        treatments: JSON.stringify(treatments_data)
      };
      res.send(resp);
    } else {
      res.send(verfication);
    }
  } catch (error) {
    res.send({
      status: "error",
      response: error.type
    });
  }
}
