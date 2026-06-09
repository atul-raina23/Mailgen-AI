import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Hourglass, 
  Smile,
  ChevronRight
} from 'lucide-react';

const FUNNEL_DATA = [
  { stage: 'Applied', count: 60, percentage: 100, color: 'bg-blue-500' },
  { stage: 'Assessments', count: 24, percentage: 40, color: 'bg-purple-500' },
  { stage: 'Interviews', count: 12, percentage: 20, color: 'bg-amber-500' },
  { stage: 'Offers', count: 2, percentage: 3.3, color: 'bg-green-500' },
];

const MONTHLY_PERFORMANCE = [
  { month: 'Jan', Applications: 12, Responses: 5 },
  { month: 'Feb', Applications: 18, Responses: 8 },
  { month: 'Mar', Applications: 24, Responses: 12 },
  { month: 'Apr', Applications: 15, Responses: 9 },
  { month: 'May', Applications: 32, Responses: 18 },
  { month: 'Jun', Applications: 45, Responses: 22 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Avg Response Time</p>
            <h3 className="text-xl font-bold text-foreground">4.2 Days</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Top companies reply within 3 days</p>
          </div>
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Offer Conversion Rate</p>
            <h3 className="text-xl font-bold text-green-500">3.3%</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Global benchmark: 2.5%</p>
          </div>
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Interview Progression Rate</p>
            <h3 className="text-xl font-bold text-foreground">50%</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Assessment to Interview round</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Progress */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-6 lg:col-span-1">
          <div>
            <h3 className="text-sm font-bold">Application Funnel</h3>
            <p className="text-xs text-muted-foreground">Progression across interview stages</p>
          </div>

          <div className="space-y-4">
            {FUNNEL_DATA.map((item, index) => (
              <div key={item.stage} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">{item.stage}</span>
                  <span className="text-muted-foreground">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-xl">
            <h4 className="text-xs font-bold mb-1 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Funnel Efficiency</span>
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your highest drop-off rate occurs from **Applied** to **Assessment** (60%). Consider refining your resume tags.
            </p>
          </div>
        </div>

        {/* performance monthly charts */}
        <div className="p-5 bg-card border border-border rounded-2xl lg:col-span-2 h-[380px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold">Monthly Progression</h3>
            <p className="text-xs text-muted-foreground">Applications submitted vs Recruiter replies</p>
          </div>

          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MONTHLY_PERFORMANCE} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                <Line type="monotone" dataKey="Responses" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
