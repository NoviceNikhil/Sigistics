const xlsx = require("xlsx");

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TEST DATA GENERATOR  v3
 *  Produces 3 Excel files:
 *    1. sample_agents.xlsx          — upload first
 *    2. sample_shipments.xlsx       — upload second (builds Priya's load to 6)
 *    3. sample_shipments_overload.xlsx — upload LAST (triggers AGENT_OVERLOAD_RISK)
 *
 *  VALID CITIES (from locations_seed.json — 47 locations across 9 cities):
 *    Bengaluru   → Indiranagar, Whitefield, Koramangala, HSR Layout,
 *                  Electronic City, Jayanagar
 *    Delhi       → Dwarka, Saket, Connaught Place, Hauz Khas, Rohini, Karol Bagh
 *    Mumbai      → Andheri, Bandra, Powai, Colaba, Borivali, Worli
 *    Chennai     → Adyar, T. Nagar, Velachery, Anna Nagar, Mylapore, Guindy
 *    Hyderabad   → Gachibowli, Jubilee Hills, Banjara Hills, Kukatpally, Madhapur
 *    Kolkata     → Salt Lake, New Town, Park Street, Ballygunge, Behala
 *    Lucknow     → Gomti Nagar, Alambagh, Hazratganj, Indira Nagar
 *    Ahmedabad   → Satellite, Navrangpura, Prahlad Nagar, Bodakdev
 *    Pune        → Kothrud, Hinjewadi, Viman Nagar, Baner, Kalyani Nagar
 *
 *  ROUTE GUIDE — distance / 40 km/h = eta_hours  (threshold: > 40h)
 *    Bengaluru → Delhi      ≈ 2100 km → 52.5h    LONG_HAUL
 *    Bengaluru → Kolkata    ≈ 1700 km → 42.5h    LONG_HAUL
 *    Bengaluru → Lucknow    ≈ 1746 km → 43.7h    LONG_HAUL
 *    Delhi     → Chennai    ≈ 2175 km → 54.4h    LONG_HAUL
 *    Mumbai    → Kolkata    ≈ 2000 km → 50.0h    LONG_HAUL
 *    Mumbai    → Delhi      ≈ 1400 km → 35h    ❌ (just under)
 *    Bengaluru → Mumbai     ≈  984 km → 24.6h  ❌ (under)
 *    Bengaluru → Chennai    ≈  295 km →  7.4h  ❌ (local)
 *
 *  RULES:
 *    OVERSIZED_CARGO      → weight_kg > 50
 *    LONG_HAUL_AUDIT      → eta_hours > 40  (use routes above)
 *    ACTIVE_TRACKING      → status = "in_transit"
 *    AGENT_OVERLOAD_RISK  → agent.active_shipments_count > 5
 *                           (Priya has 6 after batch-1 → batch-2 triggers this)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── AGENTS ──────────────────────────────────────────────────────────────────
// 9 agents spanning all 9 seeded cities for maximum route diversity
const agentsData = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@gmail.com",
    phone: 9876543210,
    city: "Bengaluru",
    subregion: "Indiranagar",
  },
  {
    name: "Anita Sharma",
    email: "anita@gmail.com",
    phone: 9876543211,
    city: "Bengaluru",
    subregion: "Koramangala",
  },
  {
    name: "Suresh Patil",
    email: "suresh@gmail.com",
    phone: 9876543212,
    city: "Bengaluru",
    subregion: "Whitefield",
  },
  {
    name: "Priya Singh",
    email: "priya@gmail.com",
    phone: 9876543213,
    city: "Bengaluru",
    subregion: "HSR Layout",
  },
  {
    name: "Amit Verma",
    email: "amit@gmail.com",
    phone: 9876543214,
    city: "Delhi",
    subregion: "Connaught Place",
  },
  {
    name: "Vikram Desai",
    email: "vikram@gmail.com",
    phone: 9876543215,
    city: "Mumbai",
    subregion: "Andheri",
  },
  {
    name: "Neha Iyer",
    email: "neha@gmail.com",
    phone: 9876543216,
    city: "Chennai",
    subregion: "Adyar",
  },
  {
    name: "Arjun Bose",
    email: "arjun@gmail.com",
    phone: 9876543217,
    city: "Kolkata",
    subregion: "Salt Lake",
  },
  {
    name: "Riya Patel",
    email: "riya@gmail.com",
    phone: 9876543218,
    city: "Ahmedabad",
    subregion: "Satellite",
  },
];

