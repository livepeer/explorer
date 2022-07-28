import { getCacheControlHeader } from "@lib/api";
import fetch from "isomorphic-unfetch";

import type { NextApiRequest, NextApiResponse } from "next";

const query = `
  {
    projectBySlugs(organizationSlug: "livepeer", projectSlug: "explorer") {
      name
      releases {
        edges {
          node {
            title
            description
            isPublished
            publishedAt
            changes {
              type
              content
            }
          }
        }
      }
    }
  }
`;

const changefeed = async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(`https://changefeed.app/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CHANGEFEED_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query,
    }),
  });

  res.setHeader("Cache-Control", getCacheControlHeader("hour"));

  const {
    data: { projectBySlugs },
  } = await response.json();
  res.json(projectBySlugs);
};

export default changefeed;
