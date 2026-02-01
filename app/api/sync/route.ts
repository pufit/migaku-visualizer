import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

import { kv } from '@vercel/kv';
import Redis from 'ioredis';
import type { Word, WordListData } from '@/lib/data';

// Create a unique key for a word
function wordKey(word: Word): string {
    return `${word.dictForm}|${word.language}`;
}

// Merge incoming words with existing, preserving createdAt
function mergeWordLists(existing: Word[], incoming: Word[]): Word[] {
    const existingMap = new Map<string, Word>();
    for (const word of existing) {
        existingMap.set(wordKey(word), word);
    }

    return incoming.map(word => {
        const existingWord = existingMap.get(wordKey(word));
        return {
            ...word,
            // Preserve existing createdAt if present
            createdAt: existingWord?.createdAt ?? word.createdAt,
        };
    });
}

export async function POST(request: Request) {
    try {
        const secret = request.headers.get('x-sync-secret');
        if (secret !== process.env.SYNC_SECRET) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data: WordListData = await request.json();
        const incomingWords = data.words || [];

        // 1. Generic Redis
        if (process.env.REDIS_URL) {
            const url = new URL(process.env.REDIS_URL);
            const redis = new Redis({
                host: url.hostname,
                port: parseInt(url.port || '6379'),
                username: url.username,
                password: url.password,
                tls: url.protocol === 'rediss:' ? {} : undefined,
            });

            // Fetch existing data to preserve createdAt
            const existingData = await redis.get('wordlist');
            let existingWords: Word[] = [];
            if (existingData) {
                const parsed = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
                existingWords = Array.isArray(parsed) ? parsed : parsed.words || [];
            }

            // Merge to preserve createdAt
            const mergedWords = mergeWordLists(existingWords, incomingWords);
            await redis.set('wordlist', JSON.stringify({ words: mergedWords }));
            await redis.quit();
            revalidatePath('/', 'layout');
            return NextResponse.json({ success: true, message: 'Data synced successfully to Redis' });
        }

        // 2. Vercel KV
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            // Fetch existing data to preserve createdAt
            const existingData = await kv.get<WordListData | Word[]>('wordlist');
            let existingWords: Word[] = [];
            if (existingData) {
                existingWords = Array.isArray(existingData) ? existingData : existingData.words || [];
            }

            const mergedWords = mergeWordLists(existingWords, incomingWords);
            await kv.set('wordlist', { words: mergedWords });
            revalidatePath('/', 'layout');
            return NextResponse.json({ success: true, message: 'Data synced successfully to KV' });
        }

        // 3. Fallback to local filesystem (dev mode)
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const filePath = path.join(dataDir, 'wordlist.json');

        // Fetch existing data to preserve createdAt
        let existingWords: Word[] = [];
        if (fs.existsSync(filePath)) {
            const existingContent = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(existingContent);
            existingWords = Array.isArray(parsed) ? parsed : parsed.words || [];
        }

        const mergedWords = mergeWordLists(existingWords, incomingWords);
        fs.writeFileSync(filePath, JSON.stringify({ words: mergedWords }, null, 2));

        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, message: 'Data synced successfully to FS' });
    } catch (error) {
        console.error('Error syncing data:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to sync data' },
            { status: 500 }
        );
    }
}
