# Livepeer Explorer

![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.15.0-blue)

## Prerequisites

Before getting started, ensure you have the following installed on your system:

- [Node.js 22.x](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (includes npm)
- [pnpm v9.15.x](https://pnpm.io/installation) - you can install it with `npm install -g pnpm` or `corepack enable`

> [!TIP]
> Use `nvm install` or `asdf install` to automatically switch to the correct versions.

## Getting Started

To run the Livepeer Explorer application, follow these steps to set up your environment correctly. This involves installing pnpm, installing dependencies, and configuring environment variables.

### Install Runtime Dependencies

With pnpm installed, navigate to the root directory of the project and install all runtime dependencies using:

```bash
pnpm install
```

### Setup Environment Variables

Before running the application, you must configure your environment variables:

1. **Rename the Example Environment File:**

   Rename the `.env.example` file in the root of the project to `.env`.

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

## Key Environment Variables

| Environment Variable                    | Description                                                                                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PINATA_JWT`                            | JWT token used to create Polls data in IPFS for LIPs.                                                                                                                                                             |
| `NEXT_PUBLIC_NETWORK`                   | The network/chain the Explorer will interact with. The default is `ARBITRUM_ONE`.                                                                                                                                 |
| `NEXT_PUBLIC_INFURA_KEY`                | The private API key used to interact with the Infura RPC endpoints. If you prefer to use your own RPC, you can ignore this and instead set the RPC URLs in `NEXT_PUBLIC_L1_RPC_URL` and `NEXT_PUBLIC_L2_RPC_URL`. |
| `NEXT_PUBLIC_L1_RPC_URL` (Optional)     | The L1 RPC URL endpoint to use if not using Infura.                                                                                                                                                               |
| `NEXT_PUBLIC_L2_RPC_URL` (Optional)     | The L2 RPC URL endpoint to use if not using Infura.                                                                                                                                                               |
| `NEXT_PUBLIC_SUBGRAPH_API_KEY`          | The API key to interact with the Livepeer published subgraph. This is used for various functions such as displaying current round data.                                                                           |
| `NEXT_PUBLIC_SUBGRAPH_ID`               | The ID of the Livepeer published subgraph. This is used for various functions such as displaying current round data.                                                                                              |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect (Reown) Cloud Project ID. Used to enhance wallet UX for users of Explorer.                                                                                                                          |
| `NEXT_PUBLIC_METRICS_SERVER_URL`        | The Transcoding performance API server used by Explorer.                                                                                                                                                          |
| `NEXT_PUBLIC_AI_METRICS_SERVER_URL`     | The AI performance API server used by Explorer.                                                                                                                                                                   |

## Developing on Arbitrum Rinkeby

To develop on the Arbitrum Rinkeby network, set the `NEXT_PUBLIC_NETWORK` variable to `ARBITRUM_RINKEBY` in your `.env` file:

```env
NEXT_PUBLIC_NETWORK=ARBITRUM_RINKEBY
```

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
