# Dashboard Micro-frontend (Remote) - React 18 Streaming

The **Dashboard micro-frontend** is a standalone application that provides user analytics and insights functionality with **React 18 Suspense streaming** in the Module Federation architecture. It operates as a remote module with enhanced streaming capabilities and visual indicators for conference demonstrations.

## 🎯 Purpose

The Dashboard micro-frontend is responsible for:

- **Streaming User Analytics**: Displaying user activity with streaming data updates
- **Real-time Performance Metrics**: Showing KPIs with streaming delays for demonstration
- **Data Visualization with Streaming**: Charts and graphs with skeleton loading states
- **Activity Tracking**: Recent user actions with streaming indicators
- **Conference Demo**: Clear streaming indicators showing port 3003 (Violet theme)

## 🏗️ Architecture Role

```
┌─────────────────────────────────────────────────────────┐
│                    Shell App (Host)                     │
│                   localhost:3000                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   Products      │      Cart       │     Dashboard       │
│   localhost:3001│   localhost:3002│    localhost:3003   │
│   (Remote)      │   (Remote)      │    (Remote) ⭐       │
└─────────────────┴─────────────────┴─────────────────────┘
```

As a **Remote Module with Streaming**, the Dashboard micro-frontend:

- Exposes `UserDashboard` and `StreamingUserDashboard` components to the Shell application
- Features React 18 Suspense boundaries with skeleton loading states
- Uses simulated delays to demonstrate real-time analytics streaming for conferences
- Listens for user activity events from other modules with streaming feedback
- Aggregates and displays analytics data with streaming indicators
- Provides insights with visual streaming feedback
- Can run standalone for development and testing
- Provides clear visual indicators (Violet theme, Port 3003) for demo purposes

## 📁 File Structure

```
dashboard/
├── package.json                # Dependencies and scripts
├── rspack.config.js           # Module Federation remote configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── public/
│   └── index.html             # Standalone development template
└── src/
    ├── index.tsx                     # Entry point for standalone development
    ├── UserDashboard.tsx             # Original component (Remote Entry)
    ├── StreamingUserDashboard.tsx    # Streaming version with Suspense
    ├── index.css                     # Component-specific styles
    ├── types.ts                      # Dashboard-related type definitions
    └── lib/
        └── utils.ts                  # Dashboard utility functions
```

## 🔧 Key Configuration Files

### `rspack.config.js` - Module Federation Remote Configuration

```javascript
new rspack.container.ModuleFederationPlugin({
  name: "dashboard",
  filename: "remoteEntry.js",
  exposes: {
    "./UserDashboard": "./src/UserDashboard.tsx",
    "./StreamingUserDashboard": "./src/StreamingUserDashboard.tsx",
  },
  shared: {
    react: { singleton: true, strictVersion: false },
    "react-dom": { singleton: true, strictVersion: false },
  },
});
```

**Key aspects:**

- **name**: Identifies this module as "dashboard"
- **filename**: Entry point for remote consumption
- **exposes**: Makes `UserDashboard` and `StreamingUserDashboard` components available to host apps
- **shared**: Shares React dependencies with Shell application

### `package.json` - Dependencies and Scripts

**Key dependencies:**

- `react` & `react-dom`: UI library (shared with Shell)
- `clsx` & `tailwind-merge`: Conditional styling utilities
- `tailwindcss`: Utility-first CSS framework

**Key scripts:**

- `dev`: Start development server on port 3003
- `build`: Build for production

### `tsconfig.json` - TypeScript Configuration

**Key features:**

- **Strict mode enabled**: Enhanced type checking
- **Path mapping**: Clean imports with `@/`, `@components/`, `@lib/`
- **Module resolution**: Proper handling for Module Federation

## 🧩 Core Components

### `UserDashboard.tsx` - Main Exported Component

**Key features:**

- **Analytics Overview**: Key metrics and performance indicators
- **Activity Feed**: Recent user actions and system events
- **Data Visualization**: Charts and graphs for trends
- **Statistics Cards**: Important metrics in card layout
- **Real-time Updates**: Dynamic data updates
- **Performance Optimization**: Memoized components and efficient rendering

**Architecture patterns:**

