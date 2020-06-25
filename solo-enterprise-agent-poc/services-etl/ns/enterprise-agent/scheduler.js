const job = require("./job");
const span = require("../const");
const config = require("../../../config");
const moment = require("moment");
var fetch = require("node-fetch");
const mongo_store = require("./mongo");
const credential = require("../../../consent-api/credential");
const connection = require("../../../consent-api/connection");
const proof = require("../../../consent-api/proof");
const service_registry = require("../../../storage/services");
var zlib = require("zlib");
const crypto = require("../../../indy/src/crypto");
const auth = require("../../../auth/auth.service");
const rsa = require("../../../keys/rsa");
const wallet = require("../../../indy/src/wallet");
const hook_urls = require("../../hook.const");
const webhook = require("../../webhook");

async function importPreviousMonthData_forDaily(
  service_id,
  endpoint_url,
  port,
  endpoint_token
) {
  // Fetch entries and treatments
  let dateFrom = moment()
    .subtract(1, "months")
    .format("YYYY-MM-DD"); //Last Month from todays date
  let dateTo = moment().format("YYYY-MM-DD"); //Today Date

  if (port !== "") {
    endpoint_url = endpoint_url + ":" + port;
  }
  let query = endpoint_url + span.NS_DATA_REQUEST_SLUG;
  let body = {
    service_id: service_id,
    date_from: dateFrom,
    date_to: dateTo
  };

  fetch(query, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + endpoint_token
    }
  })
    .then(res => res.json())
    .then(json => {
      switch (json.status) {
        case "success":
          let response = json.response;

          //Decrypt
          var decrypted = rsa.decryptMessage(response);

          //Decompress
          var inflated = JSON.parse(
            zlib.inflateSync(new Buffer(decrypted, "base64")).toString()
          );

          if (inflated.entries.length > 0) {
            mongo_store.insertToDb(
              inflated.entries,
              "entries",
              config.mongoURI,
              "db_" + service_id
            );
          }
          if (inflated.treatments.length > 0) {
            mongo_store.insertToDb(
              inflated.treatments,
              "treatments",
              config.mongoURI,
              "db_" + service_id
            );
          }
          break;
        case "error":
          //TODO: HANDLE CONSENT FAILURE RESPONSE
          console.log(json.response);
          break;
        default:
          //TODO: HANDLE CONSENT FAILURE RESPONSE
          console.error(json.response);
          break;
      }
    });
}

async function initDataRequestJob(service_id) {
  job.manager().add(service_id, span.DAILY, () => {
    let serviceResponse = service_registry.get_service_by_id(service_id);

    serviceResponse
      .then(service => {
        service = service[0];
        let authResponse = exports.remote_agent_auth(
          service.service_id,
          service.identity_holder_key,
          service.identity_holder_did
        );

        authResponse
          .then(auth => {
            if (auth !== undefined) {
              console.log("Service " + service.service_id + " in pursuit!");
              let query = "";
              if (service.port !== "") {
                query =
                  service.endpoint +
                  ":" +
                  service.port +
                  span.NS_DATA_REQUEST_SLUG;
              } else {
                query = service.endpoint + span.NS_DATA_REQUEST_SLUG;
              }
              let dateFrom = moment().format("YYYY-MM-DD");
              let dateTo = moment()
                .add(1, "days")
                .format("YYYY-MM-DD");
              let body = {
                service_id: service.service_id,
                date_from: dateFrom,
                date_to: dateTo
              };

              fetch(query, {
                method: "post",
                body: JSON.stringify(body),
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + auth
                }
              })
                .then(res => res.json())
                .then(json => {
                  switch (json.status) {
                    case "success":
                      let response = json.response;
                      //Decrypt
                      var decrypted = rsa.decryptMessage(response);
                      //Decompress
                      var inflated = JSON.parse(
                        zlib
                          .inflateSync(new Buffer(decrypted, "base64"))
                          .toString()
                      );
                      //console.log(inflated.entries.length);
                      if (inflated.entries.length > 0) {
                        mongo_store.insertToDb(
                          inflated.entries,
                          "entries",
                          config.mongoURI,
                          "db_" + service.service_id
                        );
                      }
                      if (inflated.treatments.length > 0) {
                        mongo_store.insertToDb(
                          inflated.treatments,
                          "treatments",
                          config.mongoURI,
                          "db_" + service.service_id
                        );
                      }
                      break;
                    case "error":
                      //TODO: HANDLE CONSENT FAILURE RESPONSE
                      console.log(json.response);
                      break;
                    default:
                      //TODO: HANDLE CONSENT FAILURE RESPONSE
                      console.error(json.response);
                      break;
                  }
                });
            } else {
              // Kill the Job and remove the service
              service_registry.unregister_service(service.service_id); //Remove service from system
              job.manager().deleteJob(service.service_id); //Delete Job
              console.log("Invalid Consent, Removing CRON Job and Service.");
            }
          })
          .catch(err => {
            console.log("Auth response not found!");
            console.error(err);
          });
      })
      .catch(err => {
        console.log("Service not found!");
        console.error(err);
      });
  });
  job.manager().start(service_id);
}

