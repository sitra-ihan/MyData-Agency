const config = require("../config");
const homedir = require("home-dir");
const fs = require("fs");
const path = homedir("/.indy_client/");
var loki = require("lokijs");
const LokiFSStructuredAdapter = require("lokijs/src/loki-fs-structured-adapter");

if (!fs.existsSync(path)) {
  fs.mkdirSync(path);
}

let services_db = new loki(path + config.agentType + "_services_v2.json", {
  verbose: true,
  autosave: true,
  // autoload: true,
  autosaveInterval: 1000,
  adapter: new LokiFSStructuredAdapter(),
  // autoloadCallback: databaseInitialize
  autosaveCallback: () => {
    // console.log("autosaved db");
  }
});

function databaseInitialize(cb) {
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

const loadDb = cb => {
  services_db.loadDatabase({}, function(err) {
    if (err) {
      console.error("db load errors", err);
    } else {
      databaseInitialize();
    }
  });
};

loadDb();

module.exports = {
  services_db
};
