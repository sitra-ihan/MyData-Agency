<template>
  <div class="consents" style>
    <div>
      <div class="text-center">
        <v-dialog v-model="dialog" width="500">
          <template v-slot:activator="{ on }">
            <div>
              <v-btn
                style="
  margin-top:5%;
  background-color:#44c767;
	border-radius:28px;
	border:1px solid #18ab29;
	display:inline-block;
	cursor:pointer;
	color:#ffffff;
	font-family:Arial;
	font-size:13px;
	padding:10px 100px;
	text-decoration:none;
	text-shadow:0px 0px 0px #07abd4;"
                dark
                v-on="on"
                @click="fetchConsent"
                >Issue Data Fetch Consent</v-btn
              >
              <br />
              <v-btn
                style="
  margin-top:2%;
  margin-bottom:5%;
  background-color:#004949;
	border-radius:28px;
	border:1px solid #004949;
	display:inline-block;
	cursor:pointer;
	color:#ffffff;
	font-family:Arial;
	font-size:13px;
	padding:10px 100px;
	text-decoration:none;
	text-shadow:0px 0px 0px #07abd4;"
                dark
                v-on="on"
                @click="accessConsent"
                >Issue Data Access Consent</v-btn
              >
            </div>
          </template>

          <v-card>
            <v-card-title class="headline grey lighten-2" primary-title
              >Enter Consent Details</v-card-title
            >

            <br />
            <v-card-subtitle
              >*Caution: Use different 'Revocation Registery Tag' everytime you
              issue a consent.</v-card-subtitle
            >

            <v-col cols="12" sm="16" md="13">
              <v-combobox
                label="Send To"
                v-model="enterpriseDid"
                :items="connectionsListString"
                outlined
              ></v-combobox>

              <v-text-field
                label="Revocation Registery Tag"
                v-model="revRegTag"
                placeholder="CR1"
                outlined
              ></v-text-field>

              <v-combobox
                label="Data Service"
                v-model="serviceID"
                :items="pipelineListString"
                outlined
              ></v-combobox>

              <v-text-field
                label="Data Endpoint"
                v-model="dataEndpoint"
                placeholder="/ns for NightScout    /ok for Olympics-Commitee"
                outlined
              ></v-text-field>

              <v-text-field
                label="Agent Port"
                v-model="port"
                placeholder="3000 or empty"
                outlined
              ></v-text-field>

              <v-text-field
                label="Consent Type"
                v-model="consentType"
                placeholder="fetch or access"
                outlined
              ></v-text-field>

              <v-text-field
                label="Authorized Entity"
                v-model="authorized_entity"
                placeholder="[ad-doc-group-73c, ad-group-16a]"
                outlined
              ></v-text-field>

              <v-text-field
                label="Identity Holder Personal ID"
                v-model="identity_holder_pid"
                placeholder="120185-123X"
                outlined
                disabled="true"
              ></v-text-field>

              <v-text-field
                label="Identity Holder Name"
                v-model="identity_holder_name"
                placeholder="John Doe"
                outlined
                disabled="true"
              ></v-text-field>

              <v-text-field
                label="Dependent Personal ID"
                v-model="dependent_pid"
                placeholder="230320-456X"
                outlined
                disabled="true"
              ></v-text-field>

              <v-text-field
                label="Dependent Name"
                v-model="dependent_name"
                placeholder="Alice Doe"
                outlined
                disabled="true"
              ></v-text-field>

              <v-text-field
                label="Extra Metadata"
                v-model="metadata"
                placeholder="any JSON Object"
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
              <v-btn color="primary" text @click="issueConsent">Issue</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </div>

    <div style="float: right; margin-left: auto">
      <v-btn
        style="
  background-color:#0080ff;
	border-radius:28px;
	border:1px solid #0080ff;
	display:inline-block;
	cursor:pointer;
	color:#ffffff;
	font-family:Arial;
	font-size:13px;
	padding:10px 50px;
	text-decoration:none;
	text-shadow:0px 0px 0px #07abd4;"
        text
        @click="reloadConsents"
        >Reload My Consent List</v-btn
      >
    </div>
    <br />
    <br />

    <v-list three-line>
      <template v-for="(item, index) in proofItems">
        <v-subheader
          style="font-size: 20px; color: #000; font-weight: bold;"
          v-if="item.header"
          :key="item.header"
          v-text="item.header"
        ></v-subheader>

        <!-- <v-divider
          v-else-if="item.divider"
          :key="index"
          :inset="item.inset"
        ></v-divider> -->

        <v-list-item v-else :key="index" @click="show()">
          <v-list-item-avatar>
            <v-img :src="item.avatar"></v-img>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-html="item.title"></v-list-item-title>
            <v-list-item-subtitle v-html="item.subtitle"></v-list-item-subtitle>
          </v-list-item-content>

          <v-btn
            v-if="proofType[index - 1]"
            color=""
            style="border:1px solid #44c767; background-color:#44c767; color:white;"
            text
            @click="verifyConsent(index - 1)"
            >Verify</v-btn
          >

          <span style="margin-right: 20px;"></span>

          <v-btn
            v-if="!isRevoked[index - 1]"
            color=""
            style="border:1px solid #FF4D4D;  background-color: #FF4D4D; color: white;"
            text
            @click="revokeConsent(index - 1)"
            >Revoke</v-btn
          >
        </v-list-item>
      </template>
    </v-list>

    <v-dialog v-model="verificationDialog" width="200">
      <v-card>
        <v-card-title class="headline grey lighten-2" primary-title
          >Proof Status</v-card-title
        >

        <v-img
          v-show="loading"
          height="200px"
          width="200px"
          src="../assets/loading.gif"
        ></v-img>

        <v-img
          v-show="proofValid"
          height="200px"
          width="200px"
          src="../assets/tick.png"
        ></v-img>

        <v-img
          v-show="proofInvalid"
          height="200px"
          width="200px"
          src="../assets/cross.png"
        ></v-img>

        <v-card-subtitle v-if="proofValid"
          ><h1>Proof is Valid!</h1></v-card-subtitle
        >
        <v-card-subtitle v-if="proofInvalid"
          ><h1>Proof is Invalid!</h1></v-card-subtitle
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeVerificationDialog"
            >Done</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="revokeDialog" width="500">
      <v-card>
        <v-card-title class="headline grey lighten-2" primary-title
          >Consent Revocation Status</v-card-title
        >

        <v-img height="200px" width="200px" src="../assets/cancel.png"></v-img>
        <v-card-subtitle
          ><h1>Consent is successfully revoked!</h1></v-card-subtitle
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeVerificationDialog"
            >Done</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { config } from "../plugins/axios.js";
