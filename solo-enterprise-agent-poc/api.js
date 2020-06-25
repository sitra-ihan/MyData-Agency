const express = require("express");
const router = express.Router();

const connection = require("./consent-api/connection");
const definition = require("./consent-api/definition");
const credential = require("./consent-api/credential");
const proof = require("./consent-api/proof");
const scheduler = require("./services-etl/ns/enterprise-agent/scheduler");

router.get("/get_agent_did", async function(req, res) {
  let resp = await connection.get_agent_did();
  res.send(resp);
});

router.post("/create_schema", async function(req, res) {
  let resp = await definition.create_schema(
    req.body.name_of_schema,
    req.body.version,
    req.body.attributes
  );
  res.send(resp);
});

router.get("/get_connections", async function(req, res) {
  let resp = await connection.get_all_connections();
  res.send(resp);
});

router.post("/create_connection", async function(req, res) {
  let did = req.body.did;
  let resp = await connection.send_connection_request(did);
  res.send(resp);
});

router.get("/get_schemas", async function(req, res) {
  //Gets schemas from wallet not pool
  let resp = await definition.get_all_schemas();
  res.send(resp);
});

router.get("/get_schema_id", async function(req, res) {
  let schema_name = req.query.schema_name;
  let version = req.query.version;
  let resp = await definition.get_schema_id(schema_name, version);
  res.send(resp);
});

router.get("/get_schema_by_id", async function(req, res) {
  let schema_id = req.query.schema_id;
  let resp = await definition.get_schema_by_id(schema_id);
  res.send(resp);
});

router.post("/create_cred_def", async function(req, res) {
  let existing_cred_defs = await definition.get_enriched_credential_definitions();
  let existing_cred_def = undefined;
  for (var i = 0; i < existing_cred_defs.length; i++) {
    cred_def = existing_cred_defs[i];
    if (
      cred_def.tag === req.body.tag &&
      cred_def.schemaId_long === req.body.schema_id
    ) {
      existing_cred_def = {
        cred_def_id: cred_def.id
      };
    }
  }
  if (existing_cred_def === undefined) {
    let response = await definition.create_cred_defination(
      req.body.schema_id,
      req.body.tag
    );
    res.send(response);
  } else {
    res.send(existing_cred_def);
  }
});

router.get("/get_cred_defs", async function(req, res) {
  let resp = await definition.get_enriched_credential_definitions();
  res.send(resp);
});

router.post("/send_cred_offer", async function(req, res) {
  let their_relationship_did = await connection.get_their_relationship_did(
    req.body.did
  );
  let cred_def_id = req.body.cred_def_id;
  let resp = await credential.send_credential_offer(
    their_relationship_did,
    cred_def_id,
    req.body.cred_data,
    req.body.rev_reg_tag
  );
  res.send(resp);
});

router.post("/send_access_request", async function(req, res) {
  try {
    let their_relationship_did = await connection.get_their_relationship_did(
      req.body.did
    );
    let myDid = await connection.get_agent_did();

    let data = JSON.parse(req.body.data);

    let payload = {
      endpointDid: myDid.public_did,
      meta: {
        schema_id: req.body.schema_id,
        agent_endpoint: req.body.agent_endpoint,
        port: req.body.port,
        data: data
      }
    };
    let resp = await credential.send_access_credential_offer(
      their_relationship_did,
      payload
    );
    res.send(resp);
  } catch (error) {
    res.send({
      status: "error",
      message: error
    });
  }
});

router.get("/get_cred_offers", async function(req, res) {
  let resp = await credential.get_all_credential_offers();
  res.send(resp);
});

router.post("/accept_cred_offer", async function(req, res) {
  let cred_offer_id = req.body.cred_offer_id;
  let resp = await credential.accept_credential_offer(cred_offer_id);
  res.send(resp);
});

router.post("/reject_cred_offer", async function(req, res) {
  let cred_offer_id = req.body.cred_offer_id;
  let resp = await credential.reject_credential_offer(cred_offer_id);
  res.send(resp);
});

router.get("/get_all_creds", async function(req, res) {
  let resp = await credential.get_all_credentials();
  res.send(resp);
});

router.get("/get_all_revs", async function(req, res) {
  let resp = await credential.get_all_credential_deltas(req.body.prover_did);
  res.send(resp);
});

router.post("/revoke_cred", async function(req, res) {
  let proverEndpointDid = req.body.prover_did;
  let credDefId = req.body.cred_def_id;
  let credDeltaNonce = req.body.cred_delta_nonce;
  let resp = await credential.revoke_credential(
    proverEndpointDid,
    credDefId,
    credDeltaNonce
  );
  res.send(resp);
});

router.post("/create_proof_request", async function(req, res) {
  let their_relationship_did = await connection.get_their_relationship_did(
    req.body.did
  );
  let request_entry = req.body.request_entry;
  let resp = await proof.send_proof_request(
    their_relationship_did,
    request_entry
  );
  res.send(resp);
});

router.post("/create_self_proof", async function(req, res) {
  let request_entry = req.body.request_entry;
  let cred_issuer_did = req.body.cred_issuer_did;
  let resp = await proof.create_self_proof(request_entry, cred_issuer_did);
  res.send(resp);
});

router.get("/get_all_proof_requests", async function(req, res) {
  let resp = await proof.get_all_proof_requests();
  res.send(resp);
});

router.post("/accept_proof_request", async function(req, res) {
  let messageId = req.body.messageId;
  let resp = await proof.accept_proof_request(messageId);
  res.send(resp);
});

router.post("/reject_proof_request", async function(req, res) {
  let messageId = req.body.messageId;
  let resp = await proof.reject_proof_request(messageId);
  res.send(resp);
});

router.get("/get_all_proofs", async function(req, res) {
  let resp = await proof.get_all_proofs();
  res.send(resp);
});

router.post("/validate_proof", async function(req, res) {
  let proof_json = req.body.proof;
  let resp = await proof.is_proof_valid(proof_json);
  res.send(resp);
});

router.post("/data_token", async function(req, res) {
  let credential = req.body.credential;
  let token_auth_resp = await scheduler.remote_agent_auth(
    credential.attrs.service_id,
    credential.attrs.identity_holder_key,
    credential.attrs.identity_holder_did
  );
  if (token_auth_resp.status !== "error") {
    let resp = {
      access_token: token_auth_resp.access_token,
      token_type: token_auth_resp.token_type,
      expires_in: token_auth_resp.expires_in,
      credential: credential
    };
    res.send(resp);
  } else {
    res.send(token_auth_resp);
  }
});

module.exports = router;
