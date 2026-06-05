// Supabase middleware helper — placeholder
// TODO: install @supabase/ssr

// import { createServerClient } from "@supabase/ssr";
// import { NextResponse, type NextRequest } from "next/server";
// import { env } from "@/lib/env";
//
// export async function updateSession(request: NextRequest) {
//   let supabaseResponse = NextResponse.next({ request });
//   createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
//     cookies: {
//       getAll() { return request.cookies.getAll(); },
//       setAll(cookiesToSet) {
//         cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
//       },
//     },
//   });
//   return supabaseResponse;
// }

export {};
