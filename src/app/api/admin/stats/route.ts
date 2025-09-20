import { NextResponse } from 'next/server';
import { getAdminDashboardStats } from '@/lib/admin/statsService';

export async function GET() {
    try {
        const stats = await getAdminDashboardStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('ADMIN_GET_STATS_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}