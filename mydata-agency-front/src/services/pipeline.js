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

const Pipeline = {
  /**
   * Create NS Pipeline
   **/

  createCredDef(schema_id, tag) {
    return Vue.axios
      .post("/create_cred_def", {
        grant_type: "password",
        schema_id: schema_id,
        tag: tag
      })
      .then(response => {
        if (response.status == 200) {
          return response.data.cred_def_id;
        } else {
          return response.status;
        }
      })
      .catch(error => this.requestFailed(error.response.data));
  },

  createNSPipeline(service_name, endpoint, port, endpoint_token, cred_def_id) {
    return Vue.axios
      .post("/service/register", {
        grant_type: "password",
        service_name: service_name,
        endpoint: endpoint,
        port: port,
        endpoint_token: endpoint_token,
        refresh_token: "none",
        cred_def_id: cred_def_id
      })
      .then(response => {
        if (response.status == 200) {
          return response.data.service_id;
        } else {
          return response.status;
        }
      })
      .catch(error => this.this.requestFailed(error.response.data));
  },

  createServiceRegistryToken() {
    return Vue.axios
      .get("/get_service_registery_token", {
        grant_type: "password"
      })
      .then(response => {
        if (response.status == 200) {
          return response.data.access_token;
        } else {
          return response.status;
        }
      })
      .catch(error => this.requestFailed(error.response.data));
  },

  /**
   * Get Pipelines
   **/
  getPipelines(did) {
    return Vue.axios
      .get("/get_all_services_by_did?did=" + did, {
        grant_type: "password"
      })
      .then(response => {
        if (response.status == 200) {
          store.state.pipelines = [];
          store.state.pipelineListString = [];
          response.data.forEach(element => {
            let serviceId = element.service_id;
            let serviceName = element.service_name;
            let serviceEndpoint = element.endpoint;
            let serviceCredDefId = element.cred_def_id;
            var obj = {
              name: serviceName,
              pipelineID: serviceId,
              pipelineEndpoint: serviceEndpoint,
              credID: serviceCredDefId
            };
            store.state.pipelines.push(obj);
            store.state.pipelineListString.push(
              serviceId + " (" + serviceName + ")"
            );
          });
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch(error => this.requestFailed(error.response.data));
  },

  getPipelinesById(serviceId) {
    return Vue.axios
      .get("/get_service_by_id?service_id=" + serviceId, {
        grant_type: "password"
      })
      .then(response => {
        if (response.status == 200) {
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch(error => this.requestFailed(error.response.data));
  },

  updatePipeline(service_id, endpoint, port, token) {
    return Vue.axios
      .post("/service/update", {
        grant_type: "password",
        service_id: service_id,
        endpoint: endpoint,
        port: port,
        token: token
      })
      .then(response => {
        if (response.status == 200) {
          return 200;
        } else {
          return response.status;
        }
      })
      .catch(error => this.requestFailed(error.response.data));
  },

  requestFailed(error) {
    if (error.message == "Invalid Token") {
      User.logout();
    } else {
      return error;
    }
  }
};

export default Pipeline;
export { Pipeline, AuthenticationError };
