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
            const url = new URL(process.env.REDIS_URL);
            const redis = new Redis({
                host: url.hostname,
                port: parseInt(url.port || '6379'),
                username: url.username,
                password: url.password,
                tls: url.protocol === 'rediss:' ? {} : undefined,
            });
            const data = await redis.get('wordlist');
            await redis.quit();
            if (data) {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                return Array.isArray(parsed) ? { words: parsed } : parsed;
            }
            return null;
        }

        // 2. Vercel KV
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            const data = await kv.get<WordListData | Word[]>('wordlist');
            if (Array.isArray(data)) {
                return { words: data };
            }
            return data as WordListData;
        }

        // 3. Filesystem
        const filePath = path.join(process.cwd(), 'data', 'wordlist.json');
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return Array.isArray(parsed) ? { words: parsed } : parsed;
    } catch (error) {
        console.error('Error reading wordlist:', error);
        return null;
    }
}
