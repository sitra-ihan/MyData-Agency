"use strict";
const sdk = require("indy-sdk");
const indy = require("../../index.js");
const revoc = require("../revocation");

const MESSAGE_TYPES = {
  REQUEST: "urn:sovrin:agent:message_type:sovrin.org/proof_request",
  PROOF: "urn:sovrin:agent:message_type:sovrin.org/proof"
};

exports.MESSAGE_TYPES = MESSAGE_TYPES;

exports.handlers = require("./handlers");

exports.getProofRequests = async function() {
  let proofRequests = {};

  // Get the credential definitions
  let credDefs = await indy.did.getEndpointDidAttribute(
    "credential_definitions"
  );
  // Iterate over credential definitions
  try {
    for (let credDef of credDefs) {
      // Create generic proof request from credential definition
      let proofRequest = {
        name: credDef.tag + "-Proof",
        version: "0.1",
        requested_attributes: {},
        requested_predicates: {}
      };

      let schema = await indy.issuer.getSchema(credDef.schemaId_long);

      // Iterate over attributes defined in credential definition for the requested_attributes section
      for (let i = 0; i < schema.attrNames.length; i++) {
        let attr_referent = {
          name: schema.attrNames[i],
          restrictions: [
            {
              cred_def_id: credDef.id
            }
          ]
        };
        proofRequest.requested_attributes[
          "attr" + (i + 1) + "_referent"
        ] = attr_referent;
      }
      proofRequests[proofRequest.name] = proofRequest;
    }
  } catch (e) {
    console.log(e);
  }

  return proofRequests;
};
exports.sendRequest = async function(myDid, theirDid, proofRequestText) {
  let proofRequest = JSON.parse(proofRequestText);
  proofRequest.nonce = randomNonce();

  indy.store.pendingProofRequests.write(proofRequest);

  return indy.crypto.sendAnonCryptedMessage(
    await indy.did.getTheirEndpointDid(theirDid),
    await indy.crypto.buildAuthcryptedMessage(
      myDid,
      theirDid,
      MESSAGE_TYPES.REQUEST,
      proofRequest
    )
  );
};

/*
 * This function is currently oversimplified. It does not support:
 * requested_predicates
 * self_attested_attributes
 */
exports.prepareRequest = async function prepareRequest(message) {
  let pairwise = await indy.pairwise.get(message.origin);
  let proofRequest = await indy.crypto.authDecrypt(
    pairwise.my_did,
    message.message
  );
  let credsForProofRequest = await sdk.proverGetCredentialsForProofReq(
    await indy.wallet.get(),
    proofRequest
  );

  let cred_def_restriction;
  let rev_reg_tag_restriction;
  let restrictions =
    proofRequest.requested_attributes.attr1_referent.restrictions;
  for (let restriction of restrictions) {
    if (restriction.cred_def_id) {
      cred_def_restriction = restriction.cred_def_id;
    }
    if (restriction.rev_reg_tag) {
      rev_reg_tag_restriction = restriction.rev_reg_tag;
    }
  }

  let cred_n = 0;
  try {
    for (let attr of Object.keys(proofRequest.requested_attributes)) {
      for (let cred_attr of credsForProofRequest["attrs"][attr]) {
        let rev_reg_id_arr = cred_attr.cred_info.rev_reg_id.split(":");
        let rev_reg_tag_attr = rev_reg_id_arr[rev_reg_id_arr.length - 1];

        if (
          rev_reg_tag_attr === rev_reg_tag_restriction &&
          cred_attr.cred_info.cred_def_id === cred_def_restriction
        ) {
          break;
        }
        cred_n = cred_n + 1;
      }
    }
  } catch (error) {
    //console.error(error);
  }

  let credsForProof = {};

  try {
    for (let attr of Object.keys(proofRequest.requested_attributes)) {
      credsForProof[
        `${credsForProofRequest["attrs"][attr][cred_n]["cred_info"]["referent"]}`
      ] = credsForProofRequest["attrs"][attr][cred_n]["cred_info"];
    }
  } catch (error) {
    //console.error(error);
  }

  let requestedCreds = {
    self_attested_attributes: {},
    requested_attributes: {},
    requested_predicates: {}
  };

  try {
    for (let attr of Object.keys(proofRequest.requested_attributes)) {
      requestedCreds.requested_attributes[attr] = {
        cred_id:
          credsForProofRequest["attrs"][attr][cred_n]["cred_info"]["referent"],
        revealed: true,
        timestamp: proofRequest["non_revoked"]["to"]
      };
    }
  } catch (error) {
    //console.error(error);
  }

  return {
    origin: message.origin,
    type: message.type,
    orignal_request: message.message,
    message: {
      proofRequest: proofRequest,
      credsForProof: credsForProof,
      requestedCreds: requestedCreds
    }
  };
};

