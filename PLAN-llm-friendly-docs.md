# Plan: LLM-Friendly Documentation

This document contains detailed implementation plans for making Namestone docs AI-friendly.

---

## Plan 1: OpenAPI Specification

### Overview

Create a comprehensive OpenAPI 3.0 specification that formally describes the entire Namestone API. This is the highest-impact change for LLM compatibility.

### File Location

```
public/openapi.yaml
```

Rationale: Files in `public/` are served statically by Next.js, making the spec accessible at `https://namestone.com/openapi.yaml` with zero additional routing configuration.

### Endpoints to Document

| Endpoint | Method | Auth Required | Category |
|----------|--------|---------------|----------|
| `/set-name` | POST | Yes | Names |
| `/set-names` | POST | Yes | Names (batch) |
| `/get-names` | GET | Optional | Names |
| `/search-names` | GET | Optional | Names |
| `/delete-name` | POST | Yes | Names |
| `/set-domain` | POST | Yes | Domains |
| `/get-domain` | GET | Optional | Domains |
| `/get-domains` | GET | No | Domains |
| `/enable-domain` | POST | No* | Domains |
| `/get-siwe-message` | GET | No | Auth |

*enable-domain requires SIWE signature instead of API key

### Key Decisions

#### 1. Network Handling

**Decision**: Use server variables, not separate paths.

```yaml
servers:
  - url: https://namestone.com/api/public_v1/{network}
    variables:
      network:
        default: mainnet
        enum: [mainnet, sepolia]
        description: Ethereum network
```

Why: The current URL structure uses `/api/public_v1/mainnet/set-name` and `/api/public_v1/sepolia/set-name`. Using a server variable keeps the spec DRY and matches how the API actually works.

#### 2. Authentication Schema

```yaml
securityDefinitions:
  ApiKeyHeader:
    type: apiKey
    in: header
    name: Authorization
  ApiKeyQuery:
    type: apiKey
    in: query
    name: api_key
```

Note: Most endpoints accept either header or query param. Document both.

#### 3. Reusable Components

Define these schemas once:

```yaml
components:
  schemas:
    TextRecords:
      type: object
      additionalProperties:
        type: string
      description: ENS text records (avatar, com.twitter, url, description, etc.)
      example:
        avatar: "https://example.com/avatar.png"
        com.twitter: "username"
        description: "My profile"

    CoinTypes:
      type: object
      additionalProperties:
        type: string
      description: Multi-chain addresses keyed by SLIP-0044 coin type
      example:
        "2147483785": "0x..."  # Optimism
        "2147492101": "0x..."  # Base

    NameData:
      type: object
      properties:
        name:
          type: string
        domain:
          type: string
        address:
          type: string
        text_records:
          $ref: '#/components/schemas/TextRecords'
        coin_types:
          $ref: '#/components/schemas/CoinTypes'

    DomainData:
      type: object
      properties:
        domain:
          type: string
        address:
          type: string
        contenthash:
          type: string
          nullable: true
        text_records:
          $ref: '#/components/schemas/TextRecords'
        coin_types:
          $ref: '#/components/schemas/CoinTypes'

    Error:
      type: object
      properties:
        error:
          type: string
```

### Edge Cases to Handle

#### 1. Optional vs Conditional Parameters

- `get-names`: Both `domain` and `address` are optional individually, but behavior changes based on what's provided
- Need to document: "If omitted, returns all subnames for all domains tied to your API key"

#### 2. Boolean-ish Parameters

Several endpoints use `1` or `0` instead of true/false:
- `text_records` in get-names: `1` or `0` (default 1)
- `exact_match` in search-names: `1` or `0`
- `cycle_key` in enable-domain: `"1"` or `"0"`

```yaml
text_records:
  type: integer
  enum: [0, 1]
  default: 1
  description: Whether to return text records. 1 = yes, 0 = no.
```

#### 3. Contenthash Format

Document the expected format:
```yaml
contenthash:
  type: string
  description: IPFS or IPNS content hash
  example: "ipfs://QmYourContentHash"
  pattern: "^(ipfs|ipns)://.*$"
```

#### 4. Coin Type Values

Coin types are strings containing large integers (SLIP-0044 format):
```yaml
coin_types:
  type: object
  additionalProperties:
    type: string
    pattern: "^0x[a-fA-F0-9]{40}$"
  propertyNames:
    pattern: "^[0-9]+$"
  example:
    "2147483785": "0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF"
```

