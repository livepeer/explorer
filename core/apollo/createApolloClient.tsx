import { NextPageContext } from "next";
import {
  ApolloClient,
  ApolloLink,
  gql,
  InMemoryCache,
  NormalizedCacheObject,
  Observable,
} from "@apollo/client";
import createSchema from "./createSchema";
import LivepeerSDK from "@livepeer/sdk";
import { execute } from "graphql/execution/execute";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  INFURA_NETWORK_URLS,
  SupportedChainId,
} from "../../constants/chains";

export default function createApolloClient(
  initialState: object,
  _ctx: NextPageContext | null
) {
  // The `ctx` (NextPageContext) will only be present on the server.
  // use it to extract auth headers (ctx.req) or similar.

  const cache = new InMemoryCache().restore(
    (initialState || {}) as NormalizedCacheObject
  );

  cache.writeQuery({
    query: gql`
      {
        walletModalOpen
        bottomDrawerOpen
        selectedStakingAction
        uniswapModalOpen
        roundStatusModalOpen
        txSummaryModal {
          __typename
          open
          error
        }
        txConfirmationModal {
          __typename
          open
          error
        }
        txs
        tourOpen
        roi
        principle
      }
    `,
    data: {
      walletModalOpen: false,
      bottomDrawerOpen: false,
      selectedStakingAction: "",
      uniswapModalOpen: false,
      roundStatusModalOpen: false,
      txSummaryModal: {
        __typename: "TxSummaryModal",
        open: false,
        error: false,
      },
      txConfirmationModal: {
        __typename: "TxConfirmationModal",
        open: false,
        error: false,
      },
      txs: [],
      tourOpen: false,
      roi: 0.0,
      principle: 0.0,
    },
  });

  const link = new ApolloLink((operation) => {
    return new Observable((observer) => {
      Promise.resolve(createSchema())
        .then(async (data) => {
          const context = operation.getContext();
          const provider = context?.library
            ? context.library
            : INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID];

          const sdk = await LivepeerSDK({
            controllerAddress:
              CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.controller,
            pollCreatorAddress:
              CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.pollCreator,
            provider,
            account: context?.account,
          });

          return execute(
            data,
            operation.query,
            null,
            {
              livepeer: sdk,
              provider,
              ...context,
            },
            operation.variables,
            operation.operationName
          );
        })
        .then((data) => {
          if (!observer.closed) {
            observer.next(data);
            observer.complete();
          }
        })
        .catch((error) => {
          if (!observer.closed) {
            observer.error(error);
          }
        });
    });
  });

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link,
    cache,
  });
}
