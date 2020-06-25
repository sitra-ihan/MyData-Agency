#!/bin/bash

#Caution! Removes all previous services and RSA keys
# rm -r $HOME/.indy_client &>/dev/null




# Pre-req: Initaite rancher vault: 
#rancher login https://rancher.tietodlt.com/v3 --t RANCHER_TOKEN
#rancher kubectl port-forward vault-1 8200:8200
export VAULT_ADDR='https://127.0.0.1:8200'
export VAULT_USERNAME='agency'
export VAULT_PASSWORD='secret'
export VAULT_SKIP_VERIFY='true'



# Pre-req: Initiate HashiCorp Dev Vault -> docker-compose up --force-recreate vault 
#Local Vault Configurations
# export VAULT_ADDR='http://127.0.0.1:8200'
# VAULT_INITAL_STATUS=$(vault status -format=json | jq '.initialized')
# VAULT_SEALED_STATUS=$(vault status -format=json | jq '.sealed')

# if [ $VAULT_INITAL_STATUS = "false" ]
# then
#     vault operator init -key-shares=1 -key-threshold=1 -format=json > vault-dev.env
# fi

# TOKEN=$(jq '.root_token' vault-dev.env | tr -d \")
# UNSEAL_KEY=$(jq '.unseal_keys_b64[0]' vault-dev.env | tr -d \") 
# export VAULT_TOKEN=$TOKEN

# if [ $VAULT_SEALED_STATUS = "true" ]
# then
#     vault operator unseal $UNSEAL_KEY
# fi

# vault secrets enable -path=secret kv

export PORT="3000"
export PUBLIC_DID_ENDPOINT="127.0.0.1:3000"
export RUST_LOG="INFO"
export TEST_POOL_IP="127.0.0.1"
export GENESIS_PATH="/Users/$USER/"

node server