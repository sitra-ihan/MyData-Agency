const indy = require('../indy/index');

module.exports = {

    create_schema: async function create_schema(name_of_schema, version, attributes) {
        try {
            let resp = await indy.issuer.createSchema(name_of_schema, version, attributes);
            return {
                "schema_id": resp
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    create_cred_defination: async function create_cred_defination(schema_id, tag) {
        try {
            let resp = await indy.issuer.createCredDef(schema_id, tag);
            return {
                "cred_def_id": resp
            };
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_all_schemas: async function get_all_schemas() {
        try {
            return await indy.issuer.getSchemas();
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_schema_id: async function get_schema_id(name_of_schema, version) {
        try {
            let schema_id = undefined;
            let schemas = await indy.issuer.getSchemas();
            for (let schema of schemas) {
                if (name_of_schema === schema.name && version === schema.version) {
                    schema_id = schema.id;
                }
            }
            return schema_id;
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_schema_by_id: async function get_schema_by_id(schema_id) {
        try {
            return await indy.issuer.getSchema(schema_id);
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    get_enriched_credential_definitions: async function get_enriched_credential_definitions() {
        try {
            let credDefs = await indy.did.getEndpointDidAttribute('credential_definitions');
            for (let credDef of credDefs) {
                // Create generic credential data for credential from credential definition
                let credentialData = {};
                let schema = await indy.issuer.getSchema(credDef.schemaId_long);
                // Iterate over attributes defined in credential definition and set to empty data
                for (let attr of schema.attrNames) {
                    credentialData[attr] = "";
                }
                credDef.credentialData = credentialData;
            }
            return credDefs;
        } catch (e) {
            console.log(e);
        }
    }

};