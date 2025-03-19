import contentHash from "@ensdomains/content-hash";

/**
 * Matches a string against common ENS content hash protocols
 * @param {string} text - The text to match against protocols
 * @returns {Array|null} - Matched protocol information or null
 */
function matchProtocol(text) {
  return (
    text.match(/^(ipfs|sia|ipns|bzz|onion|onion3|arweave|ar):\/\/(.*)/) ||
    text.match(/\/(ipfs)\/(.*)/) ||
    text.match(/\/(ipns)\/(.*)/)
  );
}

/**
 * Encodes a content hash string into the format expected by ENS
 * @param {string} text - The content hash string to encode
 * @returns {string|boolean} - The encoded content hash or false if encoding failed
 */
export function encodeContenthash(text) {
  let content = text;
  let contentType;
  let encoded = false;
  let error;
  if (text) {
    const matched = matchProtocol(text);
    if (matched) {
      [, contentType, content] = matched;
    }
    try {
      if (contentType === "ipfs") {
        if (content.length >= 4) {
          encoded = `0x${contentHash.encode("ipfs-ns", content)}`;
        }
      } else if (contentType === "ipns") {
        encoded = `0x${contentHash.encode("ipns-ns", content)}`;
      } else if (contentType === "bzz") {
        if (content.length >= 4) {
          encoded = `0x${contentHash.fromSwarm(content)}`;
        }
      } else if (contentType === "onion") {
        if (content.length === 16) {
          encoded = `0x${contentHash.encode("onion", content)}`;
        }
      } else if (contentType === "onion3") {
        if (content.length === 56) {
          encoded = `0x${contentHash.encode("onion3", content)}`;
        }
      } else if (contentType === "sia") {
        if (content.length === 46) {
          encoded = `0x${contentHash.encode("skynet-ns", content)}`;
        }
      } else if (contentType === "arweave" || contentType === "ar") {
        if (content.length === 43) {
          encoded = `0x${contentHash.encode("arweave-ns", content)}`;
        }
      } else if (text.startsWith("0x")) {
        encoded = text;
      } else {
        console.warn("Unsupported protocol or invalid value", {
          contentType,
          text,
        });
        throw new Error("Unsupported protocol or invalid value");
      }
    } catch (err) {
      const errorMessage = "Error encoding content hash";
      console.warn(errorMessage, { text, encoded });
      error = errorMessage;
      throw "Error encoding content hash";
    }
  }
  return encoded;
}

export default {
  encodeContenthash,
  matchProtocol,
};
