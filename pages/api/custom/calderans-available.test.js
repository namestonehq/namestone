import { createRequest, createResponse } from "node-mocks-http";
import handler from "./calderans-available";

jest.mock("../../../lib/db", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../utils/ServerUtils", () => ({
  getNetwork: jest.fn(),
}));

import sql from "../../../lib/db";
import { getNetwork } from "../../../utils/ServerUtils";

describe("calderans-available API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns available: false if subdomain is taken", async () => {
    getNetwork.mockReturnValue("mainnet");
    sql.mockResolvedValueOnce([{}]); // Simulate found row
    const req = createRequest({
      method: "GET",
      query: { name: "taken" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      available: false,
      message: "Subdomain is already taken",
    });
  });

  it("returns available: true if subdomain is available", async () => {
    getNetwork.mockReturnValue("mainnet");
    sql.mockResolvedValueOnce([]); // Simulate no row found
    const req = createRequest({
      method: "GET",
      query: { name: "available" },
    });
    const res = createResponse();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      available: true,
      message: "Subdomain is available",
    });
  });
});
