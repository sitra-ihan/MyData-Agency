const indy = require("indy-sdk");

async function postRevocRegDefRequestToLedger(
  poolHandle,
  wallet,
  did,
  revRegDef
) {
  const revocRegRequest = await indy.buildRevocRegDefRequest(did, revRegDef);
  await ensureSignAndSubmitRequest(poolHandle, wallet, did, revocRegRequest);
}

async function postRevocRegEntryRequestToLedger(
  poolHandle,
  wallet,
  did,
  revRegDefId,
  revRegEntry
) {
  const revocRegEntryRequest = await indy.buildRevocRegEntryRequest(
    did,
    revRegDefId,
    "CL_ACCUM",
    revRegEntry
  );
  await ensureSignAndSubmitRequest(
    poolHandle,
    wallet,
    did,
    revocRegEntryRequest
  );
}

async function getRevocRegDefFromLedger(poolHandle, did, revRegDefId) {
  const getRevocRegDefRequest = await indy.buildGetRevocRegDefRequest(
    did,
    revRegDefId
  );
  const getRevocRegDefResponse = await ensureSubmitRequest(
    poolHandle,
    getRevocRegDefRequest
  );
  const [, revRegDef] = await indy.parseGetRevocRegDefResponse(
    getRevocRegDefResponse
  );
  return revRegDef;
}

async function getRevocRegDeltaFromLedger(
  poolHandle,
  did,
  revRegDefId,
  from,
  to
) {
  const getRevocRegDeltaRequest = await indy.buildGetRevocRegDeltaRequest(
    did,
    revRegDefId,
    from,
    to
  );
  const getRevocRegDeltaResponse = await ensureSubmitRequest(
    poolHandle,
    getRevocRegDeltaRequest
  );
  const [, revRegDelta, timestamp] = await indy.parseGetRevocRegDeltaResponse(
    getRevocRegDeltaResponse
  );
  return [revRegDelta, timestamp];
}

async function getRevocRegFromLedger(poolHandle, did, revRegDefId, timestamp_) {
  const getRevocRegRequest = await indy.buildGetRevocRegRequest(
    did,
    revRegDefId,
    timestamp_
  );
  const getRevocRegResponse = await ensureSubmitRequest(
    poolHandle,
    getRevocRegRequest
  );
  const [, revReg, timestamp] = await indy.parseGetRevocRegResponse(
    getRevocRegResponse
  );
  return [revReg, timestamp];
}

async function ensureSubmitRequest(poolHandle, request) {
  const response = await indy.submitRequest(poolHandle, request);
  checkResponse(response);
  return response;
}

async function ensureSignAndSubmitRequest(poolHandle, wallet, did, request) {
  const response = await indy.signAndSubmitRequest(
    poolHandle,
    wallet,
    did,
    request
  );
  checkResponse(response);
  return response;
}

function checkResponse(response) {
  if (!response) {
    throw new Error(
      "ERROR in 'ensurePreviousRequestApplied' : response is undefined !"
    );
  }
  if (response.op === "REJECT") {
    throw new Error(
      "ERROR in 'ensurePreviousRequestApplied' : response.op is " +
        response.op +
        " and must be REPLY. Reason : " +
        response.reason
    );
  }
  if (response.op !== "REPLY") {
    throw new Error(
      "ERROR in 'ensurePreviousRequestApplied' : response.op is " +
        response.op +
        " and must be REPLY"
    );
  }
  if (!response.result) {
    throw new Error(
      "ERROR in 'ensurePreviousRequestApplied' : response.result is undefined ! response=" +
        JSON.stringify(response)
    );
  }
}

module.exports = {
  postRevocRegDefRequestToLedger,
  postRevocRegEntryRequestToLedger,
  getRevocRegDefFromLedger,
  getRevocRegDeltaFromLedger,
  getRevocRegFromLedger
};
