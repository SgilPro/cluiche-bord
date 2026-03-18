import { networkInterfaces } from "os";
import { NextResponse } from "next/server";

export function GET() {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    if (!iface) continue;
    for (const net of iface) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        net.address.startsWith("192.168")
      ) {
        return NextResponse.json({ ip: net.address });
      }
    }
  }
  return NextResponse.json({ ip: null });
}
