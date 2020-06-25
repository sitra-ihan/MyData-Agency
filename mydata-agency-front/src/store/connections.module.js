import { connectionsService } from "@/utils/connections";

const state = {
  connections: [],
  isLoading: true,
  connectionsCount: 0
};

const getters = {
  connectionsCount(state) {
    return state.connectionsCount;
  },
  connections(state) {
    return state.connections;
  },
  isLoading(state) {
    return state.isLoading;
  }
};

const actions = {
  getConnections({ commit }) {
    commit("setLoading");
    return connectionsService
      .getConnections()
      .then(({ data }) => {
        console.log(data);
        commit("setConnections", data);
      })
      .catch(error => {
        throw new Error(error);
      });
  },
  createConnection({ commit }, payload) {
    return connectionsService
      .createConnection(payload)
      .then(({ response }) => {
        console.log(response);
        commit("getConnections");
      })
      .catch(error => {
        throw new Error(error);
      });
  }
};

const mutations = {
  setLoading(state) {
    state.isLoading = true;
  },
  setConnections(state, data) {
    state.connections = data;
    state.connectionsCount = data.length;
    state.isLoading = false;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
