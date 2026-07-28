/**
 * Fallback text for a failed fetch when the server didn't send our normal
 * `{success, error}` JSON shape (expired session redirect, proxy/edge
 * rejection, raw framework error page, ...) — status-specific instead of a
 * bare "Request failed" with no actionable detail.
 */
export function fallbackErrorMessage(status: number): string {
  if (status === 401) return "Your session has expired. Please refresh the page and log in again.";
  if (status === 403) return "You don't have permission to perform this action.";
  if (status >= 500) return "Something went wrong on our end. Please try again in a moment.";
  return `The request failed (error ${status}). Please try again.`;
}

export const NETWORK_ERROR_MESSAGE = "Couldn't reach the server. Check your connection and try again.";
