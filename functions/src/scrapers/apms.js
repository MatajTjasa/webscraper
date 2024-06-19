/* eslint-disable max-len */
const puppeteer = require("puppeteer");

/**
 * Scrapes the APMS website for bus schedules.
 * @param {string} departure - The departure location.
 * @param {string} destination - The destination location.
 * @param {string} date - The date of travel.
 // eslint-disable-next-line max-len
 * @return {Promise<Array>} - A promise that resolves to an array of bus schedules.
 */
async function scrapeAPMS(departure, destination, date) {
    const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await page.goto("https://apms.si/");
  await page.waitForSelector("#odhod");
  await page.waitForSelector("#prihod");
  await page.waitForSelector("#datum");
  await delay(1000);

  await page.focus("#odhod");
  await page.keyboard.type(departure);
  await delay(1000);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await page.focus("#prihod");
  await page.keyboard.type(destination);
  await delay(1000);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await page.click("#datum", {clickCount: 3});
  await page.keyboard.press("Backspace");
  await page.type("#datum", date);
  await delay(1000);

  await page.click("#iskanje", {clickCount: 3});
  await delay(2000);

    console.log("Searching...");

  try {
    await page.waitForSelector(
        ".latest-item.bts.grid-template-content",
        {timeout: 6000},
    );
    const scheduleData = await page.evaluate(() => {
      const rows = Array.from(
          // eslint-disable-next-line no-undef
          document.querySelectorAll(".latest-item.bts.grid-template-content"),
      );
      if (!rows.length) throw new Error("No schedule data elements found.");

      return rows.map((row, index) => {
        const details = Array.from(row.querySelectorAll(".single-latest-fl p"));
        return {
          id: index + 1,
          departureTime: details[0] ? details[0].textContent.trim() : "Unknown",
          arrivalTime: details[1] ? details[1].textContent.trim() : "Unknown",
          duration: details[2] ? details[2].textContent.trim() : "Unknown",
          kilometers: details[3] ? details[3].textContent.trim() : "Unknown",
          price: details[4] ? details[4].textContent.trim() : "Unknown",
        };
      });
    });

    if (scheduleData.length === 0) {
      console.log("No bus schedules found.");
      return [];
    } else {
      console.log(scheduleData);
      return scheduleData;
    }
  } catch (e) {
    console.error("Error during data extraction:", e);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Delays execution for a given number of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @return {Promise} - A promise that resolves after the given delay.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {scrapeAPMS};
