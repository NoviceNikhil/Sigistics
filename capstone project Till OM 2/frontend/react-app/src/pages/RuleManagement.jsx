import React, { useState, useEffect, useCallback, useRef } from "react";
import * as ruleService from "../services/ruleService";
import * as shipmentService from "../services/shipmentService";
import { ShieldAlert, Search, Plus, Trash2, Power, Code, Info, X, Loader2, Activity, Box, Filter, Terminal, Database, Edit2 } from "lucide-react";
import CustomSelect from "../components/ui/CustomSelect";

// --- Frontend Logic Schema Definition ---
const DB_SCHEMA = [
  { table: "Shipment Logistics", icon: "📦", fields: [
    { field: "weight_kg", label: "Package Mass (kg)", type: "number" },
    { field: "eta_hours", label: "Transit ETA (hrs)", type: "number" },
    { field: "estimated_distance_km", label: "Total Distance (km)", type: "number" },
    { field: "status", label: "Shipment State", type: "enum", options: ["created", "assigned", "picked", "in_transit", "delivered", "cancelled"] },
    { field: "package_type", label: "Package Type", type: "enum", options: ["small", "medium", "large"] },
    { field: "pickup_city", label: "Origin City", type: "string" },
    { field: "delivery_city", label: "Destination City", type: "string" }
  ]},
  { table: "Agent Telemetry", icon: "🧑‍💻", fields: [
    { field: "agent.active_shipments_count", label: "Active Workload", type: "number" },
    { field: "agent.status", label: "Agent Status", type: "enum", options: ["active", "inactive", "overloaded"] },
    { field: "agent.city", label: "Agent Hub City", type: "string" }
  ]}
];

const getFieldConfig = (fieldPath) => {
  for (let t of DB_SCHEMA) {
    for (let f of t.fields) {
      if (f.field === fieldPath) return f;
    }
  }
  return null;
};

const OPERATOR_MAP = {
  number: [
    { val: "gt", label: "> Greater Than" },
    { val: "lt", label: "< Lesser Than" },
    { val: "eq", label: "== Exactly" },
    { val: "not_eq", label: "!= Not Equal" }
  ],
  string: [
    { val: "eq", label: "== Matches" },
    { val: "not_eq", label: "!= Does Not Match" }
  ],
  enum: [
    { val: "eq", label: "== State Is" },
    { val: "not_eq", label: "!= State Is Not" }
  ],
  boolean: [
    { val: "eq", label: "== State Is" }
  ]
};

