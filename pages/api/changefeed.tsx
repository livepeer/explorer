import { getCacheControlHeader } from "@lib/api";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import { ChangefeedResponseSchema } from "@lib/api/schemas/changefeed";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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
  try {
    const method = _req.method;

    if (method === "GET") {
      const response = await fetchWithRetry(
        "https://changefeed.app/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CHANGEFEED_ACCESS_TOKEN!}`,
          },
          body: JSON.stringify({ query }),
        },
        {
          retryOnMethods: ["POST"],
        }
      );

      if (!response.ok) {
        return externalApiError(res, "changefeed.app");
      }

      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      const json = await response.json();

      // Validate GraphQL envelope structure
      const EnvelopeSchema = z.object({
        data: z.object({
          projectBySlugs: z.unknown(),
        }),
      });

      const envelopeResult = EnvelopeSchema.safeParse(json);
      if (!envelopeResult.success) {
        return externalApiError(
          res,
          "changefeed.app",
          "Invalid GraphQL structure"
        );
      }

      const { projectBySlugs } = envelopeResult.data.data;

      const validationResult =
        ChangefeedResponseSchema.safeParse(projectBySlugs);
      if (validateOutput(validationResult, res, "changefeed")) {
        return;
      }

      return res.status(200).json(projectBySlugs);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default changefeed;
