<template>
  <div class="wrapper fadeInDown">
    <div id="formContent">
      <!-- Tabs Titles -->
      <h2 class="active">User Registeration</h2>
      <div style="margin: 4%"></div>
      <!-- Icon -->
      <div class="fadeIn first">
        <img
          src="https://www.svgrepo.com/show/10733/avatar.svg"
          id="icon"
          alt="User Icon"
          height="100"
        />
      </div>
      <form @submit.prevent="register">
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
        <input type="submit" class="fadeIn fourth" value="Register" />
      </form>

      <div class="alert alert-danger" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import User from "../services/user.js";
require("@/assets/css/login-register.css");

export default {
  name: "Register",
  data() {
    return {
      username: "",
      password: "",
      error: false
    };
  },
  methods: {
    register() {
      console.log(this.username);
      console.log(this.password);
      User.register(this.username, this.password);
    }
  }
};
</script>

<style lang="css">
body {
  background: #b4aba2;
}

.register-wrapper {
  background: rgb(192, 163, 163);
  width: 70%;
  margin: 12% auto;
}

.form-register {
  max-width: 330px;
  padding: 10% 15px;
  margin: 0 auto;
}

.form-register .form-register-heading,

.form-register .checkbox {
  margin-bottom: 10px;
}
.form-register .checkbox {
  font-weight: normal;
}
.form-register .form-control {
  position: relative;
  height: auto;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 10px;
  font-size: 16px;
}
.form-register .form-control:focus {
  z-index: 2;
}
.form-register input[type="username"] {
  margin-bottom: -1px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.form-register input[type="password"] {
  margin-bottom: 10px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.form-register-heading{
  color: #257614;
}
</style>
