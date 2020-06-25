"use strict";
const request = require("request-promise");
const wallet = require("../wallet");

exports.sendMessage = async function(endpoint, message) {
  console.log("Message for endpoint: " + endpoint);
  let requestOptions = {
    uri: `http://${endpoint}/indy`,
    method: "POST",
    body: {
      message: message
    },
    json: true
  };
  return request(requestOptions);
};
