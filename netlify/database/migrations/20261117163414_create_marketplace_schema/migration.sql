CREATE TABLE "auction_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"auction_id" uuid NOT NULL,
	"bidder_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"idempotency_key" text NOT NULL,
	"extended" boolean DEFAULT false NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL UNIQUE,
	"seller_id" uuid NOT NULL,
	"format" text DEFAULT 'timed' NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"currency" text NOT NULL,
	"starting_price" bigint NOT NULL,
	"min_increment" bigint NOT NULL,
	"reserve_price" bigint,
	"current_bid" bigint,
	"current_bidder_id" uuid,
	"bid_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"original_ends_at" timestamp with time zone NOT NULL,
	"extension_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"live_event_id" uuid,
	"moderation_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"ending_soon_notified_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"winner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auctions_prices_check" CHECK ("starting_price" > 0 AND "min_increment" > 0),
	CONSTRAINT "auctions_reserve_check" CHECK ("reserve_price" IS NULL OR "reserve_price" >= "starting_price"),
	CONSTRAINT "auctions_window_check" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"ip" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"slug" text PRIMARY KEY,
	"name" text NOT NULL,
	"icon" text DEFAULT 'Package' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"opened_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_auction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"seller_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_key" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"room_name" text NOT NULL UNIQUE,
	"broadcasting" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"current_lot_id" uuid,
	"moderation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_auction_participants" (
	"event_id" uuid,
	"user_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chat_blocked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "live_auction_participants_pkey" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "live_auction_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"auction_id" uuid NOT NULL UNIQUE,
	"position" integer NOT NULL,
	"lot_duration_seconds" integer DEFAULT 120 NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"opened_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "live_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"hidden_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"link" text,
	"read_at" timestamp with time zone,
	"email_status" text DEFAULT 'pending' NOT NULL,
	"email_attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"auction_id" uuid NOT NULL UNIQUE,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"item_amount" bigint NOT NULL,
	"shipping_amount" bigint DEFAULT 0 NOT NULL,
	"commission_amount" bigint NOT NULL,
	"total_amount" bigint NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"shipping_address_id" uuid,
	"payment_due_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_session_id" text UNIQUE,
	"provider_payment_id" text,
	"amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"seller_id" uuid NOT NULL,
	"order_id" uuid NOT NULL UNIQUE,
	"amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'held' NOT NULL,
	"provider_ref" text,
	"eligible_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"blob_key" text NOT NULL UNIQUE,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"seller_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category_slug" text NOT NULL,
	"condition" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"shipping_options" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_quantity_check" CHECK ("quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payment_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"provider_ref" text,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reporter_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"rating" smallint NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"user_id" uuid PRIMARY KEY,
	"display_name" text NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"seller_type" text DEFAULT 'individual' NOT NULL,
	"business_name" text,
	"business_registration" text,
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"live_host_approved" boolean DEFAULT false NOT NULL,
	"stripe_account_id" text UNIQUE,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"carrier" text NOT NULL,
	"tracking_number" text NOT NULL,
	"status" text DEFAULT 'shipped' NOT NULL,
	"shipped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipping_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"region" text,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"avatar_key" text,
	"bio" text DEFAULT '' NOT NULL,
	"timezone" text,
	"contact_preferences" jsonb DEFAULT '{"outbid":true,"endingSoon":true,"results":true,"orders":true,"messages":true,"liveEvents":true}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identity_id" text NOT NULL UNIQUE,
	"email" text NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"phone" text,
	"country" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"terms_accepted_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_ref" text,
	"details" text DEFAULT '' NOT NULL,
	"reviewed_by" uuid,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"user_id" uuid,
	"auction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_pkey" PRIMARY KEY("user_id","auction_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY,
	"provider" text NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auction_bids_idempotency_idx" ON "auction_bids" ("bidder_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "auction_bids_amount_idx" ON "auction_bids" ("auction_id","amount");--> statement-breakpoint
CREATE INDEX "auction_bids_auction_idx" ON "auction_bids" ("auction_id","created_at");--> statement-breakpoint
CREATE INDEX "auction_bids_bidder_idx" ON "auction_bids" ("bidder_id");--> statement-breakpoint
CREATE INDEX "auctions_status_ends_idx" ON "auctions" ("status","ends_at");--> statement-breakpoint
CREATE INDEX "auctions_status_starts_idx" ON "auctions" ("status","starts_at");--> statement-breakpoint
CREATE INDEX "auctions_seller_idx" ON "auctions" ("seller_id");--> statement-breakpoint
CREATE INDEX "auctions_live_event_idx" ON "auctions" ("live_event_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" ("actor_id");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" ("status");--> statement-breakpoint
CREATE INDEX "disputes_order_idx" ON "disputes" ("order_id");--> statement-breakpoint
CREATE INDEX "live_events_status_idx" ON "live_auction_events" ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "live_events_seller_idx" ON "live_auction_events" ("seller_id");--> statement-breakpoint
CREATE INDEX "live_participants_seen_idx" ON "live_auction_participants" ("event_id","last_seen_at");--> statement-breakpoint
CREATE UNIQUE INDEX "live_products_position_idx" ON "live_auction_products" ("event_id","position");--> statement-breakpoint
CREATE INDEX "live_chat_event_idx" ON "live_chat_messages" ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_email_idx" ON "notifications" ("email_status");--> statement-breakpoint
CREATE INDEX "orders_buyer_idx" ON "orders" ("buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_seller_idx" ON "orders" ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" ("status");--> statement-breakpoint
CREATE INDEX "payouts_seller_idx" ON "payouts" ("seller_id","status");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" ("product_id","position");--> statement-breakpoint
CREATE INDEX "products_seller_idx" ON "products" ("seller_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("category_slug");--> statement-breakpoint
CREATE INDEX "products_country_idx" ON "products" ("country");--> statement-breakpoint
CREATE INDEX "products_search_idx" ON "products" USING gin (to_tsvector('simple', "title" || ' ' || "description"));--> statement-breakpoint
CREATE INDEX "refunds_payment_idx" ON "refunds" ("payment_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_order_author_idx" ON "reviews" ("order_id","author_id");--> statement-breakpoint
CREATE INDEX "reviews_subject_idx" ON "reviews" ("subject_id");--> statement-breakpoint
CREATE INDEX "shipments_order_idx" ON "shipments" ("order_id");--> statement-breakpoint
CREATE INDEX "shipping_addresses_user_idx" ON "shipping_addresses" ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" ("status");--> statement-breakpoint
CREATE INDEX "verification_user_idx" ON "verification_records" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_status_idx" ON "verification_records" ("status");--> statement-breakpoint
CREATE INDEX "watchlists_auction_idx" ON "watchlists" ("auction_id");--> statement-breakpoint
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_auction_id_auctions_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id");--> statement-breakpoint
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_bidder_id_users_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_users_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_current_bidder_id_users_id_fkey" FOREIGN KEY ("current_bidder_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_live_event_id_live_auction_events_id_fkey" FOREIGN KEY ("live_event_id") REFERENCES "live_auction_events"("id");--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_winner_id_users_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_users_id_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_users_id_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "live_auction_events" ADD CONSTRAINT "live_auction_events_seller_id_users_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "live_auction_participants" ADD CONSTRAINT "live_auction_participants_event_id_live_auction_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "live_auction_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "live_auction_participants" ADD CONSTRAINT "live_auction_participants_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "live_auction_products" ADD CONSTRAINT "live_auction_products_event_id_live_auction_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "live_auction_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "live_auction_products" ADD CONSTRAINT "live_auction_products_auction_id_auctions_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id");--> statement-breakpoint
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_event_id_live_auction_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "live_auction_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_hidden_by_users_id_fkey" FOREIGN KEY ("hidden_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_auction_id_auctions_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_shipping_addresses_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "shipping_addresses"("id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_users_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_users_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_slug_categories_slug_fkey" FOREIGN KEY ("category_slug") REFERENCES "categories"("slug");--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id");--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_id_users_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_auction_id_auctions_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE;