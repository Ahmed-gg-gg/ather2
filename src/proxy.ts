import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname.startsWith("/login");
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!user && (isDashboard || isOnboarding)) {
    const url = request.nextUrl.clone(); url.pathname = "/login"; return NextResponse.redirect(url);
  }
  if (user && isLogin) {
    const url = request.nextUrl.clone(); url.pathname = "/dashboard"; return NextResponse.redirect(url);
  }
  if (user && isDashboard) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "parent" && pathname !== "/dashboard/parent") {
      const url = request.nextUrl.clone(); url.pathname = "/dashboard/parent"; return NextResponse.redirect(url);
    }
  }
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/onboarding"] };
