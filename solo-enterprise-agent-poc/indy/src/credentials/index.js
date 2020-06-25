"use strict";
const sdk = require("indy-sdk");
const indy = require("../../index.js");
const revoc = require("../revocation");
var fs = require("fs");
const proof = require("../../../consent-api/proof");
const hook_urls = require("../../../services-etl/hook.const");
const webhook = require("../../../services-etl/webhook");
const revocLedgerOps = require("../revocation/ledgerops");

const MESSAGE_TYPES = {
  OFFER: "urn:sovrin:agent:message_type:sovrin.org/credential_offer",
  ACCESS: "urn:sovrin:agent:message_type:sovrin.org/access_request",
  REQUEST: "urn:sovrin:agent:message_type:sovrin.org/credential_request",
  CREDENTIAL: "urn:sovrin:agent:message_type:sovrin.org/credential"
};
exports.MESSAGE_TYPES = MESSAGE_TYPES;

exports.handlers = require("./handlers");

exports.getAll = async function() {
  return await sdk.proverGetCredentials(await indy.wallet.get(), {});
};

exports.getCredById = async function(credId) {
  return await sdk.proverGetCredential(await indy.wallet.get(), credId);
};

exports.getAllCredDeltas = async function(prover_did) {
  return await revoc.getAllRevDeltas(prover_did);
};

exports.revokeCredential = async function(
  proverEndpointDid,
  credDefId,
  credDeltaNonce
) {
  let myDid = await revoc.get_my_relationship_did(proverEndpointDid);
  let credDeltaMeta = await revoc.getRevDeltaByNonce(credDeltaNonce, myDid);
  let revRegId = credDeltaMeta.credential.rev_reg_id;
  let revRegMeta = await revoc.getRevRegByRevRegId(myDid, revRegId);

  let revRegDeltaAfterRevocation = await revoc.revokeCredential(
    await indy.wallet.get(),
    revRegMeta.revRegId,
    credDeltaMeta.revId
  );
  let revNewDelta = await revoc.updateRevocationDelta(
    credDeltaNonce,
    myDid,
    revRegDeltaAfterRevocation
  );

  if (revNewDelta === undefined) {
    return {
      status: "error"
    };
  } else {
    return {
      status: "revoked"
    };
  }

  //TODO: PROPAGATE REVOCATION DELTA OTHER AGENT (NOT NEEDED IN CURRENT USE-CASE;
};

exports.createRevocRegistry = async function(
  myDid,
  issuerDid,
  credentialDefinitionId,
  revocRegTag,
  nonce
) {
  let [revRegId, revRegDef] = await revoc.issuerCreateRevocationRegistry(
    await indy.pool.get(),
    await indy.wallet.get(),
    myDid,
    credentialDefinitionId,
    revocRegTag
  );
  await revoc.storeRevReg(
    myDid,
    issuerDid,
    {
      credDefId: credentialDefinitionId,
      revRegId: revRegId,
      revRegDef: revRegDef
    },
    nonce
  );
};

exports.sendOffer = async function(
  theirDid,
  credentialDefinitionId,
  credentialData,
  revocRegTag
) {
  if (theirDid === "_self_") {
    return issueCredentialToSelf(credentialDefinitionId, credentialData);
  } else {
    let pairwise = await sdk.getPairwise(await indy.wallet.get(), theirDid);
    let myDid = pairwise.my_did;
    await exports.createRevocRegistry(
      myDid,
      myDid,
      credentialDefinitionId,
      revocRegTag,
      undefined
    );

    let credOffer = await sdk.issuerCreateCredentialOffer(
      await indy.wallet.get(),
      credentialDefinitionId
    );
    try {
      credOffer.revoc_reg_tag = revocRegTag;
      credOffer.data = JSON.parse(credentialData);
    } catch (e) {
      credOffer.data = {};
      console.log(e);
    }
    await indy.store.pendingCredentialOffers.write(credOffer);
    let message = await indy.crypto.buildAuthcryptedMessage(
      myDid,
      theirDid,
      MESSAGE_TYPES.OFFER,
      credOffer
    );
    let meta = JSON.parse(pairwise.metadata);
    let theirEndpointDid = meta.theirEndpointDid;
    return indy.crypto.sendAnonCryptedMessage(theirEndpointDid, message);
  }
};

exports.sendAccessOffer = async function(theirDid, payload) {
  let pairwise = await sdk.getPairwise(await indy.wallet.get(), theirDid);
  let myDid = pairwise.my_did;
  let message = await indy.crypto.buildAuthcryptedMessage(
    myDid,
    theirDid,
    MESSAGE_TYPES.ACCESS,
    payload
  );
  let meta = JSON.parse(pairwise.metadata);
  let theirEndpointDid = meta.theirEndpointDid;
  return indy.crypto.sendAnonCryptedMessage(theirEndpointDid, message);
};

