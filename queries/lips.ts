import { gql } from "@apollo/client";

export const historyQuery = gql`
  {
    repository(owner: "livepeer", name: "LIPS") {
      content: object(expression: "master:LIPs/") {
        oid
        ... on Tree {
          entries {
            content: object {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`;
