const { sequelize } = require("./config/sql");
const Shipment = require("./models/shipment.sql.js");
const { Op } = require("sequelize");

async function run() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    // Fetch some shipments that have tags
    const shipments = await Shipment.findAll({
      where: {
        tags: { [Op.ne]: null }
      },
      limit: 5
    });

    console.log(`Found ${shipments.length} shipments with tags`);
    shipments.forEach(s => {
      console.log(`Shipment ${s.shipment_code}:`, JSON.stringify(s.tags), "Type:", typeof s.tags);
    });

    if (shipments.length > 0) {
      const sampleTag = shipments[0].tags[0];
      console.log(`\nTesting search for tag: "${sampleTag}"`);
      
      // Test 1: LIKE with spaces (Original)
      const res1 = await Shipment.findAll({
        where: { tags: { [Op.like]: `%${sampleTag}%` } }
      });
      console.log(`LIKE test: Found ${res1.length} results`);

      // Test 2: JSON_CONTAINS
      const res2 = await Shipment.findAll({
        where: sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('tags'), JSON.stringify(sampleTag)),
          1
        )
      });
      console.log(`JSON_CONTAINS test: Found ${res2.length} results`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
