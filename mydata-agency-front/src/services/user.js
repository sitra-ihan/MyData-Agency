import Vue from "vue";
import { TokenService } from "../services/storage.js";
import router from "../router";
import store from "../store/index.js";
import axios from "axios";

class AuthenticationError extends Error {
  constructor(errorCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.errorCode = errorCode;
  }
}

const User = {
  /**
   * Register the user and create a wallet.
   *
   * @returns 200
   * @throws 400
   **/
  register(username, password) {
    return Vue.axios
      .post("/create_wallet", {
        grant_type: "password",
        walletName: username,
        passphrase: password
      })
      .then(response => {
        if (response.status == 202) {
          router.push("/login").catch();
        } else {
          return response.status;
        }
      })
      .catch(error => this.loginFailed(error));
  },

  /**
   * Login the user and store the access token to TokenService.
   *
   * @returns access_token
   * @throws AuthenticationError
   **/
  login(username, password) {
    return Vue.axios
      .post("/open_wallet", {
        grant_type: "password",
        walletName: username,
        passphrase: password
      })
      .then(response => {
        if (response.status == 200) {
          this.loginSuccessful(response);
          return response.data.access_token;
        } else {
          return response.status;
        }
      })
      .catch(error => this.loginFailed(error));
  },

  loginSuccessful(req) {
    if (!req.data.access_token) {
      this.loginFailed();
      return;
    }
    TokenService.saveToken(req.data.access_token);
    //token load hack
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + TokenService.getToken();
    this.error = false;
    router.push(router.history.current.query.redirect || "/").catch();
  },

  loginFailed(error) {
    TokenService.removeToken();
    console.log(
      "at LoginFailed the error statuscode is" + error.response.status
    );
    throw new AuthenticationError(error.response.status, error.response.data);
  },

  /**
   * Logout the current user by removing the token from storage.
   *
   * SHOULD also remove `Authorization Bearer <token>` header from future requests??
   **/
  logout() {
    // Remove the token and remove Authorization header from Api Service as well
    TokenService.removeToken();
    TokenService.removeRefreshToken();
    router.push("/login").catch();
    //this.axios.defaults.headers.common["Authorization"] = "";
  },

  getPublicDid() {
    return Vue.axios
      .get("/get_agent_did", {})
      .then(response => {
        if (response.status == 200) {
          store.state.myDid = response.data.public_did;
          return response.data;
        } else {
          return response.status;
        }
      })
      .catch(error => {
        this.requestFailed(error.response.data);
      });
  },

  requestFailed(error) {
    if (error.message == "Invalid Token") {
      User.logout();
    } else {
      return error;
    }
  }
};

export default User;
export { User, AuthenticationError };
