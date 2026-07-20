"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  DollarSign,
  Eye,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Wallet,
} from "lucide-react";

import { useAgentDetailQuery } from "@/hooks/queries/useAgentDetailQuery";
import type { AgentDetailPeriod } from "@/features/agents/agent-actions";
import {
  TYPE_LABELS,
  STATUS_LABELS,
  TYPE_BADGE,
  STATUS_BADGE,
} from "./listings-data";
import type { PropertyType, PropertyStatus } from "@/generated/prisma/enums";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

// Displayed labels are translated via i18n (see PERIOD_I18N_KEY below); these
// values stay in stable English because they're compared against directly.
const PERIOD_I18N_KEY: Record<AgentDetailPeriod, string> = {
  current_month: "detail.period.currentMonth",
  last_month: "detail.period.lastMonth",
  this_quarter: "detail.period.thisQuarter",
  this_year: "detail.period.thisYear",
};

const PERIOD_OPTIONS = Object.keys(PERIOD_I18N_KEY) as AgentDetailPeriod[];

const priceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatPrice(salePrice: number | null, rentPrice: number | null): string {
  const sale = salePrice !== null ? `$${priceFormat.format(salePrice)}` : null;
  const rent = rentPrice !== null ? `$${priceFormat.format(rentPrice)}/mo` : null;
  if (sale && rent) return `${sale} · ${rent}`;
  return sale ?? rent ?? "—";
}

function mapRole(role: "ADMIN" | "MANAGER" | "AGENT", t: (key: string) => string): string {
  if (role === "ADMIN") return t("role.administrator");
  if (role === "MANAGER") return t("role.manager");
  return t("role.agent");
}

// ── Badge components ──────────────────────────────────────────────────────────
// Labels come from the shared "dashboard" namespace (propertyType / status
// enums) so they stay consistent with the Listings module's own badges.

function TypeBadge({ type, t }: { type: string; t: (key: string) => string }) {
  const badgeStyle = TYPE_BADGE[type as PropertyType];

  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[6px] px-3 py-1 text-[12px] font-medium"
      style={{
        backgroundColor: badgeStyle.bg,
        color: badgeStyle.text,
        ...mont,
      }}
    >
      {t(`propertyType.${type}`)}
    </span>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const badgeStyle = STATUS_BADGE[status as PropertyStatus];

  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[6px] px-3 py-1 text-[12px] font-medium"
      style={{
        backgroundColor: badgeStyle.bg,
        color: badgeStyle.text,
        ...mont,
      }}
    >
      {t(`status.${status}`)}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  iconBackground: string;
  icon: ReactNode;
  value: string | number;
  label: string;
};

