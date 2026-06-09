import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  ArrowUpRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_APPLICATIONS = [
  { id: '1', companyName: 'Google', role: 'Frontend Engineer', source: 'LinkedIn', status: 'INTERVIEWING', appliedDate: '2026-06-05' },
  { id: '2', companyName: 'Vercel', role: 'Developer Advocate', source: 'Referral', status: 'OFFERED', appliedDate: '2026-06-01' },
  { id: '3', companyName: 'Linear', role: 'Product Designer', source: 'Wellfound', status: 'REJECTED', appliedDate: '2026-05-25' },
  { id: '4', companyName: 'Stripe', role: 'Software Engineer II', source: 'LinkedIn', status: 'ASSESSMENT', appliedDate: '2026-05-20' },
  { id: '5', companyName: 'Nvidia', role: 'AI Researcher', source: 'Company Portal', status: 'APPLIED', appliedDate: '2026-06-08' },
];

const MOCK_TREND = [
  { name: 'Jan', count: 12 },
  { name: 'Feb', count: 18 },
  { name: 'Mar', count: 24 },
  { name: 'Apr', count: 15 },
  { name: 'May', count: 32 },
  { name: 'Jun', count: 45 },
];

const MOCK_SOURCES = [
  { name: 'LinkedIn', value: 25 },
  { name: 'Wellfound', value: 12 },
  { name: 'Referral', value: 8 },
  { name: 'Company Portal', value: 15 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

import { API_URL } from '../api/config';

export default function Dashboard() {
  const [apps, setApps] = useState(MOCK_APPLICATIONS);
  const [stats, setStats] = useState({
    total: 60,
    responses: 35,
    interviews: 6,
    offers: 1,
    rejections: 14,
    pending: 25,
  });

  useEffect(() => {
    // Fetch live apps if available
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/applications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setApps(data.slice(0, 5));
            // Recalculate stats from live data
            const total = data.length;
            const interviews = data.filter((a: any) => a.status === 'INTERVIEWING').length;
            const offers = data.filter((a: any) => a.status === 'OFFERED').length;
            const rejections = data.filter((a: any) => a.status === 'REJECTED').length;
            const pending = data.filter((a: any) => a.status === 'APPLIED').length;
            const assessment = data.filter((a: any) => a.status === 'ASSESSMENT').length;
            setStats({
              total,
              responses: interviews + offers + rejections + assessment,
              interviews,
              offers,
              rejections,
              pending
            });
          }
        }
      } catch (err) {
        console.log('Using mock data for preview');
      }
    };
    fetchData();
  }, []);

  const responseRate = stats.total > 0 ? Math.round((stats.responses / stats.total) * 100) : 0;
  const interviewRate = stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, Atul</h1>
          <p className="text-sm text-muted-foreground">Here is the status of your applications and Gmail sync updates.</p>
        </div>
        <Link 
          to="/applications?new=true"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 shadow-md shadow-primary/10 transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Application</span>
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Applied</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span> from last month
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interviews</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mt-2">{stats.interviews}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{interviewRate}%</span> average conversion rate
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offers Received</span>
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mt-2 text-green-500">{stats.offers}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Keep it up! Hard work pays off.
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response Rate</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mt-2">{responseRate}%</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{stats.responses}</span> positive responses total
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card flex flex-col justify-between h-[320px]">
          <div>
            <h3 className="text-sm font-bold">Application Trend</h3>
            <p className="text-xs text-muted-foreground">Applications submitted per month</p>
          </div>
          <div className="h-[220px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TREND} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Pie Chart */}
        <div className="p-5 rounded-2xl border border-border bg-card flex flex-col justify-between h-[320px]">
          <div>
            <h3 className="text-sm font-bold">Platform Distribution</h3>
            <p className="text-xs text-muted-foreground">Where you apply the most</p>
          </div>
          <div className="h-[180px] w-full flex items-center justify-center mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_SOURCES}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {MOCK_SOURCES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {MOCK_SOURCES.map((source, i) => (
              <div key={source.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="truncate text-muted-foreground">{source.name} ({source.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Applications */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold">Recent Applications</h3>
            <p className="text-xs text-muted-foreground">Your last 5 job submissions</p>
          </div>
          <Link to="/applications" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            <span>View All</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <th className="pb-3">Company</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Applied Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-semibold">{app.companyName}</td>
                  <td className="py-3 text-muted-foreground">{app.role}</td>
                  <td className="py-3 text-xs">
                    <span className="px-2 py-1 rounded-md bg-muted font-medium text-foreground">
                      {app.source}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{app.appliedDate}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      app.status === 'OFFERED' ? 'bg-green-500/10 text-green-500' :
                      app.status === 'INTERVIEWING' ? 'bg-amber-500/10 text-amber-500' :
                      app.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                      app.status === 'ASSESSMENT' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
