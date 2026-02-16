import React, { useMemo, useState } from "react";
import { Tabs, type TabItem, Input, IconButton } from ".";
import { type SmartVariable, SYSTEM_VARIABLES } from "../types/Variables";
import { createSmartToken } from "../utils/smartVariables";
import { type CapsuleBlueprintParameter } from "../types/CapsuleBlueprint";

interface VariablePickerProps {
  onSelect: (variable: SmartVariable) => void;
  onClose?: () => void;
  globalParameters: CapsuleBlueprintParameter[];
  serviceNames: string[];
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ onSelect, onClose, globalParameters, serviceNames }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("global");

  const globalVars: SmartVariable[] = useMemo(() => {
    return globalParameters.map((p) => ({
      fullToken: createSmartToken(p.type === "env" ? "env" : "var", "global", p.key),
      type: p.type === "env" ? "env" : "var",
      source: "global",
      name: p.key,
      description: p.name || p.help,
      defaultValue: p.default_value,
    }));
  }, [globalParameters]);

  const serviceVars: SmartVariable[] = useMemo(() => {
    return serviceNames.map((name) => ({
      fullToken: createSmartToken("var", "service", name),
      type: "var",
      source: "service",
      name: name,
      description: `Reference to service: ${name}`,
    }));
  }, [serviceNames]);

  const filterVars = (vars: SmartVariable[]) => {
    if (!searchTerm) return vars;
    const lower = searchTerm.toLowerCase();
    return vars.filter((v) => v.name.toLowerCase().includes(lower) || (v.description && v.description.toLowerCase().includes(lower)));
  };

  const renderList = (vars: SmartVariable[], emptyMsg: string) => {
    const filtered = filterVars(vars);
    if (filtered.length === 0) {
      return <div className="p-4 text-center text-slate-500 italic">{emptyMsg}</div>;
    }
    return (
      <div className="flex flex-col gap-1 p-2">
        {filtered.map((v) => (
          <button key={v.fullToken} onClick={() => onSelect(v)} className="flex flex-col items-start p-2 hover:bg-slate-100 rounded text-left group transition-colors">
            <div className="flex items-center gap-2 w-full">
              <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{v.name}</span>
              {v.defaultValue && <span className="text-xs text-slate-400 ml-auto truncate max-w-[150px]">Def: {v.defaultValue}</span>}
            </div>
            {v.description && <span className="text-xs text-slate-500 mt-1 line-clamp-1 group-hover:text-slate-700">{v.description}</span>}
            <span className="text-[10px] text-slate-300 mt-0.5 font-mono hidden group-hover:block">{v.fullToken}</span>
          </button>
        ))}
      </div>
    );
  };

  const tabs: TabItem[] = [
    {
      id: "global",
      label: "Global",
      icon: "Globe" as any,
      panel: <div className="h-64 overflow-y-auto">{renderList(globalVars, "No global parameters found.")}</div>,
    },
    {
      id: "system",
      label: "System",
      icon: "Cog" as any,
      panel: <div className="h-64 overflow-y-auto">{renderList(SYSTEM_VARIABLES, "No system variables found.")}</div>,
    },
    {
      id: "services",
      label: "Services",
      icon: "Container" as any,
      panel: <div className="h-64 overflow-y-auto">{renderList(serviceVars, "No services found.")}</div>,
    },
  ];

  return (
    <div className="w-[400px] bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-900">Insert Variable</h3>
        {onClose && <IconButton icon="Close" size="xs" variant="ghost" onClick={onClose} />}
      </div>

      <div className="p-2 border-b border-slate-100">
        <Input placeholder="Search variables..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus className="text-sm" />
      </div>

      <div className="flex-1">
        <Tabs items={tabs} value={activeTab} onChange={setActiveTab} variant="minimal" className="h-full flex flex-col" />
      </div>
    </div>
  );
};

export default VariablePicker;
