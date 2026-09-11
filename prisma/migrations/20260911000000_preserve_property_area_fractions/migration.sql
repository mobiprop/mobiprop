ALTER TABLE public.properties
ALTER COLUMN total_area_m2 TYPE double precision USING total_area_m2::double precision,
ALTER COLUMN covered_area_m2 TYPE double precision USING covered_area_m2::double precision,
ALTER COLUMN semi_covered_area_m2 TYPE double precision USING semi_covered_area_m2::double precision,
ALTER COLUMN lot_size_m2 TYPE double precision USING lot_size_m2::double precision,
ALTER COLUMN lot_frontage_m2 TYPE double precision USING lot_frontage_m2::double precision,
ALTER COLUMN lot_depth_m2 TYPE double precision USING lot_depth_m2::double precision;
