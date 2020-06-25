# Enterprise Agent Local Installation Guide

Enterprise Agent is a node express server application. In order to install and run the Enterprise Agent locally, there are some pre-requisites. Make sure that a [local identity network](https://github.com/sitra-ihan/MyData-Agency/wiki/Identity-Network-Setup) is up and running.

## Pre-requisites

- Python 3.7.3 (use [PyENV](https://github.com/pyenv/pyenv))
- Node 11.10.1 (use [NVM](https://github.com/nvm-sh/nvm))
- NPM 6.14.5
- Libindy latest ([build guide](https://github.com/hyperledger/indy-sdk/tree/master/docs/build-guides))

## Important Notes

`1. Make sure that libindy is configured properly on your OS or Enterprise Agent won't bulld.`

`2. Make sure that a local identity network is running or Enterprise Agent won't run.`

## Install and Run locally

Use the following commands to install dependencies and run an **Enterprise Agent**:

```
cd PATH_TO_CLONED_PROJECT_HUS_REPO/solo-enterprise-agent-poc
npm install
rm -r $HOME/.indy_client    #to remove any old locally stored wallets
sh init-enterprise-agent.sh
```

`*If you face any node-gyp build error they usually occur due to wrong python version`

Upon execution of the above commands, you should have a server running locally at port 3001. This server exposes the API used to interact with Enterprise Agent. See Solo-Enterprise-Agent (SEA) [API documentation](https://documenter.getpostman.com/view/3041461/SW7gTQ5K?version=latest) for reference