exports.sendRequest = async function(theirDid, encryptedMessage) {
  let myDid = await indy.pairwise.getMyDid(theirDid);
  let credentialOffer = await indy.crypto.authDecrypt(myDid, encryptedMessage);
  let [, credentialDefinition] = await indy.issuer.getCredDef(
    await indy.pool.get(),
    await indy.did.getEndpointDid(),
    credentialOffer.cred_def_id
  ); // FIXME: Was passing in myDid. Why?
  let masterSecretId = await indy.did.getEndpointDidAttribute(
    "master_secret_id"
  );
  let [
    credRequestJson,
    credRequestMetadataJson
  ] = await sdk.proverCreateCredentialReq(
    await indy.wallet.get(),
    myDid,
    credentialOffer,
    credentialDefinition,
    masterSecretId
  );
  indy.store.pendingCredentialRequests.write(
    credRequestJson,
    credRequestMetadataJson
  );
  let message = await indy.crypto.buildAuthcryptedMessage(
    myDid,
    theirDid,
    MESSAGE_TYPES.REQUEST,
    credRequestJson
  );
  let theirEndpointDid = await indy.did.getTheirEndpointDid(theirDid);
  return indy.crypto.sendAnonCryptedMessage(theirEndpointDid, message);
};

exports.acceptRequest = async function(theirDid, encryptedMessage) {
  let myDid = await indy.pairwise.getMyDid(theirDid);
  let credentialRequest = await indy.crypto.authDecrypt(
    myDid,
    encryptedMessage
  );
  let [, credDef] = await indy.issuer.getCredDef(
    await indy.pool.get(),
    await indy.did.getEndpointDid(),
    credentialRequest.cred_def_id
  );

  let credentialOffer;
  let pendingCredOfferId;
  let pendingCredOffers = indy.store.pendingCredentialOffers.getAll();
  for (let pendingCredOffer of pendingCredOffers) {
    if (pendingCredOffer.offer.cred_def_id === credDef.id) {
      pendingCredOfferId = pendingCredOffer.id;
      credentialOffer = pendingCredOffer.offer;
    }
  }
  let schema = await indy.issuer.getSchema(credentialOffer.schema_id);

  let credentialValues = {};
  for (let attr of schema.attrNames) {
    if (credentialOffer.data[attr]) {
      credentialValues[attr] = {
        raw: credentialOffer.data[attr],
        encoded: indy.credentials.encode(credentialOffer.data[attr])
      };
    }
  }

  // console.log(credentialValues);
  let revoc_reg_tag = credentialOffer.revoc_reg_tag;
  let blobStorageReaderHandle = await revoc.getBlobStorageReaderHandle();
  let revRegMeta = await revoc.getRevReg(myDid, credDef.id, revoc_reg_tag);

  let [credential, revId, revRegDelta] = await sdk.issuerCreateCredential(
    await indy.wallet.get(),
    credentialOffer,
    credentialRequest,
    credentialValues,
    revRegMeta.revRegId,
    blobStorageReaderHandle
  );

  //Issuer posts revocation registry delta to ledger
  await revocLedgerOps.postRevocRegEntryRequestToLedger(
    await indy.pool.get(),
    await indy.wallet.get(),
    await indy.did.getEndpointDid(),
    revRegMeta.revRegId,
    revRegDelta
  );

  let storedRevDeltaMeta = await revoc.storeRevDelta(
    myDid,
    theirDid,
    {
      credDefId: credDef.id,
      cred: credential,
      revId: revId,
      revRegDelta: revRegDelta
    },
    undefined
  );

  credential.revDeltaMeta = JSON.stringify(storedRevDeltaMeta);
  credential.revRegMeta = JSON.stringify(revRegMeta);
  let tailsBuffer = fs.readFileSync(revRegMeta.revRegDef.value.tailsLocation);
  var jsonBuffer = tailsBuffer.toJSON(tailsBuffer);
  credential.tails = jsonBuffer;

  let message = await indy.crypto.buildAuthcryptedMessage(
    myDid,
    theirDid,
    MESSAGE_TYPES.CREDENTIAL,
    credential
  );
  let theirEndpointDid = await indy.did.getTheirEndpointDid(theirDid);
  await indy.crypto.sendAnonCryptedMessage(theirEndpointDid, message);
  indy.store.pendingCredentialOffers.delete(pendingCredOfferId);
};

