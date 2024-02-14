import React, { useState } from "react";
import NameStoneLogo from "../../components/NameStoneLogo";
import CustomConnectButton from "../../components/CustomConnectButton";
import Image from "next/image";
import iconDiscordBrown from "../../public/images/logo-discord-brown.svg";
import iconMailchainBrown from "../../public/images/icon-mailchain-brown.svg";
import iconConverseBrown from "../../public/images/icon-converse-brown.svg";
import iconGlobeBrown from "../../public/images/icon-globe-brown.svg";
import iconTwitterBrown from "../../public/images/logo-twitter-brown.svg";
import iconSearchBrown from "../../public/images/icon-search-brown.svg";
import iconEtherscanBrown from "../../public/images/etherscanlogobrownblack-500.svg";
import iconENSBrown from "../../public/images/icon-ens-brown.svg";

import iconElipses from "../../public/images/icon-elipses.svg";
import iconX from "../../public/images/x-icon.png";
import Link from "next/link";
import sql from "../../lib/db";
import { useEffect } from "react";
import { Icon } from "@iconify/react";

function downscaleAvatar(avatarUrl) {
  if (avatarUrl.includes("imagedelivery.net")) {
    avatarUrl = avatarUrl.replace("public", "width=100");
  }
  return avatarUrl;
}

export async function getServerSideProps({ resolvedUrl }) {
  let domainName;
  let brand;
  const domainSlug = resolvedUrl.split("/")[1];
  const brandQuery = await sql`
    SELECT 
    brand.name, brand.url_slug, brand.claim_slug, domain.name as domain, brand.default_avatar, brand.banner_image, brand.footer_image, brand.description,
    brand.show_mailchain_link, brand.show_converse_link
    FROM brand join domain on brand.domain_id = domain.id
    where LOWER(brand.url_slug) = ${domainSlug.toLowerCase()};
  `;
  console.log(brandQuery);
  if (brandQuery.length > 0) {
    brand = brandQuery[0];
    domainName = brand.domain;
  } else {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
    };
  }
  // get data for domains
  const domainTextRecordQuery = await sql`
  select domain_text_record.key, domain_text_record.value from domain_text_record
  join domain on domain_text_record.domain_id=domain.id
  where domain.name = ${domainName}`;
  // format
  const domainTextRecordDict = {};
  domainTextRecordQuery.forEach((record) => {
    const cleanKey = record.key.replace("com.", "");
    domainTextRecordDict[cleanKey] = record.value;
  });
  brand.textRecords = domainTextRecordDict;
  // get data for subdomains
  const subdomainQuery = await sql`
  select subdomain.id, subdomain.name, subdomain.address, domain.name as domain_name from subdomain
  join domain on domain.id=subdomain.domain_id
  where domain.name = ${domainName} order by subdomain.name asc`;
  const subdomainTextRecordQuery = await sql`
  select subdomain.id, subdomain_text_record.key, subdomain_text_record.value 
  from subdomain_text_record join subdomain 
  on subdomain_text_record.subdomain_id=subdomain.id
  where subdomain.domain_id = (select id from domain where name = ${domainName})`;
  // format data
  const subdomains = subdomainQuery.map((subdomain) => {
    const textRecords = subdomainTextRecordQuery.filter(
      (record) => record.id === subdomain.id
    );
    const textRecordDict = {};
    textRecords.forEach((record) => {
      textRecordDict[record.key] = record.value;
    });
    const subdomainObj = {
      name: subdomain.name,
      domain_name: subdomain.domain_name,
      address: subdomain.address,
      textRecords: textRecordDict,
    };
    return subdomainObj;
  });

  return {
    props: {
      subdomains: subdomains,
      brand: brand,
    },
  };
}

