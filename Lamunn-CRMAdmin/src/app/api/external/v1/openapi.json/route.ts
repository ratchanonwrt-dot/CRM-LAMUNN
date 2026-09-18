import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// OpenAPI 3.1 description of the read-only external API, in the shape ChatGPT
// "Actions" imports (Configure → Actions → Import from URL). Kept in sync by hand
// with the route handlers next to it — no auth on this document itself, it
// contains no data.

const page = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
];
const range = (what: string) => [
  { name: "from", in: "query", description: `Start of the period (${what}), YYYY-MM-DD in Thailand time`, schema: { type: "string", format: "date" } },
  { name: "to", in: "query", description: `End of the period (${what}), YYYY-MM-DD in Thailand time, inclusive`, schema: { type: "string", format: "date" } },
];
const customerKey = { name: "id", in: "path", required: true, description: "Customer id, or the customer's phone number (e.g. 0812345678)", schema: { type: "string" } };
const paged = (item: string) => ({
  type: "object",
  properties: { page: { type: "integer" }, pageSize: { type: "integer" }, total: { type: "integer" }, data: { type: "array", items: { $ref: `#/components/schemas/${item}` } } },
});

export function GET(req: NextRequest) {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Lamunn CRM read-only API",
      version: "1.0.0",
      description:
        "Read-only access to the Lamunn loyalty CRM: customers, points balance and membership tier, the points ledger (every purchase scanned at a branch), reward/coupon redemptions, branch performance and overall stats. All amounts are Thai baht; timestamps are ISO 8601 (UTC). Dates you pass in are Thailand calendar days.",
    },
    servers: [{ url: `${req.nextUrl.origin}/api/external/v1` }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/customers": {
        get: {
          operationId: "searchCustomers",
          summary: "Search customers by name, phone, email or tier",
          parameters: [
            { name: "q", in: "query", description: "Free text: part of a phone number, first/last name or email", schema: { type: "string" } },
            { name: "phone", in: "query", description: "Digits of a phone number to match", schema: { type: "string" } },
            { name: "tier", in: "query", description: "Membership tier name, e.g. Gold", schema: { type: "string" } },
            { name: "registeredFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "registeredTo", in: "query", schema: { type: "string", format: "date" } },
            ...page,
          ],
          responses: { "200": { description: "Matching customers, newest first", content: { "application/json": { schema: paged("Customer") } } } },
        },
      },
      "/customers/{id}": {
        get: {
          operationId: "getCustomer",
          summary: "Customer profile with spend statistics, top branches and recent activity",
          parameters: [customerKey],
          responses: {
            "200": { description: "Customer detail", content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerDetail" } } } },
            "404": { description: "Not found" },
          },
        },
      },
      "/customers/{id}/transactions": {
        get: {
          operationId: "listCustomerTransactions",
          summary: "Points ledger of one customer (every purchase / redemption / adjustment)",
          parameters: [customerKey, { name: "type", in: "query", schema: { $ref: "#/components/schemas/TransactionType" } }, ...range("transaction date"), ...page],
          responses: { "200": { description: "Transactions, newest first", content: { "application/json": { schema: paged("Transaction") } } } },
        },
      },
      "/customers/{id}/redemptions": {
        get: {
          operationId: "listCustomerRedemptions",
          summary: "Rewards and coupons of one customer",
          parameters: [customerKey, { name: "status", in: "query", schema: { $ref: "#/components/schemas/RedemptionStatus" } }, ...range("request date"), ...page],
          responses: { "200": { description: "Redemptions, newest first", content: { "application/json": { schema: paged("Redemption") } } } },
        },
      },
      "/transactions": {
        get: {
          operationId: "listTransactions",
          summary: "Points ledger across all customers — e.g. who bought at a branch on a given day",
          parameters: [
            { name: "branch", in: "query", description: "Branch code or part of the branch name", schema: { type: "string" } },
            { name: "type", in: "query", schema: { $ref: "#/components/schemas/TransactionType" } },
            { name: "phone", in: "query", schema: { type: "string" } },
            { name: "receiptNo", in: "query", description: "Exact POS receipt number", schema: { type: "string" } },
            { name: "minAmount", in: "query", description: "Only purchases of at least this many baht", schema: { type: "number" } },
            ...range("transaction date"),
            ...page,
          ],
          responses: {
            "200": {
              description: "Transactions, newest first, plus totals for the whole filter",
              content: { "application/json": { schema: { allOf: [paged("Transaction"), { type: "object", properties: { totals: { type: "object", properties: { points: { type: "integer" }, amount: { type: "number" } } } } }] } } },
            },
          },
        },
      },
      "/redemptions": {
        get: {
          operationId: "listRedemptions",
          summary: "Reward / coupon usage across all customers — which coupon, which branch, confirmed by whom",
          parameters: [
            { name: "status", in: "query", schema: { $ref: "#/components/schemas/RedemptionStatus" } },
            { name: "branch", in: "query", description: "Branch code or part of the branch name", schema: { type: "string" } },
            { name: "reward", in: "query", description: "Part of the reward / coupon name", schema: { type: "string" } },
            { name: "phone", in: "query", schema: { type: "string" } },
            ...range("confirmation date for COMPLETED, otherwise request date"),
            ...page,
          ],
          responses: {
            "200": {
              description: "Redemptions, newest first, plus counts by status",
              content: { "application/json": { schema: { allOf: [paged("Redemption"), { type: "object", properties: { byStatus: { type: "object", additionalProperties: { type: "integer" } } } }] } } },
            },
          },
        },
      },
      "/branches": {
        get: {
          operationId: "listBranches",
          summary: "All branches with visits, sales, points and redemptions in the period",
          parameters: range("activity date"),
          responses: { "200": { description: "Branch list", content: { "application/json": { schema: { type: "object", properties: { period: {}, data: { type: "array", items: { $ref: "#/components/schemas/BranchSummary" } } } } } } } },
        },
      },
      "/tiers": {
        get: {
          operationId: "listTiers",
          summary: "Membership tier definitions and customer counts",
          responses: { "200": { description: "Tiers", content: { "application/json": { schema: { type: "object", properties: { customersWithoutTier: { type: "integer" }, data: { type: "array", items: { $ref: "#/components/schemas/Tier" } } } } } } } },
        },
      },
      "/stats/overview": {
        get: {
          operationId: "getOverview",
          summary: "Headline numbers: customers, visits, sales, points, redemptions, tier distribution, top rewards",
          parameters: range("activity date"),
          responses: { "200": { description: "Overview", content: { "application/json": { schema: { $ref: "#/components/schemas/Overview" } } } } },
        },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      schemas: {
        TransactionType: { type: "string", enum: ["EARN", "REDEEM", "ADJUST", "VOID"], description: "EARN = purchase scanned at a branch, REDEEM = points spent on a reward, ADJUST = manual correction, VOID = reversal of an EARN" },
        RedemptionStatus: { type: "string", enum: ["PENDING", "COMPLETED", "CANCELLED"], description: "PENDING = coupon issued / requested but not yet used at a branch, COMPLETED = used and confirmed by staff" },
        BranchRef: { type: "object", nullable: true, properties: { code: { type: "string" }, name: { type: "string" } } },
        CustomerRef: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, phone: { type: "string", nullable: true } } },
        Customer: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            firstName: { type: "string", nullable: true },
            lastName: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            gender: { type: "string", nullable: true, enum: ["FEMALE", "MALE", "LGBTQ", "UNSPECIFIED", null] },
            dateOfBirth: { type: "string", format: "date", nullable: true },
            pointsBalance: { type: "integer", description: "Points available to spend now" },
            lifetimePoints: { type: "integer", description: "Points ever earned (drives tier promotion)" },
            tier: { type: "object", nullable: true, properties: { id: { type: "string" }, name: { type: "string" }, minPoints: { type: "integer" } } },
            tierAnniversaryAt: { type: "string", format: "date-time", nullable: true },
            isActive: { type: "boolean" },
            registeredAt: { type: "string", format: "date-time" },
          },
        },
        CustomerDetail: {
          allOf: [
            { $ref: "#/components/schemas/Customer" },
            {
              type: "object",
              properties: {
                stats: {
                  type: "object",
                  properties: {
                    visits: { type: "integer", description: "Purchases scanned (excluding voided bills)" },
                    totalSpend: { type: "number" },
                    pointsEarned: { type: "integer" },
                    pointsRedeemed: { type: "integer" },
                    firstVisitAt: { type: "string", format: "date-time", nullable: true },
                    lastVisitAt: { type: "string", format: "date-time", nullable: true },
                    averageSpendPerVisit: { type: "number" },
                    redemptions: { type: "object", additionalProperties: { type: "integer" }, description: "Count per RedemptionStatus" },
                    topBranches: { type: "array", items: { type: "object", properties: { code: { type: "string", nullable: true }, name: { type: "string", nullable: true }, visits: { type: "integer" }, spend: { type: "number" } } } },
                  },
                },
                recentTransactions: { type: "array", items: { $ref: "#/components/schemas/Transaction" } },
                recentRedemptions: { type: "array", items: { $ref: "#/components/schemas/Redemption" } },
              },
            },
          ],
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { $ref: "#/components/schemas/TransactionType" },
            points: { type: "integer", description: "Positive for EARN / ADJUST(+), negative for REDEEM / VOID / ADJUST(-)" },
            amount: { type: "number", nullable: true, description: "Purchase amount in baht (EARN rows)" },
            receiptNo: { type: "string", nullable: true },
            note: { type: "string", nullable: true },
            branch: { $ref: "#/components/schemas/BranchRef" },
            customer: { $ref: "#/components/schemas/CustomerRef" },
            createdAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            expired: { type: "boolean" },
            voidedInPos: { type: "boolean", description: "true when the POS bill was voided after the scan and the points were reversed" },
          },
        },
        Redemption: {
          type: "object",
          properties: {
            id: { type: "string" },
            rewardName: { type: "string" },
            rewardKind: { type: "string", nullable: true, enum: ["REWARD", "VOUCHER", null], description: "REWARD = redeemed with points from the catalog, VOUCHER = coupon granted to the customer" },
            discount: { type: "object", nullable: true, properties: { amount: { type: "number", nullable: true }, percent: { type: "integer", nullable: true }, maxAmount: { type: "number", nullable: true }, minSpend: { type: "number", nullable: true } } },
            pointsSpent: { type: "integer", description: "0 for free coupons" },
            status: { $ref: "#/components/schemas/RedemptionStatus" },
            branch: { $ref: "#/components/schemas/BranchRef" },
            customer: { $ref: "#/components/schemas/CustomerRef" },
            confirmedByStaff: { type: "string", nullable: true },
            posBillNo: { type: "string", nullable: true },
            requestedAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time", description: "Confirmation time for COMPLETED" },
            expiresAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        BranchSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            code: { type: "string" },
            name: { type: "string" },
            address: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            visits: { type: "integer" },
            uniqueCustomers: { type: "integer" },
            salesAmount: { type: "number" },
            pointsIssued: { type: "integer" },
            redemptionsCompleted: { type: "integer" },
            pointsRedeemed: { type: "integer" },
          },
        },
        Tier: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            minLifetimePoints: { type: "integer" },
            benefit: { type: "string", nullable: true },
            maintenanceSpendPer6Months: { type: "number", nullable: true },
            customers: { type: "integer" },
            quarterlyVouchers: { type: "array", items: { type: "object", properties: { reward: { type: "string" }, quantity: { type: "integer" } } } },
          },
        },
        Overview: {
          type: "object",
          properties: {
            period: {},
            customersTotal: { type: "integer" },
            newCustomers: { type: "integer" },
            activeCustomers: { type: "integer", description: "Distinct customers with a purchase in the period" },
            visits: { type: "integer" },
            salesAmount: { type: "number" },
            averageSpendPerVisit: { type: "number" },
            pointsIssued: { type: "integer" },
            pointsRedeemed: { type: "integer" },
            redemptionsCompleted: { type: "integer" },
            customersByTier: { type: "array", items: { type: "object", properties: { tier: { type: "string", nullable: true }, customers: { type: "integer" } } } },
            topRewards: { type: "array", items: { type: "object", properties: { reward: { type: "string" }, redemptions: { type: "integer" } } } },
          },
        },
      },
    },
  };
  return NextResponse.json(spec, { headers: { "Cache-Control": "no-store" } });
}
