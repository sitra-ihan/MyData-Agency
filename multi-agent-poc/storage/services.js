var store = require("./store");

// Collections
var services_db = store.services_db;

module.exports = {
  register_service: function register_service(
    service_id,
    service_name,
    endpoint,
    port,
    endpoint_token,
    refresh_token,
    issued_token,
    cred_def_id,
    identity_holder_key,
    identity_holder_did
  ) {
    try {
      var services = services_db.getCollection("services");
      services.insert({
        service_id: service_id,
        service_name: service_name,
        endpoint: endpoint,
        port: port,
        endpoint_token: endpoint_token,
        refresh_token: refresh_token,
        issued_token: issued_token,
        active_data_access_token: "(none)",
        cred_def_id: cred_def_id,
        identity_holder_key: identity_holder_key,
        identity_holder_did: identity_holder_did
      });
      services_db.saveDatabase();
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  unregister_service: function unregister_service(service_id) {
    try {
      var services = services_db.getCollection("services");
      services
        .chain()
        .find({
          service_id: service_id
        })
        .remove();
      services_db.saveDatabase();
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_service_by_id: function get_service_by_id(service_id) {
    try {
      var services = services_db.getCollection("services");
      let results = services.where(function(obj) {
        return obj.service_id === service_id;
      });
      return results;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  update_service_by_id: function update_service_by_id(
    service_id,
    endpoint,
    port,
    token
  ) {
    try {
      var services = services_db.getCollection("services");
      let result = services.where(function(obj) {
        return obj.service_id === service_id;
      });
      result[0].endpoint = endpoint;
      result[0].port = port;
      result[0].endpoint_token = token;
      services.update(result[0]);
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  update_active_data_access_token: function update_active_data_access_token(
    service_id,
    data_access_token
  ) {
    try {
      var services = services_db.getCollection("services");
      let result = services.where(function(obj) {
        return obj.service_id === service_id;
      });
      result[0].active_data_access_token = data_access_token;
      services.update(result[0]);
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  update_service_publickey: function update_service_publickey(
    service_id,
    counterparty_pubkey
  ) {
    try {
      var services = services_db.getCollection("services");
      let result = services.where(function(obj) {
        return obj.service_id === service_id;
      });
      result[0].identity_holder_key = counterparty_pubkey;
      services.update(result[0]);
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  update_service_endpoint_token: function update_service_endpoint_token(
    service_id,
    new_endpoint_token,
    new_refresh_token
  ) {
    try {
      var services = services_db.getCollection("services");
      let result = services.where(function(obj) {
        return obj.service_id === service_id;
      });
      result[0].endpoint_token = new_endpoint_token;
      result[0].refresh_token = new_refresh_token;
      services.update(result[0]);
      return result;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_services: function get_all_services() {
    try {
      var services = services_db.getCollection("services");
      let allServices = [];
      services.data.forEach(element => {
        if (element.service_id != "empty") {
          let obj = {
            service_id: element.service_id,
            service_name: element.service_name,
            endpoint: element.endpoint,
            port: element.port,
            cred_def_id: element.cred_def_id
          };
          allServices.push(obj);
        }
      });
      return allServices;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  get_all_services_by_did: function get_all_services_by_did(did) {
    try {
      var services = services_db.getCollection("services");
      let results = services.where(function(obj) {
        let x = String(obj.cred_def_id).split(":")[0];
        return x === did;
      });
      return results;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
};
