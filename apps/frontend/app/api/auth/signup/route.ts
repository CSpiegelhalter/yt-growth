import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name ?? null, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 });
  }
}
