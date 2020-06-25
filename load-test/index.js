var Spinner = require("cli-spinner").Spinner;
var faker = require("faker");
var figlet = require("figlet");
var readline = require("readline-sync");
var action = require("./actions");
var { logEvent, logResult, logAction } = require("./utils.js");
var {
  AG_URL,
  EA_URL,
  EA_username,
  EA_password,
  EA_DID,
  SERVICE_ENDPOINT,
  SERVICE_PORT,
  SERVICE_ENDPOINT_TOKEN,
  AG_IP,
  AG_PORT
} = require("./config.js");

var usernames = [];
var passwords = [];
var agency_dids = [];
var agency_tokens = [];
var schemaIds = [];
var tags = [];
var credDefs = [];
var serviceIds = [];

async function testSchemaCreation(n) {
  logEvent("\nInitating " + n + " Schemas creation on Enterprise Agent!");
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  var hrstart = process.hrtime();

  let attributes = [
    "service_id",
    "agent_endpoint",
    "data_endpoint",
    "port",
    "counterparty_public_key",
    "counterparty_public_did",
    "type",
    "data"
  ];

  let resp = await action.authenticateEA(EA_URL, EA_username, EA_password);
  var i;
  for (i = 0; i < n; i++) {
    let schemaId = await action.createSchema(
      EA_URL,
      resp[1],
      faker.lorem.word() + "-consent",
      "1.0",
      JSON.stringify(attributes)
    );
    schemaIds.push(schemaId);
    // console.log(schemaId);
  }
  let hrend = process.hrtime(hrstart);
  let avgSeconds = hrend[0] / n;
  spinner.stop(true);
  logResult(
    "Average Schema Creation time over " + n + " schemas: " + avgSeconds + "s "
  );

  logAction(
    "Total Schema Creation time of " +
      n +
      " schemas: " +
      hrend[0] +
      "s " +
      hrend[1] / 1000000 +
      " ms"
  );
}

async function testWalletCreationAndOpen(n) {
  var i;
  var hrstart = process.hrtime();
  logEvent("\nInitating " + n + " Wallet creation on Agency!");
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  for (i = 0; i < n; i++) {
    let username =
      faker.name.firstName().toLowerCase() +
      faker.name.lastName().toLowerCase();
    let passphrase = faker.internet.password();
    let respx = await action.createWallet(AG_URL, username, passphrase);
    usernames.push(username);
    passwords.push(passphrase);
  }
  let hrend = process.hrtime(hrstart);
  let avgSeconds = hrend[0] / n;
  spinner.stop(true);
  logResult(
    "Average Wallet Creation time over " + n + " wallets: " + avgSeconds + "s "
  );
  logAction(
    "Total Wallet Creation time of " +
      n +
      " wallets: " +
      hrend[0] +
      "s " +
      hrend[1] / 1000000 +
      " ms"
  );

  //========================================================================
  logEvent("\n\nInitating " + n + " Wallet Access on Agency!");
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  var hrstart2 = process.hrtime();
  for (i = 0; i < n; i++) {
    let resp = await action.openWallet(AG_URL, usernames[i], passwords[i]);
    agency_dids.push(resp[2]);
    agency_tokens.push(resp[3]);
  }

  let hrend2 = process.hrtime(hrstart2);
  avgSeconds = hrend2[0] / n;
  spinner.stop(true);

  logResult(
    "Average Wallet Access time over " + n + " wallets: " + avgSeconds + "s "
  );
  logAction(
    "Total wallet Access time of " +
      n +
      " wallets: " +
      hrend2[0] +
      "s " +
      hrend2[1] / 1000000 +
      " ms"
  );
}

async function testCreateConnection(n) {
  var i;
  logEvent(
    "\nInitating " + n + " Connections creation from Agency toward Entperise!"
  );
  var hrstart2 = process.hrtime();
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  for (i = 0; i < n; i++) {
    let resp = await action.createConnection(AG_URL, agency_tokens[i], EA_DID);
  }

  let hrend2 = process.hrtime(hrstart2);
  avgSeconds = hrend2[0] / n;
  spinner.stop(true);

  logResult(
    "Average Connection Request time over " +
      n +
      " requests: " +
      avgSeconds +
      "s "
  );
  logAction(
    "Total requests time of " +
      n +
      " requests: " +
      hrend2[0] +
      "s " +
      hrend2[1] / 1000000 +
      " ms"
  );
}

