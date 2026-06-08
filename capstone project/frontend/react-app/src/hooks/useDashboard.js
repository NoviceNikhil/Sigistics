import { useState, useEffect } from "react";
import api from "../services/axios";

const buildQuery = (filters) => {
  const queryParams = new URLSearchParams(filters);
  const keysForDel = [];
  queryParams.forEach((value, key) => {
    if (value == null || value === "") keysForDel.push(key);
  });
  keysForDel.forEach((key) => queryParams.delete(key));
  return queryParams.toString() ? `?${queryParams.toString()}` : "";
};

export const useDashboard = (filters) => {
  const [data, setData] = useState({
    summary: null,
    statusData: [],
    timelineData: [],
    agentData: [],
    delayedData: [],
    // --- NEW ---
    cityAnalytics: null,
    agentLeaderboard: [],
    packageAnalytics: [],
    tagAnalytics: [],
    onTimeByCity: [],
  });
  const [meta, setMeta] = useState({ agents: [], regions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const q = buildQuery(filters);

        const [
          summaryRes,
          statusRes,
          timelineRes,
          agentRes,
          delayedRes,
          metaRes,
          cityRes,
          leaderboardRes,
          packageRes,
          tagRes,
          onTimeRes,
        ] = await Promise.all([
          api.get(`/api/dashboard/summary${q}`),
          api.get(`/api/dashboard/shipments-by-status${q}`),
          api.get(`/api/dashboard/timeline${q}`),
          api.get(`/api/dashboard/agent-performance${q}`),
          api.get(`/api/dashboard/delayed-shipments${q}`),
          api.get(`/api/dashboard/filters-meta`),
          api.get(`/api/dashboard/city-analytics${q}`),
          api.get(`/api/dashboard/agent-leaderboard${q}`),
          api.get(`/api/dashboard/package-analytics${q}`),
          api.get(`/api/dashboard/tag-analytics${q}`),
          api.get(`/api/dashboard/ontime-by-city${q}`),
        ]);

        setData({
          summary: summaryRes.data.data,
          statusData: statusRes.data.data,
          timelineData: timelineRes.data.data,
          agentData: agentRes.data.data,
          delayedData: delayedRes.data.data,
          cityAnalytics: cityRes.data.data,
          agentLeaderboard: leaderboardRes.data.data,
          packageAnalytics: packageRes.data.data,
          tagAnalytics: tagRes.data.data,
          onTimeByCity: onTimeRes.data.data,
        });
        setMeta(metaRes.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [filters]);

  return { data, meta, loading, error };
};