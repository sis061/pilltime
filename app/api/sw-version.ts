import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    buildId: process.env.__NEXT_BUILD_ID || "",
  });
}
