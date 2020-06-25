"use strict";
const indy = require("../../index.js");

exports.request = function(message) {
  return indy.credentials.acceptRequest(message.origin, message.message);
};

exports.access = async function(message) {
  let encryptedMessage = message.message;
  let myDid = await indy.pairwise.getMyDid(message.origin);
  let decryptedMessage = await indy.crypto.authDecrypt(myDid, encryptedMessage);
  indy.store.pendingAccessRequests.write(
    decryptedMessage.endpointDid,
    decryptedMessage.meta
  );
};

exports.acceptOfferAuto = async function(message) {
  await indy.credentials.sendRequest(message.origin, message.message);
};

exports.credential = function(message) {
  return indy.credentials.acceptCredential(message.origin, message.message);
};