#### 5. set-names Batch Limits

```yaml
names:
  type: array
  maxItems: 50
  minItems: 1
  items:
    $ref: '#/components/schemas/NameInput'
```

#### 6. Error Response Variations

Different endpoints return errors differently. Document all patterns:

```yaml
# Simple error
{"error": "Invalid domain"}

# Batch error (set-names)
{
  "error": "Batch operation failed",
  "processed": 0,
  "errors": [{"index": 1, "name": "bad", "error": "Invalid ens name"}],
  "total": 3
}
```

### Site Presentation

#### Option A: Link from Docs (Recommended)

Add to `api-routes.mdx`:
```markdown
## Machine-Readable Specification

For programmatic access, an OpenAPI 3.0 specification is available:

- [OpenAPI Spec (YAML)](/openapi.yaml)
- [View in Swagger UI](https://petstore.swagger.io/?url=https://namestone.com/openapi.yaml)
```

#### Option B: Dedicated Page with Swagger UI

Create `pages/api-spec.js` that renders Swagger UI. More work, but nicer UX.

**Recommendation**: Start with Option A. Can add Swagger UI page later if demand exists.

### Validation Strategy

Before shipping:
1. Validate with `swagger-cli validate public/openapi.yaml`
2. Test each endpoint example actually works
3. Generate a TypeScript client and verify types match SDK

### Implementation Steps

1. Create `public/openapi.yaml` with info, servers, security
2. Add `/get-names` endpoint (simplest GET)
3. Add `/set-name` endpoint (POST with complex body)
4. Add remaining name endpoints
5. Add domain endpoints
6. Add auth endpoints (get-siwe-message, enable-domain)
7. Define all reusable components/schemas
8. Add comprehensive examples
9. Add error responses
10. Validate and test
11. Add link to docs page
12. Update sitemap.xml

---

## Plan 2: llms.txt

### Overview

Create a plain-text file optimized for LLM consumption. This follows the emerging `llms.txt` convention (similar to robots.txt but for AI).

### File Location

```
public/llms.txt
```

Accessible at: `https://namestone.com/llms.txt`

### Design Principles

1. **Single file** - Everything an LLM needs in one place
2. **Plain text** - No parsing required, can be injected directly into prompts
3. **Hierarchical** - Most important info first
4. **Copy-pasteable** - Examples should work as-is (except API key)
5. **Token-efficient** - Concise but complete (~2-4KB target)

### Structure

```
# Namestone API

[One-line description]

## Quick Start
[Minimal working example]

## Authentication
[How to auth]

## Endpoints
[All endpoints with minimal description]

## Common Operations
[Most frequent use cases with examples]

## SDK
[How to use the TypeScript SDK]

## Limits & Constraints
[Important limitations]

## Links
[Where to find more]
```

### Edge Cases to Handle

#### 1. Network Selection

LLMs need to know about mainnet vs sepolia:
```
## Networks
- Mainnet: https://namestone.com/api/public_v1/mainnet/
- Sepolia (testnet): https://namestone.com/api/public_v1/sepolia/

Use Sepolia for testing. Switch to Mainnet for production.
```

#### 2. API Key Placeholder

Use consistent placeholder:
```
Authorization: YOUR_API_KEY
```

Not `<YOUR_API_KEY>` or `{api_key}` - LLMs sometimes include angle brackets literally.

#### 3. Resolver Requirement

Critical prerequisite that's easy to miss:
```
## Prerequisites
Your ENS domain must use Namestone's resolver:
0xA87361C4E58B619c390f469B9E6F27d759715125

Set this in your ENS manager before using the API.
```

#### 4. Coin Type Complexity

Multichain is complex. Keep it simple in llms.txt:
```
## Multichain Addresses
coin_types maps SLIP-0044 coin type IDs to addresses.
Common IDs:
- 2147483785 = Optimism
- 2147492101 = Base
- 2147525809 = Arbitrum

Convert chain_id to coin_type: 0x80000000 | chain_id
```

#### 5. set-name vs claim-name

Important distinction:
```
## Creating Names
- set-name: Creates or overwrites. Use for admin operations.
- claim-name: Fails if exists. Use for user self-service.
```

#### 6. Private Names

```
## Privacy
Names can be marked private in the admin panel.
Private names only appear in get-names when using your API key.
```

### Content Draft

