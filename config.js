// ========================================
// Wormhole Configuration
// ========================================

const WORMHOLE_CONFIG = [
    {
        id: 'personal',
        label: 'Personal',
        color: 0x00ff88,        // Green
        position: { x: -60, y: 20, z: -180 },
        destination: './personal/index.html'
    },
    {
        id: 'work',
        label: 'Work',
        color: 0x06ffa5,        // Cyan
        position: { x: 60, y: -20, z: -180 },
        destination: './work/index.html'
    },
    {
        id: 'blog',
        label: 'Blog',
        color: 0xff6b35,        // Orange (star-like)
        position: { x: 0, y: -60, z: -200 },
        destination: './blog/index.html'
    },
    {
        id: 'my_world_view',
        label: 'My World View',
        color: 0x4cc9f0,        // Cyan/Blue
        position: { x: 0, y: 60, z: -220 },
        destination: './my_world_view/index.html'
    },
    {
        id: 'my_web',
        label: 'Research',
        color: 0x9d4edd,        // Purple
        position: { x: 90, y: 30, z: -200 },
        destination: './my_web/index.html'
    }
];

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORMHOLE_CONFIG };
}
