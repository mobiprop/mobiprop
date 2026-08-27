// Names must match the `agents.team[].name` entries in src/i18n/locales/*/home.json
// and the corresponding Profile.fullName in the DB, so getTeamAvatars() can look up
// each member's real avatarUrl. Kept in its own module (no "use client", no
// side-effect imports) so server-only code (getTeamAvatars.ts) can import it
// without pulling the client-only Agents.tsx module graph into the server bundle.
export const TEAM_MEMBER_NAMES = [
  "Rodolfo Ulrich",
  "Carola Buscaglia",
  "Matías Ulrich",
] as const;
