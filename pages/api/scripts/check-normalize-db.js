import sql from "../../../lib/db";
import Cors from "micro-cors";
import { normalize } from "viem/ens";

const cors = Cors({
  allowMethods: ["GET", "HEAD", "POST"],
  origin: "*",
});

async function handler(req, res) {
  const { headers } = req;
  // get all domain names
  let domainNames = await sql`select name from domain`;

  // get all subdomain names
  let subdomainNames =
    await sql`select subdomain.name as name, domain.name as domain from subdomain join domain on subdomain.domain_id = domain.id`;

  let returnObj = [];

  // for each domain name, normalize it, and print both if normalized name is different
  for (let domainName of domainNames) {
    try {
      let normalizedDomainName = normalize(domainName.name);
      if (normalizedDomainName !== domainName.name) {
        console.log(
          "Domain: ",
          domainName.name,
          "Normalized: ",
          normalizedDomainName
        );
      }
    } catch (e) {
      console.log("Error Domain: ", domainName.name);
    }
  }

  // for each subdomain name, normalize it, and print both if normalized name is different
  for (let subdomainName of subdomainNames) {
    try {
      let normalizedSubdomainName = normalize(subdomainName.name);
      if (normalizedSubdomainName !== subdomainName.name) {
        console.log(
          "Domain: ",
          subdomainName.domain,
          "Subdomain: ",
          subdomainName.name,
          "Normalized: ",
          normalizedSubdomainName
        );
      }
    } catch (e) {
      console.log(
        "Domain: ",
        subdomainName.domain,
        "Error Subdomain: ",
        subdomainName.name
      );
    }
  }

  return returnObj;
}

export default cors(handler);