// ─── BATCH 1 SHIPMENTS ───────────────────────────────────────────────────────
// 30 shipments across all 6 statuses, all rule combinations, some unassigned.
// After this upload, Priya Singh will have active_shipments_count = 6.
const shipmentsData = [
  // ══════════════════════════════════════════════════════════════════════════
  // STATUS: created  (no agent assigned — feeds into "Assign All" queue)
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Clean unassigned — no rule triggers
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: "",
    pickup_city: "Mumbai",
    pickup_subregion: "Andheri",
    delivery_city: "Bengaluru",
    delivery_subregion: "Koramangala",
    package_type: "medium",
    weight_kg: 8,
    status: "created",
  },

  // 2. Unassigned + OVERSIZED (weight 72 kg — OVERSIZED_CARGO fires)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: "",
    pickup_city: "Bengaluru",
    pickup_subregion: "Indiranagar",
    delivery_city: "Mumbai",
    delivery_subregion: "Bandra",
    package_type: "large",
    weight_kg: 72,
    status: "created",
  },

  // 3. Unassigned + LONG_HAUL (Bengaluru→Delhi, ETA ~52h — LONG_HAUL_AUDIT fires)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: "",
    pickup_city: "Bengaluru",
    pickup_subregion: "Electronic City",
    delivery_city: "Delhi",
    delivery_subregion: "Hauz Khas",
    package_type: "small",
    weight_kg: 4,
    status: "created",
  },

  // 4. Unassigned + OVERSIZED + LONG_HAUL (both rules fire, still unassigned)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: "",
    pickup_city: "Bengaluru",
    pickup_subregion: "Jayanagar",
    delivery_city: "Delhi",
    delivery_subregion: "Rohini",
    package_type: "large",
    weight_kg: 88,
    status: "created",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS: assigned
  // ══════════════════════════════════════════════════════════════════════════

  // 5. Clean assignment — no rule triggers
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543214,
    pickup_city: "Delhi",
    pickup_subregion: "Connaught Place",
    delivery_city: "Delhi",
    delivery_subregion: "Dwarka",
    package_type: "small",
    weight_kg: 2,
    status: "assigned",
  },

  // 6. Assigned + LONG_HAUL (Bengaluru→Kolkata, ETA ~42.5h)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543210,
    pickup_city: "Bengaluru",
    pickup_subregion: "Whitefield",
    delivery_city: "Kolkata",
    delivery_subregion: "Salt Lake",
    package_type: "medium",
    weight_kg: 10,
    status: "assigned",
  },

  // 7. Assigned + OVERSIZED (weight 58 kg)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543215,
    pickup_city: "Mumbai",
    pickup_subregion: "Powai",
    delivery_city: "Mumbai",
    delivery_subregion: "Colaba",
    package_type: "large",
    weight_kg: 58,
    status: "assigned",
  },

  // 8. Assigned + OVERSIZED + LONG_HAUL (Bengaluru→Delhi, 65 kg — both rules)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543211,
    pickup_city: "Bengaluru",
    pickup_subregion: "Koramangala",
    delivery_city: "Delhi",
    delivery_subregion: "Saket",
    package_type: "large",
    weight_kg: 65,
    status: "assigned",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS: picked
  // ══════════════════════════════════════════════════════════════════════════

  // 9. Clean pickup — no rule triggers
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543218,
    pickup_city: "Ahmedabad",
    pickup_subregion: "Navrangpura",
    delivery_city: "Mumbai",
    delivery_subregion: "Borivali",
    package_type: "small",
    weight_kg: 3,
    status: "picked",
  },

  // 10. Picked + LONG_HAUL (Delhi→Chennai, ETA ~54.4h)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543216,
    pickup_city: "Delhi",
    pickup_subregion: "Karol Bagh",
    delivery_city: "Chennai",
    delivery_subregion: "Anna Nagar",
    package_type: "medium",
    weight_kg: 18,
    status: "picked",
  },

  // 11. Picked + OVERSIZED (weight 95 kg)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543217,
    pickup_city: "Kolkata",
    pickup_subregion: "New Town",
    delivery_city: "Kolkata",
    delivery_subregion: "Park Street",
    package_type: "large",
    weight_kg: 95,
    status: "picked",
  },

  // 12. Picked + OVERSIZED + LONG_HAUL (Mumbai→Kolkata, 80 kg — both rules)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543215,
    pickup_city: "Mumbai",
    pickup_subregion: "Worli",
    delivery_city: "Kolkata",
    delivery_subregion: "Ballygunge",
    package_type: "large",
    weight_kg: 80,
    status: "picked",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS: in_transit  (ALL trigger ACTIVE_TRACKING automatically)
  // ══════════════════════════════════════════════════════════════════════════

  // 13. In-transit + ACTIVE_TRACKING only (local Bengaluru route, clean weight)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543212,
    pickup_city: "Bengaluru",
    pickup_subregion: "Whitefield",
    delivery_city: "Bengaluru",
    delivery_subregion: "Electronic City",
    package_type: "small",
    weight_kg: 3,
    status: "in_transit",
  },

  // 14. In-transit + ACTIVE_TRACKING + LONG_HAUL (Bengaluru→Lucknow, ETA ~43.7h)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543210,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Lucknow",
    delivery_subregion: "Gomti Nagar",
    package_type: "medium",
    weight_kg: 12,
    status: "in_transit",
  },

  // 15. In-transit + ACTIVE_TRACKING + OVERSIZED (weight 70 kg, local route)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543214,
    pickup_city: "Delhi",
    pickup_subregion: "Rohini",
    delivery_city: "Delhi",
    delivery_subregion: "Connaught Place",
    package_type: "large",
    weight_kg: 70,
    status: "in_transit",
  },

  // 16. In-transit + ALL 3 rules (Bengaluru→Delhi, 90 kg — MAXIMUM RULE HIT)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543210,
    pickup_city: "Bengaluru",
    pickup_subregion: "Indiranagar",
    delivery_city: "Delhi",
    delivery_subregion: "Connaught Place",
    package_type: "large",
    weight_kg: 90,
    status: "in_transit",
  },

  // 17. In-transit + ACTIVE_TRACKING + LONG_HAUL (Mumbai→Kolkata, ETA ~50h, clean weight)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543215,
    pickup_city: "Mumbai",
    pickup_subregion: "Bandra",
    delivery_city: "Kolkata",
    delivery_subregion: "New Town",
    package_type: "medium",
    weight_kg: 14,
    status: "in_transit",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS: delivered  (historical records — rules captured at shipment time)
  // ══════════════════════════════════════════════════════════════════════════

  // 18. Clean delivery — no rule violations
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543216,
    pickup_city: "Chennai",
    pickup_subregion: "T. Nagar",
    delivery_city: "Chennai",
    delivery_subregion: "Velachery",
    package_type: "small",
    weight_kg: 2,
    status: "delivered",
  },

  // 19. Delivered — was oversized during transit
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543217,
    pickup_city: "Kolkata",
    pickup_subregion: "Behala",
    delivery_city: "Kolkata",
    delivery_subregion: "Ballygunge",
    package_type: "large",
    weight_kg: 62,
    status: "delivered",
  },

  // 20. Delivered — was long-haul delivery
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543211,
    pickup_city: "Bengaluru",
    pickup_subregion: "Jayanagar",
    delivery_city: "Delhi",
    delivery_subregion: "Dwarka",
    package_type: "medium",
    weight_kg: 9,
    status: "delivered",
  },

  // 21. Delivered — was both oversized + long-haul
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543218,
    pickup_city: "Ahmedabad",
    pickup_subregion: "Prahlad Nagar",
    delivery_city: "Kolkata",
    delivery_subregion: "Park Street",
    package_type: "large",
    weight_kg: 77,
    status: "delivered",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS: cancelled  (mix of unassigned and assigned cancellations)
  // ══════════════════════════════════════════════════════════════════════════

  // 22. Cancelled — no agent, no rules
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: "",
    pickup_city: "Pune",
    pickup_subregion: "Kothrud",
    delivery_city: "Pune",
    delivery_subregion: "Hinjewadi",
    package_type: "small",
    weight_kg: 1,
    status: "cancelled",
  },

  // 23. Cancelled — was oversized, no agent
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: "",
    pickup_city: "Mumbai",
    pickup_subregion: "Colaba",
    delivery_city: "Bengaluru",
    delivery_subregion: "Koramangala",
    package_type: "large",
    weight_kg: 71,
    status: "cancelled",
  },

  // 24. Cancelled — had an agent assigned
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543212,
    pickup_city: "Bengaluru",
    pickup_subregion: "Whitefield",
    delivery_city: "Hyderabad",
    delivery_subregion: "Gachibowli",
    package_type: "medium",
    weight_kg: 5,
    status: "cancelled",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PRIYA'S 6 ACTIVE SHIPMENTS — builds active_shipments_count to 6 in DB
  // Upload batch-2 AFTER this to trigger AGENT_OVERLOAD_RISK on her 7th.
  // ══════════════════════════════════════════════════════════════════════════

  // 25. Priya #1 — picked + OVERSIZED + LONG_HAUL (Bengaluru→Delhi, 80kg)
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Delhi",
    delivery_subregion: "Connaught Place",
    package_type: "large",
    weight_kg: 80,
    status: "picked",
  },

  // 26. Priya #2 — in_transit + LONG_HAUL + ACTIVE_TRACKING
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Kolkata",
    delivery_subregion: "New Town",
    package_type: "medium",
    weight_kg: 15,
    status: "in_transit",
  },

  // 27. Priya #3 — assigned, clean
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Mumbai",
    delivery_subregion: "Andheri",
    package_type: "small",
    weight_kg: 5,
    status: "assigned",
  },

  // 28. Priya #4 — assigned, clean
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Bengaluru",
    delivery_subregion: "Indiranagar",
    package_type: "small",
    weight_kg: 3,
    status: "assigned",
  },

  // 29. Priya #5 — assigned, clean
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Bengaluru",
    delivery_subregion: "Whitefield",
    package_type: "medium",
    weight_kg: 6,
    status: "assigned",
  },

  // 30. Priya #6 — picked + OVERSIZED (Bengaluru→Chennai, 55kg)
  {
    customer_email: "danielbanik7@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Chennai",
    delivery_subregion: "Guindy",
    package_type: "large",
    weight_kg: 55,
    status: "picked",
  },
];

