// Dashboard Data Types - Matches the JSON schema from DASHBOARD_AI_SPEC.md

export interface DashboardData {
  meta: DashboardMeta;
  executiveOverview: ExecutiveOverview;
  kpis: KPIs;
  sections: Sections;
  crossChannelFunnel: FunnelData;
  alerts: Alert[];
  charts: ChartDefinition[];
  leaderboard: LeaderboardEntry[];
  goals: GoalProgress[];
  sentimentGauge: SentimentData;
  activityHeatmap: HeatmapData;
  recommendations: Recommendation[];
  predictions: Prediction[];
}

export interface DashboardMeta {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  dataCompleteness: number;
  version: string;
}

export interface ExecutiveOverview {
  summary: string;
  strategicActions: StrategicAction[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  confidenceScore: number;
}

export interface StrategicAction {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  category: 'growth' | 'risk' | 'efficiency' | 'opportunity';
  impact: 'high' | 'medium' | 'low';
}

export interface KPIMetric {
  value: number | string;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  changePercent?: number;
  changeLabel?: string;
  status: 'good' | 'warning' | 'critical';
  sparkline?: number[];
}

export interface KPIs {
  totalInteractions: KPIMetric;
  completionRate: KPIMetric;
  avgResponseTime: KPIMetric;
  revenue: KPIMetric;
}

export interface Sections {
  whatsapp: WhatsAppSection;
  productivity: ProductivitySection;
  ads: AdsSection;
  email: EmailSection;
}

export interface WhatsAppSection {
  summary: string;
  metrics: {
    totalCustomers: KPIMetric;
    newCustomers: KPIMetric;
    avgResponseTime: KPIMetric;
    conversationVolume: KPIMetric;
    resolutionRate: KPIMetric;
  };
  topConversationTopics: { topic: string; count: number }[];
  peakHours: { hour: number; volume: number }[];
  dailyBreakdown: { day: string; customers: number; messages: number }[];
}

export interface ProductivitySection {
  summary: string;
  metrics: {
    tasksCompleted: KPIMetric;
    tasksLate: KPIMetric;
    completionRate: KPIMetric;
    avgTaskDuration: KPIMetric;
  };
  employeePerformance: {
    name: string;
    tasksCompleted: number;
    tasksLate: number;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  dailyBreakdown: { day: string; completed: number; late: number }[];
}

export interface AdsSection {
  summary: string;
  metrics: {
    totalSpend: KPIMetric;
    totalResults: KPIMetric;
    costPerResult: KPIMetric;
    roas: KPIMetric;
    impressions: KPIMetric;
    clicks: KPIMetric;
    ctr: KPIMetric;
  };
  campaignBreakdown: {
    name: string;
    spend: number;
    results: number;
    cpr: number;
    status: 'active' | 'paused' | 'ended';
  }[];
  dailyBreakdown: { day: string; spend: number; results: number }[];
}

export interface EmailSection {
  summary: string;
  metrics: {
    totalSent: KPIMetric;
    openRate: KPIMetric;
    clickRate: KPIMetric;
    conversionRate: KPIMetric;
    bounceRate: KPIMetric;
    unsubscribeRate: KPIMetric;
  };
  topPerformingEmails: {
    subject: string;
    openRate: number;
    clickRate: number;
    sent: number;
  }[];
  dailyBreakdown: { day: string; sent: number; opens: number; clicks: number }[];
}

export interface FunnelData {
  stages: {
    name: string;
    value: number;
    percentage: number;
    dropoff?: number;
  }[];
  conversionRate: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'anomaly' | 'threshold' | 'trend' | 'prediction';
  title: string;
  description: string;
  affectedMetric: string;
  section: 'whatsapp' | 'productivity' | 'ads' | 'email' | 'general';
  suggestedAction?: string;
  detectedAt: string;
}

export interface ChartDefinition {
  id: string;
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'area' | 'radar';
  title: string;
  section: 'whatsapp' | 'productivity' | 'ads' | 'email' | 'overview';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      fill?: boolean;
    }[];
  };
  options?: {
    stacked?: boolean;
    showLegend?: boolean;
    aspectRatio?: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  employeeName: string;
  score: number;
  tasksCompleted: number;
  trend: 'up' | 'down' | 'stable';
  badge?: 'star' | 'trophy' | 'medal';
}

export interface GoalProgress {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  percentage: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'exceeded';
  deadline?: string;
}

export interface SentimentData {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: 'improving' | 'declining' | 'stable';
  topPositiveTopics: string[];
  topNegativeTopics: string[];
}

export interface HeatmapData {
  title: string;
  type: 'weekly' | 'hourly';
  data: {
    label: string;
    value: number;
    intensity: number;
  }[];
}

export interface Recommendation {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  category: 'immediate' | 'short_term' | 'long_term';
  title: string;
  description: string;
  expectedImpact: string;
  relatedMetrics: string[];
  confidence: number;
}

export interface Prediction {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  predictedDate: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  reasoning: string;
}

// Default goals configuration
export const DEFAULT_GOALS: GoalProgress[] = [
  {
    id: 'whatsapp-customers',
    title: 'عملاء واتساب الأسبوعي',
    target: 100,
    current: 0,
    unit: 'عميل',
    percentage: 0,
    status: 'behind',
  },
  {
    id: 'completion-rate',
    title: 'معدل الإنجاز',
    target: 80,
    current: 0,
    unit: '%',
    percentage: 0,
    status: 'behind',
  },
  {
    id: 'response-time',
    title: 'زمن الرد',
    target: 15,
    current: 0,
    unit: 'دقيقة',
    percentage: 0,
    status: 'behind',
  },
  {
    id: 'email-open-rate',
    title: 'معدل فتح البريد',
    target: 25,
    current: 0,
    unit: '%',
    percentage: 0,
    status: 'behind',
  },
];