```
# Namestone API

Gasless ENS subdomain management. Issue subdomains like alice.yourbrand.eth via REST API.

## Quick Start

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: YOUR_API_KEY" \
  -d '{"domain": "yourbrand.eth", "name": "alice", "address": "0x..."}' \
  https://namestone.com/api/public_v1/mainnet/set-name

## Authentication

API key in header: Authorization: YOUR_API_KEY
Or query param: ?api_key=YOUR_API_KEY

Get an API key: https://namestone.com/try-namestone

## Networks

- Mainnet: /api/public_v1/mainnet/
- Sepolia: /api/public_v1/sepolia/

## Endpoints

### Names (Subdomains)
POST /set-name       - Create/update subdomain
POST /set-names      - Batch create/update (max 50)
POST /claim-name     - Create subdomain (fails if exists)
GET  /get-names      - List subdomains by domain/address
GET  /search-names   - Search by prefix
POST /delete-name    - Delete subdomain

### Domains
POST /set-domain     - Set domain records
GET  /get-domain     - Get domain records
GET  /get-domains    - List domains by admin address
POST /enable-domain  - Enable domain (requires SIWE)
GET  /get-siwe-message - Get SIWE message for signing

## Common Operations

### Issue subdomain to user
POST /set-name
{
  "domain": "yourbrand.eth",
  "name": "alice",
  "address": "0x1234...",
  "text_records": {
    "avatar": "https://...",
    "com.twitter": "alice"
  }
}

### Look up user's subdomain
GET /get-names?domain=yourbrand.eth&address=0x1234...

### Search subdomains
GET /search-names?domain=yourbrand.eth&name=ali

### Delete subdomain
POST /delete-name
{"domain": "yourbrand.eth", "name": "alice"}

## SDK (TypeScript)

npm install @namestone/namestone-sdk

import Namestone from "@namestone/namestone-sdk";
const ns = new Namestone("YOUR_API_KEY");

await ns.setName({
  domain: "yourbrand.eth",
  name: "alice",
  address: "0x..."
});

const names = await ns.getNames({ domain: "yourbrand.eth" });

## Multichain Addresses

Add L2 addresses via coin_types (SLIP-0044 format):
{
  "coin_types": {
    "2147483785": "0x...",  // Optimism
    "2147492101": "0x...",  // Base
    "2147525809": "0x..."   // Arbitrum
  }
}

Convert chain_id to coin_type: 0x80000000 | chain_id

## Limits

- Batch operations: 50 names max
- Default pagination: 50 results
- Max pagination: 1000 results

## Prerequisites

Domain must use Namestone resolver:
0xA87361C4E58B619c390f469B9E6F27d759715125

## Links

- Docs: https://namestone.com/docs
- SDK: https://github.com/namestonehq/namestone-sdk
- Admin Panel: https://namestone.com/admin
- Get API Key: https://namestone.com/try-namestone
```

### Site Presentation

#### robots.txt Addition

Add to `public/robots.txt` (create if doesn't exist):
```
User-agent: *
Allow: /

# LLM-friendly documentation
# See: https://namestone.com/llms.txt
```

#### Docs Link

Add to `api-routes.mdx`:
```markdown
## AI/LLM Integration

For AI assistants and code generation tools:
- [llms.txt](/llms.txt) - Concise API reference for LLMs
- [OpenAPI Spec](/openapi.yaml) - Machine-readable specification
```

#### Meta Tag (Optional)

In `_document.js` or layout:
```html
<link rel="llms" href="/llms.txt" type="text/plain" />
```

This is speculative (no standard yet) but forward-compatible.

### Implementation Steps

1. Create `public/llms.txt` with full content
2. Test by pasting into Claude/ChatGPT and asking it to generate code
3. Iterate based on what the LLMs get wrong
4. Create/update `public/robots.txt`
5. Add links to docs
6. Update sitemap.xml

---

## Implementation Order

**Phase 1: llms.txt** (1-2 hours)
- Lower complexity
- Immediate value
- Easy to iterate

**Phase 2: OpenAPI Spec** (4-6 hours)
- Higher complexity
- Requires validation
- More maintenance burden

---

## Success Metrics

After implementation, test with:

1. **Claude Code**: "Using the Namestone API, write code to issue a subdomain"
2. **Cursor**: Import openapi.yaml, verify autocomplete works
3. **ChatGPT**: Paste llms.txt, ask for integration code

The docs are LLM-friendly if:
- LLMs generate working code on first try
- No hallucinated endpoints or parameters
- Correct authentication handling
- Proper network selection (mainnet vs sepolia)