async function accept_incoming_proof(
  request_id,
  requestedAttributes,
  cred_type
) {
  //Get cred_id from proof request
  let cred_id = requestedAttributes.attr1_referent.cred_id;
  let cred = await credential.get_credential_by_cred_id(cred_id);

  await proof.accept_proof_request(request_id);
  console.log("Proof Offer Accepted!");

  // //Init Data Request Job
  let service = await service_registry.get_service_by_id(cred.attrs.service_id);
  if (service.length === 0) {
    // ***************** Send Enterprise RSA Public Key ****************
    const rsa_message = {
      type: "RSA",
      service_id: cred.attrs.service_id,
      pub_key: rsa.RSAKeyPair().public
    };
    let resp = await crypto.sendAnonCryptedMessage(
      cred.attrs.identity_holder_did,
      rsa_message
    );
    // Gets personal agent public key in return but not needed as we already have personal agent rsa public key via credential.
    // *****************************************************************
    if (cred_type === "fetch") {
      //Register Agent as service
      service_registry.register_service(
        cred.attrs.service_id,
        "personal_agent",
        cred.attrs.endpoint,
        cred.attrs.port,
        "none",
        "none",
        "none",
        cred.attrs.identity_holder_key,
        cred.attrs.identity_holder_did
      );

      //Webhook for data fetch to client server so they can start data fetch pipeline
      await webhook.propogate_consent_meta_webhoook(
        hook_urls.FETCH_CONSENT_PROPOGATION_URL,
        { credential: cred }
      );
      //resp may contain data

      //Request previous month data
      // await importPreviousMonthData_forDaily(cred.attrs.service_id, cred.attrs.endpoint, cred.attrs.port, endpoint_token);

      //Init Data-request CRON
      // initDataRequestJob(cred.attrs.service_id);
    }
  }
}

