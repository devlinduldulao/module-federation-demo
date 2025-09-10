export interface DashboardStat {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly emoji?: string;
  readonly color: string;
  readonly trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
}

export interface ActivityItem {
  readonly id: string;
  readonly message: string;
  readonly timestamp: string;
  readonly type: "success" | "info" | "warning" | "error";
  readonly icon?: string;
}

export type StatCategory = "orders" | "spending" | "wishlist" | "pending";

export interface DashboardData {
  readonly stats: DashboardStat[];
  readonly recentActivity: ActivityItem[];
  readonly lastUpdated: string;
}
