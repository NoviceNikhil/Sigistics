const fs = require('fs');
const shipments = JSON.parse(fs.readFileSync('seed/shipments_seed.json'));
const histories = JSON.parse(fs.readFileSync('seed/shipment_histories_seed.json'));

let totalSimulations = 0;
let errors = 0;
let zeroHistoriesCount = 0;

const historyMap = {};
histories.forEach(h => {
  if (!historyMap[h.shipment_id]) historyMap[h.shipment_id] = [];
  historyMap[h.shipment_id].push(h);
});

shipments.forEach(s => {
  const sHistories = historyMap[s.id] || [];
  
  if (sHistories.length === 0) {
    if (s.status === 'created') {
        zeroHistoriesCount++;
    } else {
        console.log(`ERROR: Shipment ${s.id} is ${s.status} but has 0 histories.`);
        errors++;
    }
  } else {
    // Check flow
    const expectedFlows = {
      'assigned': ['created->assigned'],
      'picked': ['created->assigned', 'assigned->picked'],
      'in_transit': ['created->assigned', 'assigned->picked', 'picked->in_transit'],
      'delivered': ['created->assigned', 'assigned->picked', 'picked->in_transit', 'in_transit->delivered'],
      'cancelled': ['created->assigned', 'assigned->cancelled']
    };
    
    const formattedFlow = sHistories.map(h => `${h.previous_status}->${h.new_status}`);
    const expected = expectedFlows[s.status];
    
    if (expected && expected.join(',') !== formattedFlow.join(',')) {
        console.log(`ERROR: Shipment ${s.id} mismatch! \nExpected: ${expected}\nGot: ${formattedFlow}`);
        errors++;
    }
  }
});

console.log(`Analysis complete for ${shipments.length} shipments.`);
console.log(`Shipments with 0 histories (validly 'created'): ${zeroHistoriesCount}`);
console.log(`Errors found: ${errors}`);
