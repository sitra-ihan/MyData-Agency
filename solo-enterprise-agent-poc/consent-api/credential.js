const indy = require("../indy/index");
const message = require("./message");
const rsa = require("../keys/rsa");

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

  send_access_credential_offer: async function send_access_credential_offer(
    their_did,
    payload
  ) {
    try {
      let resp = await indy.credentials.sendAccessOffer(their_did, payload);
      return {
        status: resp
      };
    } catch (error) {
      console.error(error);
      return {
        status: "error",
        message: error
      };
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

  get_all_credentials: async function get_all_credentials() {
    try {
      let credentials = await indy.credentials.getAll();
      return credentials;
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
    credDefId,
    credDeltaNonce
  ) {
    try {
      let response = await indy.credentials.revokeCredential(
        proverEndpointDid,
        credDefId,
        credDeltaNonce
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
