import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { encodeContenthash } from "./ContentHashUtils.js";
import { getCoinName } from "./ChainUtils.js";

/**
 * Validates ENS-related parameters using object parameters
 * Returns an object with validation result and error information
 *
 * @param {Object} params - Object containing all validation parameters
 * @param {string} params.name - ENS name to validate
 * @param {Object} params.addresses - Object of Ethereum addresses to validate (key=field name, value=address)
 * @param {Object} params.urls - Object of avatar URLs to validate (key=field name, value=url) (optional)
 * @param {string} params.contentHash - Content hash to validate (optional)
 * @returns {Object} - Validation result containing success status and error details
 */
export function validateEnsParams(
  name,
  address,
  coin_types,
  text_records,
  contentHash = null
) {
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

  if (address && !isAddress(address)) {
    return {
      isValid: false,
      error: "Invalid Ethereum address",
      field: field,
      value: address,
    };
  }
  // Validate Ethereum addresses
  for (const [field, address] of Object.entries(coin_types)) {
    //skip non eth addresses
    if (
      !["Base", "Optimism", "Scroll", "Arbitrum"].includes(getCoinName(field))
    ) {
      continue;
    }

    //skip blank fields
    if (!address) {
      continue;
    }

    if (!isAddress(address)) {
      return {
        isValid: false,
        error: `Invalid ${getCoinName(field)} address`,
        field: field,
        value: address,
      };
    }
  }

  // Validate  URLs (if provided)
  if (text_records && Object.keys(text_records).length > 0) {
    for (const [field, url] of Object.entries(text_records)) {
      // skip non url text records
      if (!["url", "avatar", "header"].includes(field)) {
        continue;
      }
      //skip blank fields
      if (!url) {
        continue;
      }

      try {
        // Check if it's a valid URL string that points to an image
        if (
          !(
            typeof url === "string" &&
            (url.startsWith("http://") ||
              url.startsWith("https://") ||
              url.startsWith("data:image/"))
          )
        ) {
          let displayField = capitalizeFirstLetter(field);
          if (displayField === "Url") {
            displayField = "Personal website";
          }
          return {
            isValid: false,
            error: `${displayField} must be a url`,
            field: field,
            value: url,
          };
        }
      } catch (e) {
        return {
          isValid: false,
          error: `Invalid ${field} URL`,
          field: field,
          value: url,
        };
      }
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

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
