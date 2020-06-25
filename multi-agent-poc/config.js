'use strict';

const config = {

    // Change to your endpoint did's endpoint
    endpointDidEndpoint: process.env.PUBLIC_DID_ENDPOINT,

    // IP Address of the running ledger
    testPoolIp: process.env.TEST_POOL_IP,

    // the port to run the agent server on
    port: process.env.PORT,

    // Optional: Give your pool config a unique name
    poolName: process.env.POOL_NAME || 'pool1',

    agentType: 'agency',

    mongoURI: process.env.MONGO_URI,

    genesisPath: process.env.GENESIS_PATH
};

module.exports = config;