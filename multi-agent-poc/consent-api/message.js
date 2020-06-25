const indy = require('../indy/index');

module.exports = {

    CRED_MESSAGE_TYPES: CRED_MESSAGE_TYPES = {
        OFFER: "urn:sovrin:agent:message_type:sovrin.org/credential_offer",
        ACCESS: "urn:sovrin:agent:message_type:sovrin.org/access_request",
        REQUEST: "urn:sovrin:agent:message_type:sovrin.org/credential_request",
        CREDENTIAL: "urn:sovrin:agent:message_type:sovrin.org/credential"
    },

    PROOF_MESSAGE_TYPES: PROOF_MESSAGE_TYPES = {
        REQUEST: "urn:sovrin:agent:message_type:sovrin.org/proof_request"
    },

    get_messages: async function get_messages() {
        try {
            let rawMessages = indy.store.messages.getAll();
            return rawMessages;
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_message_byId: async function get_message_byId(messageId) {
        try {
            return indy.store.messages.getMessage(messageId);
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    decline_message: async function decline_message(messageId) {
        try {
            indy.store.messages.deleteMessage(messageId);
            return true;
        } catch (error) {
            console.error(error);
            return error;
        }
    }

};