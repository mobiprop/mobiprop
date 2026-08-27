-- Item #7 (client feedback batch): adds a dedicated Zonaprop source so leads
-- imported from the client's Zonaprop export can be tagged accurately
-- instead of falling back to OTHER/IMPORT.
ALTER TYPE "LeadSource" ADD VALUE 'ZONAPROP';
