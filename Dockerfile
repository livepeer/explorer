# syntax=docker/dockerfile:1

FROM node:24 AS builder
WORKDIR /app
RUN corepack enable

ARG CHANGEFEED_ACCESS_TOKEN
ARG GITHUB_ACCESS_TOKEN
ARG LIVEPEER_COM_API_ADMIN_TOKEN
ARG PINATA_JWT
ARG NEXT_PUBLIC_GA_TRACKING_ID
ARG NEXT_PUBLIC_NETWORK=ARBITRUM_ONE
ARG NEXT_PUBLIC_INFURA_KEY
ARG NEXT_PUBLIC_L1_RPC_URL
ARG NEXT_PUBLIC_L2_RPC_URL
ARG NEXT_PUBLIC_GITHUB_LIP_NAMESPACE=adamsoffer
ARG NEXT_PUBLIC_SUBGRAPH_ID
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ARG NEXT_PUBLIC_METRICS_SERVER_URL=https://leaderboard-serverless.vercel.app
ARG NEXT_PUBLIC_AI_METRICS_SERVER_URL=https://leaderboard-api.livepeer.cloud

# Create .env with the existing build configuration; subgraph secrets are mounted below.
RUN echo "CHANGEFEED_ACCESS_TOKEN=${CHANGEFEED_ACCESS_TOKEN}" >> .env && \
    echo "GITHUB_ACCESS_TOKEN=${GITHUB_ACCESS_TOKEN}" >> .env && \
    echo "LIVEPEER_COM_API_ADMIN_TOKEN=${LIVEPEER_COM_API_ADMIN_TOKEN}" >> .env && \
    echo "PINATA_JWT=${PINATA_JWT}" >> .env && \
    echo "NEXT_PUBLIC_GA_TRACKING_ID=${NEXT_PUBLIC_GA_TRACKING_ID}" >> .env && \
    echo "NEXT_PUBLIC_NETWORK=${NEXT_PUBLIC_NETWORK}" >> .env && \
    echo "NEXT_PUBLIC_INFURA_KEY=${NEXT_PUBLIC_INFURA_KEY}" >> .env && \
    echo "NEXT_PUBLIC_L1_RPC_URL=${NEXT_PUBLIC_L1_RPC_URL}" >> .env && \
    echo "NEXT_PUBLIC_L2_RPC_URL=${NEXT_PUBLIC_L2_RPC_URL}" >> .env && \
    echo "NEXT_PUBLIC_GITHUB_LIP_NAMESPACE=${NEXT_PUBLIC_GITHUB_LIP_NAMESPACE}" >> .env && \
    echo "NEXT_PUBLIC_SUBGRAPH_ID=${NEXT_PUBLIC_SUBGRAPH_ID}" >> .env && \
    echo "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}" >> .env && \
    echo "NEXT_PUBLIC_METRICS_SERVER_URL=${NEXT_PUBLIC_METRICS_SERVER_URL}" >> .env && \
    echo "NEXT_PUBLIC_AI_METRICS_SERVER_URL=${NEXT_PUBLIC_AI_METRICS_SERVER_URL}" >> .env

COPY . .
RUN pnpm install --frozen-lockfile
RUN --mount=type=secret,id=SUBGRAPH_API_KEY,env=SUBGRAPH_API_KEY \
    --mount=type=secret,id=SUBGRAPH_ENDPOINT,env=SUBGRAPH_ENDPOINT \
    pnpm run build

FROM node:24
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 3000
CMD ["pnpm", "start"]
