<template>
  <div class="pipelines">
    <form role="form">
      <v-app id="inspire">
        <v-row style="max-height: 45%; margin-top: 5%;">
          <v-col cols="3" sm="3" md="4">
            <!-- NS -->
            <v-card class="mx-auto" max-width="300">
              <v-img
                class="white--text align-end"
                height="150px"
                src="../assets/husns.jpg"
              >
                <v-card-title style="color: black;"
                  >HUS-Nightscout Service</v-card-title
                >
              </v-img>

              <v-card-subtitle class="pb-0"
                >HUS Helsinki University Hospital</v-card-subtitle
              >

              <v-card-text class="text--primary">
                <div>
                  Create a service to share your Nightscout Data with HUS
                </div>
              </v-card-text>

              <v-card-actions>
                <v-btn color="orange" @click="showDialog" text>Create</v-btn>
              </v-card-actions>
            </v-card>
            <!-- HUS NS -->
          </v-col>

          <v-col cols="3" sm="3" md="4">
            <!-- PV -->
            <v-card class="mx-auto" max-width="300">
              <v-img
                class="white--text align-end"
                height="150px"
                src="../assets/suunto2.jpeg"
              >
                <v-card-title style="color: black;"
                  >PV-Suunto Service</v-card-title
                >
              </v-img>

              <v-card-subtitle class="pb-0"
                >Finnish Defence Forces</v-card-subtitle
              >

              <v-card-text class="text--primary">
                <div>
                  Create this service to share your Suunto Data with Defence
                  Forces
                </div>
              </v-card-text>

              <v-card-actions>
                <v-btn color="orange" @click="showSchemaDialog('pv')" text
                  >Create</v-btn
                >
              </v-card-actions>
            </v-card>
            <!-- PV -->
          </v-col>

          <v-col cols="3" sm="3" md="4">
            <!-- PV -->
            <v-card class="mx-auto" max-width="300">
              <v-img
                class="white--text align-end"
                height="150px"
                src="../assets/polar.jpg"
              >
                <v-card-title style="color: black;"
                  >OK-Polar Service</v-card-title
                >
              </v-img>

              <v-card-subtitle class="pb-0"
                >Olympics Commite of Finland</v-card-subtitle
              >

              <v-card-text class="text--primary">
                <div>
                  Create this service to share your Polar Data with Olympics
                  Commite Finland
                </div>
              </v-card-text>

              <v-card-actions>
                <v-btn color="orange" @click="showSchemaDialog('ok')" text
                  >Create</v-btn
                >
              </v-card-actions>
            </v-card>
            <!-- PV -->
          </v-col>
        </v-row>

        <div class="text-center">
          <v-dialog v-model="dialog" width="500">
            <v-card>
              <v-card-title class="headline grey lighten-2" primary-title
                >Register Nightscout Instance</v-card-title
              >

              <v-col cols="12" sm="16" md="13">
                <v-text-field
                  label="Service Name"
                  v-model="serviceName"
                  placeholder="Alice Nightscout"
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Nightscout Endpoint"
                  v-model="serviceEndpoint"
                  placeholder=""
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Nightscout Port"
                  v-model="servicePort"
                  placeholder="9000"
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Access Token"
                  v-model="serviceEndpointToken"
                  placeholder="tieto-0913bfb091061c91"
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Schema ID"
                  v-model="schemaId"
                  placeholder=""
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Tag"
                  v-model="tag"
                  placeholder="FC1"
                  outlined
                ></v-text-field>
              </v-col>

              <v-divider></v-divider>

              <v-img
                v-show="loading"
                height="150px"
                src="../assets/loading.gif"
              ></v-img>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="createHUSPipeline"
                  >Create</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Update Service Dialog -->
          <v-dialog v-model="updateDialog" width="500">
            <v-card>
              <v-card-title class="headline grey lighten-2" primary-title
                >Update Service</v-card-title
              >

              <v-col cols="12" sm="16" md="13">
                <v-text-field
                  label="Service ID"
                  v-model="updateServiceID"
                  placeholder="Service ID"
                  :disabled="true"
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Service Name"
                  v-model="updateServiceName"
                  placeholder="Alice Nightscout"
                  :disabled="true"
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Nightscout Endpoint"
                  v-model="updateServiceEndpoint"
                  placeholder=""
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Nightscout Port"
                  v-model="updateServicePort"
                  placeholder=""
                  outlined
                ></v-text-field>

                <v-text-field
                  label="Access Token"
                  v-model="updateServiceEndpointToken"
                  placeholder=""
                  outlined
                ></v-text-field>
              </v-col>

              <v-divider></v-divider>

              <v-img
                v-show="loading"
                height="150px"
                src="../assets/loading.gif"
              ></v-img>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="updatePipelines"
                  >Update</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>
          <!--------------------------->

          <v-dialog v-model="dialogSchema" width="500">
            <template v-slot:activator="{ on }"></template>

            <v-card>
              <v-card-title class="headline grey lighten-2" primary-title
                >Enter Schema Information</v-card-title
              >

              <v-col cols="12" sm="16" md="13">
                <v-text-field
                  label="Solo"
                  v-model="schemaIDInput"
                  placeholder="Schema ID i.e. HQJPVXPefWk6yrHKbHR81e:2:consent:1.0"
                  solo
                ></v-text-field>
                <v-text-field
                  label="Solo"
                  v-model="tagInput"
                  placeholder="Tag i.e. FC"
                  solo
                ></v-text-field>
              </v-col>

              <v-divider></v-divider>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="redirect">Create</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
        <v-data-table
          v-model="selectedService"
          style="margin-top: 0%;"
          :headers="headers"
          :items="pipelines"
          :items-per-page="5"
          :single-select="true"
          item-key="pipelineID"
          show-select
          class="elevation-1"
        ></v-data-table>

        <br />

        <div style="float: right; margin-left: auto;">
          <v-btn
            style="
              background-color: #0080ff;
              border-radius: 28px;
              border: 1px solid #0080ff;
              display: inline-block;
              cursor: pointer;
              color: #ffffff;
              font-family: Arial;
              font-size: 13px;
              padding: 10px 50px;
              text-decoration: none;
              text-shadow: 0px 0px 0px #07abd4;
            "
            text
            @click="reloadPipelines"
            >Reload Services</v-btn
          >
          &emsp;
          <v-btn
            style="
              background-color: #44c767;
              border-radius: 28px;
              border: 1px solid #44c767;
              display: inline-block;
              cursor: pointer;
              color: #ffffff;
              font-family: Arial;
              font-size: 13px;
              padding: 10px 50px;
              text-decoration: none;
              text-shadow: 0px 0px 0px #07abd4;
            "
            text
            :disabled="selectedService.length == 0"
            @click="updatePipelinesDialog"
            >Update Service</v-btn
          >
        </div>
      </v-app>
    </form>
  </div>
