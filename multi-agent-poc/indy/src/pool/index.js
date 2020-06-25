"use strict";
const sdk = require("indy-sdk");
const indy = require("../../index.js");
const config = require("../../../config");
const util = require("../../util");
const revoc = require("../revocation");
let pool;

exports.get = async function() {
  if (!pool) {
    await exports.setup();
  }
  return pool;
};

exports.setup = async function() {
  // see PlenumProtocolVersion or indy-plenum.common.constans.CURRENT_PROTOCOL_VERSION
  console.log("Opening Pool for Agency");
  await sdk.setProtocolVersion(2);
  pool = await createAndOpenPoolHandle(config.poolName);
};

async function createAndOpenPoolHandle(actor) {
  const poolName = actor; //+ "-pool-sandbox"
  const poolGenesisTxnPath = await util.getPoolGenesisTxnPath(poolName);
  const poolConfig = { genesis_txn: poolGenesisTxnPath };
  await sdk.createPoolLedgerConfig(poolName, poolConfig).catch(e => {});
  return await sdk.openPoolLedger(poolName, poolConfig);
}

exports.getBlobStorageReaderHandle = async function() {
  const tailsWriterConfig = {
    base_dir: util.getPathToIndyClientHome() + "/tails",
    uri_pattern: ""
  };
  return await sdk.openBlobStorageReader("default", tailsWriterConfig);
};

exports.setEndpointForDid = async function(did, endpoint) {
  let attributeRequest = await sdk.buildAttribRequest(
    await indy.did.getEndpointDid(),
    did,
    null,
    {
      endpoint: {
        ha: endpoint
      }
    },
    null
  );
  let resp = await sdk.signAndSubmitRequest(
    await indy.pool.get(),
    await indy.wallet.get(),
    await indy.did.getEndpointDid(),
    attributeRequest
  );
};

exports.getEndpointForDid = async function(did) {
  let getAttrRequest = await sdk.buildGetAttribRequest(
    await indy.did.getEndpointDid(),
    did,
    "endpoint",
    null,
    null
  );
  let res = await waitUntilApplied(
    pool,
    getAttrRequest,
    data => data["result"]["data"] != null
  );
  return JSON.parse(res.result.data).endpoint.ha;
};

exports.proverGetEntitiesFromLedger = async function(
  identifiers,
  timestamp,
  myDid,
  theirDid,
  cred_rev_id
) {
  let schemas = {};
  let credDefs = {};
  let revStates = {};

  for (let referent of Object.keys(identifiers)) {
    let item = identifiers[referent];
    let receivedSchema = await indy.issuer.getSchema(item["schema_id"]);
    schemas[receivedSchema.id] = receivedSchema;

    let [receivedCredDefId, receivedCredDef] = await indy.issuer.getCredDef(
      await indy.pool.get(),
      await indy.did.getEndpointDid(),
      item["cred_def_id"]
    );
    credDefs[receivedCredDefId] = receivedCredDef;

    let revRegMeta = await revoc.getRevRegByRevRegId(myDid, item.rev_reg_id);
    let revDeltaMeta = await revoc.getRevDelta(
      myDid,
      theirDid,
      receivedCredDefId,
      cred_rev_id,
      item.rev_reg_id
    );

    let revState = await revoc.proverCreateRevocationState(
      revRegMeta.revRegDef,
      revDeltaMeta.revRegDelta,
      timestamp,
      revDeltaMeta.revId
    );
    revStates[revRegMeta.revRegId] = {};
    revStates[revRegMeta.revRegId][timestamp] = revState;
  }

  return [schemas, credDefs, revStates];
};

exports.verifierGetEntitiesFromLedger = async function(
  identifiers,
  myDid,
  theirDid,
  cred_rev_id
) {
  let schemas = {};
  let credDefs = {};
  let revRegDefs = {};
  let revRegs = {};

  for (let referent of Object.keys(identifiers)) {
    let item = identifiers[referent];
    let receivedSchema = await indy.issuer.getSchema(item["schema_id"]);
    schemas[receivedSchema.id] = receivedSchema;

    let [receivedCredDefId, receivedCredDef] = await indy.issuer.getCredDef(
      await indy.pool.get(),
      await indy.did.getEndpointDid(),
      item["cred_def_id"]
    );
    credDefs[receivedCredDefId] = receivedCredDef;

    let revRegMeta = await revoc.getRevRegByRevRegId(myDid, item.rev_reg_id);
    let revDeltaMeta = await revoc.getRevDelta(
      myDid,
      theirDid,
      receivedCredDefId,
      cred_rev_id,
      item.rev_reg_id
    );

    revRegDefs[item.rev_reg_id] = revRegMeta.revRegDef;
    revRegs[item.rev_reg_id] = {};
    revRegs[item.rev_reg_id][item.timestamp] = revDeltaMeta.revRegDelta;
  }
  return [schemas, credDefs, revRegDefs, revRegs];
};

exports.sendNym = async function(
  poolHandle,
  walletHandle,
  Did,
  newDid,
  newKey,
  role
) {
  let nymRequest = await sdk.buildNymRequest(Did, newDid, newKey, null, role);
  await sdk.signAndSubmitRequest(poolHandle, walletHandle, Did, nymRequest);
};

async function waitUntilApplied(ph, req, cond) {
  for (let i = 0; i < 3; i++) {
    let res = await sdk.submitRequest(ph, req);
    if (cond(res)) {
      return res;
    }

    await indy.utils.sleep(5 * 1000);
  }
}
