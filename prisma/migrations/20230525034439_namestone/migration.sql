-- CreateTable
CREATE TABLE "domain" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "name" TEXT,
    "contenthash" TEXT,

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
CREATE TABLE "subdomain" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "name" TEXT,
    "domain_id" INTEGER NOT NULL,
    "contenthash" TEXT,

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

-- CreateIndex
CREATE INDEX "domain__name" ON "domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "domain_text_record_domain_id_key" ON "domain_text_record"("domain_id");

-- CreateIndex
CREATE INDEX "domain_text_record__domain_id" ON "domain_text_record"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "subdomain_domain_id_key" ON "subdomain"("domain_id");

-- CreateIndex
CREATE INDEX "subdomain__address" ON "subdomain"("address");

-- CreateIndex
CREATE INDEX "subdomain__domain_id" ON "subdomain"("domain_id");

-- CreateIndex
CREATE INDEX "subdomain__name" ON "subdomain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subdomain_text_record_subdomain_id_key" ON "subdomain_text_record"("subdomain_id");

-- CreateIndex
CREATE INDEX "subdomain_text_record__subdomain_id" ON "subdomain_text_record"("subdomain_id");

-- AddForeignKey
ALTER TABLE "domain_text_record" ADD CONSTRAINT "domain_text_record_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdomain" ADD CONSTRAINT "subdomain_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
