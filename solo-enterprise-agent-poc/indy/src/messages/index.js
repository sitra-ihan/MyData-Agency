"use strict";
const request = require("request-promise");

exports.sendMessage = async function(endpoint, message, DID) {
  console.log(
    "Message for endpoint: " + endpoint + "      with      DID: " + DID
  );
  let requestOptions = {
    uri: `http://${endpoint}/indy`,
    method: "POST",
    body: {
      message: message,
      sub: DID
    },
    json: true
  };
  return request(requestOptions);
};
