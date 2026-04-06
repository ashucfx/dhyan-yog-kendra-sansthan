import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerEnv } from "./config";
import { getSupabaseServiceClient } from "./service";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.includes("auth-token"));
}

export async function updateSupabaseSession(request: NextRequest) {
  const env = getSupabaseServerEnv();
  if (!env.configured || !env.url || !env.anonKey) {
    return NextResponse.next({ request });
  }

  if (!hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  try {
    await supabase.auth.getUser();
  } catch {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminSignInPage = pathname === "/admin/sign-in";

  if (isAdminPage && !isAdminSignInPage) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    const service = getSupabaseServiceClient();
    if (!service) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.searchParams.set("error", "config");
      return NextResponse.redirect(url);
    }

    const { data } = await service
      .from("admin_users")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();
    const adminUser = data as { role: string; status: string } | null;

    if (!adminUser || adminUser.status !== "active") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
