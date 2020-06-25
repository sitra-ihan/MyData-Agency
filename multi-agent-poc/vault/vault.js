const config = require("./config");
var vault = require("node-vault")(config.OPTIONS);

async function init() {
  if (!process.env.VAULT_LOGIN_STATUS) {
    //console.log("Authenticating Vault for Agency!");
    await login(config.VAULT_USERNAME, config.VAULT_PASSWORD);
  }
}

async function login(username, password) {
  await vault
    .userpassLogin({ username, password })
    .then(() => {
      process.env.VAULT_LOGIN_STATUS = "true";
    })
    .catch(error => "Vault " + console.error(error.message));
}

async function write(path, data) {
  await init();
  return vault.write(path, { value: data }).catch(error => {
    console.error("Vault " + error.message);
    return 400;
  });
}

async function read(path) {
  await init();
  return await vault.read(path).catch(error => {
    console.error("Vault " + error.message);
    return 400;
  });
}

async function remove(path) {
  await init();
  return await vault.delete(path).catch(error => {
    console.error("Vault " + error.message);
    return 400;
  });
}

module.exports = {
  write,
  read,
  remove
};
