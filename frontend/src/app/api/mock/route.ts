import { NextResponse } from "next/server";
import { DEFAULT_PARCEL_DATA } from "@/mock/defaultParcelData";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientLog = url.searchParams.get("log");
  if (clientLog) {
    console.log("[CLIENT LOG]:", clientLog);
  }
  return NextResponse.json(DEFAULT_PARCEL_DATA);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      ...DEFAULT_PARCEL_DATA,
      cadastral_code: body.cadastral_code || DEFAULT_PARCEL_DATA.cadastral_code,
      coordinates: body.coordinates || DEFAULT_PARCEL_DATA.coordinates,
    });
  } catch {
    return NextResponse.json(DEFAULT_PARCEL_DATA);
  }
}
