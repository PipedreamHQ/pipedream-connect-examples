import { NextResponse } from "next/server";

import { serverConnectTokenCreate } from "@/app/server";

export async function POST(request: Request) {
  try {
    const { externalUserId } = await request.json();

    if (!externalUserId || typeof externalUserId !== "string") {
      return NextResponse.json(
        { error: "externalUserId is required" },
        { status: 400 }
      );
    }

    const tokenResponse = await serverConnectTokenCreate({ externalUserId });
    return NextResponse.json(tokenResponse);
  } catch (error) {
    console.error("Error creating connect token via API route:", error);
    return NextResponse.json(
      { error: "Failed to create connect token" },
      { status: 500 }
    );
  }
}
