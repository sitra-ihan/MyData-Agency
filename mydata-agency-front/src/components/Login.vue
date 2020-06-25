<template>
  <div class="wrapper fadeInDown">
    <div id="formContent">
      <!-- Tabs Titles -->
      <h2 class="active">Login</h2>
      <div style="margin: 4%"></div>

      <!-- Icon -->
      <div class="fadeIn first">
        <img
          src="https://www.svgrepo.com/show/5125/avatar.svg"
          id="icon"
          alt="User Icon"
          height="100"
        />
      </div>
      <form @submit.prevent="login">
        <!-- Login Form -->
        <input
          v-model="username"
          type="text"
          id="login"
          class="form-control fadeIn second"
          placeholder="Username"
          required
          autofocus
        />

        <input
          v-model="password"
          type="password"
          id="inputPassword"
          class="form-control fadeIn third"
          placeholder="Passphrase"
          required
        />

        <div style="margin: 4%"></div>
        <input type="submit" class="fadeIn fourth" value="Log In" />
      </form>

      <div class="alert alert-danger" v-if="loginError">{{ loginError }}</div>

      <!-- Remind Passowrd -->
      <div id="formFooter">
        <a
          class="underlineHover"
          onClick='alert("Please contact the admistrator!")'
          >Forgot Password?</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import User from "../services/user.js";
require("@/assets/css/login-register.css");

export default {
  name: "Login",
  data() {
    return {
      username: "",
      password: "",
      error: false,
      loginResponse: "",
      loginError: ""
    };
  },
  methods: {
    login: function() {
      User.login(this.username, this.password)
        .then(response => {
          this.loginResponse = response;
        })
        .catch(error => {
          this.loginError = error.message;
          console.log("Authentication error caught " + this.loginError);
        });
    }
  }
};
</script>

<style lang="css">
body {
  background: #b4aba2;
}

.login-wrapper {
  background: rgb(192, 163, 163);
  width: 70%;
  margin: 12% auto;
}

.form-signin {
  max-width: 330px;
  padding: 10% 15px;
  margin: 0 auto;
}
.form-signin .form-signin-heading,
.form-signin .checkbox {
  margin-bottom: 10px;
}
.form-signin .checkbox {
  font-weight: normal;
}
.form-signin .form-control {
  position: relative;
  height: auto;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 2;
}
.form-signin input[type="username"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.form-signin input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.form-signin-heading {
  color: #30a2e4;
}
</style>
