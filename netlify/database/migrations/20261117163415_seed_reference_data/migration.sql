-- Reference data only. No listings, users, bids or transactions are seeded.
INSERT INTO "categories" ("slug", "name", "icon", "sort_order") VALUES
  ('electronics', 'Electronics', 'Cpu', 1),
  ('vehicles', 'Vehicles', 'Car', 2),
  ('fashion', 'Fashion', 'Shirt', 3),
  ('watches-jewellery', 'Watches & Jewellery', 'Watch', 4),
  ('home-furniture', 'Home & Furniture', 'Sofa', 5),
  ('collectibles', 'Collectibles', 'Gem', 6),
  ('art', 'Art', 'Palette', 7),
  ('sports', 'Sports Equipment', 'Dumbbell', 8),
  ('machinery', 'Machinery', 'Cog', 9),
  ('other', 'Other', 'Package', 10)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "platform_settings" ("key", "value") VALUES
  ('commission_bps', '800'::jsonb),
  ('anti_snipe_window_seconds', '120'::jsonb),
  ('anti_snipe_extension_seconds', '120'::jsonb),
  ('payment_window_hours', '72'::jsonb),
  ('payout_hold_days', '3'::jsonb),
  ('enabled_currencies', '["USD","EUR","GBP","CAD","AUD","ZAR","NGN","KES","AED","INR","JPY"]'::jsonb),
  ('enabled_countries', '["US","GB","CA","AU","DE","FR","NL","IE","ZA","NG","KE","AE","IN","JP"]'::jsonb),
  ('live_host_policy', '"verified_sellers"'::jsonb),
  ('policies', '{"prohibited":"Weapons, counterfeit goods, stolen property, live animals, hazardous materials, recalled products and anything illegal in the buyer or seller country.","returns":"Sellers describe items accurately. Buyers can open a dispute within 14 days of delivery if an item is significantly not as described."}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
