import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    url: process.env.GOOGLE_FORM_RESPONSE_SHEET_URL || ""
  });
}
