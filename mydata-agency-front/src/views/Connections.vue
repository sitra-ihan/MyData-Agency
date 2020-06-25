<template>
  <div class="connections">
    <form role="form">
      <v-app id="inspire">
        <div class="text-center">
          <v-dialog v-model="dialog" width="500">
            <template v-slot:activator="{ on }">
              <div>
                <v-btn
                  style="
                    margin-top: 5%;
                    background-color: #44c767;
                    border-radius: 28px;
                    border: 1px solid #18ab29;
                    display: inline-block;
                    cursor: pointer;
                    color: #ffffff;
                    font-family: Arial;
                    font-size: 13px;
                    padding: 10px 100px;
                    text-decoration: none;
                    text-shadow: 0px 0px 0px #07abd4;
                  "
                  dark
                  v-on="on"
                  >Establish Connection</v-btn
                >
              </div>
            </template>

            <v-card>
              <v-card-title class="headline grey lighten-2" primary-title
                >Select Connection DID</v-card-title
              >

              <v-col cols="12" sm="16" md="13">
                <!-- <v-text-field
                  label="Solo"
                  v-model="connectionDID"
                  placeholder="DID i.e. TiJLocRSf3CeV9XM6eLnPC"
                  solo
                ></v-text-field> -->
                <v-combobox
                  label="Connection DID"
                  v-model="connectionDID"
                  :items="connectionsDIDList"
                  outlined
                ></v-combobox>
              </v-col>

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="createConnection"
                  >Connect</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog v-model="dialogAuth" width="500">
            <template v-slot:activator="{ on }">
              <div>
                <v-btn
                  style="
                    margin-top: 5%;
                    background-color: #00d9f;
                    border-radius: 28px;
                    border: 1px solid #00d9f;
                    display: inline-block;
                    cursor: pointer;
                    color: #ffffff;
                    font-family: Arial;
                    font-size: 13px;
                    padding: 10px 100px;
                    text-decoration: none;
                    text-shadow: 0px 0px 0px #07abd4;
                  "
                  dark
                  v-on="on"
                  >HAG Authentication</v-btn
                >
              </div>
            </template>

            <v-card>
              <v-card-title class="headline grey lighten-2" primary-title
                >Select Connection</v-card-title
              >

              <v-col cols="12" sm="16" md="13">
                <!-- <v-text-field
                  label="Solo"
                  v-model="connectionDID"
                  placeholder="DID i.e. TiJLocRSf3CeV9XM6eLnPC"
                  solo
                ></v-text-field> -->
                <v-combobox
                  label="Connection"
                  v-model="selectedAuthConnection"
                  :items="connectionsListString"
                  outlined
                ></v-combobox>
              </v-col>

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="HAG_Auth"
                  >Authenticate</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>

        <v-data-table
          style="margin-top: 5%;"
          :headers="headers"
          :items="connectionsList"
          :items-per-page="5"
          class="elevation-1"
        ></v-data-table>
      </v-app>
    </form>
  </div>
</template>
<script>
// import axios from "axios"; // for network calls
import { mapState } from "vuex";
import Connection from "../services/connection.js";
import { TokenService } from "../services/storage.js";
// import router from "../router";

export default {
  name: "Connection",
  mixins: [],
  data: function () {
    return {
      connectionDID: "",
      selectedAuthConnection: "",
      //TODO:These values are hard-coded need to fetch them dynamically later, in case to test run hard-code your enterprise agent public-did and org-name
      connectionsDIDList: [
        "XAEcBGpyjH1CitFZSm9RV1: Enterprise Agent Organization 1",
        "4sWUiDPY7W4kKuKsutfMC2: Enterprise Agent Organization 2",
        "UkgjiBWb19j4VwFuVAhnpF: Enterprise Agent Organization 3",
      ],
      dialog: false,
      dialogAuth: false,
      headers: [
        {
          text: "Organization Name",
          align: "left",
          sortable: false,
          value: "name",
        },
        { text: "Endpoint", value: "endpoint" },
      ],
    };
  },
  computed: {
    ...mapState(["connectionsList", "connectionsListString"]),
  },

  created() {
    //Make api call and load Connections
    Connection.getConnections();
    // router.push("/connections");
  },

  methods: {
    /*
     * Create connection
     */
    async HAG_Auth() {
      let connectionDIDtrim = this.selectedAuthConnection.split(" ")[0];
      let connections = await Connection.getConnections();

      let privateDID = undefined;
      for (let index = 0; index < connections.length; index++) {
        let connection = connections[index];
        if (connection.metadata.theirEndpointDid === connectionDIDtrim) {
          privateDID = connection.my_did;
          break;
        }
      }

      this.dialogAuth = false;
      if (privateDID) {
        let RedirectURL =
          "https://HAG_AUTH_SERVICE_URL/authService/requestHAGAuth?requesting_did=" +
          privateDID +
          "&token=" +
          TokenService.getToken();
        window.open(RedirectURL, "_blank");
      } else {
        alert("Connection not found!");
      }
    },

    async createConnection() {
      let connectionDIDtrim = this.connectionDID.split(":")[0];
      this.dialog = false;
      await Connection.createConnection(connectionDIDtrim);
      console.log("Connection Created!");
      await Connection.getConnections();
      // router.push("/");
      //Make create connection API call
    },
  },
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
