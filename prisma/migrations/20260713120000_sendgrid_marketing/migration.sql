-- SendGrid email marketing module: audiences, recipients, campaigns, events,
-- settings. Hand-written (shadow-db workaround) — apply with `migrate deploy`.

-- CreateEnum
CREATE TYPE "EmailRecipientStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED', 'REMOVED');
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');
CREATE TYPE "EmailSendStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable: email_lists
CREATE TABLE "email_lists" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "double_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_lists_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_lists_list_id_key" ON "email_lists"("list_id");
ALTER TABLE "email_lists" ENABLE ROW LEVEL SECURITY;

-- CreateTable: email_recipients
CREATE TABLE "email_recipients" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" "EmailRecipientStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "unsubscribed_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "unsubscribe_token" TEXT NOT NULL,
    "crm_contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_recipients_email_key" ON "email_recipients"("email");
CREATE UNIQUE INDEX "email_recipients_unsubscribe_token_key" ON "email_recipients"("unsubscribe_token");
CREATE INDEX "email_recipients_status_idx" ON "email_recipients"("status");
ALTER TABLE "email_recipients" ENABLE ROW LEVEL SECURITY;

-- CreateTable: email_list_members
CREATE TABLE "email_list_members" (
    "list_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "added_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_list_members_pkey" PRIMARY KEY ("list_id","recipient_id")
);
CREATE INDEX "email_list_members_recipient_idx" ON "email_list_members"("recipient_id");
ALTER TABLE "email_list_members"
    ADD CONSTRAINT "email_list_members_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "email_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_list_members"
    ADD CONSTRAINT "email_list_members_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "email_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_list_members" ENABLE ROW LEVEL SECURITY;

-- CreateTable: email_campaigns
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preview_text" TEXT,
    "from_name" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "template_key" TEXT,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "list_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "send_started_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "sent_by_id" UUID,
    "failed_reason" TEXT,
    "sg_batch_id" TEXT,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "last_event_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_campaigns_campaign_id_key" ON "email_campaigns"("campaign_id");
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");
ALTER TABLE "email_campaigns"
    ADD CONSTRAINT "email_campaigns_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "email_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_campaigns" ENABLE ROW LEVEL SECURITY;

-- CreateTable: email_campaign_recipients
CREATE TABLE "email_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "recipient_id" TEXT,
    "email" TEXT NOT NULL,
    "status" "EmailSendStatus" NOT NULL DEFAULT 'PENDING',
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "dropped_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "spam_reported_at" TIMESTAMP(3),
    "last_event_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaign_recipients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_campaign_recipients_campaign_email_key" ON "email_campaign_recipients"("campaign_id", "email");
CREATE INDEX "email_campaign_recipients_email_idx" ON "email_campaign_recipients"("email");
ALTER TABLE "email_campaign_recipients"
    ADD CONSTRAINT "email_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_campaign_recipients"
    ADD CONSTRAINT "email_campaign_recipients_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "email_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_campaign_recipients" ENABLE ROW LEVEL SECURITY;

-- CreateTable: email_campaign_events
CREATE TABLE "email_campaign_events" (
    "id" TEXT NOT NULL,
    "sg_event_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "email" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaign_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_campaign_events_sg_event_id_key" ON "email_campaign_events"("sg_event_id");
CREATE INDEX "email_campaign_events_campaign_idx" ON "email_campaign_events"("campaign_id");
ALTER TABLE "email_campaign_events"
    ADD CONSTRAINT "email_campaign_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_campaign_events" ENABLE ROW LEVEL SECURITY;

-- CreateTable: sendgrid_settings
CREATE TABLE "sendgrid_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "default_from_name" TEXT NOT NULL DEFAULT 'Ulrich Propiedades',
    "default_from_email" TEXT NOT NULL DEFAULT 'mailing@ulrichpropiedades.com',
    "click_tracking" BOOLEAN NOT NULL DEFAULT true,
    "open_tracking" BOOLEAN NOT NULL DEFAULT true,
    "sandbox_mode" BOOLEAN NOT NULL DEFAULT false,
    "last_connection_test_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sendgrid_settings_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "sendgrid_settings" ENABLE ROW LEVEL SECURITY;

-- Seed the system "All Contacts" master list.
INSERT INTO "email_lists" ("id", "list_id", "name", "description", "is_system", "updated_at")
VALUES ('emls_all_contacts_system', 'LIST-001', 'All Contacts', 'Every contact imported into SendGrid', true, CURRENT_TIMESTAMP);