export default function BrandPage({ brand, subdomains }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedSubdomains, setSearchedSubdomains] = useState(subdomains);

  // useEffect to filter searchedSubdomains
  useEffect(() => {
    if (searchTerm === "") {
      setSearchedSubdomains(subdomains);
    } else {
      const loweredSearchTerm = searchTerm.toLowerCase();
      const filteredSubdomains = subdomains.filter((subdomain) => {
        return (
          subdomain.name.toLowerCase().includes(loweredSearchTerm) ||
          subdomain.textRecords["com.twitter"]
            ?.toLowerCase()
            .includes(loweredSearchTerm) ||
          subdomain.textRecords["com.discord"]
            ?.toLowerCase()
            .includes(loweredSearchTerm) ||
          subdomain.textRecords.url?.toLowerCase().includes(loweredSearchTerm)
        );
      });
      setSearchedSubdomains(filteredSubdomains);
    }
  }, [searchTerm, subdomains]);

  const brandHasSocials =
    brand.textRecords.twitter ||
    brand.textRecords.url ||
    brand.textRecords.discord ||
    brand.show_converse_link ||
    brand.show_mailchain_link;

  return (
    <div className="flex flex-col w-full min-h-screen overflow-hidden text-center bg-gradient-to-b from-orange-200 to-red-200">
      {/* Nav bar */}
      <div className="flex items-center justify-between w-full px-4 py-4 md:px-20">
        <NameStoneLogo />
        <CustomConnectButton />
      </div>
      {/* Main Content Container */}
      <div className="mx-8 sm:mx-auto max-w-[738px]">
        <Image
          src={brand.banner_image}
          alt="Brand Banner"
          width={738}
          height={137}
          className="h-[137px] object-cover rounded-2xl"
        ></Image>{" "}
        {/* Community Details */}
        <div className="flex mt-4">
          <Image
            src={brand.default_avatar}
            width={72}
            height={72}
            className="w-[48px] h-[48px] sm:w-[72px] sm:h-[72px] mr-3 rounded-full"
            alt="Your Image"
          />
          <div className="flex flex-col w-full">
            <div className="flex justify-between">
              <div className="text-base sm:text-[32px] font-bold text-left text-brownblack-700 sm:mb-1 mb-2">
                {brand.name}
              </div>
              {[null, ""].includes(brand.claim_slug) && (
                <Link
                  href={`/${brand.url_slug}`}
                  className="flex items-center text-xs font-bold text-brownblack-500"
                >
                  Claim a subdomain
                  <Icon
                    icon="eva:external-link-outline"
                    className="w-4 h-4 ml-2"
                  />
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:gap-0">
              <div className={`flex gap-4 ${brandHasSocials ? "mr-4" : ""}`}>
                {brand.textRecords.twitter && (
                  <div className="relative flex flex-col items-center group">
                    <Link
                      href={`https://twitter.com/${brand.textRecords.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={iconTwitterBrown}
                        width={16}
                        height={16}
                        className="my-auto"
                        alt="twitter"
                      />
                    </Link>
                    <div className="absolute hidden px-3 text-xs text-center transform -translate-x-1/2 bg-white rounded-lg top-5 group-hover:block left-1/2">
                      {brand.textRecords.twitter}
                    </div>
                  </div>
                )}
                {brand.textRecords.discord && (
                  <div className="relative flex flex-col items-center group">
                    <Link
                      href={brand.textRecords.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={iconDiscordBrown}
                        width={16}
                        height={16}
                        className="my-auto"
                        alt="discord"
                      />
                    </Link>
                    <div className="absolute hidden px-3 text-xs text-center transform -translate-x-1/2 bg-white rounded-lg top-5 group-hover:block left-1/2">
                      {brand.textRecords.discord}
                    </div>
                  </div>
                )}

                {brand.textRecords.url && (
                  <div className="relative flex flex-col items-center group">
                    <Link
                      href={brand.textRecords.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={iconGlobeBrown}
                        className="my-auto"
                        width={16}
                        height={16}
                        alt="website"
                      />
                    </Link>
                    <div className="absolute hidden px-3 text-xs text-center transform -translate-x-1/2 bg-white rounded-lg top-5 group-hover:block left-1/2">
                      {brand.textRecords.url}
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden mr-4 sm:visible">•</div>
              <div className="flex items-end text-xs font-bold text-brownblack-700">
                Names: {subdomains.length}
              </div>
            </div>
            <div className="text-xs text-left sm:text-sm text-brownblack-700">
              {brand.description}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start w-full mt-4 mb-6">
          <input
            type="text"
            placeholder="Search names or social handles eg., bob#1323"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            className="w-full h-12 p-4 pl-12 rounded-lg appearance-none focus:ring focus:ring-orange-400/[0.5] focus:outline-none"
          />
          <div className="absolute pl-4 my-4">
            <Image src={iconSearchBrown} className="my-auto" alt="Search" />
          </div>
        </div>
        <div className="grid divide-y divide-orange-200 sm:divide-y-0 sm:grid-cols-4 ">
          {searchedSubdomains.map((subdomain, index) => (
            <MemberCard
              key={index}
              subname={subdomain.name}
              domainName={subdomain.domain_name}
              address={subdomain.address}
              show_converse_link={brand.show_converse_link}
              show_mailchain_link={brand.show_mailchain_link}
              avatar={downscaleAvatar(
                subdomain.textRecords.avatar || brand.default_avatar
              )}
              twitter={subdomain.textRecords["com.twitter"]}
              discord={subdomain.textRecords["com.discord"]}
              website={subdomain.textRecords.url}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberCard({
  address,
  subname,
  domainName,
  avatar,
  twitter,
  discord,
  website,
  show_converse_link,
  show_mailchain_link,
}) {
  const [visibleSocials, setVisibleSocials] = useState([]);
  useEffect(() => {
    const tempVisibleSocials = [];
    tempVisibleSocials.push({
      name: "Go to ENS profile",
      icon: iconENSBrown,
      link: `https://app.ens.domains/${subname}.${domainName}`,
    });
    if (twitter) {
      tempVisibleSocials.push({
        name: twitter,
        icon: iconTwitterBrown,
        link: "https://twitter.com/" + twitter,
      });
    }
    if (show_converse_link) {
      tempVisibleSocials.push({
        name: "Send Message (Converse)",
        icon: iconConverseBrown,
        link: "https://converse.xyz/dm/" + address,
      });
    }
    if (website) {
      tempVisibleSocials.push({
        name: website
          .replace("https://", "")
          .replace("http://", "")
          .replace("www.", ""),
        icon: iconGlobeBrown,
        link: website,
      });
    }
    if (show_mailchain_link) {
      tempVisibleSocials.push({
        name: "Send Email (Mailchain)",
        icon: iconMailchainBrown,
        link:
          "https://app.mailchain.com/mailto:" +
          subname +
          "." +
          domainName +
          "@ens.mailchain.com",
      });
    }
    tempVisibleSocials.push({
      name: "Go to Etherscan",
      icon: iconEtherscanBrown,
      link: `https://etherscan.io/name-lookup-search?id=${subname}.${domainName}`,
    });
    if (discord) {
      tempVisibleSocials.push({
        name: discord,
        icon: iconDiscordBrown,
        link: "https://discordapp.com/users/" + discord,
      });
    }
    setVisibleSocials(tempVisibleSocials);
  }, [
    twitter,
    discord,
    website,
    domainName,
    subname,
    show_converse_link,
    show_mailchain_link,
  ]);

  const [showModal, setShowModal] = useState(false);
  return (
    <div className="flex sm:flex-col sm:mb-8">
      <div
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center mr-3 h-[72px] sm:h-fit sm:mr-0 cursor-pointer"
      >
        <Image
          src={avatar}
          width={100}
          height={100}
          className="w-[48px]  h-[48px] sm:w-[100px] sm:h-[100px] rounded-full  drop-shadow-xl sm:mb-2"
          alt="Your Image"
        />
      </div>
      {/* name & subname */}
      <div
        className="flex flex-col justify-center cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="text-xs font-bold text-left cursor-pointer sm:text-center text-brownblack-700 hover:underline">
          {subname}
        </div>
        <div className="text-xs text-brownblack-700/[0.5]">.{domainName}</div>{" "}
      </div>
      <ProfileModal
        subname={subname}
        avatar={avatar}
        visibleSocials={visibleSocials}
        domainName={domainName}
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
      {/* mobile only */}
      <div
        className="self-center ml-auto cursor-pointer sm:hidden"
        onClick={() => setShowModal(true)}
      >
        <Image
          src={iconElipses}
          width={24}
          height={24}
          className="my-auto"
          alt="my image"
        />
      </div>

      {/* Social Links */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-center gap-4 mt-2 ">
          {visibleSocials.slice(0, 3).map((social) => (
            <div
              key={social.name}
              className="relative flex flex-col items-center group"
            >
              <Link
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={social.icon}
                  width={16}
                  height={16}
                  className="my-auto"
                  alt={social.name}
                />
              </Link>
              <div className="absolute z-20 hidden px-3 text-xs text-center transform -translate-x-1/2 bg-white rounded-lg top-5 group-hover:block left-1/2">
                {social.name}
              </div>
            </div>
          ))}
          {visibleSocials.length > 3 && (
            <div
              className="text-xs font-bold cursor-pointer text-brownblack-500 hover:underline"
              onClick={() => setShowModal(true)}
            >
              more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileModal({
  visible,
  onClose,
  subname,
  avatar,
  domainName,
  visibleSocials,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        {/* modal */}
        <div className="flex flex-col w-full max-w-2xl mx-auto my-8 overflow-hidden transition-all transform bg-white rounded-2xl">
          {/* avatar and name */}
          <div className="flex mx-6 mt-6 mb-3">
            <Image
              src={avatar}
              className="w-[60px] h-[60px] rounded-full mr-3 "
              alt="Your Image"
              width={60}
              height={60}
            />
            {/* name & subname */}
            <div className="flex flex-col justify-center">
              <Link
                href={`https://app.ens.domains/${subname}.${domainName}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="text-[16px] font-bold text-left sm:text-center text-brownblack-700 hover:underline">
                  {subname}
                </div>
              </Link>
              <div className="text-[16px] text-brownblack-700/[0.5]">
                .{domainName}
              </div>
            </div>
            <div
              className="ml-auto "
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              type="button"
            >
              <Image
                src={iconX}
                width={24}
                height={24}
                className="my-auto"
                alt="close"
              />
            </div>
          </div>
          <div className="mx-4 border-t border-brownblack-20"></div>

          <div className="flex flex-col justify-center gap-4 mx-6 mt-4 mb-8 ">
            {visibleSocials.map((social) => (
              <Link
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
                key={social.name}
              >
                <Image
                  src={social.icon}
                  width={20}
                  height={20}
                  className="my-auto mr-4"
                  alt="my image"
                />

                <div className="text-sm text-brownblack-500">{social.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