function StatCard({ iconBackground, icon, value, label }: StatCardProps) {
  return (
    <article className="flex min-h-[138px] min-w-0 flex-col rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:p-5">
      <span
        className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px]"
        style={{ backgroundColor: iconBackground }}
      >
        {icon}
      </span>

      <div className="mt-3 min-w-0">
        <p
          className="min-w-0 truncate text-[24px] font-semibold leading-8 text-[#0d2138]"
          style={poppins}
        >
          {value}
        </p>

        <p
          className="mt-0.5 text-[14px] leading-5 text-[#6a7282]"
          style={mont}
        >
          {label}
        </p>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type AgentDetailPageProps = {
  agentId: string;
};

export function AgentDetailPage({ agentId }: AgentDetailPageProps) {
  const { t } = useTranslation("agents");
  const { t: td } = useTranslation("dashboard");
  const [period, setPeriod] = useState<AgentDetailPeriod>("current_month");
  const { data: agent, isLoading, isFetching, isError } = useAgentDetailQuery(agentId, period);
  const [propertySearch, setPropertySearch] = useState("");
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const periodMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPeriodOpen) return;
    function handleMouseDown(event: MouseEvent) {
      if (periodMenuRef.current?.contains(event.target as Node)) return;
      setIsPeriodOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isPeriodOpen]);

  const normalizedSearch = propertySearch.trim().toLowerCase();

  const filteredProperties = useMemo(() => {
    if (!agent) return [];
    if (!normalizedSearch) return agent.properties;

    return agent.properties.filter((property) =>
      [
        property.listingId,
        property.title,
        TYPE_LABELS[property.type as PropertyType],
        property.location,
        STATUS_LABELS[property.status as PropertyStatus],
        formatPrice(property.salePrice, property.rentPrice),
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [agent, normalizedSearch]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-2 px-6 py-10 text-[#6a7282]"
        style={mont}
      >
        <Loader2 size={18} className="animate-spin" />
        {t("detail.loadingAgent")}
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-[14px] text-[#dc2626]" style={mont}>
          {t("detail.notFound")}
        </p>

        <Link
          href="/dashboard/agents"
          className="mt-3 inline-block text-[13px] text-[#1e4f86] hover:underline"
          style={mont}
        >
          {t("detail.backToAgents")}
        </Link>
      </div>
    );
  }

  const initials = agent.name
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAgentActive = agent.status === "ACTIVE";

  return (
    <main className="min-h-full bg-[#f8fafc] px-3 py-4 sm:px-4 sm:py-5 lg:px-5">
      <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-4">
        {/* Back link */}
        <Link
          href="/dashboard/agents"
          className="inline-flex w-fit items-center gap-1.5 text-[14px] font-medium text-[#6a7282] transition-colors hover:text-[#0d2138]"
          style={mont}
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span>{t("detail.backToAgents")}</span>
        </Link>

        {/* Agent header */}
        <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Agent information */}
            <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
              {/* Avatar */}
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="size-16 shrink-0 rounded-full border border-[#e5e7eb] object-cover sm:size-[70px]"
                />
              ) : (
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#1e4f86] text-[18px] font-semibold text-white sm:size-[70px] sm:text-[20px]"
                  style={mont}
                >
                  {initials}
                </div>
              )}

              {/* Name and details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="break-words text-[18px] font-semibold leading-6 text-[#0d2138] sm:text-[20px]"
                    style={poppins}
                  >
                    {agent.name}
                  </h1>

                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium ${
                      isAgentActive
                        ? "border-[#86efac] bg-[#dcfce7] text-[#008236]"
                        : "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]"
                    }`}
                    style={mont}
                  >
                    <span
                      className={`mr-1 size-1.5 rounded-full ${
                        isAgentActive ? "bg-[#00c950]" : "bg-[#ef4444]"
                      }`}
                    />

                    {td(isAgentActive ? "status.ACTIVE" : "status.INACTIVE")}
                  </span>
                </div>

                <p
                  className="mt-1 text-[14px] text-[#6a7282]"
                  style={mont}
                >
                  {mapRole(agent.role, t)}
                </p>

                {/* Contact information */}
                <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
                  <span
                    className="flex min-w-0 items-start gap-2 text-[14px] text-[#4b5563]"
                    style={mont}
                  >
                    <Mail
                      size={15}
                      className="mt-0.5 shrink-0 text-[#6a7282]"
                    />

                    <span className="break-all">{agent.email}</span>
                  </span>

                  <span
                    className="flex items-center gap-2 text-[14px] text-[#4b5563]"
                    style={mont}
                  >
                    <Phone
                      size={15}
                      className="shrink-0 text-[#6a7282]"
                    />

                    <span>{agent.phone || "—"}</span>
                  </span>

                  <span
                    className="flex min-w-0 items-start gap-2 text-[14px] text-[#4b5563]"
                    style={mont}
                  >
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-[#6a7282]"
                    />

                    <span className="break-words">{agent.city || "—"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Period selector */}
            <div ref={periodMenuRef} className="relative w-full shrink-0 lg:w-auto">
              <button
                type="button"
                aria-label={t("detail.selectPeriodAria")}
                aria-haspopup="listbox"
                aria-expanded={isPeriodOpen}
                onClick={() => setIsPeriodOpen((open) => !open)}
                className="flex h-11 w-full items-center justify-between gap-2 rounded-[9px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#183f6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 lg:h-10 lg:w-auto lg:justify-center"
                style={mont}
              >
                <span>{t(PERIOD_I18N_KEY[period])}</span>

                {isFetching ? (
                  <Loader2 size={16} className="shrink-0 animate-spin" />
                ) : (
                  <ChevronDown size={16} className="shrink-0" />
                )}
              </button>

              {isPeriodOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 z-20 mt-1.5 w-full min-w-[180px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-lg lg:w-auto"
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={option === period}
                      onClick={() => {
                        setPeriod(option);
                        setIsPeriodOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[14px] text-[#0d2138] transition-colors hover:bg-[#f3f4f6]"
                      style={mont}
                    >
                      {t(PERIOD_I18N_KEY[option])}
                      {option === period && <Check size={15} className="shrink-0 text-[#1e4f86]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            iconBackground="#e4e7ff"
            icon={
              <Building2
                size={20}
                strokeWidth={1.8}
                className="text-[#6366f1]"
              />
            }
            value={agent.totalListings}
            label={t("detail.stats.totalListings")}
          />

          <StatCard
            iconBackground="#d1fae5"
            icon={
              <DollarSign
                size={21}
                strokeWidth={1.8}
                className="text-[#10b981]"
              />
            }
            value={`$${priceFormat.format(agent.totalRevenue)}`}
            label={t("detail.stats.totalRevenue")}
          />

          <StatCard
            iconBackground="#fef3c7"
            icon={
              <Handshake
                size={20}
                strokeWidth={1.8}
                className="text-[#f59e0b]"
              />
            }
            value={agent.totalDeals}
            label={t("detail.stats.totalDeals")}
          />

          <StatCard
            iconBackground="#e4e7ff"
            icon={
              <Building2
                size={20}
                strokeWidth={1.8}
                className="text-[#6366f1]"
              />
            }
            value={agent.openDeals}
            label={t("detail.stats.openDeals")}
          />

          <StatCard
            iconBackground="#fae8ff"
            icon={
              <Wallet
                size={20}
                strokeWidth={1.8}
                className="text-[#a855f7]"
              />
            }
            value={`$${priceFormat.format(agent.totalEarnings)}`}
            label={t("detail.stats.totalEarnings")}
          />
        </section>

        {/* Properties assigned */}
        <section className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
          {/* Properties header */}
          <div className="flex flex-col gap-4 border-b border-[#e5e7eb] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                className="text-[16px] font-semibold leading-6 text-[#0d2138]"
                style={mont}
              >
                {t("detail.propertiesAssigned")}
              </h2>

              <p
                className="mt-0.5 text-[14px] text-[#6a7282]"
                style={mont}
              >
                {t("detail.totalProperties", { count: agent.properties.length })}
              </p>
            </div>

            {/* Search */}
            <div className="flex h-11 w-full items-center gap-2.5 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3 transition-colors focus-within:border-[#1e4f86] focus-within:ring-2 focus-within:ring-[#1e4f86]/10 sm:h-10 sm:w-[230px]">
              <Search
                size={16}
                className="shrink-0 text-[#99a1af]"
              />

              <input
                type="search"
                value={propertySearch}
                onChange={(event) => setPropertySearch(event.target.value)}
                placeholder={t("detail.searchPropertiesPlaceholder")}
                aria-label={t("detail.searchAssignedPropertiesAria")}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b3038] outline-none placeholder:text-[#99a1af]"
                style={mont}
              />
            </div>
          </div>

          {/* Tablet and desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfc]">
                  {[
                    t("detail.columns.listingId"),
                    t("detail.columns.propertyName"),
                    t("detail.columns.type"),
                    t("detail.columns.location"),
                    t("detail.columns.price"),
                    t("detail.columns.status"),
                    "",
                  ].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="whitespace-nowrap px-4 py-3 text-left text-[12px] font-medium tracking-wide text-[#99a1af]"
                      style={mont}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-t border-[#edf0f3] transition-colors hover:bg-[#fafbfc]"
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className="whitespace-nowrap text-[14px] font-semibold text-[#1e4f86]"
                        style={mont}
                      >
                        {property.listingId}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className="whitespace-nowrap text-[14px] font-medium text-[#2b3038]"
                        style={mont}
                      >
                        {property.title}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <TypeBadge type={property.type} t={td} />
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className="flex items-center gap-1.5 whitespace-nowrap text-[14px] text-[#6a7282]"
                        style={mont}
                      >
                        <MapPin
                          size={14}
                          className="shrink-0 text-[#7b8493]"
                        />

                        {property.location}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className="whitespace-nowrap text-[14px] font-medium text-[#0d2138]"
                        style={mont}
                      >
                        {formatPrice(property.salePrice, property.rentPrice)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={property.status} t={td} />
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={`/listings/${property.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("detail.viewPublicListingTitle")}
                        aria-label={t("detail.viewListingAria", { title: property.title })}
                        className="inline-flex size-9 items-center justify-center rounded-[8px] text-[#99a1af] transition-colors hover:bg-[#f3f4f6] hover:text-[#1e4f86]"
                      >
                        <Eye size={16} />
                      </a>
                    </td>
                  </tr>
                ))}

                {filteredProperties.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[14px] text-[#6a7282]"
                      style={mont}
                    >
                      {t("detail.noPropertiesFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile property cards */}
          <div className="flex flex-col gap-3 bg-[#f8fafc] p-3 md:hidden">
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <article
                  key={property.id}
                  className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                >
                  {/* Property heading */}
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-semibold text-[#1e4f86]"
                        style={mont}
                      >
                        {property.listingId}
                      </p>

                      <h3
                        className="mt-1.5 break-words text-[14px] font-semibold leading-5 text-[#0d2138]"
                        style={mont}
                      >
                        {property.title}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={property.status} t={td} />
                    </div>
                  </div>

                  {/* Property details */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                      <p
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        {t("detail.mobileLabels.type")}
                      </p>

                      <div className="mt-2">
                        <TypeBadge type={property.type} t={td} />
                      </div>
                    </div>

                    <div className="min-w-0 rounded-[10px] bg-[#f8fafc] p-3">
                      <p
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        {t("detail.mobileLabels.price")}
                      </p>

                      <p
                        className="mt-2 truncate text-[14px] font-semibold text-[#0d2138]"
                        style={mont}
                      >
                        {formatPrice(property.salePrice, property.rentPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#f8fafc] p-3">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-[#6a7282]"
                    />

                    <div className="min-w-0">
                      <p
                        className="text-[14px] text-[#99a1af]"
                        style={mont}
                      >
                        {t("detail.mobileLabels.location")}
                      </p>

                      <p
                        className="mt-1 break-words text-[14px] font-medium text-[#6a7282]"
                        style={mont}
                      >
                        {property.location}
                      </p>
                    </div>
                  </div>

                  {/* View button */}
                  <a
                    href={`/listings/${property.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#dbe3ec] bg-white text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#f8fafc]"
                    style={mont}
                  >
                    <Eye
                      size={16}
                      className="shrink-0"
                    />

                    {t("detail.viewProperty")}
                  </a>
                </article>
              ))
            ) : (
              <div
                className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-10 text-center text-[14px] text-[#6a7282]"
                style={mont}
              >
                No properties found.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
