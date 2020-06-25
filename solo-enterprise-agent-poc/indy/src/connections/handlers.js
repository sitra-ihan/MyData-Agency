"use strict";
const indy = require("../../index.js");
const wallet = require("../wallet");

exports.response = function(message) {
  return indy.connections.acceptResponse(message.aud, message.message);
};

exports.acknowledge = function(message) {
  return indy.connections.acceptAcknowledgement(
    message.origin,
    message.message
  );
};

exports.request = async function(message) {
  let oldConnections = await indy.pairwise.getAll();
  let acceptanceFlag = true;
  for (let connection of oldConnections) {
    if (connection.metadata.theirEndpointDid === message.message.endpointDid) {
      acceptanceFlag = false;
      break;
    }
  }

  if (acceptanceFlag) {
    return indy.connections.acceptRequest(
      message.message.endpointDid,
      message.message.did,
      message.message.nonce
    );
  } else {
    console.log(
      "Connection already exist, Agent registered for communication!"
    );
  }
};
