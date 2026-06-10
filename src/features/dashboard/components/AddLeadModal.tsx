"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";

import type { LeadStatus } from "../leads-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewLead = {
  name: string;
  email: string;
  phone: string;
  source: string;
  propertyInterest: string;
  minBudget: string;
  maxBudget: string;
  score: number;
  status: LeadStatus;
  assignedAgent: string;
  notes: string;
};

type AddLeadModalProps = {
  onClose: () => void;
  onCreate?: (lead: NewLead) => void;
};

const inputClass =
  "h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";
const selectClass =
  "w-full h-10 pl-3 pr-9 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] bg-white appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer";

const SOURCES = ["Zonaprop", "Website", "Whatsapp", "Campaign"];
const PROPERTY_INTERESTS = ["Apartment", "House", "Commercial", "Land"];
const STATUSES: LeadStatus[] = ["Cold", "In Progress", "Won", "Lost"];

export function AddLeadModal({ onClose, onCreate }: AddLeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Zonaprop");
  const [propertyInterest, setPropertyInterest] = useState("Apartment");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [score, setScore] = useState(50);
  const [status, setStatus] = useState<LeadStatus>("In Progress");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate?.({
      name: name.trim(), email: email.trim(), phone: phone.trim(),
      source, propertyInterest, minBudget, maxBudget, score, status,
      assignedAgent, notes: notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[700px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Add New Lead</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Full Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className={inputClass} style={mont} />
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Email *</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} style={mont} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Phone *</label>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 5555-0000" className={inputClass} style={mont} />
            </div>
          </div>

          {/* Source / Property interest */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Lead Source *</label>
              <div className="relative">
                <select required value={source} onChange={(e) => setSource(e.target.value)} className={selectClass} style={mont}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Property Interest *</label>
              <div className="relative">
                <select required value={propertyInterest} onChange={(e) => setPropertyInterest(e.target.value)} className={selectClass} style={mont}>
                  {PROPERTY_INTERESTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Budget range */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Budget Range</label>
            <div className="grid grid-cols-2 gap-5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>$</span>
                <input value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="Min" inputMode="numeric" className="h-10 w-full pl-7 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>$</span>
                <input value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Max" inputMode="numeric" className="h-10 w-full pl-7 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
              </div>
            </div>
          </div>

          {/* Lead score slider */}
          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Lead Score: {score}</label>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-[#1e4f86]"
              style={{ background: `linear-gradient(to right, #1e4f86 ${score}%, #e5e7eb ${score}%)` }}
            />
            <div className="flex items-center justify-between text-[12px] text-[#6a7282]" style={mont}>
              <span>Cold (0)</span>
              <span>Hot (100)</span>
            </div>
          </div>

          {/* Status / Assigned agent */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Status *</label>
              <div className="relative">
                <select required value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className={selectClass} style={mont}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Assigned Agent</label>
              <div className="relative">
                <select value={assignedAgent} onChange={(e) => setAssignedAgent(e.target.value)} className={selectClass} style={mont}>
                  <option value="">Select Agent</option>
                  <option value="Thomas Fletcher">Thomas Fletcher</option>
                  <option value="Esther Howard">Esther Howard</option>
                  <option value="Jenny Wilson">Jenny Wilson</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this lead..."
              rows={3}
              className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
              style={mont}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Cancel
            </button>
            <button type="submit" className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors" style={mont}>
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
