"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import type {
  Integration,
  IntegrationPermission,
  IntegrationSettingField,
} from "../integrations-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type IntegrationDetailModalProps = {
  integration: Integration;
  onClose: () => void;
  onSave?: (
    settings: IntegrationSettingField[],
    permissions: IntegrationPermission[],
  ) => void;
  onDisconnect?: () => void;
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 ${
        checked ? "bg-[#1e4f86]" : "bg-[#d1d5db]"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${
          checked
            ? "translate-x-[24px]"
            : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function IntegrationDetailModal({
  integration,
  onClose,
  onSave,
  onDisconnect,
}: IntegrationDetailModalProps) {
  const [settings, setSettings] = useState<
    IntegrationSettingField[]
  >(integration.settings ?? []);

  const [permissions, setPermissions] = useState<
    IntegrationPermission[]
  >(integration.permissions ?? []);

  function updateSetting(
    id: string,
    value: string,
  ) {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id
          ? {
              ...setting,
              value,
            }
          : setting,
      ),
    );
  }

  function togglePermission(
    id: string,
    enabled: boolean,
  ) {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === id
          ? {
              ...permission,
              enabled,
            }
          : permission,
      ),
    );
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="integration-modal-title"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div
        className="relative z-10 flex w-full max-w-[700px] max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:max-h-[92dvh] sm:rounded-[14px]"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                id="integration-modal-title"
                className="break-words text-[15px] font-semibold leading-6 text-[#1f2937] sm:text-[16px]"
                style={mont}
              >
                {integration.name}
              </p>

              <p
                className="mt-0.5 break-words text-[11px] leading-5 text-[#6a7282] sm:text-[12px]"
                style={mont}
              >
                Manage integration settings
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
            {/* Connected banner */}
            <div className="min-w-0 rounded-[14px] border border-[#d1fae5] bg-[#ecfdf5] p-4">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#10b981] sm:size-10">
                    <CheckCircle2
                      size={20}
                      className="text-white"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="break-words text-[13px] font-medium leading-5 text-[#047857] sm:text-[14px]"
                      style={mont}
                    >
                      Connected Successfully
                    </p>

                    <p
                      className="break-words text-[11px] leading-5 text-[#059669] sm:text-[12px]"
                      style={mont}
                    >
                      Last synced:{" "}
                      {integration.lastSynced ??
                        "just now"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex min-h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-[#86efac] px-3 text-[12px] font-medium text-[#047857] transition-colors hover:bg-[#d1fae5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]/30 sm:w-auto"
                  style={mont}
                >
                  <RefreshCw size={12} />
                  Sync Now
                </button>
              </div>
            </div>

            {/* Integration Settings */}
            {settings.length > 0 && (
              <div className="flex min-w-0 flex-col gap-4">
                <p
                  className="text-[14px] font-medium text-[#1f2937]"
                  style={mont}
                >
                  Integration Settings
                </p>

                <div className="flex min-w-0 flex-col gap-4">
                  {settings.map((field) => (
                    <div
                      key={field.id}
                      className="flex min-w-0 flex-col gap-2"
                    >
                      <label
                        htmlFor={field.id}
                        className="text-[12px] text-[#1f2937]"
                        style={mont}
                      >
                        {field.label}
                      </label>

                      {field.type === "select" ? (
                        <div className="relative min-w-0">
                          <select
                            id={field.id}
                            value={field.value}
                            onChange={(event) =>
                              updateSetting(
                                field.id,
                                event.target.value,
                              )
                            }
                            className="h-10 w-full min-w-0 appearance-none rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] pl-3.5 pr-10 text-[12px] text-[#0a0a0a] outline-none transition-colors focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10"
                            style={mont}
                          >
                            {field.options.map(
                              (option) => (
                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option}
                                </option>
                              ),
                            )}
                          </select>

                          <ChevronDown
                            size={18}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
                          />
                        </div>
                      ) : (
                        <input
                          id={field.id}
                          type={field.type}
                          value={field.value}
                          onChange={(event) =>
                            updateSetting(
                              field.id,
                              event.target.value,
                            )
                          }
                          className="h-10 w-full min-w-0 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 text-[12px] text-[#0a0a0a] outline-none transition-colors focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10"
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
              <div className="flex min-w-0 flex-col gap-3">
                <p
                  className="text-[14px] font-medium text-[#1f2937]"
                  style={mont}
                >
                  Permissions
                </p>

                <div className="flex min-w-0 flex-col gap-2">
                  {permissions.map(
                    (permission) => (
                      <div
                        key={permission.id}
                        className="flex min-h-[50px] min-w-0 items-center justify-between gap-4 rounded-[10px] border border-[#e5e7eb] px-3 py-2.5"
                      >
                        <p
                          className="min-w-0 break-words text-[12px] leading-5 text-[#1f2937]"
                          style={mont}
                        >
                          {permission.label}
                        </p>

                        <Toggle
                          checked={
                            permission.enabled
                          }
                          onChange={(value) =>
                            togglePermission(
                              permission.id,
                              value,
                            )
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-[#e5e7eb] bg-white p-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              className="min-h-10 w-full flex-1 rounded-[10px] bg-[#1e4f86] px-5 text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
              style={mont}
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={handleDisconnect}
              className="min-h-10 w-full shrink-0 rounded-[10px] border border-[#fca5a5] px-5 text-[12px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/20 sm:w-auto"
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