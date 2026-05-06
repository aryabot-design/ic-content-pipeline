import { NextResponse } from 'next/server';

export const GET = () => NextResponse.json({ user: { name: 'Team' } });
export const POST = () => NextResponse.json({ user: { name: 'Team' } });
