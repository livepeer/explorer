/** @jest-environment node */

import { NextApiResponse } from "next";
import { z } from "zod";

import { validateOutput } from "./errors";

afterEach(() => jest.restoreAllMocks());

describe.each(["development", "production", "test"] as const)(
  "output validation in %s",
  (environment) => {
    beforeEach(() => {
      jest.replaceProperty(process, "env", {
        ...process.env,
        NODE_ENV: environment,
      });
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    const response = () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      return res as typeof res & NextApiResponse;
    };
    const schema = z.object({ value: z.number() });

    it("allows valid output without logging or writing an error", () => {
      const res = response();
      expect(
        validateOutput(schema.safeParse({ value: 1 }), res, "api/example")
      ).toBeUndefined();
      expect(console.error).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("logs a mismatch and only stops the development response", () => {
      const res = response();
      const result = schema.safeParse({ value: "invalid" });
      const error = validateOutput(result, res, "api/example");
      expect(console.error).toHaveBeenCalledWith(
        "[api/example] Output validation failed:",
        expect.any(z.ZodError)
      );
      if (environment === "development") {
        expect(error).toBe(res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ code: "INTERNAL_ERROR" })
        );
      } else {
        expect(error).toBeUndefined();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      }
    });
  }
);