async function consent_daemon() {
  var credTimeStart = process.hrtime();
  //Accept incoming credential offers
  let cred_offers = await credential.get_all_credential_offers();
  let credOfferCount = cred_offers.length;
  for (const offer of cred_offers) {
    await credential.accept_credential_offer(offer.id);
    console.log("Credential Offer Accepted!");
  }
  let credTimeEnd = process.hrtime(credTimeStart);
  // if (credOfferCount !== 0) {
  //   console.log(
  //     "=============================================================="
  //   );
  //   console.log(" Credentials Performance");
  //   console.log(
  //     "=============================================================="
  //   );
  //   let avgSeconds = credTimeEnd[0] / credOfferCount;
  //   console.log(
  //     "\nAverage credential issue time over " +
  //       credOfferCount +
  //       " credentials: " +
  //       avgSeconds +
  //       "s "
  //   );

  //   console.log(
  //     "Total credential issuance time of " +
  //       credOfferCount +
  //       " credentials: " +
  //       credTimeEnd[0] +
  //       "s " +
  //       credTimeEnd[1] / 1000000 +
  //       " ms"
  //   );
  //   console.log(
  //     "=============================================================="
  //   );
  // }

  var proofTimeStart = process.hrtime();
  //Accept incoming proof requests
  let proof_requests = await proof.get_all_proof_requests();
  let proofReqCount = proof_requests.length;
  for (const request of proof_requests) {
    //Get cred_id from proof request
    let requestedAttributes =
      request.message.message.requestedCreds.requested_attributes;
    // console.log(request.message.message.requestedCreds);
    if (requestedAttributes.attr1_referent !== undefined) {
      let cred_id = requestedAttributes.attr1_referent.cred_id;
      let cred_for_proof = request.message.message.credsForProof;
      let cred_type = cred_for_proof[cred_id].attrs.type;
      await accept_incoming_proof(request.id, requestedAttributes, cred_type);
    } else {
      //re-init proof-request
      let new_request = await proof.rebuild_proof_request(
        request.id,
        request.message
      );
      if (new_request !== undefined) {
        let cred_id = new_request.attributes.attr1_referent.cred_id;
        let cred_for_proof = new_request.message.credsForProof;
        let cred_type = cred_for_proof[cred_id].attrs.type;
        await accept_incoming_proof(
          new_request.id,
          new_request.attributes,
          cred_type
        );
      }
    }
  }
  let proofTimeEnd = process.hrtime(proofTimeStart);
  // if (proofReqCount !== 0) {
  //   console.log(
  //     "\n\n=============================================================="
  //   );
  //   console.log(" Proofs Performance");
  //   console.log(
  //     "=============================================================="
  //   );
  //   let avgSeconds = proofTimeEnd[0] / proofReqCount;
  //   console.log(
  //     "\nAverage proofs issue time over " +
  //       proofReqCount +
  //       " proofs: " +
  //       avgSeconds +
  //       "s "
  //   );

  //   console.log(
  //     "Total proof issuance time of " +
  //       proofReqCount +
  //       " proofs: " +
  //       credTimeEnd[0] +
  //       "s " +
  //       credTimeEnd[1] / 1000000 +
  //       " ms"
  //   );
  //   console.log(
  //     "=============================================================="
  //   );
  // }
}

async function init_dead_jobs() {
  // let services = await service_registry.get_all_services();
  // for (const service of services) {
  //     if (service.endpoint_token !== undefined) {
  //         setTimeout(() => {
  //             initDataRequestJob(service.service_id);
  //             console.log("Service with id: " + service.service_id + " has started!");
  //         }, 2000); //Init jobs with 2 seconds delay
  //     }
  // }
}

exports.remote_agent_auth = async function(
  service_id,
  identity_holder_key,
  identity_holder_did
) {
  try {
    let my_relationship_did = await connection.get_my_relationship_did(
      identity_holder_did
    );
    let their_relationship_did = await connection.get_their_relationship_did(
      identity_holder_did
    );
    let type = "JWT";

    let body = {
      type: type,
      sub: their_relationship_did,
      service_id: service_id
    };

    let message = await crypto.buildAuthcryptedMessage(
      my_relationship_did,
      their_relationship_did,
      type,
      body
    );
    let resp = await crypto.sendAnonCryptedMessage(
      identity_holder_did,
      message
    );

    if (resp.status === "success") {
      //Validate token
      let authResponse = await auth.verifyToken(
        resp.access_token,
        identity_holder_key
      );
      if (authResponse.sub === their_relationship_did) {
        return resp;
      } else {
        console.error("Invalid DID");
        return resp;
      }
    } else {
      console.error(resp.message);
      return resp;
    }
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: error
    };
  }
};

exports.initConsentDaemon = async function() {
  //Init previous dead jobs after 30 seconds
  setTimeout(() => {
    init_dead_jobs();
  }, 30000);

  //Init consent daemon
  job.manager().add("consent_daemon", span.PER_MINUTE, () => {
    consent_daemon();
  });
  job.manager().start("consent_daemon");
};
