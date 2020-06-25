let config = require('../config');

const FETCH_CONSENT_PROPOGATION_URL = config.fetchConsentProgoationURL;
const ACCESS_CONSENT_PROPOGATION_URL = config.accessConsentProgoationURL;
const REVOKE_CONSENT_PROPOGATION_URL = config.revokeConsentProgoationURL;

module.exports = {
    FETCH_CONSENT_PROPOGATION_URL,
    ACCESS_CONSENT_PROPOGATION_URL,
    REVOKE_CONSENT_PROPOGATION_URL
}