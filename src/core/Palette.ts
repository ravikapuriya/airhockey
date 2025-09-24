export type PickerItem = { id: string; color: number; label: string };

export const PADDLE_OPTIONS: PickerItem[] = [
    { id: 'teal', color: 0x17c2b8, label: 'Teal' },
    { id: 'blue', color: 0x2c7bff, label: 'Blue' },
    { id: 'red', color: 0xff3a3a, label: 'Red' },
    { id: 'orange', color: 0xff9f1c, label: 'Orange' },
    { id: 'purple', color: 0x8a5cff, label: 'Purple' },
    { id: 'lime', color: 0x00e676, label: 'Lime' }
];

export const PUCK_OPTIONS: PickerItem[] = [
    { id: 'navy', color: 0x1a2a6c, label: 'Navy' },
    { id: 'cyan', color: 0x00e5ff, label: 'Cyan' },
    { id: 'magenta', color: 0xff2bd4, label: 'Magenta' },
    { id: 'white', color: 0xf0f0f0, label: 'White' }
];
