FROM node:lts-alpine3.14

RUN apk add jq

WORKDIR /app

COPY . .

RUN chmod +x ./role-switch.sh

RUN npm install

ENV ENV="/root/.ashrc"

RUN echo "alias cf-plan='node index.js'" > "$ENV"

ENTRYPOINT ["/bin/ash"]
