import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import { kv } from '@vercel/kv';
import Redis from 'ioredis';

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

        // 1. Generic Redis
        if (process.env.REDIS_URL) {
            const redis = new Redis(process.env.REDIS_URL);
            await redis.set('wordlist', JSON.stringify(data));
            await redis.quit();
            return NextResponse.json({ success: true, message: 'Data synced successfully to Redis' });
        }

        // 2. Vercel KV
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            await kv.set('wordlist', data);
            return NextResponse.json({ success: true, message: 'Data synced successfully to KV' });
        }

        // 3. Fallback to local filesystem (dev mode)
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const filePath = path.join(dataDir, 'wordlist.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true, message: 'Data synced successfully to FS' });
    } catch (error) {
        console.error('Error syncing data:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to sync data' },
            { status: 500 }
        );
    }
}
