"use client";

import { useState } from "react";
import { X, ChevronDown, Plus, Calendar } from "lucide-react";

import type { OppStage, OppStatus } from "../opportunities-data";
import { QuickAddContactModal } from "./QuickAddContactModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewOpportunity = {
  name: string;
  contactSide: "Buyer" | "Seller";
  contact: string;
  dealType: string;
  dealSize: string;
  contractStart: string;
  contractEnd: string;
  commissionAmount: string;
  commissionUnit: string;
  paymentTerms: string;
  probability: number;
  stage: OppStage;
  expectedClose: string;
  associatedProperty: string;
  status: OppStatus;
  agent: string;
  agentCommission: string;
  description: string;
};

type AddOpportunityModalProps = {
  onClose: () => void;
  onCreate?: (opp: NewOpportunity) => void;
};

const inputClass =
  "h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";
const selectClass =
  "w-full h-10 pl-3 pr-9 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] bg-white appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer";

const DEAL_TYPES = ["Rent", "Sale"];
const STAGES: OppStage[] = ["Qualification", "Visitation", "Offer", "Negotiation", "Closing"];
const STATUSES: OppStatus[] = ["Open", "Closed Won", "Closed Lost"];

export function AddOpportunityModal({ onClose, onCreate }: AddOpportunityModalProps) {
  const [name, setName] = useState("");
  const [contactSide, setContactSide] = useState<"Buyer" | "Seller">("Buyer");
  const [contact, setContact] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [extraContacts, setExtraContacts] = useState<string[]>([]);
  const [dealType, setDealType] = useState("Rent");
  const [dealSize, setDealSize] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [commissionUnit, setCommissionUnit] = useState("%");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [probability, setProbability] = useState(50);
  const [stage, setStage] = useState<OppStage>("Qualification");
  const [expectedClose, setExpectedClose] = useState("");
  const [associatedProperty, setAssociatedProperty] = useState("");
  const [status, setStatus] = useState<OppStatus>("Open");
  const [agent, setAgent] = useState("Matias Ulrich");
  const [agentCommission, setAgentCommission] = useState("20%");
  const [description, setDescription] = useState("");

  const isRental = dealType === "Rent";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate?.({
      name: name.trim(), contactSide, contact, dealType, dealSize,
      contractStart, contractEnd, commissionAmount, commissionUnit, paymentTerms,
      probability, stage, expectedClose, associatedProperty, status,
      agent: agent.trim(), agentCommission, description: description.trim(),
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
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>New Opportunity</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* Opportunity name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Opportunity Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter opportunity name" className={inputClass} style={mont} />
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Contact *</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {(["Buyer", "Seller"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setContactSide(side)}
                    className={`h-10 px-4 rounded-[8px] border text-[12px] font-medium transition-colors ${
                      contactSide === side ? "bg-[#1e4f86] border-[#1e4f86] text-white" : "bg-white border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb]"
                    }`}
                    style={mont}
                  >
                    {side}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <select value={contact} onChange={(e) => setContact(e.target.value)} className={selectClass} style={mont}>
                  <option value="">Select contacts from Contacts</option>
                  <option value="Thomas Fletcher">Thomas Fletcher</option>
                  <option value="Robert Johnson">Robert Johnson</option>
                  {extraContacts.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => setShowAddContact(true)}
                className="h-10 px-4 bg-[#1e4f86] rounded-[8px] flex items-center gap-2 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors shrink-0"
                style={mont}
              >
                <Plus size={16} />
                Add Contact
              </button>
            </div>
          </div>

          {/* Deal type / size */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Deal Type *</label>
              <div className="relative">
                <select required value={dealType} onChange={(e) => setDealType(e.target.value)} className={selectClass} style={mont}>
                  {DEAL_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Deal Size *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>$</span>
                <input required type="number" value={dealSize} onChange={(e) => setDealSize(e.target.value)} placeholder="0.00" className="h-10 w-full pl-7 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
              </div>
            </div>
          </div>

          {/* Rental contract period — only for rentals */}
          {isRental && (
            <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[#1e4f86]" />
                <p className="text-[12px] font-medium text-[#1e4f86]" style={mont}>Rental contract period</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Contract start date *</label>
                  <div className="relative">
                    <input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className="h-10 w-full px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Contract end date *</label>
                  <div className="relative">
                    <input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className="h-10 w-full px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commission amount / payment terms */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Commission Amount</label>
              <div className="flex items-center gap-2">
                <input value={commissionAmount} onChange={(e) => setCommissionAmount(e.target.value)} placeholder="Input the percentage" className={`flex-1 ${inputClass}`} style={mont} />
                <div className="relative w-[72px] shrink-0">
                  <select value={commissionUnit} onChange={(e) => setCommissionUnit(e.target.value)} className={selectClass} style={mont}>
                    <option value="%">%</option>
                    <option value="$">$</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Payment Terms</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30, Installments, Cash" className={inputClass} style={mont} />
            </div>
          </div>

          {/* Probability slider */}
          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Probability: {probability}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-[#1e4f86]"
              style={{ background: `linear-gradient(to right, #1e4f86 ${probability}%, #e5e7eb ${probability}%)` }}
            />
            <div className="flex items-center justify-between text-[12px] text-[#6a7282]" style={mont}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Stage / expected close */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Stage *</label>
              <div className="relative">
                <select required value={stage} onChange={(e) => setStage(e.target.value as OppStage)} className={selectClass} style={mont}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Expected Close Date *</label>
              <input required type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} className={inputClass} style={mont} />
            </div>
          </div>

          {/* Associated property / status */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Associated Property</label>
              <div className="relative">
                <select value={associatedProperty} onChange={(e) => setAssociatedProperty(e.target.value)} className={selectClass} style={mont}>
                  <option value="">Select Property</option>
                  <option value="Sierra Lakeview Estate">Sierra Lakeview Estate</option>
                  <option value="Oceanfront Paradise">Oceanfront Paradise</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Status *</label>
              <div className="relative">
                <select required value={status} onChange={(e) => setStatus(e.target.value as OppStatus)} className={selectClass} style={mont}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Agent / agent commission */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Agent *</label>
              <input required value={agent} onChange={(e) => setAgent(e.target.value)} className={inputClass} style={mont} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Agent Commission</label>
              <input value={agentCommission} onChange={(e) => setAgentCommission(e.target.value)} className={inputClass} style={mont} />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this opportunity..." rows={3} className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none" style={mont} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Cancel
            </button>
            <button type="submit" className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors" style={mont}>
              Create Opportunity
            </button>
          </div>
        </form>
      </div>

      {showAddContact && (
        <QuickAddContactModal
          onClose={() => setShowAddContact(false)}
          onCreate={(c) => {
            const fullName = `${c.firstName} ${c.lastName}`.trim();
            if (fullName) {
              setExtraContacts((prev) => (prev.includes(fullName) ? prev : [...prev, fullName]));
              setContact(fullName);
              setContactSide(c.type === "Seller" ? "Seller" : "Buyer");
            }
            setShowAddContact(false);
          }}
        />
      )}
    </div>
  );
}
