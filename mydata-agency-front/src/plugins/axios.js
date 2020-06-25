/* eslint-disable no-unused-vars */
"use strict";

import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import { TokenService } from "../services/storage.js";

// Full config:  https://github.com/axios/axios#request-config
axios.defaults.baseURL =
  process.env.baseURL ||
  process.env.apiUrl ||
  // "https://AGENCY_URL.com/api";
  "http://127.0.0.1:3000/api";

if (TokenService.getToken()) {
  axios.defaults.headers.common["Authorization"] =
    "Bearer " + TokenService.getToken();
}

axios.defaults.headers.get["Content-Type"] =
  "application/x-www-form-urlencoded";
axios.defaults.headers.post["Content-Type"] = "application/json";

let config = {
  baseURL:
    process.env.baseURL || process.env.apiUrl || "http://127.0.0.1:3000/api",
  baseIP: "http://127.0.0.1",
  //   "https://AGENCY_URL.com/api",
  // baseIP: "http://AGENCY_PUBLIC_IP",
  timeout: 60 * 1000, // Timeout
  // withCredentials: true // Check cross-site Access-Control
};

const _axios = axios.create(config);

_axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
_axios.interceptors.response.use(
  function (response) {
    // Do something with response data
    return response;
  },
  function (error) {
    // Do something with response error
    return Promise.reject(error);
  }
);

Plugin.install = function (Vue, options) {
  console.log("Installing the axios plugin!");
  Vue.axios = _axios;
  window.axios = _axios;
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios;
      },
    },
    $axios: {
      get() {
        return _axios;
      },
    },
  });
};

Vue.use(Plugin, VueAxios);

export default Plugin;
export { config };
