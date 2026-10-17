CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "geo"."places"
ADD COLUMN "location" geography(Point, 4326);

UPDATE "geo"."places"
SET "location" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography;

ALTER TABLE "geo"."places"
ALTER COLUMN "location" SET NOT NULL;

CREATE INDEX "places_location_gist_idx"
ON "geo"."places" USING GIST ("location");

ALTER TABLE "transit"."transit_stops"
ADD COLUMN "location" geography(Point, 4326);

UPDATE "transit"."transit_stops"
SET "location" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography;

ALTER TABLE "transit"."transit_stops"
ALTER COLUMN "location" SET NOT NULL;

CREATE INDEX "transit_stops_location_gist_idx"
ON "transit"."transit_stops" USING GIST ("location");

CREATE FUNCTION geo.set_location_from_coordinates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."location" := ST_SetSRID(ST_MakePoint(NEW."lng", NEW."lat"), 4326)::geography;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "places_set_location_from_coordinates"
BEFORE INSERT OR UPDATE OF "lat", "lng"
ON "geo"."places"
FOR EACH ROW
EXECUTE FUNCTION geo.set_location_from_coordinates();

CREATE TRIGGER "transit_stops_set_location_from_coordinates"
BEFORE INSERT OR UPDATE OF "lat", "lng"
ON "transit"."transit_stops"
FOR EACH ROW
EXECUTE FUNCTION geo.set_location_from_coordinates();
