#!/bin/bash


#Caution! Removes all previous users, services and RSA keys
# rm -r $HOME/*_users.json &>/dev/null
# rm -r $HOME/*_services.json &>/dev/null

export PORT="3001"
export FIRST_NAME="enterpise-agent"
export ORGANIZATION_NAME="Enterprise Agent Organization"
export LAST_NAME=""
export EMAIL="ep@msn.com"
export USERNAME="ep"
export PASSWORD="secret"
export PUBLIC_DID_ENDPOINT="127.0.0.1:3001"
export RUST_LOG="INFO"
export TEST_POOL_IP="127.0.0.1"
export MONGO_URI='mongodb://127.0.0.1:27017'
# export MONGO_URI='mongodb://MONGO_URI:49954/DB'
#Reason being 3 different variables of same data is that in an alternate use-case bussiness logic can deploy seprate urls
export FETCH_CONSENT_PROPOGATION_URL=''
export ACCESS_CONSENT_PROPOGATION_URL=''
export REVOKE_CONSENT_PROPOGATION_URL=''
export AGENT_TYPE="enterprise"
export GENESIS_PATH="/Users/$USER/" #"/home/indy/" #"C:\Users\$USER"


node server
