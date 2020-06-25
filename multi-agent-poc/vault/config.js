const VAULT_API_VERSION = "v1";
const VAULT_ENDPOINT = process.env.VAULT_ENDPOINT;
const VAULT_USERNAME = process.env.VAULT_USERNAME;
const VAULT_PASSWORD = process.env.VAULT_PASSWORD;
const VAULT_SECRET = "secret/";

var OPTIONS = {
  apiVersion: VAULT_API_VERSION,
  endpoint: VAULT_ENDPOINT
};

module.exports = {
  OPTIONS,
  VAULT_SECRET,
  VAULT_USERNAME,
  VAULT_PASSWORD
};
