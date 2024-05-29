const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {scrapeAPMS} = require("./scrapers/apms");

admin.initializeApp();
const db = admin.firestore();

exports.scrapeData = functions.https.onRequest(async (req, res) => {
  const {date, departure, destination} = req.body;

  const data = await scrapeAPMS(departure, destination, date);
  if (data.length) {
    await db.collection("scrapedData").add({
      date,
      departure,
      destination,
      data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  res.send(data);
});
