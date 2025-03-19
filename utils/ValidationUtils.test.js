/**
 * Tests for ValidationUtils.js
 */

import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { encodeContenthash } from "./ContentHashUtils.js";
import { getCoinName } from "./ChainUtils.js";
import {
  validateEnsParams,
  isValidAddress,
  isValidEnsName,
  isValidContentHash,
} from "./ValidationUtils";

// Mock dependencies
jest.mock("viem", () => ({
  isAddress: jest.fn(),
}));

jest.mock("viem/ens", () => ({
  normalize: jest.fn(),
}));

jest.mock("./ContentHashUtils.js", () => ({
  encodeContenthash: jest.fn(),
}));

jest.mock("./ChainUtils.js", () => ({
  getCoinName: jest.fn(),
}));

describe("ValidationUtils", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("validateEnsParams", () => {
    // Test for ENS name validation
    test("should return error when name is blank", () => {
      const result = validateEnsParams("", null, {}, {});

      expect(result).toEqual({
        isValid: false,
        error: "Name cannot be blank",
        field: "name",
      });
    });

    test("should return error when name format is invalid", () => {
      normalize.mockImplementationOnce(() => {
        throw new Error("Invalid ENS name");
      });

      const result = validateEnsParams("invalid-name", null, {}, {});

      expect(result).toEqual({
        isValid: false,
        error: "Invalid ENS name format",
        field: "name",
      });
      expect(normalize).toHaveBeenCalledWith("invalid-name");
    });

    test("should return error when Ethereum address is invalid", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(false);

      const result = validateEnsParams(
        "valid-name.eth",
        "0xinvalid-address",
        {},
        {}
      );

      expect(result).toEqual({
        isValid: false,
        error: "Invalid Ethereum address",
        field: "address",
        value: "0xinvalid-address",
      });
      expect(isAddress).toHaveBeenCalledWith("0xinvalid-address");
    });

    test("should validate Optimism address in coin_types", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true); // For main address

      getCoinName.mockImplementation((type) => {
        if (type === "2147483658") return "Optimism";
        return null;
      });

      // Mock isAddress to return false for the Optimism address
      isAddress.mockReturnValueOnce(false);

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {
          2147483658: "0xInvalidOptimismAddress",
        },
        {}
      );

      expect(result).toEqual({
        isValid: false,
        error: "Invalid Optimism address",
        field: "2147483658",
        value: "0xInvalidOptimismAddress",
      });

      expect(getCoinName).toHaveBeenCalledWith("2147483658");
      expect(isAddress).toHaveBeenCalledWith("0xValidAddress");
      expect(isAddress).toHaveBeenCalledWith("0xInvalidOptimismAddress");
    });

    test("should validate Base address in coin_types", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true); // For main address

      getCoinName.mockImplementation((type) => {
        if (type === "2147492101") return "Base";
        return null;
      });

      // Mock isAddress to return false for the Base address
      isAddress.mockReturnValueOnce(false);

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {
          2147492101: "0xInvalidBaseAddress",
        },
        {}
      );

      expect(result).toEqual({
        isValid: false,
        error: "Invalid Base address",
        field: "2147492101",
        value: "0xInvalidBaseAddress",
      });

      expect(getCoinName).toHaveBeenCalledWith("2147492101");
      expect(isAddress).toHaveBeenCalledWith("0xValidAddress");
      expect(isAddress).toHaveBeenCalledWith("0xInvalidBaseAddress");
    });

    test("should skip blank fields in coin_types", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true); // For main address

      getCoinName.mockReturnValue("Base");

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {
          2147492101: "", // Should be skipped (blank)
        },
        {}
      );

      expect(result).toEqual({
        isValid: true,
        error: "",
        field: null,
      });

      expect(getCoinName).toHaveBeenCalledWith("2147492101");
      expect(isAddress).toHaveBeenCalledWith("0xValidAddress");
      // Should not attempt to validate the blank address
      expect(isAddress).not.toHaveBeenCalledWith("");
    });

    // Test URL validation in text records
    test("should validate URLs in text records", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true);

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {},
        {
          url: "not-a-url",
          avatar: "https://example.com/avatar.png",
          other: "non-url-field", // Should be skipped
        }
      );

      expect(result).toEqual({
        isValid: false,
        error: "Personal website must be a url",
        field: "url",
        value: "not-a-url",
      });
    });

    test("should skip blank URL fields in text records", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true);

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {},
        {
          url: "", // Should be skipped (blank)
          avatar: "https://example.com/avatar.png",
        }
      );

      expect(result).toEqual({
        isValid: true,
        error: "",
        field: null,
      });
    });

    test("should validate content hash if provided", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true);
      encodeContenthash.mockImplementationOnce(() => {
        throw new Error("Invalid content hash");
      });

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {},
        {},
        "invalid-content-hash"
      );

      expect(result).toEqual({
        isValid: false,
        error: "Invalid content hash format",
        field: "contentHash",
      });
      expect(encodeContenthash).toHaveBeenCalledWith("invalid-content-hash");
    });

    test("should pass validation for valid parameters", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      isAddress.mockReturnValueOnce(true);

      getCoinName.mockImplementation((type) => {
        if (type === "2147492101") return "Base";
        return null;
      });

      isAddress.mockReturnValueOnce(true); // For Base address
      encodeContenthash.mockReturnValueOnce("0xContentHashEncoded");

      const result = validateEnsParams(
        "valid-name.eth",
        "0xValidAddress",
        {
          2147492101: "0xValidBaseAddress",
          501: "ValidSolanaAddress", // Non-ETH address, should be skipped
        },
        {
          url: "https://example.com",
          avatar: "https://example.com/avatar.png",
          email: "user@example.com", // Non-URL field, should be skipped
        },
        "ipfs://validContentHash"
      );

      expect(result).toEqual({
        isValid: true,
        error: "",
        field: null,
      });
    });
  });

  describe("isValidAddress", () => {
    test("should return false for null or empty address", () => {
      expect(isValidAddress(null)).toBe(false);
      expect(isValidAddress("")).toBe(false);
    });

    test("should call viem isAddress and return its result", () => {
      isAddress.mockReturnValueOnce(true);
      expect(isValidAddress("0xValidAddress")).toBe(true);
      expect(isAddress).toHaveBeenCalledWith("0xValidAddress");

      isAddress.mockReturnValueOnce(false);
      expect(isValidAddress("0xInvalidAddress")).toBe(false);
      expect(isAddress).toHaveBeenCalledWith("0xInvalidAddress");
    });
  });

  describe("isValidEnsName", () => {
    test("should return false for null or empty name", () => {
      expect(isValidEnsName(null)).toBe(false);
      expect(isValidEnsName("")).toBe(false);
    });

    test("should return true for valid ENS name", () => {
      normalize.mockImplementationOnce(() => "valid-name.eth");
      expect(isValidEnsName("valid-name.eth")).toBe(true);
      expect(normalize).toHaveBeenCalledWith("valid-name.eth");
    });

    test("should return false for invalid ENS name", () => {
      normalize.mockImplementationOnce(() => {
        throw new Error("Invalid ENS name");
      });
      expect(isValidEnsName("invalid-name")).toBe(false);
      expect(normalize).toHaveBeenCalledWith("invalid-name");
    });
  });

  describe("isValidContentHash", () => {
    test("should return true for null or empty content hash", () => {
      expect(isValidContentHash(null)).toBe(true);
      expect(isValidContentHash("")).toBe(true);
    });

    test("should return true for valid content hash", () => {
      encodeContenthash.mockReturnValueOnce("0xEncodedHash");
      expect(isValidContentHash("ipfs://validContentHash")).toBe(true);
      expect(encodeContenthash).toHaveBeenCalledWith("ipfs://validContentHash");
    });

    test("should return false for invalid content hash", () => {
      encodeContenthash.mockImplementationOnce(() => {
        throw new Error("Invalid content hash");
      });
      expect(isValidContentHash("invalid-content-hash")).toBe(false);
      expect(encodeContenthash).toHaveBeenCalledWith("invalid-content-hash");
    });
  });
});
