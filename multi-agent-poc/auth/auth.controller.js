var httpContext = require("express-http-context");
const express = require("express");
const router = express.Router();
const authService = require("./auth.service");
const wallet = require("../indy/src/wallet");
const pool = require("../indy/src/pool");
var httpContext = require("express-http-context");
const accessType = require("../_helpers/accessTypes");

router.post("/revoke_jwt", revoke);

router.post("/create_wallet", createWallet);

router.post("/open_wallet", openWallet);

router.get("/get_endpoint", getEndpoint);

function revoke(req, res, next) {
  authService
    .revokeToken(req, res)
    .then((response) =>
      response
        ? res.status(200).json({
            message: "Token revoked successfully!",
          })
        : res.status(400).json({
            message: "Error! token is still valid",
          })
    )
    .catch((err) => next(err));
}

async function createWallet(req, res, next) {
  try {
    if (req.body.walletName !== "" && req.body.passphrase !== "") {
      await wallet.createWallet(req.body.walletName, req.body.passphrase);
      res.status(202).send({
        status: 202,
        message: "wallet created successfully!",
      });
    } else {
      res.status(400).send({
        status: 400,
        error: "empty username or password!",
      });
    }
  } catch (error) {
    res.status(400).send({
      status: 400,
      error: error,
    });
  }
}

async function openWallet(req, res, next) {
  try {
    let token_type = "Bearer";
    let expires_in = "12h";
    if (req.body.walletName !== "" && req.body.passphrase !== "") {
      httpContext.set("walletName", req.body.walletName);
      let walletHandle = await wallet.openWallet(
        req.body.walletName,
        req.body.passphrase
      );
      if (walletHandle === undefined) {
        throw Error("Wallet Inaccessible!");
      }
      let did = await wallet.createDidForWallet(
        walletHandle,
        req.body.walletName,
        req.body.passphrase
      );
      if (did) {
        const token = authService.issueToken(
          {
            sub: did,
            accessType: accessType.AUTH,
          },
          expires_in
        );
        res.status(200).send({
          public_did: did,
          access_token: token,
          token_type: token_type,
          expires_in: expires_in,
        });
      } else {
        res.status(400).send({
          status: 400,
          error: "Wallet vault error, contact administrator!",
        });
      }
    } else {
      res.status(400).send({
        status: 400,
        error: "empty username or password!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({
      status: 400,
      error: error,
    });
  }
}

async function getEndpoint(req, res, next) {
  try {
    let did = await pool.getEndpointForDid(req.query.did);
    res.status(202).send({
      endpoint: did,
    });
  } catch (error) {
    res.status(400).send({
      status: 400,
      error: error,
    });
  }
}

module.exports = router;
