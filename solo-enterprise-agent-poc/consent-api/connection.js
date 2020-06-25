const indy = require('../indy/index');

module.exports = {

    send_connection_request: async function send_connection_request(did) {
        try {
            let theirEndpointDid = did;
            let connectionRequest = await indy.connections.prepareRequest(theirEndpointDid);
            let response = await indy.crypto.sendAnonCryptedMessage(theirEndpointDid, connectionRequest);
            return {
                "status": response
            };
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    get_all_connections: async function get_all_connections() {
        try {
            return await indy.pairwise.getAll();
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_their_relationship_did: async function get_their_relationship_did(their_public_did) {
        try {
            let pairwise_list = await indy.pairwise.getAll();
            for (i = 0; i < pairwise_list.length; i++) {
                if (pairwise_list[i].metadata.theirEndpointDid === their_public_did) {
                    return pairwise_list[i].their_did;
                }
            }
            return undefined;
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_my_relationship_did: async function get_my_relationship_did(their_public_did) {
        try {
            let pairwise_list = await indy.pairwise.getAll();
            for (i = 0; i < pairwise_list.length; i++) {
                if (pairwise_list[i].metadata.theirEndpointDid === their_public_did) {
                    return pairwise_list[i].my_did;
                }
            }
            return undefined;
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_agent_did: async function get_agent_did() {
        try {
            let did = await indy.did.getEndpointDid()
            return {
                "public_did": did
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    }

};