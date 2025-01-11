-- CreateTable
CREATE TABLE "user_engagement" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "name" TEXT,
    "details" JSONB,

    CONSTRAINT "user_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "network" TEXT NOT NULL DEFAULT 'mainnet',
    "address" TEXT,
    "name" TEXT,
    "contract" TEXT,
    "contenthash" TEXT,
    "contenthash_raw" TEXT,
    "name_limit" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_text_record" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "key" TEXT,
    "value" TEXT,

    CONSTRAINT "domain_text_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_coin_type" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "coin_type" TEXT,
    "address" TEXT,

    CONSTRAINT "domain_coin_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdomain" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "name" TEXT,
    "domain_id" INTEGER NOT NULL,
    "contenthash" TEXT,
    "contenthash_raw" TEXT,

    CONSTRAINT "subdomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdomain_text_record" (
    "id" SERIAL NOT NULL,
    "subdomain_id" INTEGER NOT NULL,
    "key" TEXT,
    "value" TEXT,

    CONSTRAINT "subdomain_text_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdomain_coin_type" (
    "id" SERIAL NOT NULL,
    "subdomain_id" INTEGER NOT NULL,
    "coin_type" TEXT,
    "address" TEXT,

    CONSTRAINT "subdomain_coin_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_item" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "display" TEXT,
    "requirement" TEXT,
    "parameters" JSONB,

    CONSTRAINT "eligibility_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "address" TEXT,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admin" (
    "id" SERIAL NOT NULL,
    "address" TEXT,

    CONSTRAINT "super_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "name" TEXT,
    "url_slug" TEXT,
    "claim_slug" TEXT,
    "description" TEXT,
    "banner_image" TEXT,
    "footer_image" TEXT,
    "default_avatar" TEXT,
    "default_description" TEXT,
    "share_with_data_providers" BOOLEAN NOT NULL DEFAULT false,
    "show_converse_link" BOOLEAN NOT NULL DEFAULT false,
    "show_mailchain_link" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_text_record" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "key" TEXT,
    "default_value" TEXT,

    CONSTRAINT "brand_text_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" SERIAL NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "key" TEXT,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "name_resolution" (
    "id" SERIAL NOT NULL,
    "resolution_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subdomain_id" INTEGER NOT NULL,

    CONSTRAINT "name_resolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_provider" (
    "id" SERIAL NOT NULL,
    "api_key" TEXT,
    "company_name" TEXT,

    CONSTRAINT "data_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocklist" (
    "id" SERIAL NOT NULL,
    "uid" TEXT,
    "words" JSONB NOT NULL,

    CONSTRAINT "blocklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siwe" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "siwe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "domain__name" ON "domain"("name");

-- CreateIndex
CREATE INDEX "domain_text_record__domain_id" ON "domain_text_record"("domain_id");

-- CreateIndex
CREATE INDEX "subdomain__address" ON "subdomain"("address");

-- CreateIndex
CREATE INDEX "subdomain__domain_id" ON "subdomain"("domain_id");

-- CreateIndex
CREATE INDEX "subdomain__name" ON "subdomain"("name");

-- CreateIndex
CREATE INDEX "subdomain_text_record__subdomain_id" ON "subdomain_text_record"("subdomain_id");

-- CreateIndex
CREATE UNIQUE INDEX "siwe_address_key" ON "siwe"("address");

-- AddForeignKey
ALTER TABLE "domain_text_record" ADD CONSTRAINT "domain_text_record_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_coin_type" ADD CONSTRAINT "domain_coin_type_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdomain" ADD CONSTRAINT "subdomain_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdomain_text_record" ADD CONSTRAINT "subdomain_text_record_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "subdomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdomain_coin_type" ADD CONSTRAINT "subdomain_coin_type_subdomain_id_fkey" FOREIGN KEY ("subdomain_id") REFERENCES "subdomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_item" ADD CONSTRAINT "eligibility_item_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand" ADD CONSTRAINT "brand_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
