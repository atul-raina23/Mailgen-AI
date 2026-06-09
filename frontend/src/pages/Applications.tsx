import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MapPin, 
  DollarSign, 
  ChevronRight, 
  X, 
  Mail, 
  Clock, 
  Trash2,
  Edit3,
  FileText
} from 'lucide-react';
import { apiFetch } from '../api/client';

interface Application {
  id: string;
  companyName: string;
  role: string;
  source: string;
  status: string;
  appliedDate: string;
  notes?: string;
  emails?: Email[];
  interviews?: Interview[];
  offers?: Offer[];
}

interface Email {
  id: string;
  subject: string;
  sender: string;
  classification: string;
  confidence: number;
  receivedAt: string;
}

interface Interview {
  id: string;
  interviewDate: string;
  round: string;
  meetingLink?: string;
}

interface Offer {
  id: string;
  ctc?: string;
  location?: string;
}

const INITIAL_APPS: Application[] = [
  {
    id: '1',
    companyName: 'Google',
    role: 'Frontend Engineer',
    source: 'LinkedIn',
    status: 'INTERVIEWING',
    appliedDate: '2026-06-05',
    notes: 'Had a call with recruiter. Prepared on React fundamentals and DS/Algo.',
    interviews: [
      { id: '101', interviewDate: '2026-06-12T15:00:00.000Z', round: 'Technical Round 1', meetingLink: 'https://meet.google.com/abc-defg-hij' }
    ],
    emails: [
      { id: '201', subject: 'Interview scheduled: Google & Atul Raina', sender: 'recruiter@google.com', classification: 'INTERVIEWING', confidence: 0.98, receivedAt: '2026-06-06T10:15:00.000Z' },
      { id: '202', subject: 'Application Received: Frontend Engineer', sender: 'no-reply@google.com', classification: 'APPLIED', confidence: 0.99, receivedAt: '2026-06-05T09:00:00.000Z' }
    ]
  },
  {
    id: '2',
    companyName: 'Vercel',
    role: 'Developer Advocate',
    source: 'Referral',
    status: 'OFFERED',
    appliedDate: '2026-06-01',
    notes: 'Referral through Sarah. Exciting opportunity!',
    offers: [
      { id: '301', ctc: '$150,000 / year', location: 'Remote (US/Global)' }
    ],
    emails: [
      { id: '203', subject: 'Job Offer: Developer Advocate at Vercel', sender: 'careers@vercel.com', classification: 'OFFERED', confidence: 0.97, receivedAt: '2026-06-08T18:30:00.000Z' }
    ]
  },
  {
    id: '3',
    companyName: 'Linear',
    role: 'Product Designer',
    source: 'Wellfound',
    status: 'REJECTED',
    appliedDate: '2026-05-25',
    notes: 'Standard automated rejection email. Resume might need tweaking for design roles.',
    emails: [
      { id: '204', subject: 'Update on your application: Product Designer', sender: 'jobs@linear.app', classification: 'REJECTED', confidence: 0.95, receivedAt: '2026-05-28T14:20:00.000Z' }
    ]
  },
  {
    id: '4',
    companyName: 'Stripe',
    role: 'Software Engineer II',
    source: 'LinkedIn',
    status: 'ASSESSMENT',
    appliedDate: '2026-05-20',
    notes: 'Received an online coding test on HackerRank. Need to complete by next Friday.',
    emails: [
      { id: '205', subject: 'Stripe Engineering Online Assessment', sender: 'stripe@hackerrank.com', classification: 'ASSESSMENT', confidence: 0.99, receivedAt: '2026-05-21T08:00:00.000Z' }
    ]
  },
  {
    id: '5',
    companyName: 'Nvidia',
    role: 'AI Researcher',
    source: 'Company Portal',
    status: 'APPLIED',
    appliedDate: '2026-06-08',
    notes: 'Applied through internal career page. Hopeful for AI focus.'
  }
];

