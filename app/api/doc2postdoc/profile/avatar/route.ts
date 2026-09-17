import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../../lib/doc2postdoc/server";

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your photo." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 5_000_000) return NextResponse.json({ error: "Choose an image smaller than 5MB." }, { status: 400 });
  const path = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  const { error: uploadError } = await supabase.storage.from("doc2postdoc-avatars").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "Unable to upload photo." }, { status: 400 });
  const { data: publicData } = supabase.storage.from("doc2postdoc-avatars").getPublicUrl(path);
  const { data, error } = await supabase.from("doc2postdoc_profiles").update({ avatar_url: publicData.publicUrl, avatar_path: path }).eq("id", user.id).select("avatar_url, avatar_path").single();
  if (error) return NextResponse.json({ error: "Unable to save photo." }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function DELETE() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your photo." }, { status: 401 });
  const { data: profile } = await supabase.from("doc2postdoc_profiles").select("avatar_path").eq("id", user.id).single();
  if (profile?.avatar_path) await supabase.storage.from("doc2postdoc-avatars").remove([profile.avatar_path]);
  await supabase.from("doc2postdoc_profiles").update({ avatar_url: null, avatar_path: null }).eq("id", user.id);
  return NextResponse.json({ success: true });
}