const puppeteer = require('puppeteer');
const fs = require('fs');
const {delay} = require('../server/helpers');

(async () => {
    const browser = await puppeteer.launch({headless: false}); // za vizualen pregled
    const page = await browser.newPage();
    await page.goto('https://www.apms.si');

    await page.click('#odhod');
    await page.keyboard.press(' ');
    await delay(1500);

    let postaje = new Set();

    for (let i = 0; i < 600; i++) {
        await page.keyboard.press('ArrowDown');
        await delay(100);

        const name = await page.$eval('#odhod', el => el.value.trim());
        if (!postaje.has(name)) postaje.add(name);

        if (name === "Žižki GD") break;
    }

    fs.writeFileSync('apms_destinations.json', JSON.stringify(Array.from(postaje), null, 2));
    console.log("Shranjeno:", postaje.size, "postaj");

    await browser.close();
})();
