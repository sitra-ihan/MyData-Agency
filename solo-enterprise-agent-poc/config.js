'use strict';

const config = {

    // Change to your endpoint did's endpoint
    endpointDidEndpoint: process.env.PUBLIC_DID_ENDPOINT,

    // IP Address of the running ledger
    testPoolIp: process.env.TEST_POOL_IP,

    // the port to run the agent server on
    port: process.env.PORT,

    // Optional: Give your wallet a unique name
    walletName: `${process.env.USERNAME}_wallet`,

    // Optional: Give your pool config a unique name
    poolName: process.env.POOL_NAME || 'pool1',

    // This information is used to issue your "Government ID"
    userInformation: {
        fname: process.env.FIRST_NAME,
        lname: process.env.LAST_NAME,
        orgname: process.env.ORGANIZATION_NAME,
        email: process.env.EMAIL,
        username: process.env.USERNAME,
        password: process.env.PASSWORD
    },

    //Agent type
    agentType: process.env.AGENT_TYPE,

    //Connection to mongo db if using internal CRON data pipeline
    mongoURI: process.env.MONGO_URI,

    //Path to genesis file
    genesisPath: process.env.GENESIS_PATH,

    //Webhook URL to propogate fetch type of consent
    fetchConsentProgoationURL: process.env.FETCH_CONSENT_PROPOGATION_URL,

    //Webhook URL to propogate access type of consent
    accessConsentProgoationURL: process.env.ACCESS_CONSENT_PROPOGATION_URL,

    //Webhook URL to propogate consent revocation
    revokeConsentProgoationURL: process.env.REVOKE_CONSENT_PROPOGATION_URL

};

module.exports = config;