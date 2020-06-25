# MyData Agency Local Installation Guide

MyData Agency is comprised of two separate projects. A **frontend** _node Vue.js application_ that functions as user-interface and a _node-express_ based **back-end** that operates as a server to manage requests from the front-end. In order to install the MyData agency locally, there are some pre-requisites. Make sure a [local identity network](https://github.com/sitra-ihan/MyData-Agency/wiki/Identity-Network-Setup) is up and running.


## Pre-requisites

- Python 3.7.3 (use [PyENV](https://github.com/pyenv/pyenv))
- Node 11.10.1 (use [NVM](https://github.com/nvm-sh/nvm))
- NPM 6.14.5
- Libindy latest ([build guide](https://github.com/hyperledger/indy-sdk/tree/master/docs/build-guides))
- Vue CLI 3.0.5

## Important Notes

`1. Make sure that libindy is configured properly on your OS or MyData Agency won't bulld.`

`2. Make sure that a local identity network is running or MyData Agency won't run.`

## Install and Run locally

Use the following commands to install dependencies and run **MyData Agency backend**:

```
cd PATH_TO_CLONED_PROJECT_REPO/multi-agent-poc
npm install
rm -r $HOME/.indy_client    #to remove any old locally stored wallets
sh init-multiagent-service.sh
```

`*If you face any node-gyp build error they usually occur due to wrong python version`

Use the following commands to install dependencies and run **MyData Agency frontend**:

```
cd PATH_TO_CLONED_REPO/mydata-agency-front
npm install
npm run serve
```

Upon execution of the above commands, you should have two servers running locally. A backend agency server on port 3000 and a frontend Vue app on port 8080. The web app can be accessed via [http://localhost:8080](http://localhost:8080) to create wallets, login, and Issue Consent.

The backend agency server on port 3000 exposes the API used to interact with the Agency. See Solo-Multi-Agent-Agency (MAA) [API documentation](https://documenter.getpostman.com/view/3041461/SWE9XFvh?version=latest) for reference.