// ─── BATCH 2: OVERLOAD TRIGGER ────────────────────────────────────────────────
// Upload THIS FILE SEPARATELY after batch-1.
// At that point Priya's DB count = 6 → the 7th assignment hits AGENT_OVERLOAD_RISK.
// Also hits OVERSIZED_CARGO + LONG_HAUL_AUDIT for maximum simultaneous rule coverage.
const shipmentsOverloadData = [
  {
    customer_email: "tanvimall12@icloud.com",
    agent_phone: 9876543213,
    pickup_city: "Bengaluru",
    pickup_subregion: "HSR Layout",
    delivery_city: "Delhi",
    delivery_subregion: "Hauz Khas",
    package_type: "large",
    weight_kg: 75,
    status: "assigned",
    // Triggers: AGENT_OVERLOAD_RISK + OVERSIZED_CARGO + LONG_HAUL_AUDIT (triple!)
  },
];

// ─── WRITER ──────────────────────────────────────────────────────────────────
const createExcel = (data, filename) => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  xlsx.writeFile(workbook, filename);
  console.log(`  Created: ${filename}  (${data.length} rows)`);
};

createExcel(agentsData, "sample_agents.xlsx");
createExcel(shipmentsData, "sample_shipments.xlsx");
createExcel(shipmentsOverloadData, "sample_shipments_overload.xlsx");

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UPLOAD ORDER (via Shipment / Agent Hub UI):
  1. sample_agents.xlsx             (Agent Hub → Bulk Import)
  2. sample_shipments.xlsx          (Shipment Hub → Batch Import)
     → After this, Priya's active count = 6
  3. sample_shipments_overload.xlsx (Shipment Hub → Batch Import)
     → Priya's 7th shipment triggers AGENT_OVERLOAD_RISK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RULES TRIGGERED IN BATCH 1:
  • OVERSIZED_CARGO      → shipments 2,4,7,8,11,12,15,16,19,21,25,30
  • LONG_HAUL_AUDIT      → shipments 3,4,6,8,10,12,14,16,17,20,21,26
  • ACTIVE_TRACKING      → shipments 13,14,15,16,17,26
  • Multi-rule hits      → shipments 4,8,12,16 (2+ rules each)
  • All 3 simultaneously → shipment 16 (Bengaluru→Delhi, 90kg, in_transit)
  • Unassigned           → shipments 1,2,3,4,22,23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
