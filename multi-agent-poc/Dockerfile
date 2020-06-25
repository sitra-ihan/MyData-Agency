FROM bcgovimages/von-image:py36-1.11-1

USER root

RUN apt update && \
    apt upgrade -y && \
    apt-get install -y curl wget build-essential && \
    apt-get autoclean

# Install node
RUN apt-get -y install curl gnupg && \
    curl -sL https://deb.nodesource.com/setup_12.x  | bash - && \
    apt-get -y install nodejs


WORKDIR /src
ADD . .

RUN npm install

ENV NODE_ENV="dev" \
    PORT="3000" \ 
    PUBLIC_DID_ENDPOINT="127.0.0.1:3000" \ 
    RUST_LOG="INFO" \ 
    TEST_POOL_IP="127.0.0.1" \
    GENESIS_PATH="/home/indy/" \
    VAULT_ADDR="https://127.0.0.1:8200" \
    VAULT_USERNAME='agency' \
    VAULT_PASSWORD='secret' \
    VAULT_SKIP_VERIFY='true'

EXPOSE 3000

CMD [ "./init-multiagent-service-docker.sh"]