export default function Applications() {
  const [apps, setApps] = useState<Application[]>(INITIAL_APPS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newSource, setNewSource] = useState('LinkedIn');
  const [newStatus, setNewStatus] = useState('APPLIED');
  const [newAppliedDate, setNewAppliedDate] = useState(new Date().toISOString().substring(0, 10));
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    // Check if URL has ?new=true query param to open form
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setIsAdding(true);
    }
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const data = await apiFetch('/applications');
      if (data && data.length > 0) {
        setApps(data);
      }
    } catch (e) {
      console.log('Failed fetching live applications, fallback to mock data');
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole) return;

    const newAppObj = {
      companyName: newCompany,
      role: newRole,
      source: newSource,
      status: newStatus,
      appliedDate: newAppliedDate,
      notes: newNotes
    };

    try {
      const created = await apiFetch('/applications', {
        method: 'POST',
        bodyData: newAppObj
      });
      setApps([created, ...apps]);
    } catch (err) {
      // Fallback local mock insertion if offline
      setApps([{ id: String(Date.now()), ...newAppObj }, ...apps]);
    }

    // Reset
    setIsAdding(false);
    setNewCompany('');
    setNewRole('');
    setNewSource('LinkedIn');
    setNewStatus('APPLIED');
    setNewNotes('');
  };

  const handleUpdateStatus = async (appId: string, newStatusVal: string) => {
    try {
      const updated = await apiFetch(`/applications/${appId}`, {
        method: 'PATCH',
        bodyData: { status: newStatusVal }
      });
      setApps(apps.map(a => a.id === appId ? { ...a, status: updated.status } : a));
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...selectedApp, status: updated.status });
      }
    } catch (err) {
      // Fallback local update
      setApps(apps.map(a => a.id === appId ? { ...a, status: newStatusVal } : a));
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatusVal });
      }
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await apiFetch(`/applications/${appId}`, {
        method: 'DELETE',
      });
    } catch (err) {}
    setApps(apps.filter(a => a.id !== appId));
    setSelectedApp(null);
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = 
      app.companyName.toLowerCase().includes(search.toLowerCase()) || 
      app.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="relative h-full flex flex-col gap-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-1 w-full gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies or roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="relative w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="INTERVIEWING">Interviewing</option>
              <option value="OFFERED">Offered</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm cursor-pointer transition-all duration-200"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Applications List */}
        <div className={`lg:col-span-2 space-y-3 ${selectedApp ? 'hidden lg:block' : 'block'}`}>
          {filteredApps.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground text-sm">No applications found matching the search criteria.</p>
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-4 bg-card border rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all duration-200 ${
                  selectedApp?.id === app.id ? 'border-primary shadow-xs bg-muted/20' : 'border-border'
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground">
                    {app.companyName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight text-foreground">{app.companyName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.role}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="bg-muted px-1.5 py-0.5 rounded-md font-medium text-[10px] text-foreground">{app.source}</span>
                      <span>•</span>
                      <span>Applied {app.appliedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    app.status === 'OFFERED' ? 'bg-green-500/10 text-green-500' :
                    app.status === 'INTERVIEWING' ? 'bg-amber-500/10 text-amber-500' :
                    app.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                    app.status === 'ASSESSMENT' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {app.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Application Sidebar Panel */}
        {selectedApp && (
          <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 space-y-6 shadow-sm sticky top-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground">
                  {selectedApp.companyName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">{selectedApp.companyName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedApp.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(selectedApp.id)}
                  className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Delete Application"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground cursor-pointer lg:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground cursor-pointer hidden lg:block"
                  title="Close panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Update Status</label>
              <select
                value={selectedApp.status}
                onChange={(e) => handleUpdateStatus(selectedApp.id, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="APPLIED">Applied</option>
                <option value="ASSESSMENT">Assessment</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="OFFERED">Offered</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Dates & Source */}
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-border/50 py-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Applied Date</p>
                <p className="font-medium mt-1 flex items-center gap-1.5 text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedApp.appliedDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Job Source</p>
                <p className="font-medium mt-1 text-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded-md text-xs font-medium">
                    {selectedApp.source}
                  </span>
                </p>
              </div>
            </div>

            {/* Offers Column if offered */}
            {selectedApp.offers && selectedApp.offers.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Offer Details</h4>
                {selectedApp.offers.map((o) => (
                  <div key={o.id} className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl space-y-1.5">
                    <p className="text-xs flex items-center gap-1.5 font-semibold text-green-500">
                      <DollarSign className="h-3.5 w-3.5" />
                      CTC: {o.ctc || 'N/A'}
                    </p>
                    <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Location: {o.location || 'Remote'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Interviews details */}
            {selectedApp.interviews && selectedApp.interviews.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Scheduled Interviews</h4>
                {selectedApp.interviews.map((int) => (
                  <div key={int.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                    <p className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {int.round}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Date: {new Date(int.interviewDate).toLocaleString()}
                    </p>
                    {int.meetingLink && (
                      <a 
                        href={int.meetingLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-primary font-semibold hover:underline block truncate mt-1"
                      >
                        Join Meeting Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Personal Notes</span>
              </h4>
              <textarea
                value={selectedApp.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedApp({ ...selectedApp, notes: val });
                  setApps(apps.map(a => a.id === selectedApp.id ? { ...a, notes: val } : a));
                }}
                placeholder="Add notes about interviews, company contacts..."
                className="w-full text-xs bg-background border border-border rounded-xl p-3 h-24 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Related Emails */}
            <div className="space-y-3 border-t border-border/50 pt-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>Synced Emails ({selectedApp.emails?.length || 0})</span>
              </h4>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {selectedApp.emails && selectedApp.emails.length > 0 ? (
                  selectedApp.emails.map((e) => (
                    <div key={e.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1 text-[11px]">
                      <div className="flex justify-between font-semibold">
                        <span className="truncate max-w-[150px] text-foreground">{e.subject}</span>
                        <span className={`px-1.5 rounded-md text-[9px] font-bold ${
                          e.classification === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                          e.classification === 'OFFERED' ? 'bg-green-500/10 text-green-500' :
                          e.classification === 'INTERVIEWING' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {e.classification}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>From: {e.sender}</span>
                        <span>Conf: {Math.round(e.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">No Gmail threads matched yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Application Dialog Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 relative shadow-lg">
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h3 className="font-bold text-lg mb-4 text-foreground">Add New Job Application</h3>

            <form onSubmit={handleAddApplication} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Role / Position *</label>
                <input
                  type="text"
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Fullstack Engineer"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Wellfound">Wellfound</option>
                    <option value="Naukri">Naukri</option>
                    <option value="Referral">Referral</option>
                    <option value="Company Portal">Company Portal</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="ASSESSMENT">Assessment</option>
                    <option value="INTERVIEWING">Interviewing</option>
                    <option value="OFFERED">Offered</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Applied Date</label>
                <input
                  type="date"
                  value={newAppliedDate}
                  onChange={(e) => setNewAppliedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional context, links, contacts..."
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-muted-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-sm cursor-pointer"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
