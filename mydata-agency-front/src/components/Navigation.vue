<template>
  <div>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>MyData</span>
        <span class="font-weight-light">Agency</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-toolbar-items class="headline text-uppercase">
        <v-btn router-link to="/">Home</v-btn>

        <v-btn router-link to="/connections">Connections</v-btn>

        <v-btn router-link to="/pipelines">Services</v-btn>
        <v-btn router-link to="/consents">Consents</v-btn>
        <v-btn router-link to="/about">About</v-btn>
      </v-toolbar-items>

      <v-spacer></v-spacer>
      <v-btn text @click.native="login()">
        <span class="mr-2">login</span>
      </v-btn>
      <v-btn text @click.native="register()">
        <span class="mr-2">register</span>
      </v-btn>
      <v-btn text @click.native="logout()">
        <span class="mr-2">logout</span>
      </v-btn>
    </v-app-bar>
  </div>
</template>

<script>
import User from "../services/user.js";
import router from "../router";

export default {
  components: {
    //
  },
  methods: {
    logout() {
      User.logout();
    },
    register() {
      router.push("/register").catch();
    },
    login() {
      router.push("/login").catch();
    }
  }
};
</script>
