const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Listen to console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    page.on('error', err => console.log('CRASH ERROR:', err.toString()));
    
    console.log('Navigating to my_world_view/index.html...');
    await page.goto('file:///Users/uday/Documents/Personal_Sites/Personal_Web_3D/my_world_view/index.html', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Clicking the first planet...');
    await page.evaluate(() => {
        try {
            if (typeof initiateLanding === 'function' && typeof planets !== 'undefined' && planets.length > 0) {
                console.log('Initiating landing on', planets[0].userData.name);
                initiateLanding(planets[0]);
            } else {
                console.log('planets array or initiateLanding function not found globally');
            }
        } catch(e) {
            console.log('Error in evaluate:', e.toString());
        }
    });
    
    console.log('Waiting for landing animation to finish...');
    await new Promise(r => setTimeout(r, 6000));
    
    // Take a screenshot to see what it looks like
    await page.screenshot({ path: 'landing_screenshot.png' });
    console.log('Screenshot saved to landing_screenshot.png');
    
    const roverStatus = await page.evaluate(() => {
        try {
            if (typeof rover === 'undefined' || !rover) return 'rover is null or undefined';
            return {
                visible: rover.visible,
                position: rover.position,
                isLandingAnim: typeof isLandingAnim !== 'undefined' ? isLandingAnim : null,
                cameraPosition: typeof camera3D !== 'undefined' ? camera3D.position : null,
                hudDisplay: document.getElementById('rover-hud') ? document.getElementById('rover-hud').style.display : 'no-hud'
            };
        } catch(e) {
            return e.toString();
        }
    });
    console.log('Rover status:', JSON.stringify(roverStatus, null, 2));
    
    await browser.close();
})();