// --- Custom Interactive Field Picker ---
const FieldPicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = getFieldConfig(value);
  const currentTable = currentConfig ? DB_SCHEMA.find(t => t.fields.includes(currentConfig)) : null;

  return (
    <div className="relative min-w-[240px]">
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-gray-200 bg-white rounded-lg p-2.5 text-xs font-black text-gray-700 shadow-sm hover:border-indigo-400 focus:outline-none transition-all"
      >
        <div className="flex items-center gap-2">
           {currentConfig ? (
             <>
               <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                  <Database size={10}/> {currentTable?.table.split(" ")[0]}
               </span>
               <span className="truncate">{currentConfig.label}</span>
             </>
           ) : (
             <span className="text-gray-400 flex items-center gap-2"><Database size={12}/> Choose Data Column...</span>
           )}
        </div>
        <span className="text-gray-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 top-full mt-2 left-0 w-[320px] bg-white border border-gray-100 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in divide-y divide-gray-50 flex flex-col max-h-[300px]">
            <div className="p-3 bg-gray-50/80 border-b border-gray-100 backdrop-blur-md sticky top-0">
               <h4 className="text-[10px] font-black tracking-widest uppercase text-gray-500">Available Schemas</h4>
            </div>
            <div className="overflow-y-auto">
              {DB_SCHEMA.map((table, tIdx) => (
                <div key={tIdx} className="p-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-sm">{table.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{table.table} Table</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {table.fields.map(f => (
                      <button
                        key={f.field}
                        type="button"
                        onClick={() => {
                           onChange(f.field);
                           setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all border ${value === f.field ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-inner' : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50 text-gray-600 shadow-sm'}`}
                      >
                        <span className="truncate">{f.label}</span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${f.type === 'number' ? 'bg-blue-100 text-blue-600' : f.type === 'enum' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {f.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Recursive Component to properly display deeply nested rules on the dashboard summary cards
const ConditionNodeRenderer = ({ node }) => {
  if (node.type === "condition") {
    const config = getFieldConfig(node.target_field);
    const label = config ? config.label : node.target_field;
    return (
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs my-1">
        <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded font-bold border border-purple-200">IF</span>
        <span className="text-gray-800 font-bold px-1">{label}</span>
        <span className="text-indigo-400 font-black">{node.operator}</span>
        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-black uppercase tracking-wider">{String(node.threshold)}</span>
      </div>
    );
  }
  return (
    <div className="w-full mt-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md shadow-sm">{node.logical_operator}</span>
      <div className="pl-4 mt-2 border-l-2 border-indigo-100 space-y-1.5">
        {node.conditions?.map((child, i) => (
          <ConditionNodeRenderer key={i} node={child} />
        ))}
      </div>
    </div>
  );
};

// Interactive builder component for modals
const ConditionBuilder = ({ node, onChange, level = 0 }) => {
  const updateNode = (updates) => onChange({ ...node, ...updates });

  if (node.type === "condition") {
    const config = getFieldConfig(node.target_field);
    const opList = OPERATOR_MAP[config?.type || "string"];

    const handleFieldChange = (newField) => {
       const newConfig = getFieldConfig(newField);
       const ops = OPERATOR_MAP[newConfig?.type || "string"];
       updateNode({ 
           target_field: newField, 
           operator: ops[0].val, // reset to first valid operator safely
           threshold: "" // clear invalid thresholds
       });
    };

    return (
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-full transition-all hover:border-indigo-100">
        
        {/* Visual Column Picker */}
        <FieldPicker value={node.target_field} onChange={handleFieldChange} />

        {/* Dynamic Operator Picker */}
        <CustomSelect
          className="!w-[140px]"
          value={node.operator || "eq"}
          onChange={e => updateNode({ operator: e.target.value })}
          options={opList.map(op => ({ value: op.val, label: op.label }))}
        />

        {/* Dynamic Threshold Input */}
        {config?.type === "enum" ? (
           <CustomSelect
              className="flex-1 !min-w-[150px]"
              value={node.threshold}
              onChange={e => updateNode({ threshold: e.target.value })}
              placeholder="Select State"
              options={config.options.map(opt => ({
                value: opt,
                label: opt.replace(/_/g, " ").toUpperCase()
              }))}
           />
        ) : config?.type === "boolean" ? (
           <CustomSelect
              className="flex-1 !min-w-[120px]"
              value={String(node.threshold)}
              onChange={e => updateNode({ threshold: e.target.value === "true" })}
              placeholder="Toggle"
              options={[
                { value: "true", label: "TRUE" },
                { value: "false", label: "FALSE" }
              ]}
           />
        ) : (
           <input 
             type={config?.type === "number" ? "number" : "text"} 
             placeholder={config?.type === "number" ? "Enter numeric threshold..." : "Enter exact match value..."}
             className="flex-1 min-w-[120px] border-2 border-indigo-100 bg-indigo-50/30 text-indigo-900 rounded-lg p-2.5 text-xs font-black placeholder-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors" 
             value={node.threshold || ""} 
             onChange={e => updateNode({ threshold: e.target.value })}
           />
        )}
      </div>
    );
  }

  // Type == group
  const addChild = (type) => {
    if (level >= 4) { // Limits to 5 levels (0,1,2,3,4)
       alert("Maximum nesting depth (5 levels) reached.");
       return;
    }
    const child = type === "group" 
      ? { type: "group", logical_operator: "AND", conditions: [] }
      : { type: "condition", target_field: "weight_kg", operator: "gt", threshold: "" };
    updateNode({ conditions: [...(node.conditions || []), child] });
  };

  const updateChild = (index, childNode) => {
    const newConditions = [...(node.conditions || [])];
    newConditions[index] = childNode;
    updateNode({ conditions: newConditions });
  };

  const removeChild = (index) => {
    const newConditions = [...(node.conditions || [])];
    newConditions.splice(index, 1);
    updateNode({ conditions: newConditions });
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm w-full ${level % 2 === 0 ? 'bg-gray-50/70 border-gray-200' : 'bg-white border-gray-100'}`}>
      <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
        <div className="flex items-center gap-3">
          <CustomSelect
            className="!w-[180px]"
            value={node.logical_operator || "AND"}
            onChange={e => updateNode({ logical_operator: e.target.value })}
            options={[
              { value: "AND", label: "ALL Conditions (AND)" },
              { value: "OR", label: "ANY Condition (OR)" }
            ]}
          />
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Logic Envelope</span>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button type="button" onClick={() => addChild("condition")} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all">
            <Plus size={12}/> Condition
          </button>
          <div className="w-px bg-gray-200 my-1"></div>
          <button type="button" onClick={() => addChild("group")} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg transition-all">
            <Box size={12}/> Group
          </button>
        </div>
      </div>
      
      <div className="pl-3 border-l-4 border-indigo-200/50 space-y-4 relative">
        {(!node.conditions || node.conditions.length === 0) && (
           <div className="text-xs text-gray-400 italic py-3 pl-3 font-medium bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              Rule logic block is fundamentally empty. Defaults to resolving True.
           </div>
        )}
        {node.conditions?.map((child, i) => (
          <div key={i} className="relative group w-full lg:pr-10">
            <ConditionBuilder node={child} level={level + 1} onChange={(c) => updateChild(i, c)} />
            <button 
              type="button" 
              onClick={() => removeChild(i)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-red-50 text-red-500 rounded-xl p-3 shadow-md border border-red-100 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 hidden lg:block"
              title="Remove block"
            >
              <Trash2 size={16} />
            </button>
            {/* Mobile friendly delete button visible statically */}
            <button 
              type="button" 
              onClick={() => removeChild(i)}
              className="mt-2 w-full lg:hidden bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-red-100 hover:bg-red-100 flex justify-center items-center gap-2"
            >
              <Trash2 size={14} /> Remove Above Logic Block
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


export default function RuleManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals & Logs State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [ruleLogs, setRuleLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState("");

  const defaultRootCondition = {
      type: "group",
      logical_operator: "AND",
      conditions: [
          { type: "condition", target_field: "weight_kg", operator: "gt", threshold: "" }
      ]
  };

  const [formData, setFormData] = useState({
    name: "", description: "", 
    condition_tree: defaultRootCondition,
    tag_to_add: "", delay_reason_to_set: "", set_is_delayed: false
  });

  const [editingId, setEditingId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- NATIVE DEBOUNCED API: RULE QUERY ---
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ruleService.getRules(false, searchTerm);
      setRules(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(loadRules, 400); 
    return () => clearTimeout(timer);
  }, [loadRules]);

  // --- NATIVE DEBOUNCED API: LOGS QUERY ---
  const loadLogs = useCallback(async () => {
    if (!isLogsModalOpen) return;
    try {
      setLogsLoading(true);
      // Fetch only "flagged" logs from the server-side to stay efficient
      const logs = await ruleService.getRuleLogs(1000, logFilter, true); 
      setRuleLogs(logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  }, [logFilter, isLogsModalOpen]);

  useEffect(() => {
    const timer = setTimeout(loadLogs, 400); 
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const openLogs = () => {
    setIsLogsModalOpen(true);
  };

  const handleEditRule = (rule) => {
    setFormData({
      name: rule.name,
      description: rule.description || "",
      condition_tree: rule.condition_tree,
      tag_to_add: rule.tag_to_add || "",
      delay_reason_to_set: rule.delay_reason_to_set || "",
      set_is_delayed: rule.set_is_delayed || false
    });
    setEditingId(rule._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.condition_tree || formData.condition_tree.conditions?.length === 0) {
          alert("A rule must contain at least one condition.");
          return;
      }

      if (!formData.tag_to_add && !formData.delay_reason_to_set && !formData.set_is_delayed) {
          alert("A rule must have at least one outcome (Tag, Delay Reason, or Delay Override).");
          return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        condition_tree: formData.condition_tree,
        is_active: true
      };
      
      payload.tag_to_add = formData.tag_to_add ? formData.tag_to_add.trim() : null;
      payload.delay_reason_to_set = formData.delay_reason_to_set ? formData.delay_reason_to_set.trim() : null;
      payload.set_is_delayed = !!formData.set_is_delayed;

      setIsSyncing(true);
      if (editingId) {
        await ruleService.updateRule(editingId, payload);
      } else {
        await ruleService.createRule(payload);
      }
      
      // Trigger retroactive sync for existing shipments (This will handle tag cleanup)
      await shipmentService.syncRules();
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "", condition_tree: defaultRootCondition, tag_to_add: "", delay_reason_to_set: "", set_is_delayed: false });
      loadRules();
    } catch (err) {
      alert("Failed to save rule. " + (err.response?.data?.message || err.message));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleHardDelete = async (id) => {
    if (window.confirm("Are you sure you want to disable this rule? This will trigger a retroactive cleanup of its tags from all shipments.")) {
       try {
          setIsSyncing(true);
          await ruleService.deleteRule(id);
          await shipmentService.syncRules();
          loadRules();
       } catch (err) { alert("Deletion failure"); }
       finally { setIsSyncing(false); }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      setIsSyncing(true);
      if(currentStatus) {
         await ruleService.deleteRule(id);
      } else {
         await ruleService.updateRule(id, { is_active: true });
      }
      
      // Trigger retroactive sync for existing shipments
      await shipmentService.syncRules();
      
      loadRules();
    } catch (err) { alert("Status execution failure"); }
    finally { setIsSyncing(false); }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50/50 min-h-screen font-sans relative overflow-hidden">
      
      {/* Background Orbs for Glassmorphism */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-[50px] right-[10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-[200px] right-[-50px] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-[40%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">

        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 md:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 sm:gap-3">
              <Code size={24} className="text-indigo-600"/> Python Logic Engine
            </h1>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Dynamic Logistics Computation Matrix</p>
          </div>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
             <button onClick={openLogs} className="admin-secondary-btn py-3 px-6 shadow-sm flex-1 sm:flex-initial justify-center flex items-center gap-2">
                <Terminal size={14} /> View Logs
             </button>
             <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-sm hover:bg-indigo-700 transition-all font-black uppercase text-xs tracking-widest flex-1 sm:flex-initial justify-center">
               <Plus size={16} /> New Rule
             </button>
          </div>
        </div>

        {/* Dynamic Glass Filter Block */}
        <div className="admin-minimal-card p-4 mb-10 flex gap-4 items-center">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by rule name or applied tag (e.g. 'priority')..." 
              className="w-full border-none bg-transparent text-slate-700 font-bold px-2 py-1 focus:outline-none text-base transition-all placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && <Loader2 className="animate-spin text-indigo-500" size={18} />}
        </div>

        {/* Engine Rules Render Core */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 pb-12">
           {rules.map((rule) => (
              <div key={rule._id} className="admin-minimal-card flex flex-col group h-full">
                 <div className="p-7 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Execution Node</div>
                         <h3 className="text-lg font-black text-slate-900 tracking-tight">{rule.name}</h3>
                       </div>
                       <div className="flex gap-1.5">
                          <button 
                             onClick={() => handleEditRule(rule)}
                             className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                             title="Edit Rule"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                             onClick={() => toggleStatus(rule._id, rule.is_active)}
                             className={`p-2 rounded-xl transition-all shadow-sm ${rule.is_active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                           >
                             <Power size={16} />
                          </button>
                          <button 
                             onClick={() => handleHardDelete(rule._id)}
                             className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                             title="Permanent Disable & Cleanup"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 leading-relaxed mb-6">{rule.description || 'No computation description provided for this node.'}</p>
                 
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6 flex-1 overflow-x-auto min-h-[140px]">
                        <ConditionNodeRenderer node={rule.condition_tree} />
                    </div>

                    <div className="space-y-3 mt-auto">
                       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yield Executions</div>
                       <div className="flex flex-wrap gap-2">
                          {rule.tag_to_add && <span className="bg-slate-100 text-slate-700 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border border-slate-200">+{rule.tag_to_add}</span>}
                          {rule.set_is_delayed && <span className="bg-rose-50 text-rose-700 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border border-rose-100">Delay</span>}
                          {rule.delay_reason_to_set && <span className="bg-amber-50 text-amber-700 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border border-amber-100 truncate max-w-full" title={rule.delay_reason_to_set}>{rule.delay_reason_to_set}</span>}
                       </div>
                    </div>
                 </div>

              </div>
           ))}
        </div>

        {rules.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-white shadow-xl">
            <Code size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-black text-gray-500 uppercase tracking-widest mb-2">Matrix Empty</h3>
            <p className="text-gray-400 text-sm font-bold">No python evaluation sequences found.</p>
          </div>
        )}
      </div>

      {/* ----------- RULE EVALUATION LOGS MODAL ----------- */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xl animate-fade-in">
           <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="p-7 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                      <Activity className="text-indigo-600" size={22}/> Rule Evaluation Logs
                    </h2>
                    <p className="text-sm text-gray-400 font-medium mt-1">
                      Live trace matrices reflecting all trigger outputs assigned.
                    </p>
                 </div>
                 <button onClick={() => setIsLogsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                    <X size={22} className="text-gray-500" />
                 </button>
              </div>

              <div className="px-7 py-4 border-b border-gray-100 bg-white">
                 <div className="relative flex items-center">
                    <Search className="absolute left-4 text-gray-400" size={18} />
                    <input 
                       type="text" 
                       placeholder="Search by shipment ID, rule name, or tag..."
                       className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition-all shadow-inner"
                       value={logFilter}
                       onChange={(e) => setLogFilter(e.target.value)}
                    />
                    {logsLoading && <Loader2 className="absolute right-4 animate-spin text-indigo-500" size={18} />}
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-7 space-y-4">
                 {(() => {
                   if (ruleLogs.length === 0 && !logsLoading) {
                     return (
                       <div className="py-24 text-center">
                         <Terminal size={40} className="mx-auto text-gray-200 mb-4" />
                         <p className="text-gray-400 font-bold">No flagged shipments found.</p>
                         <p className="text-gray-300 text-sm mt-1">All evaluated shipments passed cleanly, or try a different search term.</p>
                       </div>
                     );
                   }

                   return ruleLogs.map((log) => {
                     const hasDelay = log.is_delayed_applied || log.delay_reason_applied;
                     const hasTag   = log.tags_applied && log.tags_applied.length > 0;
                     return (
                       <div
                         key={log._id}
                         className={`rounded-2xl border p-6 transition-all hover:shadow-md ${hasDelay ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50/60" : "border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/40"}`}
                       >
                         <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
                           <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${hasDelay ? "bg-rose-100" : "bg-indigo-100"}`}>
                               {hasDelay ? "⚠️" : "🏷️"}
                             </div>
                             <div>
                               <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shipment ID</div>
                               <div className="text-sm font-black text-gray-900 font-mono">{log.shipment_id || "Unknown"}</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${hasDelay ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"}`}>
                               {hasDelay ? "Action Required" : "Tagged"}
                             </span>
                           </div>
                         </div>

                         <div className="mb-4">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Rule That Fired</div>
                           <div className="text-sm font-bold text-gray-800 mb-3">{log.rule_name}</div>
                         </div>

                         {hasTag && (
                           <div className="mb-3">
                             <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Labels Applied</div>
                             <div className="flex flex-wrap gap-2">
                               {log.tags_applied.map((tag, i) => (
                                 <span key={i} className="text-xs font-bold bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-lg shadow-sm">
                                   {tag.replace(/_/g, " ")}
                                 </span>
                               ))}
                             </div>
                           </div>
                         )}

                         {log.is_delayed_applied && (
                           <div className="flex items-center gap-2 mb-3 mt-4">
                             <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg shadow-sm">
                               ⚠ Marked as Delayed
                             </span>
                           </div>
                         )}

                         {log.delay_reason_applied && (
                           <div className="bg-white border border-rose-100 shadow-sm rounded-xl px-4 py-3 mt-3">
                             <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Official Delay Reason</div>
                             <p className="text-sm font-medium text-gray-700 leading-relaxed">{log.delay_reason_applied}</p>
                           </div>
                         )}
                       </div>
                     );
                   });
                 })()}
              </div>

           </div>
        </div>
      )}


      {/* ----------- INJECT RULE MODAL ----------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto animate-slide-up border border-gray-100">
            <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-20 backdrop-blur-md">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                 <ShieldAlert className="text-indigo-600" /> {editingId ? "Modify Logic Node" : "Advanced UI Logic Pipeline"}
              </h2>
              <button 
                onClick={() => {
                   setIsModalOpen(false);
                   setEditingId(null);
                   setFormData({ name: "", description: "", condition_tree: defaultRootCondition, tag_to_add: "", delay_reason_to_set: "", set_is_delayed: false });
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                
                {/* Left side Metadata & Outcomes */}
                <div className="lg:col-span-1 space-y-8 border-r border-gray-100 pr-10">
                   <div>
                     <label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">Node Name</label>
                     <input type="text" required className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-sm font-bold focus:border-indigo-500 focus:outline-none transition-colors placeholder-gray-300" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Heavy Dispatch" />
                   </div>
                   
                   <div>
                      <label className="block text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2">Operational Context</label>
                      <textarea className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm font-medium focus:border-indigo-500 focus:outline-none transition-colors" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Why is this node built?"/>
                   </div>

                   <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-200 to-purple-200 opacity-20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125"></div>
                        <h4 className="text-[12px] font-black tracking-widest uppercase text-indigo-900 mb-6 border-b border-indigo-200/50 pb-2 relative z-10">Consequent Outcome (Mandatory)</h4>
                        <div className="space-y-6 relative z-10">
                           <div>
                              <label className="block text-[10px] font-black tracking-widest uppercase text-indigo-600 mb-1.5 ml-1">Tag to Apply</label>
                              <input type="text" className="w-full border border-white bg-white/70 shadow-sm rounded-xl p-3 text-xs font-bold focus:border-indigo-400 focus:outline-none transition-all placeholder-gray-300" value={formData.tag_to_add} onChange={e => setFormData({...formData, tag_to_add: e.target.value})} placeholder="e.g. priority_shipment"/>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black tracking-widest uppercase text-indigo-600 mb-1.5 ml-1">Official Delay Reason</label>
                              <input type="text" className="w-full border border-white bg-white/70 shadow-sm rounded-xl p-3 text-xs font-bold focus:border-indigo-400 focus:outline-none transition-all placeholder-gray-300" value={formData.delay_reason_to_set} onChange={e => setFormData({...formData, delay_reason_to_set: e.target.value})} placeholder="e.g. Natural calamity at origin"/>
                           </div>
                           <label className="flex flex-col gap-2 cursor-pointer group mt-6 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:border-indigo-300 transition-colors">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 transition-colors">Trigger Delay State</span>
                              <div className="relative flex items-center">
                                 <input type="checkbox" className="sr-only" checked={formData.set_is_delayed} onChange={e => setFormData({...formData, set_is_delayed: e.target.checked})} />
                                 <div className={`w-12 h-6 rounded-full transition-colors ${formData.set_is_delayed ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                                 <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${formData.set_is_delayed ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </div>
                           </label>
                        </div>
                   </div>
                </div>

                {/* Right side Visual Canvas */}
                <div className="lg:col-span-3 bg-gray-50/50 rounded-3xl border border-gray-100 p-8 shadow-inner overflow-x-auto">
                    <h4 className="text-sm font-black tracking-widest uppercase text-gray-800 mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
                       <Filter size={18} className="text-indigo-500" />
                       Schema Blueprint Verification Matrix
                    </h4>
                    
                    <ConditionBuilder 
                       node={formData.condition_tree} 
                       onChange={(newTree) => setFormData({...formData, condition_tree: newTree})} 
                     />

                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4 border-t border-gray-100 pt-8 relative z-30">
                <button 
                  type="button" 
                  onClick={() => {
                     setIsModalOpen(false);
                     setEditingId(null);
                     setFormData({ name: "", description: "", condition_tree: defaultRootCondition, tag_to_add: "", delay_reason_to_set: "", set_is_delayed: false });
                  }} 
                  className="px-8 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 shadow-sm transition-all"
                >Cancel Node</button>
                <button type="submit" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
                   {editingId ? "Push Logic Updates" : "Activate Logic Architecture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------- GLOBAL SYNC OVERLAY ----------- */}
      {isSyncing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-md animate-fade-in">
           <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-12 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] border border-white/50 text-center max-w-md animate-slide-up relative overflow-hidden group">
              {/* Animated background pulse */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200 animate-bounce transition-transform">
                   <div className="relative">
                      <Loader2 size={40} className="text-white animate-spin opacity-40 absolute inset-0" />
                      <Activity size={32} className="text-white relative z-10 animate-pulse" />
                   </div>
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Syncing Engine</h2>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-6 bg-indigo-50 py-2 px-4 rounded-full inline-block border border-indigo-100 italic">
                   Recalculating Global Logistics Matrix
                </p>
                
                <div className="space-y-4">
                   <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-full animate-progress-shimmer bg-[length:200%_100%]"></div>
                   </div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                      Updating tags, re-calculating delay ETAs, and aligning warehouse logic across all historical nodes.
                   </p>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
