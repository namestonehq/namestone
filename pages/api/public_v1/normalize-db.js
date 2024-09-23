import sql from "../../../lib/db";
import { checkApiKey } from "../../../utils/ServerUtils";
import Cors from "micro-cors";
import { normalize } from "viem/ens";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

// get all domain names
domainNames = await sql`select name from domain`;

// get all subdomain names
subdomainNames = await sql`select name from subdomain`;

// for each domain name, normalize it, and print both if normalized name is different
for (let domainName of domainNames) {
  let normalizedDomainName = normalize(domainName);
  if (normalizedDomainName !== domainName) {
    console.log(
      `Domain name ${domainName} normalized to ${normalizedDomainName}`
    );
  }
}

// for each subdomain name, normalize it, and print both if normalized name is different
for (let subdomainName of subdomainNames) {
  let normalizedSubdomainName = normalize(subdomainName);
  if (normalizedSubdomainName !== subdomainName) {
    console.log(
      `Subdomain name ${subdomainName} normalized to ${normalizedSubdomainName}`
    );
  }
}
