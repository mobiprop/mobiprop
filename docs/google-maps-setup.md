# Mobi Prop Google Maps

Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the mobi-prop Vercel project, then redeploy. This browser key powers the property maps, contact office map and Places suggestions.

Enable Maps JavaScript API, Places API (New), and Geocoding API in the key's Google Cloud project with billing enabled. Restrict the browser key to the deployed Mobi website domains and local development origins. Do not add Ulrich's domains or use its credentials.

Server-side geocoding when agents save a property uses a separate GOOGLE_MAPS_API_KEY. That key must support Geocoding API and server-side requests; do not apply website-referrer restrictions to the server key. Neither key is committed to this repository.

Google API setup and restrictions:
https://developers.google.com/maps/api-security-best-practices

Office map address: Las Amapolas 455, Manuel Alberti, Buenos Aires, Argentina. Directions remain available when the interactive map cannot load.
