"use client";

import { useState } from "react";
import { X, CheckCircle2, RefreshCw, ChevronDown } from "lucide-react";

import type { Integration, IntegrationPermission, IntegrationSettingField } from "../integrations-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type IntegrationDetailModalProps = {
  integration: Integration;
  onClose: () => void;
  onSave?: (settings: IntegrationSettingField[], permissions: IntegrationPermission[]) => void;
  onDisconnect?: () => void;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#1e4f86]" : "bg-[#d1d5db]"}`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-1"}`}
      />
    </button>
  );
}

export function IntegrationDetailModal({ integration, onClose, onSave, onDisconnect }: IntegrationDetailModalProps) {
  const [settings, setSettings] = useState<IntegrationSettingField[]>(integration.settings ?? []);
  const [permissions, setPermissions] = useState<IntegrationPermission[]>(integration.permissions ?? []);

  function updateSetting(id: string, value: string) {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  }

  function togglePermission(id: string, enabled: boolean) {
    setPermissions((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
  }

  function handleSave() {
    onSave?.(settings, permissions);
    onClose();
  }

  function handleDisconnect() {
    onDisconnect?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[14px] w-full max-w-[700px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 pt-5 pb-[21px] border-b border-[#e5e7eb]">
          <div className="flex flex-col">
            <p className="text-[16px] font-semibold text-[#1f2937] leading-6" style={mont}>{integration.name}</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>Manage integration settings</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Connected banner */}
          <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-[14px] flex items-center gap-3 px-[17px] h-[74px]">
            <div className="size-10 shrink-0 rounded-full bg-[#10b981] flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div className="flex-1 flex flex-col">
              <p className="text-[14px] font-medium text-[#047857]" style={mont}>Connected Successfully</p>
              <p className="text-[12px] text-[#059669]" style={mont}>Last synced: {integration.lastSynced ?? "just now"}</p>
            </div>
            <button
              type="button"
              className="h-8 px-3 border border-[#86efac] rounded-[10px] flex items-center gap-1.5 text-[12px] font-medium text-[#047857] hover:bg-[#d1fae5] transition-colors shrink-0"
              style={mont}
            >
              <RefreshCw size={12} />
              Sync Now
            </button>
          </div>

          {/* Integration Settings */}
          {settings.length > 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Integration Settings</p>
              <div className="flex flex-col gap-4">
                {settings.map((field) => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <label className="text-[12px] text-[#1f2937]" style={mont}>{field.label}</label>
                    {field.type === "select" ? (
                      <div className="relative">
                        <select
                          value={field.value}
                          onChange={(e) => updateSetting(field.id, e.target.value)}
                          className="w-full h-10 pl-3.5 pr-9 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                          style={mont}
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => updateSetting(field.id, e.target.value)}
                        className="h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] outline-none focus:border-[#1e4f86] transition-colors"
                        style={mont}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {permissions.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Permissions</p>
              <div className="flex flex-col gap-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="border border-[#e5e7eb] rounded-[10px] h-[50px] flex items-center justify-between px-3"
                  >
                    <p className="text-[12px] text-[#1f2937]" style={mont}>{perm.label}</p>
                    <Toggle checked={perm.enabled} onChange={(v) => togglePermission(perm.id, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-[#e5e7eb] pt-5 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 h-[39.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-5 h-[41.5px] border border-[#fca5a5] rounded-[10px] text-[12px] font-medium text-[#dc2626] hover:bg-[#fef2f2] transition-colors shrink-0"
              style={mont}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
