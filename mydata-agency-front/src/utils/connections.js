import Vue from "vue";

const connectionsService = {
  getConnections: function() {
    const url = `/get_connections`;
    return Vue.axios
      .get(url)
      .then(response => {
        return response;
      })
      .catch(error => {
        throw error;
      });
  },

  createConnection: function() {
    const url = `/create_connection`;
    return Vue.axios.post(url).then(response => response.data);
  }
};

export { connectionsService };