import { Pipeline } from "../services/pipeline.js";
import { Consent } from "../services/consent.js";
import Connection from "../services/connection";
import User from "../services/user";

export default {
  name: "Consents",
  mixins: [],
  data: function() {
    return {
      loading: false,
      enterpriseDid: "",
      revRegTag: "CR1",
      serviceID: "",
      dataEndpoint: "/ns",
      port: "3000",
      consentType: "fetch",
      metadata: "(none)",
      credDefId: "",
      agentEndpoint: config.baseIP,
      authorized_entity: "[doc-group-73c, ad-group-4b]",
      identity_holder_pid: "",
      identity_holder_name: "",
      dependent_name: "",
      dependent_pid: "",
      verificationDialog: false,
      dialog: false,
      proofValid: false,
      proofInvalid: false,
      revokeDialog: false,
    };
  },
  computed: {
    ...mapState([
      "pipelines",
      "connectionsListString",
      "pipelineListString",
      "proofItems",
      "proofs",
      "proofType",
      "isRevoked",
      "identityHolderPid",
      "identityHolderName",
      "dependentPid",
      "dependentName",
      "hagData",
    ]),
  },

  created() {
    //Make api call
    Connection.getConnections();
    User.getPublicDid().then((data) => {
      Pipeline.getPipelines(data.public_did);
      Consent.getAllProofs();
    });
    Consent.getHagAuthCreds();
  },

  methods: {
    async show() {
      // console.log("ok");
    },

    async closeVerificationDialog() {
      this.verificationDialog = false;
      this.revokeDialog = false;
      this.reloadConsents();
    },

    async verifyConsent(index) {
      this.loading = true;
      this.verificationDialog = true;
      let resp = await Consent.verifyProof(
        JSON.stringify(this.proofs[0][index])
      );

      if (resp.validity == true) {
        this.loading = false;
        this.proofInvalid = false;
        this.proofValid = true;
      } else {
        this.loading = false;
        this.proofValid = false;
        this.proofInvalid = true;
      }
    },

    async revokeConsent(index) {
      if (this.proofType[index] == true) {
        let prover_did = this.proofs[0][index].issuerEndpointDid;
        let revocRegId = this.proofs[0][index].identifiers[0].rev_reg_id;
        let resp = await Consent.revokeConsent(prover_did, revocRegId);
        if (resp.response == 200) {
          this.revokeDialog = true;
        } else {
          console.log("revocation error:" + resp);
        }
      } else {
        let prover_did = this.proofs[index].issued_to_did;
        let revocRegId = this.proofs[index].rev_reg_id;
        let resp = await Consent.revokeConsent(prover_did, revocRegId);
        if (resp.response == 200) {
          this.revokeDialog = true;
        } else {
          console.log("revocation error:" + resp);
        }
      }
    },
    async generateTag() {
      this.revRegTag = String(
        Math.random()
          .toString(36)
          .slice(2, 6)
      ).toUpperCase();
    },

    async reloadConsents() {
      this.$router.go(0);
      // Connection.getConnections();
      // User.getPublicDid().then(data => {
      //   Pipeline.getPipelines(data.public_did);
      //   Consent.getAllProofs();
      // });
    },

    async accessConsent() {
      this.generateTag();
      this.identity_holder_pid = this.identityHolderPid;
      this.identity_holder_name = this.identityHolderName;
      this.dependent_name = this.dependentName;
      this.dependent_pid = this.dependentPid;
      this.consentType = "access";
    },

    async fetchConsent() {
      this.generateTag();
      this.identity_holder_pid = this.identityHolderPid;
      this.identity_holder_name = this.identityHolderName;
      this.dependent_name = this.dependentName;
      this.dependent_pid = this.dependentPid;
      this.consentType = "fetch";
    },

    async issueFetchConsent() {
      this.loading = true;
      let serviceResponse = await Pipeline.getPipelinesById(
        this.serviceID.split(" ")[0]
      );
      this.credDefId = serviceResponse[0].cred_def_id;

      let credData = {
        service_id: this.serviceID.split(" ")[0],
        agent_endpoint: this.agentEndpoint,
        data_endpoint: this.dataEndpoint,
        port: this.port,
        type: this.consentType,
        authorized_entity: this.authorized_entity,
        identity_holder_pid: this.identity_holder_pid,
        identity_holder_name: this.identity_holder_name,
        dependent_name: this.dependent_name,
        dependent_pid: this.dependent_pid,
        data: this.metadata,
      };

      let credential = await Consent.sendConsentRequest(
        this.enterpriseDid.split(" ")[0],
        this.credDefId,
        JSON.stringify(credData),
        this.revRegTag
      );

      if (credential !== undefined) {
        console.log(credential);

        let proof_req_entry = {
          name: "dg1-Proof",
          version: "0.1",
          requested_attributes: {
            attr1_referent: {
              name: "service_id",
              restrictions: [
                { cred_def_id: this.credDefId },
                { rev_reg_tag: this.revRegTag },
              ],
            },
          },
          requested_predicates: {},
          non_revoked: { from: 0, to: 100 },
        };

        await Consent.requestProof(
          this.enterpriseDid.split(" ")[0],
          JSON.stringify(proof_req_entry)
        );
      } else {
        console.log("Something is wrong with credential!");
      }
      this.loading = false;
      this.dialog = false;
    },

    async issueAccessConsent() {
      this.loading = true;
      let serviceResponse = await Pipeline.getPipelinesById(
        this.serviceID.split(" ")[0]
      );
      this.credDefId = serviceResponse[0].cred_def_id;

      let credData = {
        service_id: this.serviceID.split(" ")[0],
        agent_endpoint: this.agentEndpoint,
        data_endpoint: this.dataEndpoint,
        port: this.port,
        type: this.consentType,
        authorized_entity: this.authorized_entity,
        identity_holder_pid: this.identity_holder_pid,
        identity_holder_name: this.identity_holder_name,
        dependent_name: this.dependent_name,
        dependent_pid: this.dependent_pid,
        data: this.metadata,
      };

      await Consent.sendConsentRequest(
        this.enterpriseDid.split(" ")[0],
        this.credDefId,
        JSON.stringify(credData),
        this.revRegTag
      );

      this.loading = false;
      this.dialog = false;
    },

    async issueConsent() {
      if (this.consentType === "fetch") {
        this.issueFetchConsent();
      }
      if (this.consentType === "access") {
        this.issueAccessConsent();
      }
    },
  },
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style module></style>
