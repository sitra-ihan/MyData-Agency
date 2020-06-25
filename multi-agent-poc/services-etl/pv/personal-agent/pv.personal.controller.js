const express = require("express");
const router = express.Router();
const pv_service = require("./pv.service");
const services = require("../../../storage/services");
const serviceUtil = require("../../service.utils");
// var zlib = require('zlib');
// const rsa = require('../../../keys/rsa');

// routes
router.get("/pv/workouts", pv_workouts_request);
router.get("/pv/activities", pv_activities_request);

module.exports = router;

async function pv_workouts_request(req, res, next) {
  let since = new Date(req.query.since);

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
      var workouts_data;
      var workouts = await pv_service.fetch_workouts(
        url,
        since,
        endpoint_token
      );
      if (workouts.status === 401) {
        //renew token and remake call and update new token in storage
        let refresh_token_response = await pv_service.refresh_token(
          refresh_token
        );
        let resp = await refresh_token_response.json();
        let new_endpoint_token = resp.access_token;
        let new_refresh_token = resp.refresh_token;

        console.log("Renewing Suunto Access Token");
        await services.update_service_endpoint_token(
          service_id,
          new_endpoint_token,
          new_refresh_token
        );
        workouts = await pv_service.fetch_workouts(
          url,
          since,
          new_endpoint_token
        );
        workouts_data = await workouts.json();
      } else {
        workouts_data = await workouts.json();
      }
      res.send(workouts_data);
    } else {
      res.send(verfication);
    }
  } catch (error) {
    res.send({
      status: "error",
      response: error
    });
  }
}

async function pv_activities_request(req, res, next) {
  let startDate = new Date(req.query.startDate);
  let endDate = new Date(req.query.endDate);

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

      var activities_data;
      var activities = await pv_service.fetch_daily_activities(
        url,
        startDate,
        endDate,
        endpoint_token
      );
      if (activities.status === 401) {
        //renew token and remake call and update new token in storage
        let refresh_token_response = await pv_service.refresh_token(
          refresh_token
        );
        let resp = await refresh_token_response.json();
        let new_endpoint_token = resp.access_token;
        let new_refresh_token = resp.refresh_token;

        console.log("Renewing Suunto Access Token");
        await services.update_service_endpoint_token(
          service_id,
          new_endpoint_token,
          new_refresh_token
        );
        activities = await pv_service.fetch_daily_activities(
          url,
          startDate,
          endDate,
          new_endpoint_token
        );
        activities_data = await activities.json();
      } else {
        activities_data = await activities.json();
      }
      console.log("Data Length: " + activities_data.length);
      res.send(activities_data);
    } else {
      res.send(verfication);
    }
  } catch (error) {
    res.send({
      status: "error",
      response: error
    });
  }
}