async function testCreateCredDef(n) {
  var i;
  logEvent("\nInitating " + n + " Credential Defination Creation on Agency!");
  var hrstart2 = process.hrtime();
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  for (i = 0; i < n; i++) {
    let tag = faker.address.countryCode() + faker.random.number();
    let credDefId = await action.createCredDef(
      AG_URL,
      agency_tokens[i],
      schemaIds[i],
      tag
    );
    //console.log(credDefId);
    tags.push(tag);
    credDefs.push(credDefId);
  }

  let hrend2 = process.hrtime(hrstart2);
  avgSeconds = hrend2[0] / n;
  spinner.stop(true);

  logResult(
    "Average Cred Def creation time over " +
      n +
      " CredDefs: " +
      avgSeconds +
      "s "
  );
  logAction(
    "Total Cred Def creation time of " +
      n +
      " CredDefs: " +
      hrend2[0] +
      "s " +
      hrend2[1] / 1000000 +
      " ms"
  );
}

async function testServiceRegistration(n) {
  var i;
  logEvent("\nInitating " + n + " Service registrations at Agency");
  var hrstart2 = process.hrtime();
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  for (i = 0; i < n; i++) {
    let service_id = await action.registerService(
      AG_URL,
      agency_tokens[i],
      faker.lorem.word(),
      SERVICE_ENDPOINT,
      SERVICE_ENDPOINT_TOKEN,
      SERVICE_PORT,
      credDefs[i]
    );
    //console.log(service_id);
    serviceIds.push(service_id);
  }

  let hrend2 = process.hrtime(hrstart2);
  avgSeconds = hrend2[0] / n;
  spinner.stop(true);

  logResult(
    "Average service creation time over " +
      n +
      " services: " +
      avgSeconds +
      "s "
  );
  logAction(
    "Total service creation time of " +
      n +
      " services: " +
      hrend2[0] +
      "s " +
      hrend2[1] / 1000000 +
      " ms"
  );
}

async function testCredentialOffer(n) {
  var i;
  logEvent(
    "\nInitating " +
      n +
      " Credential Offers from Agency toward Enterprise Agent!"
  );
  var hrstart2 = process.hrtime();
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  for (i = 0; i < n; i++) {
    let credOfferStatus = await action.sendCredOffer(
      AG_URL,
      agency_tokens[i],
      EA_DID,
      credDefs[i],
      tags[i],
      serviceIds[i],
      AG_IP,
      "/ns",
      AG_PORT
    );
    // console.log(credOfferStatus);
  }

  let hrend2 = process.hrtime(hrstart2);
  avgSeconds = hrend2[0] / n;
  spinner.stop(true);

  logResult(
    "Average credential offer request time over " +
      n +
      " requests: " +
      avgSeconds +
      "s "
  );
  logAction(
    "Total credential offer requests time of " +
      n +
      " requests: " +
      hrend2[0] +
      "s " +
      hrend2[1] / 1000000 +
      " ms"
  );
}

async function testProofRequest(n) {
  var i;
  logEvent(
    "\nInitating " + n + " Proof Requests from Agency toward Enterprise Agent!"
  );
  var hrstart2 = process.hrtime();
  var spinner = new Spinner("%s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();
  for (i = 0; i < n; i++) {
    let proofReqStatus = await action.sendProofRequest(
      AG_URL,
      agency_tokens[i],
      EA_DID,
      credDefs[i]
    );
    // console.log(proofReqStatus);
  }

  let hrend2 = process.hrtime(hrstart2);
  avgSeconds = hrend2[0] / n;
  spinner.stop(true);

  logResult(
    "Average proof request time over " + n + " requests: " + avgSeconds + "s "
  );
  logAction(
    "Total proof requests time of " +
      n +
      " requests: " +
      hrend2[0] +
      "s " +
      hrend2[1] / 1000000 +
      " ms"
  );
}

async function main() {
  var stressLevel = 1;
  await figlet("Consent Project\nStress Test!!", function(err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
    stressLevel = readline.question("Enter Stress Level (10 - 1000000): ");
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("");
  await testSchemaCreation(stressLevel);
  console.log("");
  await testWalletCreationAndOpen(stressLevel);
  console.log("");
  await testCreateConnection(stressLevel);
  console.log("");
  await testCreateCredDef(stressLevel);
  console.log("");
  await testServiceRegistration(stressLevel);
  console.log("");
  await testCredentialOffer(stressLevel);
  console.log("");
  await testProofRequest(stressLevel);
  console.log("");
}

main();
