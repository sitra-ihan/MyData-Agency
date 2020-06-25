import Vue from "vue";
import Vuex from "vuex";

import connections from "./connections.module";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    connections,
  },
  state: {
    myDid: "Loading...",
    identityHolderPid: "",
    identityHolderName: "",
    dependentPid: "",
    dependentName: "",
    hagData: "",
    connectionsList: [],
    connectionsListString: [],
    pipelineListString: [],
    pipelines: [],
    proofs: [],
    proofItems: [],
    proofType: [],
    isRevoked: [],
  },
  mutations: {},
  actions: {},
});
