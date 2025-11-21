// ========================================
// Wormhole Configuration
// ========================================

const WORMHOLE_CONFIG = [
    {
        id: 'personal',
        label: 'Personal',
        color: 0x00ff88,        // Green
        position: { x: -30, y: 0, z: -120 },
        destination: './personal/index.html'
    },
    {
        id: 'work',
        label: 'Work',
        color: 0x06ffa5,        // Cyan
        position: { x: 30, y: 0, z: -120 },
        destination: './work/index.html'
    },
    {
        id: 'blog',
        label: 'Blog',
        color: 0xff6b35,        // Orange (star-like)
        position: { x: 0, y: -40, z: -120 },
        destination: './blog/index.html'
    }
    // Add more wormholes here! Example:
    // {
    //     id: 'projects',
    //     label: 'Projects',
    //     color: 0xff6b35,     // Orange
    //     position: { x: 0, y: 30, z: -120 },
    //     destination: './projects/index.html'
    // }
];

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORMHOLE_CONFIG };
}
