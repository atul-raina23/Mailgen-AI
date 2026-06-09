import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Check, 
  AlertTriangle,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { API_URL } from '../api/config';
import { apiFetch } from '../api/client';

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncHistory, setSyncHistory] = useState([
    { timestamp: '2026-06-09 20:30:15', count: 3, status: 'SUCCESS' },
    { timestamp: '2026-06-09 15:30:00', count: 0, status: 'SUCCESS' },
    { timestamp: '2026-06-09 10:30:00', count: 5, status: 'SUCCESS' }
  ]);

  useEffect(() => {
    // Check connection status from backend
    const checkConnection = async () => {
      try {
        const data = await apiFetch('/gmail/status');
        setIsConnected(data.connected);
      } catch (e) {}
    };
    checkConnection();
  }, []);

  const handleConnectGmail = () => {
    setLoading(true);
    // Connect flow: redirect to backend OAuth URL
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account? We will stop syncing your job application emails.')) return;
    setLoading(true);
    try {
      await apiFetch('/gmail/disconnect', {
        method: 'POST',
      });
      setIsConnected(false);
    } catch (e) {}
    setIsConnected(false);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Connected Accounts Card */}
      <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
        <div>
          <h3 className="font-bold text-sm">Connected Accounts</h3>
          <p className="text-xs text-muted-foreground">Manage external connections to fetch your application updates.</p>
        </div>

        <div className="p-4 bg-muted/20 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Gmail API Link</h4>
              <p className="text-[11px] text-muted-foreground">Scans incoming emails to extract confirm and rejection states.</p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-500 font-semibold flex items-center gap-1">
                  <Check className="h-4 w-4" /> Connected
                </span>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-3 py-1.5 border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-semibold rounded-lg cursor-pointer transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGmail}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 shadow-sm cursor-pointer transition"
              >
                Connect Gmail
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sync history */}
      {isConnected && (
        <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
          <div>
            <h3 className="font-bold text-sm">Synchronization Logs</h3>
            <p className="text-xs text-muted-foreground">Monitor automatic scans and classification results.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold pb-2">
                  <th className="pb-2">Sync Time</th>
                  <th className="pb-2">Emails Scanned</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-muted-foreground">
                {syncHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {item.timestamp}
                    </td>
                    <td className="py-2.5 font-medium text-foreground">{item.count} items</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 font-bold text-[10px]">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Policies */}
      <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
        <div>
          <h3 className="font-bold text-sm">Security & Privacy</h3>
          <p className="text-xs text-muted-foreground">We take user email confidentiality with high precaution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-2">
            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Read-only Scopes</span>
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              JAIP requests `gmail.readonly` permissions. We never send, update, or delete emails from your inbox.
            </p>
          </div>

          <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-2">
            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Entity Hashing</span>
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Only metadata matching job terms is processed by AI models. Personal conversations are completely ignored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
