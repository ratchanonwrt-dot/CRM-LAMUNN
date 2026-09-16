const APPS = [
  { key: "hr", label: "HR", href: "https://lamunn-hrm.vercel.app" },
  { key: "live", label: "LIVE", href: "https://lamunn-live.vercel.app" },
  { key: "finance", label: "FINANCE", href: "https://lamunn-finance.vercel.app" },
  { key: "crm", label: "CRM", href: "https://lamunn-crm-admin.vercel.app" },
] as const;

// Lets staff jump between Lamunn's internal systems without hunting for
// bookmarks — every internal (staff-only) app carries the same 4 buttons.
// Never added to a customer-facing app (the CRM rewards site, LiveBook,
// TaxInvoice) since those shouldn't surface links to internal tools.
export default function AppSwitcher({ current }: { current?: (typeof APPS)[number]["key"] }) {
  return (
    <div className="mb-5 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {APPS.map((app) =>
        app.key === current ? (
          <span key={app.key} className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-[11px] font-bold text-gray-900 shadow-sm">
            {app.label}
          </span>
        ) : (
          <a
            key={app.key}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold text-gray-500 transition hover:bg-white hover:text-gray-800"
          >
            {app.label}
          </a>
        )
      )}
    </div>
  );
}
