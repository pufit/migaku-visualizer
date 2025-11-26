import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const secret = request.headers.get('x-sync-secret');
        if (secret !== process.env.SYNC_SECRET) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();

        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const filePath = path.join(dataDir, 'wordlist.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true, message: 'Data synced successfully' });
    } catch (error) {
        console.error('Error syncing data:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to sync data' },
            { status: 500 }
        );
    }
}
