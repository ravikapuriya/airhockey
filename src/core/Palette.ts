export type PickerItem = { id: string; color: number; label: string; imagePath?: string };

export const PADDLE_OPTIONS: PickerItem[] = [
    { id: 'teal', color: 0x17c2b8, label: 'Teal', imagePath: 'assets/skins/mallet/mallet.png' },
    { id: 'blue', color: 0x2c7bff, label: 'Blue', imagePath: 'assets/skins/mallet/mallet.png' },
    { id: 'red', color: 0xff3a3a, label: 'Red', imagePath: 'assets/skins/mallet/mallet.png' },
    { id: 'orange', color: 0xff9f1c, label: 'Orange', imagePath: 'assets/skins/mallet/mallet.png' },
    { id: 'purple', color: 0x8a5cff, label: 'Purple', imagePath: 'assets/skins/mallet/mallet.png' },
    { id: 'lime', color: 0x00e676, label: 'Lime', imagePath: 'assets/skins/mallet/mallet.png' }
];

export const PUCK_OPTIONS: PickerItem[] = [
    { id: 'navy', color: 0x1a2a6c, label: 'Navy', imagePath: 'assets/skins/puck/puck.png' },
    { id: 'cyan', color: 0x00e5ff, label: 'Cyan', imagePath: 'assets/skins/puck/puck.png' },
    { id: 'magenta', color: 0xff2bd4, label: 'Magenta', imagePath: 'assets/skins/puck/puck.png' },
    { id: 'white', color: 0xf0f0f0, label: 'White', imagePath: 'assets/skins/puck/puck.png' }
];
