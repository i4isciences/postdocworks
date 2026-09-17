import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

export async function GET() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view the community feed." }, { status: 401 });
  const { data, error } = await supabase.from("doc2postdoc_posts").select("id, body, tags, media_urls, created_at, author:doc2postdoc_profiles(display_name, role, institution)").order("created_at", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: "Unable to load the community feed." }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to publish a post." }, { status: 401 });
  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
  const form = isMultipart ? await request.formData() : null;
  const body = isMultipart ? null : await request.json() as { body?: unknown; tags?: unknown };
  const postBody = typeof (form?.get("body") ?? body?.body) === "string" ? String(form?.get("body") ?? body?.body).trim() : "";
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 8) : ["community"];
  if (postBody.length < 1 || postBody.length > 5000) return NextResponse.json({ error: "Posts must be between 1 and 5000 characters." }, { status: 400 });
  const mediaUrls: string[] = [];
  const file = form?.get("media");
  if (file instanceof File && file.type.startsWith("image/") && file.size <= 10_000_000) {
    const path = `${user.id}/posts/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const upload = await supabase.storage.from("doc2postdoc-avatars").upload(path, file, { contentType: file.type });
    if (!upload.error) mediaUrls.push(supabase.storage.from("doc2postdoc-avatars").getPublicUrl(path).data.publicUrl);
  }
  const { data, error } = await supabase.from("doc2postdoc_posts").insert({ author_id: user.id, body: postBody, tags, media_urls: mediaUrls }).select("id, body, tags, media_urls, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to publish the post." }, { status: 500 });
  return NextResponse.json({ success: true, post: data }, { status: 201 });
}
