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

ENV NODE_ENV="production" \
    AGENT_ID="afd94534yh3462" \ 
    PORT="3001" \ 
    FIRST_NAME="enteprise-agent" \ 
    LAST_NAME="" \ 
    EMAIL="ep@msn.com" \ 
    PASSWORD="secret" \ 
    USERNAME="ep" \ 
    PUBLIC_DID_ENDPOINT="127.0.0.1:3001" \ 
    RUST_LOG="INFO" \ 
    TEST_POOL_IP="192.168.65.3" \ 
    MONGO_URI="mongodb://127.0.0.1:27017" \ 
    AGENT_TYPE="enterprise" \
    GENESIS_PATH="/home/indy/"


EXPOSE 3001

CMD ["./init-enterprise-agent-docker.sh"]
