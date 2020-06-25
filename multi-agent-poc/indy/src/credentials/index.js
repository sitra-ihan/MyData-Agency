"use strict";
const sdk = require("indy-sdk");
const indy = require("../../index.js");
const revoc = require("../revocation");
var fs = require("fs");
const store = require("../../../storage/services");
const auth = require("../../../auth/auth.service");
const rsa = require("../../../keys/rsa");

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

exports.getAllAccessCreds = async function() {
  let connections = await indy.pairwise.getAll();
  let all_relationships_list = [];
  for (let relationship of connections) {
    all_relationships_list.push({
      my_relationship_did: relationship.my_did,
      their_public_did: relationship.metadata.theirEndpointDid,
      their_name: relationship.metadata.organizationName
    });
  }
  return await revoc.getAllAccessCredsFromRevDeltas(all_relationships_list);
};

exports.revokeCredential = async function(proverEndpointDid, revocRegId) {
  let myDid = await revoc.get_my_relationship_did(proverEndpointDid);
  let credDeltaMeta = await revoc.getRevDeltaByrevocRegId(revocRegId, myDid);
  let revRegId = credDeltaMeta.credential.rev_reg_id;
  let revRegMeta = await revoc.getRevRegByRevRegId(myDid, revRegId);

  let revRegDeltaAfterRevocation = await revoc.revokeCredential(
    await indy.wallet.get(),
    revRegMeta.revRegId,
    credDeltaMeta.revId
  );
  let revNewDelta = await revoc.updateRevocationDelta(
    credDeltaMeta.nonce,
    myDid,
    revRegDeltaAfterRevocation
  );

  //Revoke data access token
  let serviceId = credDeltaMeta.credential.values.service_id.raw;
  let service = store.get_service_by_id(serviceId);
  let key = rsa.RSAKeyBuffer();
  if (
    service[0].active_data_access_token != "(none)" &&
    service[0].active_data_access_token != undefined
  ) {
    try {
      let decodedDataToken = auth.verifyToken(
        service[0].active_data_access_token,
        key.public
      );
      await auth.revokeTokenByToken(decodedDataToken);
    } catch (error) {
      if (
        error.message == "jwt expired" ||
        error.message == "jwt must be provided"
      ) {
        //Do nothing
      } else {
        //Log error and continue
        console.log(error.message);
      }
    }
  }

  if (revNewDelta === undefined) {
    return {
      status: "error"
    };
  } else {
    let theirDid = await revoc.get_their_relationship_did(proverEndpointDid);
    //Propagate revocation delta change to prover
    let tailsBuffer = fs.readFileSync(revRegMeta.revRegDef.value.tailsLocation);
    var jsonBuffer = tailsBuffer.toJSON(tailsBuffer);

    let revocJson = {
      revRegMeta: revRegMeta,
      revNewDelta: revNewDelta,
      tailsBuffer: jsonBuffer
    };

    let message = await indy.crypto.buildAuthcryptedMessage(
      myDid,
      theirDid,
      "REVOCATION",
      revocJson
    );
    let resp = await indy.crypto.sendAnonCryptedMessage(
      proverEndpointDid,
      message
    );

    return resp;
  }
};

exports.createRevocRegistry = async function(
  myDid,
  issuerDid,
  credentialDefinitionId,
  revocRegTag,
  nonce
) {
  let [revRegId, revRegDef] = await revoc.issuerCreateRevocationRegistry(
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

  let revoc_reg_tag = credentialOffer.revoc_reg_tag;
  let blobStorageReaderHandle = await indy.pool.getBlobStorageReaderHandle();
  let revRegMeta = await revoc.getRevReg(myDid, credDef.id, revoc_reg_tag);

  let [credential, revId, revRegDelta] = await sdk.issuerCreateCredential(
    await indy.wallet.get(),
    credentialOffer,
    credentialRequest,
    credentialValues,
    revRegMeta.revRegId,
    blobStorageReaderHandle
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
};

exports.encode = function(string) {
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
  return number;
};

exports.decode = function(number) {
  if (!number) return number;
  let string = "";
  number = number.slice(1); // remove leading 1
  let length = number.length;

  for (let i = 0; i < length; ) {
    let code = number.slice(i, (i += 3));
    string += String.fromCharCode(parseInt(code, 10));
  }
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
