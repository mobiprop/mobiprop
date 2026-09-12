"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, Plus, RefreshCw, Search } from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import {
  resendInvitation,
  revokeInvitation,
  type InvitationListItem,
} from "@/features/auth/staff-actions";
import { AddAgentModal } from "./components/AddAgentModal";
import { SearchableSelect } from "./components/SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

type InviteStatus = InvitationListItem["status"];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<InviteStatus, { bg: string; border: string; text: string; label: string }> = {
  PENDING:  { bg: "#fffcf5", border: "#ffd384", text: "#ffa80a", label: "Pendiente"  },
  ACCEPTED: { bg: "#f5fffa", border: "#89d8a9", text: "#00aa4f", label: "Aceptada" },
  EXPIRED:  { bg: "#f8fafc", border: "#d1d5dc", text: "#6a7282", label: "Vencida"  },
  REVOKED:  { bg: "#fff5f5", border: "#f49e9e", text: "#fb2c36", label: "Revocada"  },
};

function StatusBadge({ status }: { status: InviteStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center px-3 py-[7px] rounded-[8px] text-[12px]"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.text, ...mont }}
    >
      {s.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = { AGENT: "Agente", MANAGER: "Gerente", ADMIN: "Administrador" };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type InvitationsPageProps = {
  role: Role;
  invitations: InvitationListItem[];
};

export function InvitationsPage({ role, invitations }: InvitationsPageProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InviteStatus | "All">("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const canInvite = hasPermission(role, "agents:invite");
  const canResend = hasPermission(role, "invitations:resend");
  const canRevoke = hasPermission(role, "invitations:revoke");

  const filtered = useMemo(
    () =>
      invitations.filter((inv) => {
        const name = `${inv.firstName ?? ""} ${inv.lastName ?? ""}`.trim();
        const q = search.toLowerCase();
        const matchesSearch =
          !q || name.toLowerCase().includes(q) || inv.email.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [invitations, search, statusFilter],
  );

  const refresh = () => startTransition(() => router.refresh());

  const handleResend = async (inv: InvitationListItem) => {
    setBusyId(inv.id);
    try {
      const result = await resendInvitation(inv.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      try {
        await navigator.clipboard.writeText(result.inviteUrl);
        toast.success(
          result.emailSent
            ? `Invitación reenviada a ${inv.email}. Nuevo enlace copiado.`
            : `Nuevo enlace copiado. El correo no se envió porque el servicio no está configurado.`,
        );
      } catch {
        toast.success(`Invitación renovada para ${inv.email}.`);
      }
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (inv: InvitationListItem) => {
    setBusyId(inv.id);
    try {
      const result = await revokeInvitation(inv.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Invitación de ${inv.email} revocada.`);
      setConfirmRevokeId(null);
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/agents"
              className="text-[#6a7282] hover:text-[#0d2138] transition-colors"
              title="Volver a Agentes"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-[20px] font-medium text-[#0d2138]" style={poppins}>Invitaciones</h1>
          </div>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>
            Gestioná las invitaciones de tu equipo
          </p>
        </div>
        {canInvite && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            Agregar agente
          </button>
        )}
      </div>

      {/* Invitations table */}
      <div className="bg-white border border-[#f3f4f6] rounded-[14px] overflow-hidden">
        {/* Table header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-[16px] font-medium text-[#0d2138]" style={mont}>Todas las invitaciones</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px]">
              <Search size={14} className="text-[#6a7282] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="text-[12px] text-[#2b3038] placeholder:text-[#6a7282] bg-transparent outline-none w-[180px]"
                style={mont}
              />
            </div>
            {/* Status filter */}
            <SearchableSelect
              size="sm"
              searchable={false}
              value={statusFilter}
              onChange={(next) => setStatusFilter(next as InviteStatus | "All")}
              options={[
                { value: "All", label: "Todas" },
                { value: "PENDING", label: "Pendiente" },
                { value: "ACCEPTED", label: "Aceptada" },
                { value: "EXPIRED", label: "Vencida" },
                { value: "REVOKED", label: "Revocada" },
              ]}
              placeholder="Todas"
              ariaLabel="Filtrar por estado"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                {["Nombre", "Correo", "Rol", "Invitado por", "Creada", "Vencimiento", "Aceptada", "Estado", "Acciones"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-[10px] text-[14px] font-medium text-[#6a7282] text-left ${h === "Estado" || h === "Acciones" ? "text-center" : ""}`}
                    style={mont}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const name = `${inv.firstName ?? ""} ${inv.lastName ?? ""}`.trim() || "—";
                const busy = busyId === inv.id;
                const resendable = canResend && (inv.status === "PENDING" || inv.status === "EXPIRED");
                const revokable = canRevoke && inv.status === "PENDING";
                return (
                  <tr key={inv.id} className="border-b border-[#e5e7eb] last:border-b-0">
                    <td className="px-4 py-4">
                      <span className="text-[14px] font-medium text-[#0d2138] whitespace-nowrap" style={mont}>{name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#0d2138] whitespace-nowrap" style={mont}>{inv.email}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] font-medium text-[#6a7282] whitespace-nowrap" style={mont}>
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>
                        {inv.invitedBy?.name ?? inv.invitedBy?.email ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{formatDate(inv.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{formatDate(inv.expiresAt)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#6a7282] whitespace-nowrap" style={mont}>{formatDate(inv.acceptedAt)}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      {resendable || revokable ? (
                        <div className="flex items-center justify-center gap-2">
                          {resendable && (
                            <button
                              type="button"
                              title="Reenviar invitación (genera un nuevo enlace)"
                              disabled={busy}
                              onClick={() => handleResend(inv)}
                              className="size-8 flex items-center justify-center border border-[#bedbff] rounded-[8px] bg-white hover:bg-[#f0f7ff] transition-colors disabled:opacity-50"
                            >
                              <RefreshCw size={14} className={`text-[#1e4f86] ${busy ? "animate-spin" : ""}`} />
                            </button>
                          )}
                          {revokable && (
                            confirmRevokeId === inv.id ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleRevoke(inv)}
                                onBlur={() => setConfirmRevokeId(null)}
                                className="h-8 px-2 border border-[#f49e9e] rounded-[8px] bg-[#fff5f5] text-[12px] text-[#fb2c36] hover:bg-[#ffecec] transition-colors disabled:opacity-50"
                                style={mont}
                              >
                                ¿Confirmar?
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Revocar invitación"
                                disabled={busy}
                                onClick={() => setConfirmRevokeId(inv.id)}
                                className="size-8 flex items-center justify-center border border-[#ffa2a2] rounded-[8px] bg-white hover:bg-[#fff5f5] transition-colors disabled:opacity-50"
                              >
                                <Ban size={14} className="text-[#fb2c36]" />
                              </button>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#99a1af]" style={mont}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[14px] text-[#6a7282]" style={mont}>
                    No se encontraron invitaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#f3f4f6]">
          <span className="text-[12px] font-medium text-[#6a7282]" style={mont}>
            Mostrando {filtered.length} de {invitations.length} invitaciones
          </span>
        </div>
      </div>

      {showModal && (
        <AddAgentModal
          viewerRole={role}
          onClose={() => {
            setShowModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
