'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Bot, CheckCircle2, AlertTriangle, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BotStatus {
  authorized: boolean;
  account: string | null;
  expiresAt: string | null;
  scopes: string | null;
  updatedAt: string | null;
  railwayFallback: boolean;
}

interface Note {
  tone: 'success' | 'error';
  text: string;
}

const ERROR_TEXT: Record<string, string> = {
  not_admin: 'Only the owner admin session can authorize the bot. Log in as owner and try again.',
  invalid_state: 'The authorization expired before it finished. Try again.',
  missing_params: 'Kick did not return an authorization code. Try again.',
  token_exchange_failed: 'Kick rejected the authorization code. Try again.',
  profile_fetch_failed: 'Authorized, but the Kick account could not be read. Try again.',
  no_refresh_token: 'Kick did not return a refresh token, so nothing was saved. Try again.',
  db_error: 'Authorized, but the tokens could not be saved. Check the server logs.',
};

const fetcher = async (url: string): Promise<BotStatus> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load bot status');
  return res.json();
};

function formatExpiry(iso: string | null) {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  const stamp = date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return date.getTime() < Date.now() ? `${stamp} (expired, refreshes on next message)` : stamp;
}

export function KickBotStatus() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/kick-bot', fetcher);
  const [note, setNote] = useState<Note | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('kick_bot') === 'success';
    const errorCode = params.get('kick_bot_error');
    if (success) {
      setNote({ tone: 'success', text: `Kick bot authorized as @${params.get('account') ?? 'unknown'}.` });
    } else if (errorCode) {
      setNote({ tone: 'error', text: ERROR_TEXT[errorCode] ?? 'Bot authorization failed. Try again.' });
    }
    if (success || errorCode) {
      window.history.replaceState(null, '', window.location.pathname);
      mutate();
    }
  }, [mutate]);

  const sendTest = async () => {
    setTesting(true);
    setNote(null);
    try {
      const res = await fetch('/api/admin/kick-bot/test', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setNote({ tone: 'success', text: `Test message sent${body.via === 'railway' ? ' through the Railway fallback' : ''}. Check your Kick chat.` });
      } else {
        setNote({ tone: 'error', text: `Test message failed: ${body.error ?? res.status}` });
      }
    } catch {
      setNote({ tone: 'error', text: 'Test message failed: could not reach the server.' });
    } finally {
      setTesting(false);
      mutate();
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-base">Kick Bot</CardTitle>
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : data?.authorized ? (
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Authorized
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Not authorized
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs leading-relaxed">
          The account that posts chat replies. Tokens refresh automatically and are stored server-side only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">Could not load bot status. Reload the page and try again.</p>}

        {data && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Authorized account</dt>
              <dd className="font-medium">{data.account ? `@${data.account}` : 'None yet'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Access token expires</dt>
              <dd className="font-medium">{formatExpiry(data.expiresAt)}</dd>
            </div>
          </dl>
        )}

        {data?.railwayFallback && (
          <p className="text-xs text-muted-foreground">RAILWAY_BOT_URL is set, so the old Railway bot is used if direct sending fails.</p>
        )}

        {note && (
          <p
            role="status"
            className={`rounded-md border px-3 py-2 text-sm ${
              note.tone === 'success' ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-destructive/40 bg-destructive/10 text-destructive'
            }`}
          >
            {note.text}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant={data?.authorized ? 'outline' : 'default'} className="sm:w-auto">
            <a href="/api/auth/kick?mode=bot">{data?.authorized ? 'Re-authorize bot' : 'Authorize bot'}</a>
          </Button>
          <Button variant="secondary" onClick={sendTest} disabled={testing || isLoading} className="gap-2 sm:w-auto">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send test message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
