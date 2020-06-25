"use strict";
var httpContext = require("express-http-context");
const sdk = require("indy-sdk");
const indy = require("../../index");
const pool = require("../pool");
const did = require("../did");

const config = require("../../../config");
const vault = require("../../../vault/vault");
const vaultConfig = require("../../../vault/config");

exports.wallets = {};
exports.endpointDids = {};

// *********************** Multi-wallet handling *************************

exports.get = async function () {
  try {
    var walletName = httpContext.get("walletName"); //Get walletName of user with current session/request
    let wallet = await exports.getByName(walletName);
    if (!wallet) {
      console.warn("Wallet is not opened, open wallet and try again!");
      return undefined;
    }
    return wallet;
  } catch (e) {
    console.warn("Wallet Error:" + e);
    return undefined;
  }
};

exports.getByName = async function (walletName) {
  try {
    if (walletName in exports.wallets) {
      return exports.wallets[walletName];
    } else {
      return undefined;
    }
  } catch (e) {
    console.warn("Wallet is not open Error: " + e);
    return undefined;
  }
};

exports.getWalletNameByEndpointDid = async function (endpointDid) {
  try {
    if (endpointDid in exports.endpointDids) {
      return exports.endpointDids[endpointDid];
    } else {
      let vaultSecret = await vault.read(
        vaultConfig.VAULT_SECRET + endpointDid
      );

      if (vaultSecret == 400) {
        return undefined;
      }

      let secretJSON = JSON.parse(vaultSecret.data.value);
      exports.endpointDids[endpointDid] = secretJSON.walletName;

      await exports.openWallet(
        secretJSON.walletName,
        secretJSON.walletPassphrase
      );
      return exports.endpointDids[endpointDid];
    }
  } catch (e) {
    console.warn("Endpoint DID may not exist for wallet! Error: " + e);
    return undefined;
  }
};

exports.createOpenWallet = async function (walletName, passphrase, walletType) {
  try {
    await exports.createWallet(walletName, passphrase);
    let walletHandle = await exports.openWallet(
      walletName,
      passphrase,
      walletType
    );
    let did = await exports.createDidForWallet(walletHandle, walletName);
    return did;
  } catch (e) {
    console.warn("Error: " + e.message);
  }
};

exports.createWallet = async function (walletName, passphrase) {
  try {
    await sdk.createWallet({ id: walletName }, { key: passphrase });
    console.log("wallet created successfully!");
  } catch (e) {
    if (e.message !== "WalletAlreadyExistsError") {
      console.warn("create wallet failed with message: " + e.message);
    }
  }
};

exports.openWallet = async function (walletName, passphrase, walletType) {
  try {
    let resp = await sdk.openWallet({ id: walletName }, { key: passphrase });
    if (Number.isInteger(resp)) {
      exports.wallets[walletName] = resp;
      console.log("wallet '" + walletName + "' opened successfully!");
      return exports.wallets[walletName];
    } else {
      throw Error("Invalid username or password!");
    }
  } catch (e) {
    let walletResponse = undefined;
    if (e.indyName === "WalletAlreadyOpenedError") {
      await sdk.closeWallet(exports.wallets[walletName]);
      exports.wallets[walletName] = await sdk.openWallet(
        { id: walletName },
        { key: passphrase }
      );
      walletResponse = exports.wallets[walletName];
    } else {
      console.warn("Cannot open wallet: " + e.message);
    }
    return walletResponse;
  }
};

exports.createDidForWallet = async function (
  walletHandle,
  walletName,
  walletPassphrase
) {
  //Create DID for wallet
  let endpointDid = await did.getEndpointDid(); // Creates it if it doesn't exist
  exports.endpointDids[endpointDid] = walletName;

  //Associate DID with the HTTP URL+PORT ENDPOINT (config.endpointDidEndpoint)
  await pool.setEndpointForDid(endpointDid, config.endpointDidEndpoint);
  console.log(
    "Endpoint:" + config.endpointDidEndpoint + " create for DID:" + endpointDid
  );

  let vaultWrite = await vault.write(
    vaultConfig.VAULT_SECRET + endpointDid,
    JSON.stringify({
      walletName: walletName,
      walletPassphrase: walletPassphrase,
    })
  );
  if (vaultWrite == 400) {
    // this.closeWallet(walletHandle);
    return undefined;
  }

  //HOTFIX: To onboard previous wallets to vault (Need to be removed in later builds after old wallets are migrated)
  let relationships = await indy.pairwise.getAll();
  for (let relationship of relationships) {
    //Write username & passphrase to vault for each relationship of user
    let vaultWrite2 = await vault.write(
      vaultConfig.VAULT_SECRET + relationship.my_did,
      JSON.stringify({
        walletName: walletName,
        walletPassphrase: walletPassphrase,
      })
    );
    if (vaultWrite2 == 400) {
      // this.closeWallet(walletHandle);
      return undefined;
    }
  }

  return endpointDid;
};

exports.closeWallet = async function (walletHandle) {
  try {
    await sdk.closeWallet(walletHandle);
  } catch (e) {
    console.warn("wallet close failed with message: " + e.message);
  }
};