</template>
<script>
// import axios from "axios"; // for network calls
import { mapState } from "vuex";
import Pipeline from "../services/pipeline.js";
import { User } from "../services/user";
// import router from "../router";

export default {
  name: "Pipelines",
  mixins: [],
  data: function () {
    return {
      updateServiceID: "",
      updateServiceName: "",
      updateServiceEndpoint: "",
      updateServicePort: "",
      updateServiceEndpointToken: "",
      selectedService: [],
      serviceName: "John's Nightscout",
      serviceEndpoint: "https://nightscout-test-server.herokuapp.com",
      servicePort: "",
      serviceEndpointToken: "tieto-0913bfb091061c91",
      schemaId: "",
      tag: "FC1",
      dialog: false,
      updateDialog: false,
      dialogSchema: false,
      selectedDialog: "",
      schemaIDInput: "",
      tagInput: "FC1",
      loading: false,
      headers: [
        {
          text: "Pipeline Name",
          align: "left",
          sortable: false,
          value: "name",
        },
        { text: "ID", value: "pipelineID" },
        { text: "Endpoint", value: "pipelineEndpoint" },
        { text: "Cred ID", value: "credID" },
      ],
    };
  },
  computed: {
    ...mapState(["pipelines", "myDid"]),
  },

  created() {
    //Make api call and load Pipelines
    User.getPublicDid().then((data) => {
      Pipeline.getPipelines(data.public_did);
    });
  },

  methods: {
    /*
     * Create connection
     */

    async showDialog() {
      this.dialog = true;
    },

    async showSchemaDialog(title) {
      this.selectedDialog = title;
      this.dialogSchema = true;
    },

    async redirect() {
      if (this.selectedDialog == "ok") {
        let credDefId = await Pipeline.createCredDef(
          this.schemaIDInput,
          this.tagInput
        );
        this.createOKPipeline(credDefId);
      } else if (this.selectedDialog == "pv") {
        let credDefId = await Pipeline.createCredDef(
          this.schemaIDInput,
          this.tagInput
        );
        this.createPVPipeline(credDefId);
      } else {
        console.log("Invalid option!");
      }
    },

    async createHUSPipeline() {
      this.loading = true;
      let credDefId = await Pipeline.createCredDef(this.schemaId, this.tag);
      console.log(credDefId);
      await Pipeline.createNSPipeline(
        this.serviceName,
        this.serviceEndpoint,
        this.servicePort,
        this.serviceEndpointToken,
        credDefId
      );
      await Pipeline.getPipelines(this.myDid);
      this.loading = false;
      this.dialog = false;
    },

    async createPVPipeline(credDefId) {
      let token = await Pipeline.createServiceRegistryToken();
      window.open(
        "https://digikunto-pv-dev.northeurope.cloudapp.azure.com/register/?token=" +
          token +
          "&cred_def_id=" +
          credDefId,
        "_blank"
      );
    },

    async createOKPipeline(credDefId) {
      let token = await Pipeline.createServiceRegistryToken();
      window.open(
        "https://digikuntookstoragedev.z16.web.core.windows.net/?token=" +
          token +
          "&cred_def_id=" +
          credDefId,
        "_blank"
      );
    },

    async reloadPipelines() {
      User.getPublicDid().then((data) => {
        Pipeline.getPipelines(data.public_did);
      });
    },

    async updatePipelinesDialog() {
      this.updateServiceID = this.selectedService[0].pipelineID;
      this.updateServiceName = this.selectedService[0].name;
      this.updateServiceEndpoint = this.selectedService[0].pipelineEndpoint;
      this.updateDialog = true;
    },

    async updatePipelines() {
      await Pipeline.updatePipeline(
        this.updateServiceID,
        this.updateServiceEndpoint,
        this.updateServicePort,
        this.updateServiceEndpointToken
      );

      await this.reloadPipelines();
      this.updateDialog = false;
    },
  },
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
