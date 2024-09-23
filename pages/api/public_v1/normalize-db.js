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
  let subdomainNames = await sql`select name from subdomain`;

  returnObj = [];

  // for each domain name, normalize it, and print both if normalized name is different
  for (let domainName of domainNames) {
    let normalizedDomainName = normalize(domainName);
    if (normalizedDomainName !== domainName) {
      console.log(
        `Domain name ${domainName} normalized to ${normalizedDomainName}`
      );
      returnObj.push({
        domainName: domainName,
        normalizedDomainName: normalizedDomainName,
      });
    }
  }

  // for each subdomain name, normalize it, and print both if normalized name is different
  for (let subdomainName of subdomainNames) {
    let normalizedSubdomainName = normalize(subdomainName);
    if (normalizedSubdomainName !== subdomainName) {
      console.log(
        `Subdomain name ${subdomainName} normalized to ${normalizedSubdomainName}`
      );
      returnObj.push({
        subdomainName: subdomainName,
        normalizedSubdomainName: normalizedSubdomainName,
      });
    }
  }

  return returnObj;
}

export default cors(handler);