```typescript
// Memoized statistics card component
const StatCard = memo<{
  title: string;
  value: string | number;
  change: number;
  icon: string;
  trend: "up" | "down" | "neutral";
}>(({ title, value, change, icon, trend }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
    <div
      className={`flex items-center mt-4 text-sm ${
        trend === "up"
          ? "text-green-600"
          : trend === "down"
          ? "text-red-600"
          : "text-gray-600"
      }`}
    >
      <TrendIcon trend={trend} />
      <span className="ml-1">{Math.abs(change)}%</span>
      <span className="ml-1">vs last period</span>
    </div>
  </div>
));

// Activity timeline component
const ActivityItem = memo<{
  activity: UserActivity;
}>(({ activity }) => (
  <div className="flex items-start space-x-3 p-4 border-b border-gray-100">
    <div className="text-lg">{activity.icon}</div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
      <p className="text-sm text-gray-600">{activity.description}</p>
      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
    </div>
  </div>
));
```

### `types.ts` - Type Definitions

**Core interfaces:**

```typescript
export interface DashboardStats {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly totalOrders: number;
  readonly revenue: number;
  readonly conversionRate: number;
  readonly bounceRate: number;
}

export interface UserActivity {
  readonly id: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly icon: string;
  readonly metadata?: Record<string, any>;
}

export type ActivityType =
  | "product_view"
  | "cart_add"
  | "cart_remove"
  | "purchase"
  | "login"
  | "logout"
  | "search"
  | "filter";

export interface ChartData {
  readonly label: string;
  readonly value: number;
  readonly date: Date;
  readonly category?: string;
}

export interface DashboardMetrics {
  readonly stats: DashboardStats;
  readonly activities: UserActivity[];
  readonly chartData: ChartData[];
  readonly trends: TrendData[];
}

export interface TrendData {
  readonly metric: string;
  readonly current: number;
  readonly previous: number;
  readonly change: number;
  readonly trend: "up" | "down" | "neutral";
}
```

### `lib/utils.ts` - Utility Functions

**Key utilities:**

- **Data formatting**: Number formatting, date formatting
- **Chart calculations**: Data aggregation for charts
- **Trend analysis**: Calculate trends and changes
- **Activity processing**: Process and categorize activities

```typescript
// Number formatting utilities
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Trend calculation
export const calculateTrend = (
  current: number,
  previous: number
): TrendData => {
  const change = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return {
    metric: "",
    current,
    previous,
    change: Math.abs(change),
    trend,
  };
};

// Activity categorization
export const categorizeActivity = (activity: UserActivity): string => {
  const categories = {
    product_view: "Engagement",
    cart_add: "Conversion",
    cart_remove: "Conversion",
    purchase: "Revenue",
    login: "Authentication",
    logout: "Authentication",
    search: "Discovery",
    filter: "Discovery",
  };

  return categories[activity.type] || "Other";
};
```

## 🚀 Development

### Starting the Dashboard Micro-frontend

```bash
# From the dashboard directory
npm run dev

# Or from the root directory
npm run dev:dashboard
```

The application will start on `http://localhost:3003`

### Standalone Development

The Dashboard micro-frontend can run independently for development:

1. **Standalone Mode**: Access `http://localhost:3003` to view with mock data
2. **Module Federation Mode**: Consumed by Shell app at `http://localhost:3000`

### Development Features

- **Hot Reloading**: Instant updates with React Refresh
- **Mock Data**: Test dashboard with sample analytics data
- **Real-time Simulation**: Simulate live data updates
- **Type Safety**: Full TypeScript support with strict mode

## 📊 Dashboard Features

### Statistics Overview

**Key Metrics Cards:**

- **Total Users**: Overall user count with growth trend
- **Active Users**: Currently active users
- **Total Orders**: Order count with conversion metrics
- **Revenue**: Total revenue with percentage growth
- **Conversion Rate**: Purchase conversion statistics
- **Bounce Rate**: User engagement metrics

**Statistics Implementation:**

```typescript
const StatisticsOverview = memo<{ stats: DashboardStats }>(({ stats }) => {
  const statCards = [
    {
      title: "Total Users",
      value: formatNumber(stats.totalUsers),
      change: 12.5,
      icon: "👥",
      trend: "up" as const,
    },
    {
      title: "Active Users",
      value: formatNumber(stats.activeUsers),
      change: 8.2,
      icon: "🔥",
      trend: "up" as const,
    },
    {
      title: "Total Orders",
      value: formatNumber(stats.totalOrders),
      change: 15.3,
      icon: "📦",
      trend: "up" as const,
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue),
      change: 23.1,
      icon: "💰",
      trend: "up" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
});
```

### Activity Feed

**Recent Activities:**

