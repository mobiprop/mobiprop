-- Extends the canonical amenity catalog (see the seed in
-- 20260611120000_add_listings_module) with the additional features from the
-- client's Figma feature-list export. Labels here are English fallbacks —
-- translated labels live in src/i18n/locales/*/dashboard.json and
-- listingDetail.json, keyed by `key`.
INSERT INTO "public"."amenities" ("id", "key", "label") VALUES
  ('amn_central_heating',       'CENTRAL_HEATING',               'Central Heating'),
  ('amn_radiators',             'RADIATORS',                     'Radiators'),
  ('amn_balanced_flue_heater',  'BALANCED_FLUE_GAS_HEATER',      'Balanced-flue Gas Heater'),
  ('amn_polo_field',            'POLO_FIELD',                    'Polo Field'),
  ('amn_golf_course',           'GOLF_COURSE',                   'Golf Course'),
  ('amn_multipurpose_room',     'MULTIPURPOSE_ROOM',             'Multipurpose Room'),
  ('amn_padel_court',           'PADEL_COURT',                   'Padel Court'),
  ('amn_central_ac',            'CENTRAL_AIR_CONDITIONING',      'Central Air Conditioning'),
  ('amn_living_room',           'LIVING_ROOM',                   'Living Room'),
  ('amn_living_dining_room',    'LIVING_DINING_ROOM',            'Living-dining Room'),
  ('amn_covered_entertaining',  'COVERED_ENTERTAINING_AREA',     'Covered Entertaining Area'),
  ('amn_approved_professional', 'APPROVED_FOR_PROFESSIONAL_USE', 'Approved for Professional Use'),
  ('amn_staff_quarters',        'STAFF_QUARTERS',                'Staff Quarters'),
  ('amn_walk_in_closet',        'WALK_IN_CLOSET',                'Walk-in Closet'),
  ('amn_en_suite_bedroom',      'EN_SUITE_BEDROOM',              'En-suite Bedroom'),
  ('amn_solarium',              'SOLARIUM',                      'Solarium')
ON CONFLICT ("key") DO NOTHING;
