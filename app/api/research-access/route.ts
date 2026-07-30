import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const is21Plus = formData.get("confirm_21_plus") === "on";
  const researchOnly = formData.get("confirm_research_only") === "on";
  const requestedNext = String(formData.get("next") || "/");
  const nextPath = requestedNext.startsWith("/") ? requestedNext : "/";

  if (!is21Plus || !researchOnly) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set("flexmed_research_gateway_v2", "accepted", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
