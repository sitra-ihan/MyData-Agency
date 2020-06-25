import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import { TokenService } from "../services/storage.js";
import Login from "../components/Login.vue";
import Register from "../components/Register.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home
  },
  {
    path: "/about",
    name: "about",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  },
  {
    path: "/connections",
    name: "connections",
    component: () =>
      import(/* webpackChunkName: "connections" */ "../views/Connections.vue")
  },
  {
    path: "/consents",
    name: "consents",
    component: () =>
      import(/* webpackChunkName: "consents" */ "../views/Consents.vue")
  },
  {
    path: "/pipelines",
    name: "pipelines",
    component: () =>
      import(/* webpackChunkName: "pipelines" */ "../views/Pipelines.vue")
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: {
      public: true, // Allow access to even if not logged in
      onlyWhenLoggedOut: true
    }
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: {
      public: true, // Allow access to even if not logged in
      onlyWhenLoggedOut: true
    }
  }
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes
});

export default router;

router.beforeEach((to, from, next) => {
  const isPublic = to.matched.some(record => record.meta.public);
  const onlyWhenLoggedOut = to.matched.some(
    record => record.meta.onlyWhenLoggedOut
  );
  const loggedIn = !!TokenService.getToken();

  if (!isPublic && !loggedIn) {
    return next({
      path: "/login",
      query: {
        redirect: to.fullPath
      } // Store the full path to redirect the user to after login
    });
  }

  // Do not allow user to visit login page or register page if they are logged in
  if (loggedIn && onlyWhenLoggedOut) {
    return next("/");
  }

  next();
});
