const axios = require('axios');

const evaluateShipmentRules = async (shipmentData) => {
  try {
    const RULE_ENGINE_URL = process.env.RULE_ENGINE_URL || 'http://localhost:8000';
    const response = await axios.post(`${RULE_ENGINE_URL}/api/rules/evaluate`, shipmentData);
    if (response.data.status === "success") return response.data.data;
    return null;
  } catch (error) {
    console.error("Rule Engine Connection Failed:", error.message);
    return {
      tags: shipmentData.tags || [],
      delay_reason: shipmentData.delay_reason || null,
      is_delayed: shipmentData.is_delayed || false
    };
  }
};

const batchEvaluateRules = async (shipments) => {
  try {
    const RULE_ENGINE_URL = process.env.RULE_ENGINE_URL || 'http://localhost:8000';
    const response = await axios.post(`${RULE_ENGINE_URL}/api/rules/evaluate/batch`, { shipments });
    if (response.data.status === "success") return response.data.data;
    return [];
  } catch (error) {
    console.error("Rule Engine Batch Connection Failed:", error.message);
    return [];
  }
};

const getAllRules = async (activeOnly = false) => {
  try {
    const RULE_ENGINE_URL = process.env.RULE_ENGINE_URL || 'http://localhost:8000';
    const response = await axios.get(`${RULE_ENGINE_URL}/api/rules`, { params: { active_only: activeOnly } });
    if (response.data.status === "success") return response.data.data;
    return [];
  } catch (error) {
    console.error("Rule Engine Fetch Rules Failed:", error.message);
    return [];
  }
};

module.exports = { evaluateShipmentRules, batchEvaluateRules, getAllRules };