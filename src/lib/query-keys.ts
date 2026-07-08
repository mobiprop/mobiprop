/**
 * Centralized TanStack Query key factory.
 *
 * Use these everywhere instead of inlining string arrays so query and
 * invalidation keys never drift apart. See the project guide (§11–§18).
 *
 * Calling a filterable key with no argument returns just the prefix
 * (e.g. `queryKeys.leads()` -> `["leads"]`), which is what you want for
 * invalidation since TanStack Query matches keys by prefix.
 */

// Returns [prefix] when no arg is passed, otherwise [prefix, arg].
function prefixed<P extends string>(prefix: P) {
  return (arg?: unknown) =>
    (arg === undefined ? [prefix] : [prefix, arg]) as
      | readonly [P]
      | readonly [P, unknown];
}

export const queryKeys = {
  // Public listings
  listings: prefixed("listings"),
  listing: (slug: string) => ["listing", slug] as const,
  similarListings: (listingId: string) => ["similar-listings", listingId] as const,
  mapListings: (filters?: unknown, drawnGeometry?: unknown, mapBounds?: unknown) =>
    ["map-listings", filters, drawnGeometry, mapBounds] as const,

  // Dashboard analytics
  dashboardMetrics: prefixed("dashboard-metrics"),
  revenueChart: (dateRange: unknown) => ["revenue-chart", dateRange] as const,
  opportunitySummary: (dateRange: unknown) => ["opportunity-summary", dateRange] as const,
  salesByAgent: (dateRange: unknown) => ["sales-by-agent", dateRange] as const,
  locationSummary: (dateRange: unknown) => ["location-summary", dateRange] as const,
  googleCalendarStatus: prefixed("google-calendar-status"),

  // CRM tables
  agents: prefixed("agents"),
  agentDetail: (id: string, period?: string) => ["agents", "detail", id, period] as const,
  dashboardContacts: prefixed("dashboard-contacts"),
  contacts: prefixed("contacts"),
  dashboardListings: prefixed("dashboard-listings"),
  leads: prefixed("leads"),
  leadDetail: (id: string) => ["leads", "detail", id] as const,
  leadMetrics: () => ["leads", "metrics"] as const,
  leadNotes: (id: string) => ["leads", "detail", id, "notes"] as const,
  leadActivities: (id: string) => ["leads", "detail", id, "activities"] as const,
  tours: prefixed("tours"),
  tourDetail: (id: string) => ["tours", "detail", id] as const,
  tourMetrics: () => ["tours", "metrics"] as const,
  dashboardOpportunities: prefixed("dashboard-opportunities"),
  opportunities: prefixed("opportunities"),
  docusignEnvelopes: prefixed("docusign-envelopes"),
  docusignTemplates: prefixed("docusign-templates"),
  docusignSettings: prefixed("docusign-settings"),
  docusignStatus: prefixed("docusign-status"),
  locations: prefixed("locations"),
  activityLogs: prefixed("activity-logs"),

  // Blog / CMS
  blogPosts: prefixed("blog-posts"),
  blogMetrics: () => ["blog-metrics"] as const,
  blogCategories: () => ["blog-categories"] as const,

  // User account
  savedListings: (userId: string) => ["saved-listings", userId] as const,
  recentlyViewedListings: (userId: string) => ["recently-viewed-listings", userId] as const,
  scheduledTours: (userId: string) => ["scheduled-tours", userId] as const,
  accountNotifications: (userId: string) => ["account-notifications", userId] as const,

  // Messages / inbox
  // A bare call (no arg) invalidates both the active and archived lists too,
  // since TanStack Query's default invalidation matches by key prefix.
  messageThreads: (archivedOnly?: boolean) =>
    (archivedOnly ? ["message-threads", "archived"] : ["message-threads"]) as
      | readonly ["message-threads"]
      | readonly ["message-threads", "archived"],
  messageThread: (threadId: string) => ["message-thread", threadId] as const,
  unreadMessageCount: () => ["unread-message-count"] as const,
  messageableStaff: () => ["messageable-staff"] as const,

  // Notifications
  notifications: () => ["notifications"] as const,
  unreadNotificationsCount: () => ["unread-notifications-count"] as const,

  // Web push
  pushStatus: () => ["push", "status"] as const,

  // Dashboard global search
  dashboardSearch: (q: string) => ["dashboard-search", q] as const,

  // Saved listings page (full card data, distinct from savedListings which tracks IDs)
  savedListingsPage: () => ["saved-listings-page"] as const,

  // Location autocomplete suggestions (public, Property-row-backed)
  locationSuggestions: (q: string) => ["listing-locations", q] as const,

  // Dashboard "Locations" sector (DB-backed) name suggestions for the Upload
  // Listing modal — distinct from locationSuggestions above.
  locationNameSuggestions: () => ["location-name-suggestions"] as const,
} as const;
