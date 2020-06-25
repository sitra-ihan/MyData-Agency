const express = require("express");
const router = express.Router();
const ok_service = require("./ok.service");
const services = require("../../../storage/services");
const serviceUtil = require("../../service.utils");
// var zlib = require('zlib');
// const rsa = require('../../../keys/rsa');

// routes
router.get("/ok/getUserInfo", ok_get_userinfo);
router.get("/ok/getUserExercises", ok_get_user_exercises);
router.get("/ok/getUserActivities", ok_get_user_activities);
router.get("/ok/getUserPhysicals", ok_get_user_physicals);

module.exports = router;

async function ok_get_userinfo(req, res, next) {
  let polar_user_id = req.query.polar_user_id;

  try {
    //Make data request
    let service_id = await serviceUtil.get_service_id_from_token(req);
    let result = await services.get_service_by_id(service_id);
    let service = result[0];
    let endpoint = service.endpoint;
    let port = service.port;
    let endpoint_token = service.endpoint_token;
    let refresh_token = service.refresh_token;
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
      var user_data = await ok_service.getUserInformation(
        url,
        endpoint_token,
        polar_user_id
      );
      res.send(user_data);
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

async function ok_get_user_exercises(req, res, next) {
  let polar_user_id = req.query.polar_user_id;

  try {
    //Make data request
    let service_id = await serviceUtil.get_service_id_from_token(req);
    let result = await services.get_service_by_id(service_id);
    let service = result[0];
    let endpoint = service.endpoint;
    let port = service.port;
    let endpoint_token = service.endpoint_token;
    let refresh_token = service.refresh_token;
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
      var user_data = await ok_service.getUserExercises(
        url,
        endpoint_token,
        polar_user_id
      );
      res.send(user_data);
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

async function ok_get_user_activities(req, res, next) {
  let polar_user_id = req.query.polar_user_id;

  try {
    //Make data request
    let service_id = await serviceUtil.get_service_id_from_token(req);
    let result = await services.get_service_by_id(service_id);
    let service = result[0];
    let endpoint = service.endpoint;
    let port = service.port;
    let endpoint_token = service.endpoint_token;
    let refresh_token = service.refresh_token;
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
      var user_data = await ok_service.getUserActivities(
        url,
        endpoint_token,
        polar_user_id
      );
      res.send(user_data);
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

async function ok_get_user_physicals(req, res, next) {
  let polar_user_id = req.query.polar_user_id;

  try {
    //Make data request
    let service_id = await serviceUtil.get_service_id_from_token(req);
    let result = await services.get_service_by_id(service_id);
    let service = result[0];
    let endpoint = service.endpoint;
    let port = service.port;
    let endpoint_token = service.endpoint_token;
    let refresh_token = service.refresh_token;
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
      var user_data = await ok_service.getUserPhysicals(
        url,
        endpoint_token,
        polar_user_id
      );
      res.send(user_data);
    } else {
      // console.log(verfication);
      res.send(verfication);
    }
  } catch (error) {
    res.send({
      status: "error",
      response: error.type
    });
  }
}
