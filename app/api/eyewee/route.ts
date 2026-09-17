import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../lib/doc2postdoc/server";

export async function POST(request: Request) {
  const { user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to ask Eyewee." }, { status: 401 });
  const body = await request.json() as { question?: unknown; profile?: { research_area?: string; institution?: string } };
  const question = typeof body.question === "string" ? body.question.trim().toLowerCase() : "";
  if (!question) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
  const field = body.profile?.research_area || "your research area";
  const answer = question.includes("industry") || question.includes("explain")
    ? `Start with the problem you solve, then name the evidence. For ${field}, describe the decision you make, the scale of the work, and the outcome before listing techniques.`
    : question.includes("path") || question.includes("role")
      ? `Based on ${field}, explore roles where research judgment is central: translational science, research strategy, and applied R&D. Your next useful step is to compare three real conversations, not just job titles.`
      : `I can help you connect your ${field} experience to a next step. Try asking about a role, a transition, an introduction, or how to explain a specific project.`;
  return NextResponse.json({ answer });
}
