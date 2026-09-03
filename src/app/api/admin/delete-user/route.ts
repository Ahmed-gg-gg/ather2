import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مسجل الدخول" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const actorRole = profile?.role ?? "";

  if (!["admin", "teacher"].includes(actorRole)) {
    return NextResponse.json(
      { error: "الأدمن أو المعلم بس يقدروا يحذفوا حسابات" },
      { status: 403 }
    );
  }

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json(
      { error: "متقدرش تحذف حسابك بنفسك" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const targetRole = targetProfile?.role ?? "";

  // Teachers can only remove student/parent accounts.
  if (
    actorRole === "teacher" &&
    !["student", "parent"].includes(targetRole)
  ) {
    return NextResponse.json(
      { error: "المعلم يقدر يحذف طلاب وأولياء أمور بس" },
      { status: 403 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
