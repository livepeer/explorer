import fetch from "isomorphic-unfetch";
import Utils from "web3-utils";
import { createApolloFetch } from "apollo-fetch";
import { applyMiddleware } from "graphql-middleware";
import graphqlFields from "graphql-fields";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { stitchSchemas, ValidationLevel } from "@graphql-tools/stitch";
import { delegateToSchema } from "@graphql-tools/delegate";
import { introspectSchema, wrapSchema } from "@graphql-tools/wrap";
import {
  getBlockByNumber,
  getEstimatedBlockCountdown,
  mergeObjectsInUnique,
} from "@lib/utils";
import { print } from "graphql";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import typeDefs from "./types";
import resolvers from "./resolvers";
import { CHAIN_INFO, DEFAULT_CHAIN_ID, l2Provider } from "lib/chains";
import { ethers } from "ethers";
import dayjs from "dayjs";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...resolvers,
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
});

function avg(obj, key) {
  const arr = Object.values(obj);
  const sum = (prev, cur) => ({ [key]: prev[key] + cur[key] });
  return arr.reduce(sum)[key] / arr.length;
}

const createSchema = async () => {
  const executor = async ({ document, variables }) => {
    const query = print(document);
    const fetchResult = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    return fetchResult.json();
  };

  const subgraphSchema = wrapSchema({
    schema: await introspectSchema(executor),
    executor,
  });

  const linkTypeDefs = `
    extend type Transcoder {
      identity: Identity
      price: Float
      scores: PerformanceLog
      successRates: PerformanceLog
      roundTripScores: PerformanceLog
    }
    type PerformanceLog {
      global: Float
      fra: Float
      mdw: Float
      sin: Float
      nyc: Float
      lax: Float
      lon: Float
      prg: Float
    }
    extend type Identity {
      transcoder: Transcoder
    }
    extend type Account {
      identity: Identity
    }
    extend type Protocol {
      totalStake(block: String): String
    }
    extend type Delegator {
      pendingStake: String
      pendingFees: String
    }
    extend type Poll {
      isActive: Boolean
      status: String
      totalVoteStake: String
      totalNonVoteStake: String
      estimatedTimeRemaining: Int
      endTime: Int
    }
    extend type Query {
      txs: [JSON]
    }
  `;
  async function getTotalStake(_ctx, _blockNumber) {
    const contract = new ethers.Contract(
      _ctx.livepeer.config.contracts.LivepeerToken.address,
      _ctx.livepeer.config.contracts.LivepeerToken.abi,
      l2Provider
    );

    let minterAddress = _ctx.livepeer.config.contracts.Minter.address;

    let balance = await contract.balanceOf(minterAddress, {
      blockTag: _blockNumber ? +_blockNumber : "latest",
    });

    return balance.toString();
  }

  const gatewaySchema = stitchSchemas({
    subschemas: [
      { schema: subgraphSchema, batch: true },
      { schema: schema, batch: true },
    ],
    typeDefs: linkTypeDefs,
    typeMergingOptions: {
      validationScopes: {
        // TOD: rename transaction query type to avoid naming conflict with subgraph
        "Query.transaction": {
          validationLevel: ValidationLevel.Off,
        },
      },
    },
    resolvers: {
      Account: {
        identity: {
          async resolve(_account, _args, _ctx, _info) {
            const identity = await delegateToSchema({
              schema: schema,
              operation: "query",
              fieldName: "identity",
              args: {
                id: _account.id,
              },
              context: _ctx,
              info: _info,
            });

            return identity;
          },
        },
      },
      Transcoder: {
        identity: {
          async resolve(_transcoder, _args, _ctx, _info) {
            const identity = await delegateToSchema({
              schema: schema,
              operation: "query",
              fieldName: "identity",
              args: {
                id: _transcoder.id,
              },
              context: _ctx,
              info: _info,
            });

            return identity;
          },
        },
      },
      Delegator: {
        pendingStake: {
          async resolve(_delegator, _args, _ctx, _info) {
            const apolloFetch = createApolloFetch({
              uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
            });
            const { data } = await apolloFetch({
              query: `{
                protocol(id: "0") {
                  id
                  currentRound {
                    id
                  }
                }
              }`,
            });

            return await _ctx.livepeer.rpc.getPendingStake(
              _delegator.id.toString(),
              data.protocol.currentRound.id.toString()
            );
          },
        },
        pendingFees: {
          async resolve(_delegator, _args, _ctx, _info) {
            const apolloFetch = createApolloFetch({
              uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
            });
            const { data } = await apolloFetch({
              query: `{
                protocol(id: "0") {
                  id
                  currentRound {
                    id
                  }
                }
              }`,
            });

            const pendingFees = await _ctx.livepeer.rpc.getPendingFees(
              _delegator.id,
              data.protocol.currentRound.id
            );
            return Utils.fromWei(pendingFees);
          },
        },
      },
      Protocol: {
        totalStake: {
          async resolve(_protocol, _args, _ctx, _info) {
            return await getTotalStake(_ctx, _args.blockNumber);
          },
        },
      },
      Poll: {
        totalVoteStake: {
          async resolve(_poll, _args, _ctx, _info) {
            const totalVoteStake = _poll?.tally
              ? +_poll.tally.no + +_poll.tally.yes
              : 0;
            return totalVoteStake;
          },
        },
        totalNonVoteStake: {
          async resolve(_poll, _args, _ctx, _info) {
            const { number: blockNumber } = await _ctx.livepeer.rpc.getBlock(
              "latest"
            );

            const isActive = blockNumber <= parseInt(_poll.endBlock);
            const totalStake = await getTotalStake(
              _ctx,
              isActive ? blockNumber : _poll.endBlock
            );
            const totalVoteStake = _poll?.tally
              ? +_poll.tally.no + +_poll.tally.yes
              : 0;
            return +Utils.fromWei(totalStake) - totalVoteStake;
          },
        },
        status: {
          async resolve(_poll, _args, _ctx, _info) {
            const { number: blockNumber } = await _ctx.livepeer.rpc.getBlock(
              "latest"
            );

            const isActive = blockNumber <= parseInt(_poll.endBlock);
            const totalStake = await getTotalStake(
              _ctx,
              isActive ? blockNumber : _poll.endBlock
            );
            const noVoteStake = +_poll?.tally?.no || 0;
            const yesVoteStake = +_poll?.tally?.yes || 0;
            const totalVoteStake = noVoteStake + yesVoteStake;
            const totalSupport = isNaN(yesVoteStake / totalVoteStake)
              ? 0
              : (yesVoteStake / totalVoteStake) * 100;
            const totalParticipation =
              (totalVoteStake / +Utils.fromWei(totalStake)) * 100;

            if (isActive) {
              return "active";
            } else if (totalParticipation > _poll.quorum / 10000) {
              if (totalSupport > _poll.quota / 10000) {
                return "passed";
              } else {
                return "rejected";
              }
            } else {
              return "Quorum not met";
            }
          },
        },
        isActive: {
          async resolve(_poll, _args, _ctx, _info) {
            const { number: blockNumber } = await _ctx.livepeer.rpc.getBlock(
              "latest"
            );

            return blockNumber <= parseInt(_poll.endBlock);
          },
        },
        estimatedTimeRemaining: {
          async resolve(_poll, _args, _ctx, _info) {
            const { number: blockNumber } = await _ctx.livepeer.rpc.getBlock(
              "latest"
            );
            if (blockNumber > parseInt(_poll.endBlock)) {
              return null;
            }
            const countdownData = await getEstimatedBlockCountdown(
              _poll.endBlock
            );

            return parseInt(countdownData.EstimateTimeInSec);
          },
        },
        endTime: {
          async resolve(_poll, _args, _ctx, _info) {
            const { number: blockNumber } = await _ctx.livepeer.rpc.getBlock(
              "latest"
            );
            if (blockNumber < parseInt(_poll.endBlock)) {
              return null;
            }

            const endBlockData = await getBlockByNumber(_poll.endBlock);
            return endBlockData.timeStamp;
          },
        },
      },
    },
  });

  // intercept and transform query responses with price and performance data
  const queryMiddleware = {
    Query: {
      delegator: async (resolve, parent, args, ctx, info) => {
        const delegator = await resolve(parent, args, ctx, info);
        const selectionSet = Object.keys(graphqlFields(info));
        // if selection set does not include 'delegate', return delegator as is, otherwise fetch and merge price
        if (!delegator || !selectionSet.includes("delegate")) {
          return delegator;
        }

        const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl);
        const transcodersWithPrice = await response.json();
        const transcoderWithPrice = transcodersWithPrice.filter(
          (t) =>
            t.Address.toLowerCase() === delegator?.delegate?.id.toLowerCase()
        )[0];

        if (delegator?.delegate) {
          delegator.delegate.price = transcoderWithPrice?.PricePerPixel
            ? transcoderWithPrice?.PricePerPixel
            : 0;
        }

        return delegator;
      },
      transcoder: async (resolve, parent, args, ctx, info) => {
        const transcoder = await resolve(parent, args, ctx, info);
        const selectionSet = Object.keys(graphqlFields(info));

        if (!transcoder) {
          return transcoder;
        }

        if (selectionSet.includes("successRates")) {
          // use fake perf on rinkeby since performance doesn't exist
          const transcoderId =
            process.env.NEXT_PUBLIC_NETWORK === "ARBITRUM_ONE"
              ? args.id.toLowerCase()
              : "0x525419ff5707190389bfb5c87c375d710f5fcb0e";

          const metricsResponse = await fetch(
            `https://leaderboard-serverless.vercel.app/api/aggregated_stats?orchestrator=${transcoderId}${
              ctx.since ? `?since=${ctx.since}` : ""
            }`
          );
          const metrics = await metricsResponse.json();

          transcoder["successRates"] = {
            global: avg(metrics[transcoderId], "success_rate") * 100,
            fra: (metrics[transcoderId]?.FRA?.success_rate || 0) * 100,
            mdw: (metrics[transcoderId]?.MDW?.success_rate || 0) * 100,
            sin: (metrics[transcoderId]?.SIN?.success_rate || 0) * 100,
            nyc: (metrics[transcoderId]?.NYC?.success_rate || 0) * 100,
            lax: (metrics[transcoderId]?.LAX?.success_rate || 0) * 100,
            lon: (metrics[transcoderId]?.LON?.success_rate || 0) * 100,
            prg: (metrics[transcoderId]?.PRG?.success_rate || 0) * 100,
          };

          transcoder["scores"] = {
            global: avg(metrics[transcoderId], "score") || 0,
            fra: metrics[transcoderId]?.FRA?.score || 0,
            mdw: metrics[transcoderId]?.MDW?.score || 0,
            sin: metrics[transcoderId]?.SIN?.score || 0,
            nyc: metrics[transcoderId]?.NYC?.score || 0,
            lax: metrics[transcoderId]?.LAX?.score || 0,
            lon: metrics[transcoderId]?.LON?.score || 0,
            prg: metrics[transcoderId]?.PRG?.score || 0,
          };

          transcoder["roundTripScores"] = {
            global: avg(metrics[transcoderId], "round_trip_score"),
            fra: metrics[transcoderId]?.FRA?.round_trip_score || 0,
            mdw: metrics[transcoderId]?.MDW?.round_trip_score || 0,
            sin: metrics[transcoderId]?.SIN?.round_trip_score || 0,
            nyc: metrics[transcoderId]?.NYC?.round_trip_score || 0,
            lax: metrics[transcoderId]?.LAX?.round_trip_score || 0,
            lon: metrics[transcoderId]?.LON?.round_trip_score || 0,
            prg: metrics[transcoderId]?.PRG?.round_trip_score || 0,
          };
        }

        if (selectionSet.includes("price")) {
          const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl);
          const transcodersWithPrice = await response.json();
          const transcoderWithPrice = transcodersWithPrice.filter(
            (t) => t.Address.toLowerCase() === args.id.toLowerCase()
          )[0];
          transcoder["price"] = transcoderWithPrice?.PricePerPixel
            ? transcoderWithPrice?.PricePerPixel
            : 0;
        }

        return transcoder;
      },
      transcoders: async (resolve, parent, args, ctx, info) => {
        const selectionSet = Object.keys(graphqlFields(info));
        const transcoders = await resolve(parent, args, ctx, info);
        const prices = [];
        const performanceMetrics = [];

        //if selection set includes 'price', return transcoders merge prices and performance metrics
        if (selectionSet.includes("price")) {
          // get price data
          const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl);
          const transcodersWithPrice = await response.json();

          for (const t of transcodersWithPrice) {
            if (transcoders.filter((a) => a.id === t.Address).length > 0) {
              prices.push({
                id: t.Address,
                price: t.PricePerPixel,
              });
            }
          }
        }

        if (selectionSet.includes("scores")) {
          const metricsResponse = await fetch(
            `https://leaderboard-serverless.vercel.app/api/aggregated_stats${
              ctx.since ? `?since=${ctx.since}` : ""
            }`
          );
          const metrics = await metricsResponse.json();

          for (const key in metrics) {
            if (transcoders.filter((a) => a.id === key).length > 0) {
              performanceMetrics.push({
                id: key,
                scores: {
                  global: avg(metrics[key], "score") * 10000,
                  fra: (metrics[key].FRA?.score || 0) * 10000,
                  mdw: (metrics[key].MDW?.score || 0) * 10000,
                  sin: (metrics[key].SIN?.score || 0) * 10000,
                  nyc: (metrics[key].NYC?.score || 0) * 10000,
                  lax: (metrics[key].LAX?.score || 0) * 10000,
                  lon: (metrics[key].LON?.score || 0) * 10000,
                  prg: (metrics[key].PRG?.score || 0) * 10000,
                },
                successRates: {
                  global: avg(metrics[key], "success_rate") * 100,
                  fra: (metrics[key].FRA?.success_rate || 0) * 100,
                  mdw: (metrics[key].MDW?.success_rate || 0) * 100,
                  sin: (metrics[key].SIN?.success_rate || 0) * 100,
                  nyc: (metrics[key].NYC?.success_rate || 0) * 100,
                  lax: (metrics[key].LAX?.success_rate || 0) * 100,
                  lon: (metrics[key].LON?.success_rate || 0) * 100,
                  prg: (metrics[key].PRG?.success_rate || 0) * 100,
                },
                roundTripScores: {
                  global: avg(metrics[key], "round_trip_score") * 10000,
                  fra: (metrics[key].FRA?.round_trip_score || 0) * 10000,
                  mdw: (metrics[key].MDW?.round_trip_score || 0) * 10000,
                  sin: (metrics[key].SIN?.round_trip_score || 0) * 10000,
                  nyc: (metrics[key].NYC?.round_trip_score || 0) * 10000,
                  lax: (metrics[key].LAX?.round_trip_score || 0) * 10000,
                  lon: (metrics[key].LON?.round_trip_score || 0) * 10000,
                  prg: (metrics[key].PRG?.round_trip_score || 0) * 10000,
                },
              });
            }
          }
        }

        // merge results
        return mergeObjectsInUnique(
          [...transcoders, ...prices, ...performanceMetrics],
          "id"
        );
      },
    },
  };

  return applyMiddleware(gatewaySchema, queryMiddleware);
};

export default createSchema;
