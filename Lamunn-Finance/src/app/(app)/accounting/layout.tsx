import AccountingTabs from "@/components/accounting/AccountingTabs";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AccountingTabs />
      {children}
    </div>
  );
}
