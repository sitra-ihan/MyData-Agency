const express = require("express");
const router = express.Router();

const connection = require("./consent-api/connection");
const definition = require("./consent-api/definition");
const credential = require("./consent-api/credential");

const proof = require("./consent-api/proof");
const authService = require("./auth/auth.service");
const store = require("./storage/services");

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
  let token = req.headers["authorization"].split(" ")[1];
  let resp = await connection.send_connection_request(did, token);
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

router.get("/get_cred_offers", async function(req, res) {
  let resp = await credential.get_all_credential_offers();
  res.send(resp);
});

router.get("/get_access_requests", async function(req, res) {
  let resp = await credential.get_all_access_requests();
  res.send(resp);
});

router.post("/accept_access_request", async function(req, res) {
  let access_request_id = req.body.access_request_id;
  let resp = await credential.accept_access_request(access_request_id);
  res.send(resp);
});

router.post("/reject_access_request", async function(req, res) {
  let access_request_id = req.body.access_request_id;
  let resp = await credential.reject_access_request(access_request_id);
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

router.get("/get_all_access_creds", async function(req, res) {
  let resp = await credential.get_all_access_credential();
  res.send(resp);
});

router.post("/revoke_cred", async function(req, res) {
  let proverEndpointDid = req.body.prover_did;
  let revocRegId = req.body.rev_reg_id;
  let resp = await credential.revoke_credential(proverEndpointDid, revocRegId);
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

router.get("/get_service_registery_token", async function(req, res) {
  let resp = await authService.getServiceRegisterationToken(req);
  res.send(resp);
});

router.get("/get_all_services", async function(req, res) {
  let resp = await store.get_all_services();
  res.send(resp);
});

router.get("/get_all_services_by_did", async function(req, res) {
  let resp = await store.get_all_services_by_did(req.query.did);
  res.send(resp);
});

router.get("/get_service_by_id", async function(req, res) {
  let resp = await store.get_service_by_id(req.query.service_id);
  res.send(resp);
});

module.exports = router;
