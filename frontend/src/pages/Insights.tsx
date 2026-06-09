import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface InsightCard {
  id: string;
  type: 'tip' | 'alert' | 'suggestion';
  title: string;
  description: string;
  meta?: string;
}

const MOCK_INSIGHTS: InsightCard[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Stripe Follow-up Recommended',
    description: 'It has been 14 days since you completed the Stripe Assessment. Sending a short polite follow-up can signal high interest and push the application forward.',
    meta: 'Completed Assessment: May 21, 2026'
  },
  {
    id: '2',
    type: 'tip',
    title: 'Targeted Resume Tuning',
    description: 'Your application funnel shows high drop-off at the screening stage for "Frontend Developer" roles, but 40% advancement for "Fullstack" positions. Try shifting bullet points to highlight Node/Database skills on your frontend CV.',
    meta: 'AI Profile Match Engine'
  },
  {
    id: '3',
    type: 'suggestion',
    title: 'Interview Preparation Focus',
    description: 'You have a "Technical Round 1" scheduled with Google on June 12. Google frontend interviews highly weigh vanilla JavaScript DOM operations, accessibility (a11y), and CSS layout algorithms alongside standard data structures.',
    meta: 'Next Event: Google Technical Round 1'
  }
];

export default function Insights() {
  const [insights, setInsights] = useState<InsightCard[]>(MOCK_INSIGHTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState<string | null>(null);

  const followUpTemplate = `Subject: Inquiry regarding Software Engineer application - Atul Raina

Hi Recruiter Team,

I hope you're having a great week.

I wanted to follow up on the status of my application for the Software Engineer II position at Stripe. I completed the online coding assessment on May 21 and thoroughly enjoyed the challenges presented.

Please let me know if there are any updates or if I can provide any additional information to support my application.

Best regards,
Atul Raina
atul@example.com`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">AI Career Agent</h1>
            <p className="text-xs text-muted-foreground">Custom-generated analysis based on your synced Gmail content.</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-semibold rounded-lg hover:bg-muted cursor-pointer transition">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Regenerate</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Alerts & Suggestions */}
        <div className="lg:col-span-2 space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className={`p-5 bg-card border rounded-2xl space-y-3 shadow-xs hover:border-primary/30 transition-all ${
                insight.type === 'alert' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  {insight.type === 'alert' && <AlertCircle className="h-4.5 w-4.5 text-amber-500" />}
                  {insight.type === 'tip' && <Sparkles className="h-4.5 w-4.5 text-primary" />}
                  {insight.type === 'suggestion' && <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />}
                  <span>{insight.title}</span>
                </h3>
                {insight.meta && (
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">
                    {insight.meta}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.description}
              </p>

              {insight.type === 'alert' && (
                <div className="pt-2 flex items-center gap-2">
                  <button 
                    onClick={() => setShowTemplate(showTemplate ? null : insight.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer transition"
                  >
                    <span>{showTemplate === insight.id ? 'Hide Template' : 'Generate Email Draft'}</span>
                  </button>
                </div>
              )}

              {/* Collapsed Draft Panel */}
              {insight.type === 'alert' && showTemplate === insight.id && (
                <div className="mt-3 p-4 bg-background border border-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Email Draft</span>
                    <button 
                      onClick={() => handleCopy(followUpTemplate, 'draft')}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'draft' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-green-500 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground bg-muted/20 p-3 rounded-lg overflow-x-auto leading-relaxed border border-border/30">
                    {followUpTemplate}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Career Coach Side Profile */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
          <h3 className="font-bold text-sm">Application Wellness Score</h3>
          
          <div className="flex flex-col items-center justify-center p-6 border border-border/50 bg-muted/20 rounded-xl text-center space-y-2">
            <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center text-lg font-bold text-foreground">
              74%
            </div>
            <h4 className="font-semibold text-xs mt-1 text-foreground">Healthy Pipeline</h4>
            <p className="text-[10px] text-muted-foreground max-w-[180px]">
              You have a good flow of applications, but keep adding more responses and follow up with assessment items.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Active Interviews</span>
              <span className="font-bold text-foreground">1 Pending</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Follow-up reminders</span>
              <span className="font-bold text-amber-500">1 Urgent</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Offers</span>
              <span className="font-bold text-green-500">1 Received</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
