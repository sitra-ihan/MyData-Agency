const indy = require("../indy/index");
const message = require("./message");
const rsa = require("../keys/rsa");
const utils = require("../indy/src/utils");
const definition = require("../consent-api/definition");
const schema = require("../consent-api/schema");
const connection = require("../consent-api/connection");

module.exports = {
  send_credential_offer: async function send_credential_offer(
    their_did,
    cred_def_id,
    cred_data,
    rev_reg_tag
  ) {
    try {
      cred_offer = JSON.parse(cred_data);
      cred_offer["identity_holder_key"] = rsa.RSAKeyPair().public; //My pubkey sent as counterparty for enterprise agent
      cred_offer["identity_holder_did"] = await indy.did.getEndpointDid(); //My endpoint did sent as counterparty for enterprise agent
      cred_offer["expiration"] = new Date(
        new Date().setFullYear(new Date().getFullYear() + 5) //+5 Years ISO 8601 from current date
      ).toISOString();
      cred_offer_str = JSON.stringify(cred_offer);
      let resp = await indy.credentials.sendOffer(
        their_did,
        cred_def_id,
        cred_offer_str,
        rev_reg_tag
      );
      return {
        status: resp
      };
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_credential_offers: async function get_all_credential_offers() {
    try {
      let rawMessages = await message.get_messages();
      let messages = [];
      for (let msg of rawMessages) {
        if (message.CRED_MESSAGE_TYPES["OFFER"] === msg.message.type) {
          let new_msg = {
            id: msg.id,
            timestamp: msg.timestamp,
            origin: msg.message.origin
          };
          messages.push(new_msg);
        }
      }
      return messages;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_access_requests: async function get_all_access_requests() {
    try {
      return indy.store.pendingAccessRequests.getAll();
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  reject_access_request: async function reject_access_request(messageId) {
    try {
      indy.store.pendingAccessRequests.delete(messageId);
      return {
        status: "Success!"
      };
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  accept_access_request: async function accept_access_request(messageId) {
    try {
      let accessRequest = indy.store.pendingAccessRequests.get(messageId);
      indy.store.pendingAccessRequests.delete(messageId);

      let schema_id = accessRequest.request.schema_id;

      //Generate CredDef Tag
      let accessCredDefTag = utils.randomString(4);

      //Create New CredDef for access
      let existing_cred_defs = await definition.get_enriched_credential_definitions();
      let existing_cred_def = undefined;
      for (var i = 0; i < existing_cred_defs.length; i++) {
        cred_def = existing_cred_defs[i];
        if (
          cred_def.tag === accessCredDefTag &&
          cred_def.schemaId_long === schema_id
        ) {
          //cred_def with tag already exist
          existing_cred_def = {
            cred_def_id: cred_def.id
          };
        }
      }

      let credDef;
      if (existing_cred_def === undefined) {
        credDef = await definition.create_cred_defination(
          schema_id,
          accessCredDefTag
        );
      } else {
        accessCredDefTag = utils.randomString(4);
        credDef = await definition.create_cred_defination(
          schema_id,
          accessCredDefTag
        );
      }

      //Send Credential Offer [Access]
      let proverDid = accessRequest.theirEndpointDid;
      let cred_def_id = credDef.cred_def_id;
      let cred_data = schema.access(accessRequest.request);
      let cred_def_tag = accessCredDefTag;

      let their_relationship_did = await connection.get_their_relationship_did(
        proverDid
      );
      let resp = await this.send_credential_offer(
        their_relationship_did,
        cred_def_id,
        JSON.stringify(cred_data),
        cred_def_tag
      );
      return resp;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_credentials: async function get_all_credentials() {
    try {
      let credentials = await indy.credentials.getAll();
      return credentials;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_access_credential: async function get_all_access_credential() {
    try {
      let response = await indy.credentials.getAllAccessCreds();
      return response;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_credential_by_cred_id: async function get_credential_by_cred_id(cred_id) {
    try {
      let credential = await indy.credentials.getCredById(cred_id);
      return credential;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  accept_credential_offer: async function accept_credential_offer(messageId) {
    try {
      let message = indy.store.messages.getMessage(messageId);
      indy.store.messages.deleteMessage(messageId);
      let resp = await indy.credentials.sendRequest(
        message.message.origin,
        message.message.message
      );
      return {
        status: resp
      };
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  reject_credential_offer: async function reject_credential_offer(messageId) {
    try {
      message.decline_message(messageId);
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_credential_def_id: async function get_credential_def_id(schema_id) {
    try {
      let credDefs = await indy.did.getEndpointDidAttribute(
        "credential_definitions"
      );
      for (let credDef of credDefs) {
        if (credDef.schemaId_long === schema_id) {
          return credDef.id;
        }
      }
      return undefined;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  revoke_credential: async function revoke_credential(
    proverEndpointDid,
    revocRegId
  ) {
    try {
      let response = await indy.credentials.revokeCredential(
        proverEndpointDid,
        revocRegId
      );
      return response;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_credential_deltas: async function get_all_credential_deltas(
    prover_did
  ) {
    try {
      let response = await indy.credentials.getAllCredDeltas(prover_did);
      return response;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
};
