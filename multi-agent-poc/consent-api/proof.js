const indy = require('../indy/index');
const message = require('./message');

module.exports = {

    send_proof_request: async function send_proof_request(their_relationship_did, request_entry) {
        try {
            let myDid = await indy.pairwise.getMyDid(their_relationship_did);
            let resp = await indy.proofs.sendRequest(myDid, their_relationship_did, request_entry);
            return {
                "status": resp
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_all_proof_requests: async function get_all_proof_requests() {
        try {
            let rawMessages = await message.get_messages();
            let messages = [];
            for (let msg of rawMessages) {
                if (message.PROOF_MESSAGE_TYPES['REQUEST'] === msg.message.type) {
                    messages.push(msg);
                }
            }
            return messages;
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    accept_proof_request: async function accept_proof_request(messageId) {
        try {
            await indy.proofs.acceptRequest(messageId);
            return {
                "status": "Accepted"
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    reject_proof_request: async function reject_proof_request(messageId) {
        try {
            message.decline_message(messageId);
            return {
                "status": "Rejected"
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_all_proofs: async function get_all_proofs() {
        try {
            let relationships = await indy.pairwise.getAll();
            let proofs = []
            for (let relationship of relationships) {
                if (relationship.metadata.proofs) {
                    let proof_arr = relationship.metadata.proofs;
                    for (let proof of proof_arr) {
                        proofs.push(proof);
                    }
                }
            }
            return proofs;
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    is_proof_valid: async function is_proof_valid(proof) {
        try {
            let validity = false;
            if (await indy.proofs.validate(JSON.parse(proof))) {
                validity = true;
            }
            return {
                "validity": validity
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    rebuild_proof_request: async function rebuild_proof_request(request_id, request_message) {
        //Rebuild
        let new_request = {
            'origin': request_message.origin,
            'type': message.PROOF_MESSAGE_TYPES.REQUEST,
            'message': request_message.orignal_request
        }
        let enhancedMessage = await indy.proofs.prepareRequest(new_request);
        let requestedAttributes = enhancedMessage.message.requestedCreds.requested_attributes;
        if (requestedAttributes.attr1_referent !== undefined) {
            //Delete Old
            indy.store.messages.deleteMessage(request_id);
            //Save New
            let uuid = indy.store.messages.write(request_message.origin, enhancedMessage);
            return {
                "id": uuid,
                "attributes": requestedAttributes
            };
        } else {
            return undefined;
        }
    }


};