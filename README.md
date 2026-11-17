# Livepeer Explorer

![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.33.0-blue)

## Prerequisites

Before getting started, ensure you have the following installed on your system:

- [Node.js 24.x](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (includes npm)
- [pnpm v10.x](https://pnpm.io/installation) - you can install it with `npm install -g pnpm` or `corepack enable`
- [Docker](https://docs.docker.com/get-docker/) (optional) — required for the dev container

> [!TIP]
> Use `nvm install` or `asdf install` to automatically switch to the correct versions.

## Dev Container (Recommended)

Develop inside a pre-configured container — consistent tooling, zero local setup, and isolation from your host machine.

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) in VS Code
2. `Ctrl+Shift+P` → **"Dev Containers: Reopen in Container"**

## Getting Started

To run the Livepeer Explorer application, follow these steps to set up your environment correctly. This involves installing pnpm, installing dependencies, and configuring environment variables.

### Install Runtime Dependencies

With pnpm installed, navigate to the root directory of the project and install all runtime dependencies using:

```bash
pnpm install
```

### Setup Environment Variables

Before running the application, you must configure your environment variables:

1. **Copy the Example Environment File:**

   Copy the `.env.example` file in the root of the project to `.env`.

2. **Update Environment Variables:**

   Open the `.env` file and update the necessary environment variables. For a reference of key settings, see the [Key Environment Variables](#key-environment-variables) section below.

### Run the Explorer Application

#### Development Mode

To run the application in development mode, which enables hot-reloading (automatic server restarts upon code changes), use the following command:

```bash
pnpm dev
```

This will start the application and deploy changes to your browser without needing to restart the server manually.

#### Production Mode

To run the application in production mode, follow these steps:

1. **Build the Application:**

   Compile and optimize the application for production by running:

   ```bash
   pnpm build
   ```

2. **Start the Production Server:**

   After building, start the application in production mode with:

   ```bash
   pnpm start
   ```

### Docker

Subgraph configuration is required during static-page generation and at runtime. Export `SUBGRAPH_API_KEY`, pass `--secret id=SUBGRAPH_API_KEY,env=SUBGRAPH_API_KEY` to `docker build`, and pass `-e SUBGRAPH_API_KEY` to `docker run`. For an endpoint override, use `--secret id=SUBGRAPH_ENDPOINT,env=SUBGRAPH_ENDPOINT` and `-e SUBGRAPH_ENDPOINT` instead. Local `.env` files are excluded from the build context.

## Key Environment Variables

Rename existing `NEXT_PUBLIC_SUBGRAPH_API_KEY` / `NEXT_PUBLIC_SUBGRAPH_ENDPOINT` settings to `SUBGRAPH_API_KEY` / `SUBGRAPH_ENDPOINT`. These are server-only; browser GraphQL requests use `/api/graphql`.

| Environment Variable                    | Description                                                                                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PINATA_JWT`                            | JWT token used to create Polls data in IPFS for LIPs.                                                                                                                                                             |
| `NEXT_PUBLIC_NETWORK`                   | The network/chain the Explorer will interact with. The default is `ARBITRUM_ONE`.                                                                                                                                 |
| `NEXT_PUBLIC_INFURA_KEY`                | The private API key used to interact with the Infura RPC endpoints. If you prefer to use your own RPC, you can ignore this and instead set the RPC URLs in `NEXT_PUBLIC_L1_RPC_URL` and `NEXT_PUBLIC_L2_RPC_URL`. |
| `NEXT_PUBLIC_L1_RPC_URL` (Optional)     | The L1 RPC URL endpoint to use if not using Infura, or as a supplementary fallback.                                                                                                                               |
| `NEXT_PUBLIC_L2_RPC_URL` (Optional)     | The L2 RPC URL endpoint to use if not using Infura, or as a supplementary fallback.                                                                                                                               |
| `SUBGRAPH_API_KEY`                      | Private API key for the Livepeer published subgraph. Required at build time and runtime unless `SUBGRAPH_ENDPOINT` is set.                                                                                        |
| `NEXT_PUBLIC_SUBGRAPH_ID`               | Public, non-secret ID of the Livepeer published subgraph.                                                                                                                                                         |
| `SUBGRAPH_ENDPOINT`                     | Optional private full-URL override for the subgraph endpoint (for example, a gateway deployments URL or a Studio URL). Takes precedence over `SUBGRAPH_API_KEY`.                                                  |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect (Reown) Cloud Project ID. Used to enhance wallet UX for users of Explorer.                                                                                                                          |
| `NEXT_PUBLIC_METRICS_SERVER_URL`        | The Transcoding performance API server used by Explorer.                                                                                                                                                          |
| `NEXT_PUBLIC_AI_METRICS_SERVER_URL`     | The AI performance API server used by Explorer.                                                                                                                                                                   |

## Testing LIPs

To test Livepeer Improvement Proposals (LIPs), follow these steps:

1. **Set the GitHub Namespace:**

   In your `.env` file, set the `NEXT_PUBLIC_GITHUB_LIP_NAMESPACE` variable to your GitHub username:

   ```env
   NEXT_PUBLIC_GITHUB_LIP_NAMESPACE=your_github_username
   ```

2. **Fork the LIPs Repository:**

   Fork the [LIPs repository](https://github.com/livepeer/LIPs) to your GitHub account.

3. **Use Your Fork for Local Testing:**

   With the namespace and your forked repository, you can now test LIPs locally within the application.

---
