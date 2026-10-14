import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Truck,
  Percent,
  Search,
  ExternalLink,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  Database,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiService, CompanyContext, AiQueryResult, SuggestedFaq } from '@/services/ai.service';
import { MarkdownViewer } from '@/components/ai/markdown-viewer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text?: string;
  result?: AiQueryResult;
}

export default function AiSearchPage() {
  const [context, setContext] = useState<CompanyContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [queryInput, setQueryInput] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load company context on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingContext(true);
        const data = await aiService.getCompanyContext();
        setContext(data);
      } catch (err: any) {
        toast.error('Could not load company context: ' + (err.message || 'Error'));
      } finally {
        setLoadingContext(false);
      }
    }
    loadData();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isQuerying]);

  const handleAskQuestion = async (promptText: string) => {
    if (!promptText.trim() || isQuerying) return;

    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'assistant-' + Date.now();

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      {
        id: userMsgId,
        sender: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setChatHistory(newHistory);
    setQueryInput('');
    setIsQuerying(true);

    try {
      const response = await aiService.query(promptText);
      setChatHistory([
        ...newHistory,
        {
          id: assistantMsgId,
          sender: 'assistant',
          result: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      toast.error('Failed to get answer: ' + (err.message || 'Server error'));
      setChatHistory([
        ...newHistory,
        {
          id: assistantMsgId,
          sender: 'assistant',
          result: {
            query: promptText,
            intent: 'ERROR',
            title: 'Telemetry Query Incomplete',
            summary: 'Could not process query against live database. Please check connection and try again.',
            detailsMarkdown: `⚠️ Error details: \`${err.message || 'Network error'}\``,
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied summary to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    toast.info('Chat history cleared');
  };

  const getFaqIcon = (category: string) => {
    switch (category) {
      case 'Organization Profile':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'Finance & Revenue':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'Inventory & Supply':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'Quick Commerce':
        return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      case 'Procurement':
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'Profitability':
        return <Percent className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" /> Live ERP Grounded
              </span>
              <span className="text-xs text-slate-400 font-mono">
                v1.2 AI Telemetry Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
              Company Intelligence & AI Copilot
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ask natural language questions about {context?.organization.name || 'Sharma FMCG Distributors'}.
              All responses are synthesized directly from your live database, GSTIN, warehouse stock, quick-commerce orders, and invoices.
            </p>
          </div>

          {context && (
            <div className="flex flex-wrap md:flex-col gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Legal Entity:</span>
                <span className="font-semibold text-slate-100">{context.organization.legalName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">GSTIN:</span>
                <span className="font-mono text-emerald-400 font-semibold">{context.organization.gstin}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Primary Hub:</span>
                <span className="text-slate-200">{context.organization.warehouses[0]?.name || 'Bhiwandi DC'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested FAQ Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-indigo-500" />
            Frequently Asked Operations Questions (Click to Ask)
          </h2>
          {chatHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear History
            </button>
          )}
        </div>

        {loadingContext ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(context?.suggestedFaqs || []).map((faq: SuggestedFaq) => (
              <button
                key={faq.id}
                onClick={() => handleAskQuestion(faq.question)}
                disabled={isQuerying}
                className="group text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {getFaqIcon(faq.category)}
                      {faq.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {faq.question}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 line-clamp-1">
                  {faq.shortDesc}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Messages Stream */}
      <div className="space-y-4 min-h-[240px]">
        {chatHistory.length === 0 && !isQuerying && (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Ready to search company operational telemetry
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Click any of the suggested prompt cards above, or type your own question below to query company financials, inventory, quick-commerce stats, or suppliers.
              </p>
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } space-y-1.5`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <User className="w-3 h-3" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Bot className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Nudge AI Grounded Assistant</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Content Body */}
            {msg.sender === 'user' ? (
              <div className="max-w-2xl px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-medium shadow-sm">
                {msg.text}
              </div>
            ) : (
              <div className="w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
                {/* Header & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                      {msg.result?.intent || 'RESPONSE'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {msg.result?.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(msg.result?.summary || '', msg.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Summary Callout */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {msg.result?.summary}
                </div>

                {/* Key Metrics Grid */}
                {msg.result?.keyMetrics && msg.result.keyMetrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {msg.result.keyMetrics.map((km, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {km.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {km.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Markdown Details (Tables, Lists, Breakdowns) */}
                {msg.result?.detailsMarkdown && (
                  <div className="pt-2">
                    <MarkdownViewer content={msg.result.detailsMarkdown} />
                  </div>
                )}

                {/* Direct Action Link to ERP Module */}
                {msg.result?.actionLink && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Link
                      to={msg.result.actionLink.path}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      <span>{msg.result.actionLink.label}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isQuerying && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Querying Sharma FMCG live database telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Prompt Input Bar */}
      <div className="sticky bottom-4 z-20 mt-auto pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(queryInput);
          }}
          className="relative flex items-center shadow-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <div className="pl-2 pr-1 text-slate-400">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={isQuerying}
            placeholder="Ask anything about our company (e.g. 'What is our GSTIN?', 'Which products have low stock?', 'Show recognized revenue')..."
            className="w-full bg-transparent px-3 py-2 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 pr-1">
            <button
              type="submit"
              disabled={!queryInput.trim() || isQuerying}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors shadow-sm"
            >
              {isQuerying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Ask AI</span>
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
