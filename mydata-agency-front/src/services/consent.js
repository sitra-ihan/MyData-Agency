import Vue from "vue";
// import { TokenService } from "../services/storage.js";
// import router from "../router";
import store from "../store/index.js";
import User from "../services/user.js";

class AuthenticationError extends Error {
  constructor(errorCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errorCode = errorCode;
  }
}

const Consent = {
  /**
   * Create NS Pipeline
   **/

  sendConsentRequest(did, cred_def_id, cred_data, rev_reg_tag) {
    return Vue.axios
      .post("/send_cred_offer", {
        grant_type: "password",
        did: did,
        cred_def_id: cred_def_id,
        cred_data: cred_data,
        rev_reg_tag: rev_reg_tag,
      })
      .then((response) => {
        if (response.status == 200) {
          return response.data;
        } else {
          return undefined;
        }
      })
      .catch((error) => this.requestFailed(error.response.data));
  },

  requestProof(did, request_entry) {
    return Vue.axios
      .post("/create_proof_request", {
        grant_type: "password",
        did: did,
        request_entry: request_entry,
      })
      .then((response) => {
        if (response.status == 200) {
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch((error) => this.requestFailed(error.response.data));
  },

  getHagAuthCreds() {
    return Vue.axios
      .get("/get_all_creds", {
        grant_type: "password",
      })
      .then((response) => {
        if (response.status == 200) {
          response.data.forEach((element) => {
            if (element.attrs.type === "hag-auth") {
              store.state.identityHolderPid = element.attrs.identity_holder_pid;
              store.state.identityHolderName =
                element.attrs.identity_holder_name;
              store.state.dependentPid = element.attrs.dependent_pid;
              store.state.dependentName = element.attrs.dependent_name;
              store.state.hagData = element.attrs.data;
            }
          });
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch((error) => {
        this.requestFailed(error.response.data);
      });
  },

  verifyProof(proof) {
    return Vue.axios
      .post("/validate_proof", {
        grant_type: "password",
        proof: proof,
      })
      .then((response) => {
        if (response.status == 200) {
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch((error) => this.requestFailed(error.response.data));
  },

  revokeConsent(prover_did, rev_reg_id) {
    return Vue.axios
      .post("/revoke_cred", {
        grant_type: "password",
        prover_did: prover_did,
        rev_reg_id: rev_reg_id,
      })
      .then((response) => {
        if (response.status == 200) {
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch((error) => this.requestFailed(error.response.data));
  },

  getAllProofs() {
    return Vue.axios
      .get("/get_all_proofs", {
        grant_type: "password",
      })
      .then((response) => {
        if (response.status == 200) {
          store.state.proofs = [];
          store.state.proofItems = [];

          store.state.proofItems.push({ header: "Issued Data Consents" });
          response.data.forEach((cred) => {
            // var divider = { divider: true, inset: true };
            var service_id =
              cred.requested_proof.revealed_attrs.attr1_referent.raw;

            var connection = "";
            store.state.connectionsListString.forEach((conn) => {
              if (conn.split(" ")[0] === cred.issuerEndpointDid) {
                connection = conn;
              }
            });

            var pipeline = "";
            store.state.pipelineListString.forEach((pipe) => {
              if (pipe.split(" ")[0] === service_id) {
                pipeline = pipe;
              }
            });

            var element = {
              avatar:
                "https://icon-library.net/images/trust-icon-png/trust-icon-png-5.jpg",
              title: "<b>Issued To: </b>" + connection,
              subtitle:
                "<span class='text--primary'>For Service: </span> &mdash;" +
                pipeline +
                "<br/> <b>Type: Data Fetch Consent</b>",
            };

            store.state.proofItems.push(element);
            store.state.proofs.push(response.data);
            store.state.proofType.push(true);
            store.state.isRevoked.push(false);
          });
        } else {
          return response.status;
        }
      })
      .then(() => {
        try {
          Vue.axios
            .get("/get_all_access_creds", {
              grant_type: "password",
            })
            .then((response) => {
              if (response.status == 200) {
                response.data.forEach((cred) => {
                  let issuedTo =
                    cred.issued_to_did + " (" + cred.issued_to_name + ")";
                  let serviceId = cred.service_id;
                  var element = {
                    avatar:
                      "https://icon-library.net/images/trust-icon-png/trust-icon-png-5.jpg",
                    title: "<b>Issued To: </b>" + issuedTo,
                    subtitle:
                      "<span class='text--primary'>For Service: </span> &mdash;" +
                      serviceId +
                      "<br/> <b>Type: Data Access Consent - Revoked: " +
                      cred.revoked +
                      "</b>",
                  };
                  store.state.proofItems.push(element);
                  store.state.proofs.push(cred);
                  store.state.proofType.push(false);
                  store.state.isRevoked.push(cred.revoked);
                });
              } else {
                return response.status;
              }
            });
        } catch (error) {
          console.log();
        }
      })
      .catch((error) => this.requestFailed(error.response.data));
  },

  requestFailed(error) {
    if (error.message == "Invalid Token") {
      User.logout();
    } else {
      return error;
    }
  },
};

export default Consent;
export { Consent, AuthenticationError };
