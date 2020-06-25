<template>
  <div class="home">
    <div style="margin-top:12%;"></div>
    <img alt="Vue logo" src="../assets/avatar.svg" height="200" />
    <p />
    <h2>Welcome to Data Consent Agency</h2>
    <h1>
      Your Public DID:
      <span style="color:#0000ff">{{ myDid }}</span>
    </h1>
  </div>
</template>

<script>
// @ is an alias to /src

import { mapState } from "vuex";
import { User } from "../services/user";

export default {
  name: "home",
  mixins: [],
  components: {
    //
  },
  computed: {
    ...mapState(["myDid"])
  },
  created() {
    User.getPublicDid();
  }
};
</script>
