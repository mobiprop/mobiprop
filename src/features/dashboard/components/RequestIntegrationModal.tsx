"use client";

import { useState } from "react";
import { X } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewIntegrationRequest = {
  name: string;
  url: string;
  description: string;
  useCase: string;
};

type RequestIntegrationModalProps = {
  onClose: () => void;
  onSubmit?: (request: NewIntegrationRequest) => void;
};

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] text-[#1f2937]";

export function RequestIntegrationModal({ onClose, onSubmit }: RequestIntegrationModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit?.({ name: name.trim(), url: url.trim(), description: description.trim(), useCase: useCase.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[14px] w-full max-w-[650px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 pt-5 pb-[21px] border-b border-[#e5e7eb]">
          <div className="flex flex-col">
            <p className="text-[16px] font-semibold text-[#1f2937] leading-6" style={mont}>Request Integration</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>Suggest a new integration</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Integration Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., HubSpot, Asana, Monday.com, Notion"
              className={inputClass}
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Website / URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Brief Description *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this integration does and its main features..."
              rows={3}
              className="px-3.5 py-2.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Your Use Case *</label>
            <textarea
              required
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="Explain how this integration would benefit your workflow and improve your business processes..."
              rows={4}
              className="px-3.5 py-2.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
              style={mont}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-[39.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
