"use strict";
var httpContext = require("express-http-context");
const indy = require("../../index.js");
const rsa = require("../../../keys/rsa");
const services = require("../../../storage/services");
const revoc = require("../revocation");
const authService = require("../../../auth/auth.service");

module.exports = function(config) {
  //factory function creates object and returns it.
  const factory = {};
  const messageHandlerMap = {};

  if (!config) {
    config = {};
  }

  factory.defineHandler = function(messageType, handler) {
    if (!messageType || typeof messageType !== "string") {
      throw Error(
        "Invalid message type: messageType must be a non-empty string"
      );
    }
    if (!handler || typeof handler !== "function") {
      throw Error("Invalid message handler: handler must be a function");
    }
    if (messageHandlerMap.hasOwnProperty(messageType)) {
      throw Error(
        `Duplicate message handler: handler already exists for message type ${messageType}`
      );
    }
    messageHandlerMap[messageType] = handler;
  };

  factory.middleware = async function(req, res) {
    try {
      let buffer = Buffer.from(req.body.message, "base64");
      let walletName = await indy.wallet.getWalletNameByEndpointDid(
        req.body.sub
      );
      httpContext.set("walletName", walletName);
      let decryptedMessage = await indy.crypto.publicKeyAnonDecrypt(buffer);

      //  ********************* Token/Key exchange hack *********************

      let connections = await indy.pairwise.getAll();
      let connection_validity = false;
      for (var i = 0; i < connections.length; i++) {
        let conn = connections[i];
        if (conn.their_did === decryptedMessage.did) {
          connection_validity = true;
          break;
        }
      }

      //  *************** Revocation delta update for issuer ******************
      if (decryptedMessage.type === "REVOCATION") {
        try {
          let encryptedMessage = decryptedMessage.message;
          let myDid = await indy.pairwise.getMyDid(decryptedMessage.origin);
          let revocDeltaData = await indy.crypto.authDecrypt(
            myDid,
            encryptedMessage
          );

          let revRegMeta = revocDeltaData.revRegMeta;
          let revNewDelta = revocDeltaData.revNewDelta;
          let tailsBuffer = revocDeltaData.tailsBuffer;

          //update tail and revDelta
          await revoc.storeTails(
            tailsBuffer,
            revRegMeta.revRegDef.value.tailsLocation
          );
          await revoc.updateRevocationDelta(
            revNewDelta.nonce,
            myDid,
            revNewDelta.revRegDelta
          );
          console.log("Revocation delta updated!");
          res.status(200).send({ status: "success!", response: 200 });
        } catch (error) {
          res.status(400).send({ status: error });
        }
      }
      //  *********************************************************************

      if (decryptedMessage.type === "JWT") {
        try {
          let encryptedMessage = decryptedMessage.message;
          let myDid = await indy.pairwise.getMyDid(decryptedMessage.origin);
          decryptedMessage = await indy.crypto.authDecrypt(
            myDid,
            encryptedMessage
          );

          let authObj = {
            status: "success",
            did: decryptedMessage.sub,
            receiverWalletName: decryptedMessage.receiverWalletName,
            service_id: decryptedMessage.service_id
          };

          let token_response = await authService.authenticate_agent(authObj);
          res.status(202).send(token_response);
        } catch (error) {
          res.status(400).send({ status: error });
        }
      } else if (decryptedMessage.type === "RSA") {
        let service_id = decryptedMessage.service_id;
        if (service_id) {
          let publicKey = rsa.RSAKeyPair().public;
          await services.update_service_publickey(
            service_id,
            decryptedMessage.pub_key
          );
          res.status(202).send({
            service_id: service_id,
            pub_key: publicKey
          });
        } else {
          console.error("Invalid RSA");
          res.status(400).send({ status: "invalid-rsa" });
        }
      }
      // *********************************************************************
      else {
        if (messageHandlerMap[decryptedMessage.type]) {
          let handler = messageHandlerMap[decryptedMessage.type];
          if (handler.length === 2) {
            // number of parameters

            handler(decryptedMessage, function(err) {
              if (err) {
                console.error(err.stack);
                throw err;
              } else {
                res.status(202).send("Accepted");
              }
            });
          } else {
            handler(decryptedMessage)
              .then(data => {
                res.status(202).send("Accepted");
              })
              .catch(err => {
                console.error(err.stack);
                throw err;
              });
          }
        } else {
          indy.store.messages.write(null, decryptedMessage);
          res.status(202).send("Accepted");
        }
      }
    } catch (err) {
      if (err.message === "Invalid Request") {
        res.status(400).send(err.message);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  };

  if (config.defaultHandlers) {
    factory.defineHandler(
      indy.connections.MESSAGE_TYPES.REQUEST,
      indy.connections.handlers.request
    );
    factory.defineHandler(
      indy.connections.MESSAGE_TYPES.RESPONSE,
      indy.connections.handlers.response
    );
    factory.defineHandler(
      indy.connections.MESSAGE_TYPES.ACKNOWLEDGE,
      indy.connections.handlers.acknowledge
    );

    //Cred Offer Auto Acceptance
    factory.defineHandler(
      indy.credentials.MESSAGE_TYPES.OFFER,
      indy.credentials.handlers.acceptOfferAuto
    );
    //--------------------------

    factory.defineHandler(
      indy.credentials.MESSAGE_TYPES.REQUEST,
      indy.credentials.handlers.request
    );
    factory.defineHandler(
      indy.credentials.MESSAGE_TYPES.CREDENTIAL,
      indy.credentials.handlers.credential
    );
    factory.defineHandler(
      indy.credentials.MESSAGE_TYPES.ACCESS,
      indy.credentials.handlers.access
    );

    factory.defineHandler(
      indy.proofs.MESSAGE_TYPES.REQUEST,
      indy.proofs.handlers.request
    );
    factory.defineHandler(
      indy.proofs.MESSAGE_TYPES.PROOF,
      indy.proofs.handlers.proof
    );
  }

  return factory;
};
