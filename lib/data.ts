import fs from 'fs';
import path from 'path';

export interface Word {
    dictForm: string;
    secondary: string;
    partOfSpeech: string;
    language: string;
    knownStatus: "KNOWN" | "LEARNING" | "UNKNOWN" | "IGNORED";
    hasCard: number;
    tracked: number;
    mod: number;
}

export interface WordListData {
    words: Word[];
}

import { kv } from '@vercel/kv';
import Redis from 'ioredis';

export async function getWordList(): Promise<WordListData | null> {
    try {
        // 1. Generic Redis
        if (process.env.REDIS_URL) {
            const redis = new Redis(process.env.REDIS_URL);
            const data = await redis.get('wordlist');
            await redis.quit();
            if (data) {
                return typeof data === 'string' ? JSON.parse(data) : data;
            }
            return null;
        }

        // 2. Vercel KV
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            const data = await kv.get<WordListData>('wordlist');
            return data;
        }

        // 3. Filesystem
        const filePath = path.join(process.cwd(), 'data', 'wordlist.json');
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading wordlist:', error);
        return null;
    }
}
