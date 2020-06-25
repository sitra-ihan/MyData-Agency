const jwt = require("jsonwebtoken");
var blacklist = require("express-jwt-blacklist");
const rsa = require("../keys/rsa");
const proofs = require("../consent-api/proof");
const store = require("../storage/services");
const accessType = require("../_helpers/accessTypes");
const wellknown = require("../keys/well-known");

//Generate Agency Keys
rsa.RSAKeyPair();

//Create .well-known/jwks.json
wellknown.createJWKS();

module.exports = {
  issueToken,
  verifyToken,
  revokeToken,
  revokeTokenByToken,
  getServiceRegisterationToken,
  authenticate_agent
};

function issueToken(payload, expiry) {
  if (expiry === undefined) {
    expiry = "1h";
  }
  let key = rsa.RSAKeyBuffer();
  return jwt.sign(payload, key.private, {
    algorithm: "RS256",
    expiresIn: expiry
  });
}

function verifyToken(token, publicKey) {
  return jwt.verify(token, publicKey, {
    algorithms: "RS256"
  });
}

async function revokeToken(req, res) {
  blacklist.revoke(req.user);
  return {
    status: "revoked"
  };
}

async function revokeTokenByToken(token) {
  blacklist.revoke(token);
  return {
    status: "revoked"
  };
}

async function getServiceRegisterationToken(req) {
  let token = req.headers["authorization"].split(" ")[1];
  let key = rsa.RSAKeyBuffer();
  decodedToken = verifyToken(token, key.public);
  let token_expiry = "600s";
  //Issue service registeration token
  return {
    status: "success",
    token_type: "Bearer",
    expires_in: token_expiry,
    access_token: issueToken(
      {
        sub: decodedToken.sub,
        accessType: accessType.SERVICE
      },
      token_expiry
    )
  };
}

async function authenticate_agent(auth) {
  //Check if proof exsists
  let proofsList = await proofs.get_all_proofs();
  let selected_proof = undefined;
  for (const proofObj of proofsList) {
    if (
      auth.service_id ===
      proofObj.requested_proof.revealed_attrs.attr1_referent.raw
    ) {
      selected_proof = proofObj;
      break;
    }
  }

  if (selected_proof !== undefined) {
    //Validate proof
    let proof = await proofs.is_proof_valid(JSON.stringify(selected_proof));
    if (proof.validity) {
      let token_expiry = "1h";

      //Invalidate any previous data access token before issuing the new one
      let service = store.get_service_by_id(auth.service_id);
      if (
        service[0].active_data_access_token != "(none)" &&
        service[0].active_data_access_token != undefined
      ) {
        let key = rsa.RSAKeyBuffer();
        try {
          let decodedDataToken = verifyToken(
            service[0].active_data_access_token,
            key.public
          );
          await revokeTokenByToken(decodedDataToken);
        } catch (error) {
          if (
            error.message == "jwt expired" ||
            error.message == "jwt must be provided"
          ) {
            //Do nothing
          } else {
            console.log(error.message);
            return {
              status: "error",
              message: error.message
            };
          }
        }
      }

      //Issue data access token
      let data_access_token = issueToken(
        {
          sub: auth.did,
          serviceId: auth.service_id,
          accessType: accessType.DATA
        },
        token_expiry
      );

      //Update token for user service
      store.update_active_data_access_token(auth.service_id, data_access_token);

      //Return token
      return {
        status: "success",
        token_type: "Bearer",
        expires_in: token_expiry,
        access_token: data_access_token
      };
    } else {
      return {
        status: "error",
        message: "proof-invalid"
      };
    }
  } else {
    return {
      status: "error",
      message: "proof-non-existent"
    };
  }
}
