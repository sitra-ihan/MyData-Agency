const config = require("../config");
var loki = require("lokijs");
const homedir = require("home-dir");
const fs = require("fs");
const path = homedir("/.indy_client/");
const LokiFSStructuredAdapter = require("lokijs/src/loki-fs-structured-adapter");
const rsa = require("../keys/rsa");
var uuid = require("uuid");

if (!fs.existsSync(path)) {
  fs.mkdirSync(path);
}

let user_db = new loki(path + config.agentType + "_user_v2.json", {
  verbose: true,
  autosave: true,
  // autoload: true,
  autosaveInterval: 1000,
  adapter: new LokiFSStructuredAdapter(),
  // autoloadCallback: databaseInitialize
  autosaveCallback: () => {
    console.log("autosaved db");
  }
});

let services_db = new loki(path + config.agentType + "_services_v2.json", {
  verbose: true,
  autosave: true,
  // autoload: true,
  autosaveInterval: 1000,
  adapter: new LokiFSStructuredAdapter(),
  // autoloadCallback: databaseInitialize
  autosaveCallback: () => {
    console.log("autosaved db");
  }
});

function serviceDatabaseInitialize(cb) {
  let entries = services_db.getCollection("services");

  if (entries === null) {
    console.log("services collection is empty, ADDING new collection services");
    entries = services_db.addCollection("services", { unique: ["id"] });
    services_db.saveDatabase();
  } else {
    console.log("Loading persisted collection!");
  }
  // cb();
}

function userDatabaseInitialize(cb) {
  let entries = user_db.getCollection("users");

  if (entries === null) {
    console.log("users collection is empty, ADDING new collection users");
    entries = user_db.addCollection("users", { unique: ["id"] });
    entries.insert({
      user_id: uuid.v4(),
      first_name: config.userInformation.fname,
      last_name: config.userInformation.lname,
      email: config.userInformation.email,
      username: config.userInformation.username,
      password: rsa.encryptMessage(config.userInformation.password)
    });
    user_db.saveDatabase();
  } else {
    console.log("Loading persisted collection!");
  }
  // cb();
}

const loadUserDb = cb => {
  user_db.loadDatabase({}, function(err) {
    if (err) {
      console.error("user db load errors", err);
    } else {
      userDatabaseInitialize();
    }
  });
};

const loadServiceDb = cb => {
  services_db.loadDatabase({}, function(err) {
    if (err) {
      console.error("service db load errors", err);
    } else {
      serviceDatabaseInitialize();
    }
  });
};

loadUserDb();
loadServiceDb();

module.exports = {
  user_db,
  services_db
};