- User login/logout events
- Product views and interactions
- Cart additions and removals
- Purchase completions
- Search queries and filters

**Activity Feed Implementation:**

```typescript
const ActivityFeed = memo<{ activities: UserActivity[] }>(({ activities }) => (
  <div className="bg-white rounded-lg shadow-md">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
    </div>
    <div className="max-h-96 overflow-y-auto">
      {activities.length === 0 ? (
        <div className="p-6 text-center text-gray-500">No recent activity</div>
      ) : (
        activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))
      )}
    </div>
  </div>
));
```

### Data Visualization

**Chart Components:**

- Line charts for trends over time
- Bar charts for categorical data
- Pie charts for distribution analysis
- Progress indicators for goals

**Chart Implementation (using CSS-only charts):**

```typescript
const TrendChart = memo<{ data: ChartData[] }>(({ data }) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance Trends
      </h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <span className="w-16 text-sm text-gray-600">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="w-12 text-sm font-medium text-gray-900">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
```

## 📊 Data Management

### Mock Data Structure

**Sample Dashboard Data:**

```typescript
const mockDashboardStats: DashboardStats = {
  totalUsers: 12547,
  activeUsers: 2847,
  totalOrders: 8634,
  revenue: 284750,
  conversionRate: 3.2,
  bounceRate: 42.1,
};

const mockActivities: UserActivity[] = [
  {
    id: "1",
    type: "purchase",
    title: "Order Completed",
    description: "User purchased Wireless Headphones",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    userId: "user_123",
    icon: "✅",
    metadata: { orderId: "order_456", amount: 99.99 },
  },
  {
    id: "2",
    type: "cart_add",
    title: "Item Added to Cart",
    description: "User added Cotton T-Shirt to cart",
    timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 minutes ago
    userId: "user_789",
    icon: "🛒",
    metadata: { productId: "product_789", quantity: 2 },
  },
  // ... more activities
];
```

### Real-time Data Simulation

**Simulating Live Updates:**

```typescript
const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [activities, setActivities] = useState<UserActivity[]>(mockActivities);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new activity
      const newActivity: UserActivity = {
        id: Date.now().toString(),
        type: "product_view",
        title: "Product Viewed",
        description: "User viewed a product",
        timestamp: new Date(),
        icon: "👀",
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);

      // Update active users count
      setStats((prev) => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return { stats, activities };
};
```

## 🔗 Inter-Module Communication

### Event Tracking

**Listening for User Activities:**

```typescript
useEffect(() => {
  const trackActivity = (event: CustomEvent) => {
    const activity: UserActivity = {
      id: Date.now().toString(),
      type: event.type as ActivityType,
      title: event.detail.title || "User Action",
      description: event.detail.description || "",
      timestamp: new Date(),
      icon: getActivityIcon(event.type as ActivityType),
      metadata: event.detail,
    };

    setActivities((prev) => [activity, ...prev.slice(0, 19)]);
  };

  // Listen for various user activities
  const events = [
    "addToCart",
    "removeFromCart",
    "productView",
    "userLogin",
    "userLogout",
    "searchPerformed",
  ];

  events.forEach((eventType) => {
    window.addEventListener(eventType, trackActivity);
  });

  return () => {
    events.forEach((eventType) => {
      window.removeEventListener(eventType, trackActivity);
    });
  };
}, []);
```

### Analytics Event Broadcasting

**Dashboard Analytics Events:**

```typescript
const broadcastAnalyticsEvent = useCallback((eventType: string, data: any) => {
  window.dispatchEvent(
    new CustomEvent("analyticsEvent", {
      detail: {
        type: eventType,
        data,
        timestamp: new Date(),
        source: "dashboard",
      },
    })
  );
}, []);
```

## 🎨 Styling and Design

### Dashboard Layout

**Grid-Based Design:**

- Responsive grid layout for statistics cards
- Flexible activity feed with scrolling
- Chart containers with consistent styling
- Mobile-optimized responsive design

**Dashboard Styling:**

```css
/* Dashboard container */
.dashboard-container {
  @apply max-w-7xl mx-auto p-6 space-y-6;
}

/* Statistics grid */
.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

/* Stat card */
.stat-card {
  @apply bg-white p-6 rounded-lg shadow-md border border-gray-200;
  @apply transition-all hover:shadow-lg;
}

/* Activity feed */
.activity-feed {
  @apply bg-white rounded-lg shadow-md max-h-96 overflow-y-auto;
}

/* Chart container */
.chart-container {
  @apply bg-white p-6 rounded-lg shadow-md;
}
```

