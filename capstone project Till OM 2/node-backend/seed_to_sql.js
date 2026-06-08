require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sequelize } = require("./config/sql");
const { User, Agent, Shipment, ShipmentHistory, Location } = require("./models/index.sql");
const { evaluateShipmentRules } = require("./utils/ruleEngine");

const loadJSON = (filename) => {
  // Change "backend" to "node-backend" or whatever your actual folder name is
  const filePath = path.join(__dirname, "../node-backend/seeded_data", filename);
  const rawData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(rawData);
};

const isValid = (val) => {
  return val !== null && val !== undefined && val !== "";
};

const hashCache = new Map();

const ensureBcryptHash = async (value) => {
  if (!isValid(value)) return value;
  if (/^\$2[aby]\$\d{2}\$/.test(value)) return value;
  if (hashCache.has(value)) return hashCache.get(value);
  const hashed = await bcrypt.hash(value, 10);
  hashCache.set(value, hashed);
  return hashed;
};

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    console.log("Dropping and recreating tables...");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Database synced and tables recreated.");

    // --- NEW: 1. Seed Locations ---
    // We seed this first so we can map IDs to Shipments later
    console.log("Validating and Seeding Locations...");
    const rawLocations = loadJSON("locations_seed.json");
    const validLocations = rawLocations.filter((loc) => {
      return (
        isValid(loc.city) &&
        isValid(loc.subregion) &&
        isValid(loc.latitude) &&
        isValid(loc.longitude)
      );
    });
    const seededLocations = await Location.bulkCreate(validLocations);
    console.log(`Successfully seeded ${seededLocations.length} valid Locations.`);

    // Create a lookup map for O(1) complexity when linking shipments
    const locMap = new Map();
    seededLocations.forEach(loc => {
      // Normalize keys to lowercase to match the set() methods in your model
      const key = `${loc.city.toLowerCase()}-${loc.subregion.toLowerCase()}`;
      locMap.set(key, loc.id);
    });

    // 1. Seed Users (Existing logic)
    console.log("Validating and Seeding Users...");
    const rawUsers = loadJSON("users_seed.json");
    const validUsers = rawUsers.filter((user) => {
      return (
        isValid(user.id) &&
        isValid(user.full_name) &&
        isValid(user.email) &&
        isValid(user.password_hash) &&
        isValid(user.phone) &&
        isValid(user.role)
      );
    });
    const preparedUsers = await Promise.all(
      validUsers.map(async (user) => ({
        ...user,
        password_hash: await ensureBcryptHash(user.password_hash),
      })),
    );
    await User.bulkCreate(preparedUsers);
    console.log(`Successfully seeded ${preparedUsers.length} valid Users.`);

    // 2. Seed Agents (Existing logic)
    console.log("Validating and Seeding Agents...");
    const rawAgents = loadJSON("delivery_agents_seed.json");
    const validAgents = rawAgents.filter((agent) => {
      return (
        isValid(agent.name) &&
        isValid(agent.email) &&
        isValid(agent.phone) &&
        isValid(agent.city) &&
        isValid(agent.subregion)
      );
    });
    console.log(`Preparing ${validAgents.length} agents for insert...`);
    const preparedAgents = await Promise.all(
      validAgents.map(async (agent) => ({
        ...agent,
        password_hash: await ensureBcryptHash(agent.password_hash),
      })),
    );
    console.log(`Prepared ${preparedAgents.length} agents. Inserting into database...`);
    await Agent.bulkCreate(preparedAgents);
    console.log(`Successfully seeded ${preparedAgents.length} valid Agents.`);

    // 3. Seed Shipments with validation and LOCATION LINKING
    console.log("Validating and Seeding Shipments...");
    const rawShipments = loadJSON("shipments_seed.json");

    const validShipments = rawShipments.filter((shipment) => {
      // Perform original validation
      const basicValid = (
        isValid(shipment.id) &&
        isValid(shipment.shipment_code) &&
        isValid(shipment.user_id) &&
        isValid(shipment.pickup_city) &&
        isValid(shipment.delivery_city) &&
        isValid(shipment.package_type) &&
        isValid(shipment.status)
      );

      if (!basicValid) return false;

      // Created shipments are intentionally unassigned at seed time.
      // Normalize missing/empty agent IDs to null so Sequelize persists them cleanly.
      shipment.agent_id = isValid(shipment.agent_id) ? shipment.agent_id : null;

      // 1. Map Pickup Location ID
      const pKey = `${shipment.pickup_city.toLowerCase()}-${shipment.pickup_subregion.toLowerCase()}`;
      shipment.pickup_location_id = locMap.get(pKey);

      // 2. Map Delivery Location ID
      const dKey = `${shipment.delivery_city.toLowerCase()}-${shipment.delivery_subregion.toLowerCase()}`;
      shipment.delivery_location_id = locMap.get(dKey);

      // --- THE FIX: Map Current Location ID ---
      // If the Python script gave us a current city/subregion, find its ID in our locMap
      if (isValid(shipment.current_city) && isValid(shipment.current_subregion)) {
        const cKey = `${shipment.current_city.toLowerCase()}-${shipment.current_subregion.toLowerCase()}`;
        const foundId = locMap.get(cKey);

        // If the location exists in our master table, assign the ID
        shipment.current_location_id = foundId || null;
      } else {
        // If no current city (status is 'created'), ensure it is null
        shipment.current_location_id = null;
      }

      // Final check: Pickup and Delivery IDs are mandatory for a valid shipment
      return isValid(shipment.pickup_location_id) && isValid(shipment.delivery_location_id);
    });

    // --- RULE ENGINE EVALUATION ---
    // Call the Python rule engine (Port 8000) for every shipment so that
    // tags, is_delayed, and delay_reason are correctly populated at seed-time,
    // matching the exact behaviour of the live bulk-upload flow.
    console.log(`Evaluating ${validShipments.length} shipments against Rule Engine (Port 8000)...`);
    let ruleHits = 0;
    for (const shipment of validShipments) {
      try {
        // Build the same snapshot shape the live upload path sends to Python
        const snapshot = {
          ...shipment,
          // Resolve the agent record so the engine can access active_shipments_count etc.
          agent: shipment.agent_id
            ? (await Agent.findByPk(shipment.agent_id, { attributes: ["id", "name", "city", "subregion", "active_shipments_count"] }))?.toJSON() ?? null
            : null,
        };

        const verdict = await evaluateShipmentRules(snapshot);

        if (verdict) {
          shipment.tags = verdict.tags ?? [];
          shipment.is_delayed = verdict.is_delayed ?? false;
          shipment.delay_reason = verdict.delay_reason ?? null;
          if ((shipment.tags && shipment.tags.length > 0) || shipment.is_delayed) ruleHits++;
        }
      } catch (ruleErr) {
        // Non-fatal: if the engine is unavailable for a single row, skip silently
        console.warn(`  ⚠ Rule engine skipped for ${shipment.shipment_code}: ${ruleErr.message}`);
      }
    }
    console.log(`  → Rule engine tagged ${ruleHits} / ${validShipments.length} shipments.`);
    // ---------------------------------

    await Shipment.bulkCreate(validShipments, { silent: true });
    console.log(`Successfully seeded ${validShipments.length} valid Shipments with ALL Location IDs linked.`);

    // 4. Seed Shipment Histories (Existing logic)
    console.log("Validating and Seeding Shipment Histories...");
    const rawHistory = loadJSON("shipment_histories_seed.json");
    const validHistory = rawHistory.filter((history) => {
      return (
        isValid(history.shipment_id) &&
        isValid(history.previous_status) &&
        isValid(history.new_status)
      );
    });
    await ShipmentHistory.bulkCreate(validHistory, { silent: true });
    console.log(`Successfully seeded ${validHistory.length} valid History records.`);

    console.log("Database Seeding Completed Successfully.");
    process.exit(0);

  } catch (error) {
    console.error("Critical Error Seeding Database:", error);
    process.exit(1);
  }
};

seedDatabase();