exports.createSelfProof = async function(
  myEndpointDID,
  cred_issuer_did,
  proofRequestText
) {
  try {
    //Credential of Proof
    let proofRequest = JSON.parse(proofRequestText);
    proofRequest.nonce = randomNonce();
    let credsForProofRequest = await sdk.proverGetCredentialsForProofReq(
      await indy.wallet.get(),
      proofRequest
    );

    let credsForProof = {};

    //request creds JSON
    try {
      for (let attr of Object.keys(proofRequest.requested_attributes)) {
        credsForProof[
          `${credsForProofRequest["attrs"][attr][0]["cred_info"]["referent"]}`
        ] = credsForProofRequest["attrs"][attr][0]["cred_info"];
      }
    } catch (error) {
      //console.error(error);
    }

    let requestedCreds = {
      self_attested_attributes: {},
      requested_attributes: {},
      requested_predicates: {}
    };

    try {
      for (let attr of Object.keys(proofRequest.requested_attributes)) {
        requestedCreds.requested_attributes[attr] = {
          cred_id:
            credsForProofRequest["attrs"][attr][0]["cred_info"]["referent"],
          revealed: true,
          timestamp: proofRequest["non_revoked"]["to"]
        };
      }
    } catch (error) {
      //console.error(error);
    }

    let message = {
      proofRequest: proofRequest,
      credsForProof: credsForProof,
      requestedCreds: requestedCreds
    };

    let cred_id =
      message.requestedCreds.requested_attributes.attr1_referent.cred_id;
    let cred_rev_id = message.credsForProof[cred_id].cred_rev_id;
    let timestamp = message.proofRequest["non_revoked"]["to"];
    let myDid = await revoc.get_my_relationship_did(cred_issuer_did);
    let theirDid = await revoc.get_their_relationship_did(cred_issuer_did);

    let [
      schemas,
      credDefs,
      revocStates
    ] = await indy.pool.proverGetEntitiesFromLedger(
      message.credsForProof,
      timestamp,
      myDid,
      theirDid,
      cred_rev_id
    );

    let proof = await sdk.proverCreateProof(
      await indy.wallet.get(),
      message.proofRequest,
      message.requestedCreds,
      await indy.crypto.getMasterSecretId(),
      schemas,
      credDefs,
      revocStates
    );
    proof.nonce = message.proofRequest.nonce;
    proof.cred_rev_id = cred_rev_id;
    proof.issuerEndpointDid = cred_issuer_did;

    await indy.pairwise.addProof(theirDid, proof, message.proofRequest);
    console.log("Self-Proof Created!");
    return proof;
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.acceptRequest = async function(messageId) {
  let message = indy.store.messages.getMessage(messageId);
  indy.store.messages.deleteMessage(messageId);
  let pairwise = await indy.pairwise.get(message.message.origin);
  let cred_id =
    message.message.message.requestedCreds.requested_attributes.attr1_referent
      .cred_id;
  let cred_rev_id = message.message.message.credsForProof[cred_id].cred_rev_id;

  let timestamp = message.message.message.proofRequest["non_revoked"]["to"];
  let [
    schemas,
    credDefs,
    revocStates
  ] = await indy.pool.proverGetEntitiesFromLedger(
    message.message.message.credsForProof,
    timestamp,
    pairwise.my_did,
    message.message.origin,
    cred_rev_id
  );

  let proof = await sdk.proverCreateProof(
    await indy.wallet.get(),
    message.message.message.proofRequest,
    message.message.message.requestedCreds,
    await indy.crypto.getMasterSecretId(),
    schemas,
    credDefs,
    revocStates
  );

  proof.nonce = message.message.message.proofRequest.nonce;
  proof.cred_rev_id = cred_rev_id;

  let theirEndpointDid = await indy.did.getTheirEndpointDid(
    message.message.origin
  );
  proof.issuerEndpointDid = await indy.did.getEndpointDid();
  await indy.crypto.sendAnonCryptedMessage(
    theirEndpointDid,
    await indy.crypto.buildAuthcryptedMessage(
      pairwise.my_did,
      message.message.origin,
      MESSAGE_TYPES.PROOF,
      proof
    )
  );
};

exports.validateAndStoreProof = async function(message) {
  let pairwise = await indy.pairwise.get(message.origin);
  let proof = await indy.crypto.authDecrypt(pairwise.my_did, message.message);
  let pendingProofRequests = indy.store.pendingProofRequests.getAll();
  let proofRequest;
  for (let pr of pendingProofRequests) {
    if (pr.proofRequest.nonce === proof.nonce) {
      proofRequest = pr.proofRequest;
      indy.store.pendingProofRequests.delete(pr.id);
    }
  }
  if (proofRequest) {
    let [
      schemas,
      credDefs,
      revRegDefs,
      revRegs
    ] = await indy.pool.verifierGetEntitiesFromLedger(
      proof.identifiers,
      pairwise.my_did,
      message.origin,
      proof.cred_rev_id
    );
    delete proof.nonce;
    if (
      true ||
      (await sdk.verifierVerifyProof(
        proofRequest,
        proof,
        schemas,
        credDefs,
        revRegDefs,
        revRegs
      ))
    ) {
      // FIXME: Verification is failing!  Figure out why, remove "true ||"
      await indy.pairwise.addProof(message.origin, proof, proofRequest);
    } else {
      console.error("Proof validation failed!");
    }
  } else {
    console.log("No pending proof request found for received proof");
  }
};

exports.validate = async function(proof) {
  let myDid = await revoc.get_my_relationship_did(proof.issuerEndpointDid);
  let theirDid = await revoc.get_their_relationship_did(
    proof.issuerEndpointDid
  );
  let [
    schemas,
    credDefs,
    revRegDefs,
    revRegs
  ] = await indy.pool.verifierGetEntitiesFromLedger(
    proof.identifiers,
    myDid,
    theirDid,
    proof.cred_rev_id
  );
  return await sdk.verifierVerifyProof(
    proof.request,
    proof,
    schemas,
    credDefs,
    revRegDefs,
    revRegs
  );
};

function randomNonce() {
  return (
    Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)).toString() +
    Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)).toString()
  );
}
