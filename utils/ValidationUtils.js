import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { encodeContenthash } from "./ContentHashUtils.js";

/**
 * Validates ENS-related parameters: address, name, and content hash
 * Returns an object with validation result and error information
 *
 * @param {string} address - Ethereum address to validate
 * @param {string} name - ENS name to validate
 * @param {string} contentHash - Content hash to validate (optional)
 * @returns {Object} - Validation result containing success status and error details
 */
export function validateEnsParams(
  name,
  address,
  avatar = null,
  contentHash = null
) {
  // Validate Ethereum address
  if (address && !isAddress(address)) {
    return {
      isValid: false,
      error: "Invalid Ethereum address",
      field: "address",
    };
  }

  // Validate ENS name
  if (!name) {
    return {
      isValid: false,
      error: "Name cannot be blank",
      field: "name",
    };
  }

  try {
    // Attempt to normalize the name to check validity
    normalize(name);
  } catch (e) {
    return {
      isValid: false,
      error: "Invalid ENS name format",
      field: "name",
    };
  }

  // Validate avatar URL (if provided)
  if (avatar && avatar !== "") {
    try {
      // Check if it's a valid URL string that points to an image
      if (
        !(
          typeof avatar === "string" &&
          (avatar.startsWith("http://") ||
            avatar.startsWith("https://") ||
            avatar.startsWith("data:image/"))
        )
      ) {
        return {
          isValid: false,
          error: "Avatar must be a url",
          field: "avatar",
        };
      }
    } catch (e) {
      return {
        isValid: false,
        error: "Invalid avatar URL",
        field: "avatar",
      };
    }
  }

  // Validate content hash (if provided)
  if (contentHash !== null && contentHash !== "") {
    try {
      // Attempt to encode the content hash to check validity
      encodeContenthash(contentHash);
    } catch (e) {
      return {
        isValid: false,
        error: "Invalid content hash format",
        field: "contentHash",
      };
    }
  }

  // All validations passed
  return {
    isValid: true,
    error: "",
    field: null,
  };
}

/**
 * Simple validation for ENS address format
 *
 * @param {string} address - Ethereum address to validate
 * @returns {boolean} - Whether the address format is valid
 */
export function isValidAddress(address) {
  if (!address) return false;
  return isAddress(address);
}

/**
 * Simple validation for ENS name format
 *
 * @param {string} name - ENS name to validate
 * @returns {boolean} - Whether the name format is valid
 */
export function isValidEnsName(name) {
  if (!name) return false;
  try {
    normalize(name);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Simple validation for content hash format
 *
 * @param {string} contentHash - Content hash to validate
 * @returns {boolean} - Whether the content hash format is valid
 */
export function isValidContentHash(contentHash) {
  if (!contentHash) return true; // Empty content hash is considered valid
  try {
    encodeContenthash(contentHash);
    return true;
  } catch (e) {
    return false;
  }
}

export default {
  validateEnsParams,
  isValidAddress,
  isValidEnsName,
  isValidContentHash,
};
