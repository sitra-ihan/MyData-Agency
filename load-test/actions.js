var fetch = require("node-fetch");
var faker = require("faker");

//authenticate entperprise agent
exports.authenticateEA = async function(url, username, password) {
  try {
    let walletResponse = await fetch(url + "/api/authenticate_user", {
      method: "post",
      body: JSON.stringify({
        username: username,
        password: password
      }),
      headers: { "Content-Type": "application/json" }
    });

    let resp = await walletResponse.json();
    let token = resp.access_token;

    let didResponse = await fetch(url + "/api/get_agent_did", {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    });

    let resp2 = await didResponse.json();
    let did = resp2.public_did;

    return [did, token];
  } catch (error) {
    console.log(error);
  }
};

//create on agency
exports.createWallet = async function(url, walletName, passphrase) {
  try {
    let walletResponse = await fetch(url + "/api/create_wallet", {
      method: "post",
      body: JSON.stringify({
        walletName: walletName,
        passphrase: passphrase
      }),
      headers: { "Content-Type": "application/json" }
    });

    let resp = await walletResponse.json();
    let status = resp.status;
    return [walletName, passphrase, status];
  } catch (error) {
    console.log(error);
  }
};

//open wallet on agency
exports.openWallet = async function(url, walletName, passphrase) {
  try {
    let walletResponse = await fetch(url + "/api/open_wallet", {
      method: "post",
      body: JSON.stringify({
        walletName: walletName,
        passphrase: passphrase
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    let resp = await walletResponse.json();
    let public_did = resp.public_did;
    let token = resp.access_token;
    return [walletName, passphrase, public_did, token];
  } catch (error) {
    console.log(error);
  }
};

// Create Connection
exports.createConnection = async function(url, token, did) {
  let connectionResponse = await fetch(url + "/api/create_connection", {
    method: "post",
    body: JSON.stringify({
      did: did
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  let resp = await connectionResponse.json();
  return resp.status;
};

//Create Schema
exports.createSchema = async function(
  url,
  token,
  name_of_schema,
  version,
  attributes
) {
  let schemaResponse = await fetch(url + "/api/create_schema", {
    method: "post",
    body: JSON.stringify({
      name_of_schema: name_of_schema,
      version: version,
      attributes: attributes
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  let resp = await schemaResponse.json();
  return resp.schema_id;
};

// Create Credential Definition
exports.createCredDef = async function(url, token, schemaId, tag) {
  let credDefResponse = await fetch(url + "/api/create_cred_def", {
    method: "post",
    body: JSON.stringify({
      schema_id: schemaId,
      tag: tag
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  let resp = await credDefResponse.json();
  credDefId = resp.cred_def_id;
  return credDefId;
};

// Register Service
exports.registerService = async function(
  url,
  token,
  service_name,
  service_endpoint,
  service_endpoint_token,
  port,
  credDefId
) {
  let serviceResponse = await fetch(url + "/api/service/register", {
    method: "post",
    body: JSON.stringify({
      service_name: service_name,
      endpoint: service_endpoint,
      port: port,
      endpoint_token: service_endpoint_token,
      cred_def_id: credDefId
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  let resp = await serviceResponse.json();
  serviceId = resp.service_id;
  return serviceId;
};

// Send Credential Offer
exports.sendCredOffer = async function(
  url,
  token,
  did,
  credDefId,
  tag,
  serviceId,
  agent_endpoint,
  data_endpoint,
  agent_port
) {
  let cred_data = {
    service_id: serviceId,
    agent_endpoint: agent_endpoint,
    data_endpoint: data_endpoint,
    port: agent_port,
    type: "fetch",
    data: "(none)"
  };

  let credOfferResponse = await fetch(url + "/api/send_cred_offer", {
    method: "post",
    body: JSON.stringify({
      did: did,
      cred_def_id: credDefId,
      cred_def_tag: tag,
      cred_data: JSON.stringify(cred_data)
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  let resp = await credOfferResponse.json();
  return resp.status;
};

// Send Proof Request
exports.sendProofRequest = async function(url, token, did, credDefId) {
  let request_entry = {
    name: faker.lorem.word() + "-Proof",
    version: "0.1",
    requested_attributes: {
      attr1_referent: {
        name: "service_id",
        restrictions: [{ cred_def_id: credDefId }]
      }
    },
    requested_predicates: {},
    non_revoked: { from: 0, to: 100 }
  };

  let proofReqResponse = await fetch(url + "/api/create_proof_request", {
    method: "post",
    body: JSON.stringify({
      did: did,
      request_entry: JSON.stringify(request_entry)
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });

  let resp = await proofReqResponse.json();
  return resp.status;
};
