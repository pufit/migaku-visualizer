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

export async function getWordList(): Promise<WordListData | null> {
    try {
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
