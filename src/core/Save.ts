import { ASSET_KEYS, IS_BUILD } from '../constants/GameConfig';
import { PlayGamaSDK } from './PlayGama';

export type BestOf = 3 | 5 | 7;

export interface SaveData {
    sfx: boolean;
    music: boolean;
    pointerSensitivity: number; // 0.5 - 2.0
    bestOf: BestOf;
    playerPaddleId: string; // from PADDLE_OPTIONS
    opponentPaddleId: string;
    puckId: string;    // from PUCK_OPTIONS
}

const DEFAULT_SAVE: SaveData = {
    sfx: true,
    music: true,
    bestOf: 3,
    pointerSensitivity: 1.0,
    playerPaddleId: 'teal',
    opponentPaddleId: 'red',
    puckId: 'navy'
};

const SAVE_KEYS: (keyof SaveData)[] = [
    'sfx', 'music', 'pointerSensitivity', 'bestOf',
    'playerPaddleId', 'opponentPaddleId', 'puckId'
];

const addKeyPrefix = (key: string): string => `airhockey-${key}`;
const removeKeyPrefix = (key: string): string => key.replace('airhockey-', '');

let cache: SaveData | null = null;
let pendingSave: Promise<SaveData> | null = null;

export const Save = {
    get: async function (): Promise<SaveData> {
        if (pendingSave) {
            return pendingSave;
        }

        if (cache) {
            return cache;
        }

        pendingSave = this.loadSave();
        try {
            const result = await pendingSave;
            cache = result;
            return result;
        } finally {
            pendingSave = null;
        }
    },

    async loadSave(): Promise<SaveData> {
        const sdk = PlayGamaSDK.getInstance();
        let loadedData: Partial<SaveData> = {};

        if (sdk.isInitialized() && IS_BUILD) {
            try {
                const prefixedKeys = SAVE_KEYS.map(addKeyPrefix);
                const bulkData = await sdk.loadBulkData(prefixedKeys);

                for (const [prefixedKey, value] of Object.entries(bulkData)) {
                    const originalKey = removeKeyPrefix(prefixedKey) as keyof SaveData;
                    loadedData[originalKey] = value;
                }
            } catch (error) {
                console.warn('Failed to load save from SDK, falling back to localStorage', error);
                loadedData = await this.loadFromLocalStorage();
            }
        } else {
            loadedData = await this.loadFromLocalStorage();
        }

        return { ...DEFAULT_SAVE, ...loadedData };
    },

    async loadFromLocalStorage(): Promise<Partial<SaveData>> {
        const data = localStorage.getItem('airhockey-save');
        return data ? JSON.parse(data) : {};
    },

    set: async function (data: Partial<SaveData>): Promise<void> {
        const sdk = PlayGamaSDK.getInstance();
        const current = await this.get();
        const newData = { ...current, ...data };

        cache = newData;

        if (sdk.isInitialized() && IS_BUILD) {
            try {
                const prefixedData: Record<string, any> = {};
                for (const [key, value] of Object.entries(data)) {
                    prefixedData[addKeyPrefix(key)] = value;
                }
                await sdk.saveBulkData(prefixedData);
            } catch (error) {
                console.warn('Failed to save data to SDK, falling back to localStorage', error);
                this.saveToLocalStorage(newData);
            }
        } else {
            this.saveToLocalStorage(newData);
        }
    },

    saveToLocalStorage(data: SaveData): void {
        localStorage.setItem('airhockey-save', JSON.stringify(data));
    },

    clearCache: function (): void {
        cache = null;
    }
};
