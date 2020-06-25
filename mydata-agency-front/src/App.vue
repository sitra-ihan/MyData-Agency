<template>
  <v-app>
    <Navigation />

    <v-content>
      <MainContent />
    </v-content>
  </v-app>
</template>

<script>
import MainContent from "./components/MainContent";
import Navigation from "./components/Navigation.vue";

export default {
  name: "App",
  components: {
    Navigation,
    MainContent
  },
  data: () => ({
    //
  })
};
</script>
