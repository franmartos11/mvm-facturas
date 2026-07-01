import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS category VARCHAR(100);');
    return NextResponse.json({ success: true, message: 'Added category column to invoices table.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
