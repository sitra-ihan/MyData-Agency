"use strict";
const sdk = require("indy-sdk");
const indy = require("../../index.js");
const fs = require("fs");
const util = require("../../util");

const BASE = JSON.stringify({ CredRevocMeta: [] });
const BASE2 = JSON.stringify({ CredRevocDeltaMeta: [] });

(exports.revokeCredential = async function(
  issuerWallet,
  revRegDefId,
  credRevId
) {
  let blobStorageReaderHandle = await exports.getBlobStorageReaderHandle();
  let revRegDeltaAfterRevocation = await sdk.issuerRevokeCredential(
    issuerWallet,
    blobStorageReaderHandle,
    revRegDefId,
    credRevId
  );
  return revRegDeltaAfterRevocation;
}),
  (exports.createRevocationState = async function(
    revRegDef,
    revRegDelta,
    timestamp,
    revId
  ) {
    let blobStorageReaderHandle = exports.getBlobStorageReaderHandle();
    let revState = await sdk.createRevocationState(
      blobStorageReaderHandle,
      revRegDef,
      revRegDelta,
      timestamp,
      revId
    );
    return revState;
  }),
  (exports.issuerCreateRevocationRegistry = async function(
    issuerWallet,
    issuerDid,
    credDefId,
    revocRegTag
  ) {
    const tailsWriterConfig = {
      base_dir: util.getPathToIndyClientHome() + "/tails",
      uri_pattern: ""
    };
    const tailsWriter = await sdk.openBlobStorageWriter(
      "default",
      tailsWriterConfig
    );
    const rvocRegDefTag = revocRegTag;
    const rvocRegDefConfig = {
      max_cred_num: 5,
      issuance_type: "ISSUANCE_ON_DEMAND"
    };
    const [revRegId, revRegDef, _] = await sdk.issuerCreateAndStoreRevocReg(
      issuerWallet,
      issuerDid,
      undefined,
      rvocRegDefTag,
      credDefId,
      rvocRegDefConfig,
      tailsWriter
    );
    return [revRegId, revRegDef];
  }),
  (exports.getBlobStorageReaderHandle = async function() {
    const tailsWriterConfig = {
      base_dir: util.getPathToIndyClientHome() + "/tails",
      uri_pattern: ""
    };
    return await sdk.openBlobStorageReader("default", tailsWriterConfig);
  }),
  (exports.proverCreateRevocationState = async function(
    revRegDef,
    revRegDelta,
    timestamp,
    revId
  ) {
    let blobStorageReaderHandle = await exports.getBlobStorageReaderHandle();
    let revState = await sdk.createRevocationState(
      blobStorageReaderHandle,
      revRegDef,
      revRegDelta,
      timestamp,
      revId
    );
    return revState;
  }),
  (exports.initRevocDir = async function() {
    let dir = util.getPathToIndyClientHome() + "/revoc";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }),
  (exports.initTailsDir = async function() {
    let dir = util.getPathToIndyClientHome() + "/tails";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }),
  (exports.storeTails = async function(tails, path) {
    exports.initTailsDir();
    path = path + "_new";
    if (!fs.existsSync(path)) {
      let tailsBuffer = new Buffer(tails.data);
      fs.writeFileSync(path, tailsBuffer);
    }
  }),
  (exports.storeRevReg = async function(myDid, issuerDid, revMeta, nonce) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_reg.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));

    if (nonce === undefined) {
      nonce = exports.generateNonce();
    }

    //DONT DUPLICATE
    let flag = true;
    for (var i = 0; i < revStore.CredRevocMeta.length; i++) {
      var revocMeta = revStore.CredRevocMeta[i];
      if (
        revocMeta.revRegDef.id === revMeta.revRegDef.id &&
        revocMeta.revRegDef.value.tailsHash ===
          revMeta.revRegDef.value.tailsHash
      ) {
        flag = false;
      }
    }

    if (flag) {
      revStore.CredRevocMeta.push({
        nonce: nonce,
        issuerDid: issuerDid,
        myDid: myDid,
        revRegId: revMeta.revRegId,
        revRegDef: revMeta.revRegDef,
        credDefId: revMeta.credDefId,
        timestamp: new Date()
      });

      fs.writeFileSync(PATH, JSON.stringify(revStore));
    }
  }),
  (exports.storeRevDelta = async function(myDid, theirDid, revMeta, nonce) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;

    if (nonce === undefined) {
      nonce = exports.generateNonce();
    }

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));

    let revDeltaObj = {
      nonce: nonce,
      myDid: myDid,
      theirDid: theirDid,
      credDefId: revMeta.credDefId,
      credential: revMeta.cred,
      revId: revMeta.revId,
      revRegDelta: revMeta.revRegDelta,
      timestamp: new Date()
    };

    revStore.CredRevocDeltaMeta.push(revDeltaObj);

    fs.writeFileSync(PATH, JSON.stringify(revStore));
    return revDeltaObj;
  }),
  (exports.getRevReg = async function(myDid, credDefId, revRegTag) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_reg.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocMeta.length; i++) {
      var revocMeta = revStore.CredRevocMeta[i];
      if (
        revocMeta.revRegDef.tag === revRegTag &&
        revocMeta.credDefId === credDefId &&
        revocMeta.myDid === myDid
      ) {
        return revocMeta;
      }
    }

    return undefined;
  }),
  (exports.getRevRegByRevRegId = async function(myDid, revRegId) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_reg.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocMeta.length; i++) {
      var revocMeta = revStore.CredRevocMeta[i];
      if (revocMeta.revRegId === revRegId) {
        return revocMeta;
      }
    }
    return undefined;
  }),
  (exports.getRevDelta = async function(
    myDid,
    theirDid,
    credDefId,
    cred_rev_id,
    rev_reg_id
  ) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;
    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocDeltaMeta.length; i++) {
      var revocMeta = revStore.CredRevocDeltaMeta[i];
      if (
        revocMeta.credential.rev_reg_id === rev_reg_id &&
        revocMeta.credDefId === credDefId &&
        revocMeta.myDid === myDid &&
        revocMeta.theirDid === theirDid &&
        revocMeta.revId === cred_rev_id
      ) {
        return revocMeta;
      }
    }

    return undefined;
  }),
  (exports.getRevDeltaByNonce = async function(nonce, myDid) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocDeltaMeta.length; i++) {
      var revocMeta = revStore.CredRevocDeltaMeta[i];
      if (revocMeta.nonce === nonce) {
        return revocMeta;
      }
    }

    return undefined;
  }),
  (exports.getRevDeltaByServiceId = async function(serviceId, myDid) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocDeltaMeta.length; i++) {
      var revocMeta = revStore.CredRevocDeltaMeta[i];
      if (revocMeta.credential.values.service_id.raw === serviceId) {
        return revocMeta;
      }
    }

    return undefined;
  }),
  (exports.getRevDeltaByrevocRegId = async function(revocRegId, myDid) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocDeltaMeta.length; i++) {
      var revocMeta = revStore.CredRevocDeltaMeta[i];
      if (revocMeta.credential.rev_reg_id === revocRegId) {
        return revocMeta;
      }
    }

    return undefined;
  }),
  (exports.getAllRevDeltas = async function(prover_did) {
    let myDid = await exports.get_my_relationship_did(prover_did);
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    return revStore;
  }),
  (exports.getAllAccessCredsFromRevDeltas = async function(
    all_relationships_list
  ) {
    try {
      let accessCredentials = [];
      for (let relationship of all_relationships_list) {
        let PATH =
          util.getPathToIndyClientHome() +
          "/revoc/" +
          relationship.my_relationship_did +
          "_rev_delta.json";

        if (!fs.existsSync(PATH)) {
          fs.writeFileSync(PATH, BASE2);
        }
        let revStore = JSON.parse(fs.readFileSync(PATH));
        for (var i = 0; i < revStore.CredRevocDeltaMeta.length; i++) {
          var revocMeta = revStore.CredRevocDeltaMeta[i];
          if (revocMeta.credential.values.type.raw === "access") {
            let isRevoked = undefined;
            if (revocMeta.revRegDelta.value.issued !== undefined) {
              isRevoked = false;
            }
            if (revocMeta.revRegDelta.value.revoked !== undefined) {
              isRevoked = true;
            }
            let cred = {
              issued_to_did: relationship.their_public_did,
              issued_to_name: relationship.their_name,
              cred_def_id: revocMeta.credDefId,
              rev_reg_id: revocMeta.credential.rev_reg_id,
              service_id: revocMeta.credential.values.service_id.raw,
              type: revocMeta.credential.values.type.raw,
              expiration: revocMeta.credential.values.expiration.raw,
              revoked: isRevoked
            };
            accessCredentials.push(cred);
          }
        }
      }
      return accessCredentials;
    } catch (error) {
      return [];
    }
  }),
  (exports.updateRevocationDelta = async function(nonce, myDid, newRevDelta) {
    exports.initRevocDir();
    let PATH =
      util.getPathToIndyClientHome() + "/revoc/" + myDid + "_rev_delta.json";
    let revStore;

    if (!fs.existsSync(PATH)) {
      fs.writeFileSync(PATH, BASE2);
    }
    revStore = JSON.parse(fs.readFileSync(PATH));
    for (var i = 0; i < revStore.CredRevocDeltaMeta.length; i++) {
      var revocMeta = revStore.CredRevocDeltaMeta[i];
      if (revocMeta.nonce === nonce) {
        revStore.CredRevocDeltaMeta[i]["revRegDelta"] = newRevDelta;
        fs.writeFileSync(PATH, JSON.stringify(revStore));
        return revStore.CredRevocDeltaMeta[i];
      }
    }

    return undefined;
  }),
  (exports.get_my_relationship_did = async function get_my_relationship_did(
    their_public_did
  ) {
    try {
      let pairwise_list = await indy.pairwise.getAll();
      for (let i = 0; i < pairwise_list.length; i++) {
        if (pairwise_list[i].metadata.theirEndpointDid === their_public_did) {
          return pairwise_list[i].my_did;
        }
      }
      return undefined;
    } catch (error) {
      console.error(error);
      return error;
    }
  }),
  (exports.get_their_relationship_did = async function get_their_relationship_did(
    their_public_did
  ) {
    try {
      let pairwise_list = await indy.pairwise.getAll();
      for (let i = 0; i < pairwise_list.length; i++) {
        if (pairwise_list[i].metadata.theirEndpointDid === their_public_did) {
          return pairwise_list[i].their_did;
        }
      }
      return undefined;
    } catch (error) {
      console.error(error);
      return error;
    }
  });

exports.generateNonce = function generateNonce() {
  return (
    Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)).toString() +
    Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)).toString()
  );
};
