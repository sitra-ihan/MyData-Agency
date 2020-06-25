import Vue from "vue";
// import { TokenService } from "../services/storage.js";
// import router from "../router";
import store from "../store/index.js";
import User from "../services/user.js";

class AuthenticationError extends Error {
  constructor(errorCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errorCode = errorCode;
  }
}

const Connection = {
  /**
   * Create Connection
   **/
  createConnection(did) {
    return Vue.axios
      .post("/create_connection", {
        grant_type: "password",
        did: did,
      })
      .then((response) => {
        if (response.status == 200) {
          // router.push("/connections");
          return response.status;
        } else {
          return response.status;
        }
      })
      .catch((error) => this.requestFailed(error.response.data));
  },

  /**
   * Get Connections
   **/
  getConnections() {
    return Vue.axios
      .get("/get_connections", {
        grant_type: "password",
      })
      .then((response) => {
        if (response.status == 200) {
          store.state.connectionsList = [];
          store.state.connectionsListString = [];
          response.data.forEach((element) => {
            let theirEndpoint = element.metadata.theirEndpointDid;
            let theirOrgName = element.metadata.organizationName;
            var obj = {
              name: theirOrgName,
              endpoint: theirEndpoint,
            };
            store.state.connectionsList.push(obj);
            store.state.connectionsListString.push(
              theirEndpoint + " (" + theirOrgName + ")"
            );
          });
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch((error) => {
        this.requestFailed(error.response.data);
      });
  },

  requestFailed(error) {
    if (error.message == "Invalid Token") {
      User.logout();
    } else {
      return error;
    }
  },
};

export default Connection;
export { Connection, AuthenticationError };
