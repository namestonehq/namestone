// Example usage of ValidationUtils

import {
  validateEnsParams,
  isValidAddress,
  isValidEnsName,
  isValidContentHash,
} from "./ValidationUtils";

// Example valid inputs
const validAddress = "0x1234567890123456789012345678901234567890";
const validName = "test.eth";
const validContentHash =
  "ipfs://QmTKB75Y73zhNbD3Y73xeXGjYrZHmaXXNxoZqGCagu7r8u";

// Example invalid inputs
const invalidAddress = "0x123456"; // Too short
const invalidName = "test!@#.eth"; // Contains invalid characters
const invalidContentHash = "ipfs://QmInvalid"; // Invalid format

// Example 1: Validate all parameters at once
function example1() {
  console.log("\nExample 1: Validating all parameters at once");

  // All valid
  const validResult = validateEnsParams(
    validAddress,
    validName,
    validContentHash
  );
  console.log("Valid inputs:", validResult);

  // Invalid address
  const invalidAddressResult = validateEnsParams(
    invalidAddress,
    validName,
    validContentHash
  );
  console.log("Invalid address:", invalidAddressResult);

  // Invalid name
  const invalidNameResult = validateEnsParams(
    validAddress,
    invalidName,
    validContentHash
  );
  console.log("Invalid name:", invalidNameResult);

  // Invalid content hash
  const invalidContentHashResult = validateEnsParams(
    validAddress,
    validName,
    invalidContentHash
  );
  console.log("Invalid content hash:", invalidContentHashResult);
}

// Example 2: Validate individual parameters
function example2() {
  console.log("\nExample 2: Validating individual parameters");

  console.log("Valid address:", isValidAddress(validAddress));
  console.log("Invalid address:", isValidAddress(invalidAddress));

  console.log("Valid name:", isValidEnsName(validName));
  console.log("Invalid name:", isValidEnsName(invalidName));

  console.log("Valid content hash:", isValidContentHash(validContentHash));
  console.log("Invalid content hash:", isValidContentHash(invalidContentHash));
}

// Example 3: Using in an API endpoint
function example3() {
  console.log("\nExample 3: Using in an API endpoint");

  // Mock request handler
  function handleRequest(address, name, contentHash) {
    const validation = validateEnsParams(address, name, contentHash);

    if (!validation.isValid) {
      return {
        status: 400,
        body: { error: validation.error, field: validation.field },
      };
    }

    // If validation passes, process the request
    return {
      status: 200,
      body: { success: true, message: "Parameters validated successfully" },
    };
  }

  // Test with valid parameters
  console.log(
    "Valid request:",
    handleRequest(validAddress, validName, validContentHash)
  );

  // Test with invalid parameters
  console.log(
    "Invalid address:",
    handleRequest(invalidAddress, validName, validContentHash)
  );
  console.log(
    "Invalid name:",
    handleRequest(validAddress, invalidName, validContentHash)
  );
  console.log(
    "Invalid content hash:",
    handleRequest(validAddress, validName, invalidContentHash)
  );
}

// Run examples
example1();
example2();
example3();