### Color Scheme

**Dashboard Colors:**

- **Primary**: Purple (600, 700) for main actions
- **Success**: Green for positive trends
- **Warning**: Yellow for neutral trends
- **Danger**: Red for negative trends
- **Background**: Gray (50) for page background
- **Cards**: White for content areas

## 🔍 Performance Optimization

### Component Optimization

1. **Memoization**: All dashboard components memoized
2. **Virtual Scrolling**: For large activity lists (future)
3. **Data Caching**: Cache analytics data locally
4. **Lazy Loading**: Load chart components on demand

### Data Management

1. **Efficient Updates**: Minimal re-renders for data changes
2. **Debounced Updates**: Prevent excessive real-time updates
3. **Memory Management**: Clean up intervals and event listeners

### Chart Performance

1. **CSS-Only Charts**: Use CSS for simple charts instead of heavy libraries
2. **Data Sampling**: Limit data points for better performance
3. **Progressive Loading**: Load chart data incrementally

## 🧪 Testing Strategies

### Mock Data Testing

**Comprehensive Test Data:**

```typescript
const generateMockDashboardData = (): DashboardMetrics => {
  const stats: DashboardStats = {
    totalUsers: Math.floor(Math.random() * 50000) + 10000,
    activeUsers: Math.floor(Math.random() * 5000) + 1000,
    totalOrders: Math.floor(Math.random() * 20000) + 5000,
    revenue: Math.floor(Math.random() * 500000) + 100000,
    conversionRate: Math.random() * 5 + 1,
    bounceRate: Math.random() * 20 + 30,
  };

  const activities: UserActivity[] = Array.from({ length: 20 }, (_, i) => ({
    id: i.toString(),
    type: ["product_view", "cart_add", "purchase"][
      Math.floor(Math.random() * 3)
    ] as ActivityType,
    title: `Activity ${i + 1}`,
    description: `Mock activity description ${i + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
    icon: ["👀", "🛒", "✅"][Math.floor(Math.random() * 3)],
  }));

  return { stats, activities, chartData: [], trends: [] };
};
```

### Integration Testing

1. **Event Integration**: Test event handling from other modules
2. **Data Flow**: Verify analytics data flow
3. **Real-time Updates**: Test live data updates
4. **Performance**: Monitor rendering performance

## 🚀 Production Deployment

### Analytics Configuration

**Production Features:**

- Real analytics data integration
- Performance monitoring
- Error tracking
- User behavior analytics

### Data Sources

**Production Data Integration:**

```typescript
// Example analytics service integration
const useProductionAnalytics = () => {
  const [analytics, setAnalytics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        // Fallback to mock data
        setAnalytics(generateMockDashboardData());
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Set up real-time updates
    const interval = setInterval(fetchAnalytics, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { analytics, loading };
};
```

## 🔄 Future Enhancements

### Advanced Analytics

1. **Custom Dashboards**: User-configurable dashboard layouts
2. **Advanced Charts**: Interactive charts with zoom/pan
3. **Drill-down Reports**: Detailed analytics with filtering
4. **Export Functionality**: PDF/CSV export capabilities
5. **Alerts & Notifications**: Real-time alerts for metrics

### Real-time Features

1. **WebSocket Integration**: Live data updates
2. **Real-time Collaboration**: Multi-user dashboard viewing
3. **Live Chat**: Customer support integration
4. **Push Notifications**: Browser notifications for important events

## 🤝 Contributing

When contributing to the Dashboard micro-frontend:

1. **Follow TypeScript strict mode** requirements
2. **Maintain performance optimizations** with memoization
3. **Test with mock data** thoroughly
4. **Consider accessibility** in chart design
5. **Validate analytics events** integration
6. **Test responsive design** across devices
7. **Update type definitions** for new metrics

## 📚 API Reference

### Exported Components

**UserDashboard**

```typescript
interface UserDashboardProps {
  // Optional props for configuration
  refreshInterval?: number;
  showRealTimeUpdates?: boolean;
  customMetrics?: string[];
}

const UserDashboard: React.FC<UserDashboardProps>;
```

### Event Interfaces

**Analytics Events:**

- `analyticsEvent`: General analytics tracking
- `metricUpdate`: Metric value updates
- `dashboardView`: Dashboard view tracking

---

The Dashboard micro-frontend provides comprehensive analytics and insights functionality while maintaining independence and seamless integration within the Module Federation architecture.
