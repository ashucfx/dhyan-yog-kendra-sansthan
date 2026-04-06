export async function POST(request: Request) {
  return Response.redirect(new URL("/admin/sign-in?error=legacy", request.url), 303);
}