exports.acceptCredential = async function(theirDid, encryptedMessage) {
  let myDid = await indy.pairwise.getMyDid(theirDid);
  let credential = await await indy.crypto.authDecrypt(myDid, encryptedMessage);
  let revocDeltaMeta = JSON.parse(credential.revDeltaMeta);
  let revocRegMeta = JSON.parse(credential.revRegMeta);

  await revoc.storeRevReg(
    myDid,
    theirDid,
    {
      credDefId: revocRegMeta.credDefId,
      revRegId: revocRegMeta.revRegId,
      revRegDef: revocRegMeta.revRegDef
    },
    revocRegMeta.nonce
  );
  await revoc.storeRevDelta(
    myDid,
    theirDid,
    {
      credDefId: revocDeltaMeta.credDefId,
      cred: revocDeltaMeta.credential,
      revId: revocDeltaMeta.revId,
      revRegDelta: revocDeltaMeta.revRegDelta
    },
    revocDeltaMeta.nonce
  );
  await revoc.storeTails(
    credential.tails,
    revocRegMeta.revRegDef.value.tailsLocation
  );

  let credentialRequestMetadata;
  let pendingCredentialRequests = indy.store.pendingCredentialRequests.getAll();
  for (let pendingCredReq of pendingCredentialRequests) {
    if (pendingCredReq.credRequestJson.cred_def_id === credential.cred_def_id) {
      // FIXME: Check for match
      credentialRequestMetadata = pendingCredReq.credRequestMetadataJson;
    }
  }

  let [, credentialDefinition] = await indy.issuer.getCredDef(
    await indy.pool.get(),
    await indy.did.getEndpointDid(),
    credential.cred_def_id
  );
  await sdk.proverStoreCredential(
    await indy.wallet.get(),
    null,
    credentialRequestMetadata,
    credential,
    credentialDefinition,
    revocRegMeta.revRegDef
  );

  // Issue self proof if cred type is access
  if (credential.values.type.raw === "access") {
    //Issue self proof for access

    //TODO: Define access proof structure and schema and make sure there is information about AD groups in proof
    let request_entry = {
      name: "self-access-proof",
      version: "0.1",
      requested_attributes: {
        attr1_referent: {
          name: "service_id",
          restrictions: [{ cred_def_id: credential.cred_def_id }]
        }
      },
      requested_predicates: {},
      non_revoked: { from: 0, to: 100 }
    };

    let response = await proof.create_self_proof(
      JSON.stringify(request_entry),
      credential.values.identity_holder_did.raw
    );

    //Webhook for data access status for client server to Modify access rights
    //Sends proof to client so they can validate it if needed
    await webhook.propogate_consent_meta_webhoook(
      hook_urls.ACCESS_CONSENT_PROPOGATION_URL,
      { data: { type: "proof", proof: response.proof } }
    );
  }
};

exports.encode = function(string) {
  // console.log(string);
  if (!string) {
    return string;
  }
  let newString = Buffer.from(string.toString(), "utf8").toString();
  let number = "1";
  let length = newString.length;
  for (let i = 0; i < length; i++) {
    let codeValue = newString.charCodeAt(i).toString(10);
    if (codeValue.length < 3) {
      codeValue = "0" + codeValue;
    }
    number += codeValue;
  }
  // console.log(number);
  return number;
};

exports.decode = function(number) {
  // console.log(number);
  if (!number) return number;
  let string = "";
  number = number.slice(1); // remove leading 1
  let length = number.length;

  for (let i = 0; i < length; ) {
    let code = number.slice(i, (i += 3));
    string += String.fromCharCode(parseInt(code, 10));
  }
  // console.log(string);
  return string;
};

async function issueCredentialToSelf(credentialDefinitionId, credentialData) {
  try {
    let endpointDID = await indy.did.getEndpointDid();
    let wallet = await indy.wallet.get();
    let pool = await indy.pool.get();
    let credentialOffer = await sdk.issuerCreateCredentialOffer(
      wallet,
      credentialDefinitionId
    );
    try {
      credentialOffer.data = JSON.parse(credentialData);
    } catch (e) {
      credentialOffer.data = {};
      console.log(e);
    }
    let [, credentialDefinition] = await indy.issuer.getCredDef(
      pool,
      endpointDID,
      credentialOffer.cred_def_id
    );
    let masterSecretId = await indy.did.getEndpointDidAttribute(
      "master_secret_id"
    );
    let [
      credRequestJson,
      credRequestMetadataJson
    ] = await sdk.proverCreateCredentialReq(
      wallet,
      endpointDID,
      credentialOffer,
      credentialDefinition,
      masterSecretId
    );
    let schema = await indy.issuer.getSchema(credentialOffer.schema_id);

    let credentialValues = {};
    for (let attr of schema.attrNames) {
      if (credentialOffer.data[attr]) {
        credentialValues[attr] = {
          raw: credentialOffer.data[attr],
          encoded: indy.credentials.encode(credentialOffer.data[attr])
        };
      }
    }
    let [credential] = await sdk.issuerCreateCredential(
      wallet,
      credentialOffer,
      credRequestJson,
      credentialValues
    );
    await sdk.proverStoreCredential(
      wallet,
      null,
      credRequestMetadataJson,
      credential,
      credentialDefinition
    );
  } catch (e) {
    console.log(e);
  }
}
