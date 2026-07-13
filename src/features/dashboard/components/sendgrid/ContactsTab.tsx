"use client";

import { useMemo, useState } from "react";
import {
  Search, Plus, Upload, Users, ListChecks, UserX, AlertCircle, X, Loader2,
  Download, Trash2, Pencil, CheckCircle2, MoreVertical, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import type { EmailListDto, EmailRecipientDto } from "@/features/integrations/sendgrid-actions";
import { EmailRecipientStatus } from "@/generated/prisma/enums";
import { useSendgridListsQuery, useSendgridListMembersQuery } from "@/hooks/queries/useSendgridQuery";
import {
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useAddMemberMutation,
  useAddMembersFromCrmMutation,
  useRemoveMemberMutation,
} from "@/hooks/mutations/useSendgridMutations";
import { Toggle } from "@/features/dashboard/components/settings/Toggle";
import { ContactPicker } from "@/features/dashboard/components/ContactPicker";
import { ImportContactsModal } from "./ImportContactsModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const RECIPIENT_BADGE: Record<EmailRecipientStatus, { bg: string; text: string; label: string }> = {
  SUBSCRIBED: { bg: "#dcfce7", text: "#16a34a", label: "Subscribed" },
  UNSUBSCRIBED: { bg: "#f3f4f6", text: "#6a7282", label: "Unsubscribed" },
  BOUNCED: { bg: "#fee2e2", text: "#dc2626", label: "Bounced" },
  REMOVED: { bg: "#f3f4f6", text: "#6a7282", label: "Removed" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MiniStat({ label, value, sub, icon, iconBg }: { label: string; value: number; sub: string; icon: React.ReactNode; iconBg: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#6a7282]" style={mont}>{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: iconBg }}>
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[22px] font-semibold leading-[26px] text-[#1e4f86]" style={poppins}>{value}</p>
        <p className="text-[11px] text-[#9ca3af]" style={mont}>{sub}</p>
      </div>
    </div>
  );
}

// ── New / edit list modal ─────────────────────────────────────────────────────

function ListFormModal({ list, onClose }: { list: EmailListDto | null; onClose: () => void }) {
  const [name, setName] = useState(list?.name ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [doubleOptIn, setDoubleOptIn] = useState(list?.doubleOptIn ?? false);
  const createMutation = useCreateListMutation();
  const updateMutation = useUpdateListMutation();
  const busy = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("List name is required");
      return;
    }
    try {
      if (list) {
        await updateMutation.mutateAsync({ id: list.id, name, description, doubleOptIn });
        toast.success("List updated");
      } else {
        await createMutation.mutateAsync({ name, description, doubleOptIn });
        toast.success("List created");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save list");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex w-full max-w-[540px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-semibold text-[#0d2138]" style={poppins}>{list ? "Edit Contact List" : "New Contact List"}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                {list ? "Update this audience segment" : "Create a new audience segment for your campaigns"}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>List Name <span className="text-[#dc2626]">*</span></span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={list?.isSystem}
              placeholder="e.g. Q2 Investors, Palermo Leads"
              className="min-h-[44px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none disabled:opacity-60"
              style={mont}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe who belongs in this list and how it will be used…"
              className="w-full resize-y rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-3 text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
              style={mont}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e5e7eb] p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Double opt-in</span>
              <span className="text-[12px] text-[#6a7282]" style={mont}>Require contacts to confirm their subscription via email</span>
            </div>
            <Toggle checked={doubleOptIn} onChange={setDoubleOptIn} label="Double opt-in" />
          </div>

          {!list && (
            <div className="flex flex-col gap-2 rounded-[12px] bg-[#eff6ff] p-4">
              <span className="text-[13px] font-semibold text-[#1e4f86]" style={mont}>After creating this list you can:</span>
              {[
                "Import contacts via CSV or by pasting emails",
                "Select this list as the audience when creating a campaign",
                "Add contacts manually or from the CRM contacts module",
              ].map((line) => (
                <span key={line} className="flex items-center gap-2 text-[12px] text-[#1e4f86]" style={mont}>
                  <CheckCircle2 size={13} className="shrink-0" /> {line}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-[#e5e7eb] px-5 py-4">
          <button type="button" onClick={onClose} className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]" style={mont}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-6 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:opacity-50"
            style={mont}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {list ? "Save Changes" : "Create List"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Members modal ─────────────────────────────────────────────────────────────

function MembersModal({ list, canManage, canExport, onClose }: { list: EmailListDto; canManage: boolean; canExport: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualFirst, setManualFirst] = useState("");
  const [manualLast, setManualLast] = useState("");
  const [crmContactId, setCrmContactId] = useState("");
  const [crmContactLabel, setCrmContactLabel] = useState("");

  const membersQuery = useSendgridListMembersQuery(list.id, search);
  const addMutation = useAddMemberMutation();
  const addCrmMutation = useAddMembersFromCrmMutation();
  const removeMutation = useRemoveMemberMutation();

  const members = membersQuery.data?.members ?? [];

  async function handleAddManual() {
    if (!manualEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await addMutation.mutateAsync({ listId: list.id, email: manualEmail, firstName: manualFirst, lastName: manualLast });
      toast.success("Contact added");
      setManualEmail(""); setManualFirst(""); setManualLast("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    }
  }

  async function handleAddFromCrm() {
    if (!crmContactId) {
      toast.error("Pick a CRM contact first");
      return;
    }
    try {
      const result = await addCrmMutation.mutateAsync({ listId: list.id, contactIds: [crmContactId] });
      if (result.skippedNoEmail > 0) {
        toast.error("That contact has no valid email address");
      } else {
        toast.success("Contact added from CRM");
      }
      setCrmContactId(""); setCrmContactLabel("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    }
  }

  async function handleRemove(member: EmailRecipientDto) {
    if (!window.confirm(`Remove ${member.email} from "${list.name}"?`)) return;
    try {
      await removeMutation.mutateAsync({ listId: list.id, recipientId: member.id });
      toast.success("Removed from list");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-semibold text-[#0d2138]" style={poppins}>{list.name}</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                {list.memberCount} contact{list.memberCount === 1 ? "" : "s"} · {list.listId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canExport && (
                <a
                  href={`/api/dashboard/sendgrid/lists/${list.id}/export`}
                  download
                  className="flex min-h-[38px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] px-4 text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                  style={mont}
                >
                  <Download size={14} /> Export CSV
                </a>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowAdd((v) => !v)}
                  className="flex min-h-[38px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1b487a]"
                  style={mont}
                >
                  <UserPlus size={14} /> Add Contact
                </button>
              )}
              <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {showAdd && canManage && (
          <div className="shrink-0 border-b border-[#f3f4f6] bg-[#fafbfc] px-5 py-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[11px] font-semibold text-[#6a7282]" style={mont}>From CRM Contacts</span>
                <ContactPicker
                  value={crmContactId}
                  label={crmContactLabel}
                  onSelect={(id, label) => { setCrmContactId(id); setCrmContactLabel(label); }}
                  placeholder="Search CRM contacts…"
                />
              </div>
              <button
                type="button"
                onClick={handleAddFromCrm}
                disabled={addCrmMutation.isPending}
                className="min-h-[40px] rounded-[10px] border border-[#1e4f86] px-4 text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] disabled:opacity-50"
                style={mont}
              >
                {addCrmMutation.isPending ? "Adding…" : "Add from CRM"}
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {[
                ["Email *", manualEmail, setManualEmail, "maria@example.com"],
                ["First name", manualFirst, setManualFirst, "María"],
                ["Last name", manualLast, setManualLast, "García"],
              ].map(([label, value, setter, ph]) => (
                <div key={label as string} className="flex flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#6a7282]" style={mont}>{label as string}</span>
                  <input
                    value={value as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    placeholder={ph as string}
                    className="min-h-[40px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
                    style={mont}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddManual}
                disabled={addMutation.isPending}
                className="min-h-[40px] rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1b487a] disabled:opacity-50"
                style={mont}
              >
                {addMutation.isPending ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        )}

        <div className="shrink-0 border-b border-[#f3f4f6] px-5 py-3">
          <div className="relative max-w-[320px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="min-h-[38px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] pl-9 pr-3 text-[12px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
              style={mont}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-[#6a7282]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]" style={mont}>Loading members…</span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14">
              <Users size={26} className="text-[#c9d6e5]" />
              <p className="text-[13px] text-[#6a7282]" style={mont}>
                {search ? "No members match your search." : "No contacts in this list yet — import or add some."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                  {["Contact", "Phone", "Source", "Status", "Added", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6a7282]" style={mont}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const badge = RECIPIENT_BADGE[member.status];
                  const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
                  return (
                    <tr key={member.id} className="border-b border-[#f3f4f6] last:border-b-0">
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-[#0d2138]" style={mont}>{fullName || "—"}</span>
                          <span className="text-[11px] text-[#9ca3af]" style={mont}>{member.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#6a7282]" style={mont}>{member.phone ?? "—"}</td>
                      <td className="px-5 py-3 text-[12px] text-[#6a7282]" style={mont}>{member.source ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-[6px] px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: badge.bg, color: badge.text, ...mont }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#6a7282] whitespace-nowrap" style={mont}>{fmtDate(member.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemove(member)}
                            title="Remove from list"
                            className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#9ca3af] hover:bg-[#fff1f2] hover:text-[#dc2626]"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Contacts tab ──────────────────────────────────────────────────────────────

export function ContactsTab({ canManage, canExport }: { canManage: boolean; canExport: boolean }) {
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importListId, setImportListId] = useState<string | undefined>(undefined);
  const [formList, setFormList] = useState<EmailListDto | null | "new">(null);
  const [membersList, setMembersList] = useState<EmailListDto | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const listsQuery = useSendgridListsQuery();
  const deleteMutation = useDeleteListMutation();

  const lists = useMemo(() => listsQuery.data?.lists ?? [], [listsQuery.data]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return lists.filter((l) => !q || l.name.toLowerCase().includes(q) || (l.description ?? "").toLowerCase().includes(q));
  }, [lists, search]);

  const totals = useMemo(() => {
    // Recipient-level totals come from the system All Contacts list (every
    // recipient is a member of it), so cross-list duplicates aren't counted twice.
    const master = lists.find((l) => l.isSystem);
    return {
      contacts: master?.memberCount ?? 0,
      lists: lists.length,
      unsubscribed: master?.unsubscribedCount ?? 0,
      bounced: master?.bouncedCount ?? 0,
    };
  }, [lists]);

  async function handleDelete(list: EmailListDto) {
    setMenuFor(null);
    if (!window.confirm(`Delete the list "${list.name}"? Contacts remain in All Contacts; only this segment is removed.`)) return;
    try {
      await deleteMutation.mutateAsync(list.id);
      toast.success("List deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete list");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[16px] font-semibold text-[#0d2138]" style={poppins}>Contact Lists</h2>
          <p className="text-[13px] text-[#6a7282]" style={mont}>Manage audience segments and subscriber lists used in campaigns</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => { setImportListId(undefined); setShowImport(true); }}
              className="flex min-h-[40px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              style={mont}
            >
              <Upload size={15} /> Import Contacts
            </button>
            <button
              type="button"
              onClick={() => setFormList("new")}
              className="flex min-h-[40px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[13px] font-medium text-white hover:bg-[#1b487a]"
              style={mont}
            >
              <Plus size={15} /> New List
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Total Contacts" value={totals.contacts} sub="Across all lists" icon={<Users size={16} className="text-[#1e4f86]" />} iconBg="#e8f0fe" />
        <MiniStat label="Active Lists" value={totals.lists} sub="Audience segments" icon={<ListChecks size={16} className="text-[#6366f1]" />} iconBg="#e0e7ff" />
        <MiniStat label="Unsubscribed" value={totals.unsubscribed} sub="Opted out" icon={<UserX size={16} className="text-[#6a7282]" />} iconBg="#f3f4f6" />
        <MiniStat label="Bounced" value={totals.bounced} sub="Invalid addresses" icon={<AlertCircle size={16} className="text-[#dc2626]" />} iconBg="#fee2e2" />
      </div>

      {/* Lists table */}
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#f3f4f6] px-5 py-3.5">
          <div className="relative w-full max-w-[300px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lists"
              className="min-h-[38px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] pl-9 pr-3 text-[12px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
              style={mont}
            />
          </div>
          <span className="shrink-0 text-[12px] text-[#6a7282]" style={mont}>{filtered.length} list{filtered.length === 1 ? "" : "s"}</span>
        </div>

        {listsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-[#6a7282]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[13px]" style={mont}>Loading lists…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14">
            <ListChecks size={26} className="text-[#c9d6e5]" />
            <p className="text-[13px] text-[#6a7282]" style={mont}>
              {search ? "No lists match your search." : "No contact lists yet — create one to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                  {["List Name", "Description", "Contacts", "Unsub.", "Bounced", "Last Updated", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6a7282]" style={mont}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((list) => (
                  <tr key={list.id} className="border-b border-[#f3f4f6] last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{list.name}</span>
                        <span className="text-[11px] text-[#9ca3af]" style={mont}>{list.listId}</span>
                      </div>
                    </td>
                    <td className="max-w-[280px] px-5 py-4">
                      <span className="line-clamp-2 text-[13px] text-[#6a7282]" style={mont}>{list.description ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-[#0d2138]" style={mont}>{list.memberCount}</td>
                    <td className="px-5 py-4 text-[13px] text-[#6a7282]" style={mont}>{list.unsubscribedCount}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[13px] font-medium ${list.bouncedCount > 0 ? "text-[#dc2626]" : "text-[#6a7282]"}`} style={mont}>{list.bouncedCount}</span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#6a7282] whitespace-nowrap" style={mont}>{fmtDate(list.updatedAt)}</td>
                    <td className="relative px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMembersList(list)}
                          className="min-h-[34px] rounded-[8px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1b487a]"
                          style={mont}
                        >
                          View
                        </button>
                        {canManage && (
                          <>
                            <button type="button" onClick={() => setMenuFor(menuFor === list.id ? null : list.id)} className="inline-flex size-8 items-center justify-center rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
                              <MoreVertical size={15} />
                            </button>
                            {menuFor === list.id && (
                              <div className="absolute right-5 top-14 z-10 w-[180px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]">
                                <button
                                  type="button"
                                  onClick={() => { setMenuFor(null); setImportListId(list.id); setShowImport(true); }}
                                  className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]"
                                  style={mont}
                                >
                                  <Upload size={13} /> Import into list
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setMenuFor(null); setFormList(list); }}
                                  className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#0d2138] hover:bg-[#f8fafc]"
                                  style={mont}
                                >
                                  <Pencil size={13} /> Edit list
                                </button>
                                {!list.isSystem && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(list)}
                                    className="flex h-9 w-full items-center gap-2 rounded-[8px] px-3 text-left text-[12px] font-medium text-[#dc2626] hover:bg-[#fff1f2]"
                                    style={mont}
                                  >
                                    <Trash2 size={13} /> Delete list
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showImport && (
        <ImportContactsModal lists={lists} initialListId={importListId} onClose={() => setShowImport(false)} />
      )}
      {formList !== null && (
        <ListFormModal list={formList === "new" ? null : formList} onClose={() => setFormList(null)} />
      )}
      {membersList && (
        <MembersModal list={membersList} canManage={canManage} canExport={canExport} onClose={() => setMembersList(null)} />
      )}
    </div>
  );
}
