import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  Boxes,
  Truck,
  TrendingUp,
  ShoppingBag,
  Building2,
  CheckCircle2,
  Layers,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@nudge-demo.com',
      password: 'NudgeDemo2024!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillRole = (email: string) => {
    setValue('email', email);
    setValue('password', 'NudgeDemo2024!');
    toast.info(`Filled credentials for ${email}`);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0d0e12] text-slate-100 font-sans antialiased overflow-hidden">
      {/* LEFT SIDE: Immersive Artwork, Operational Vectors & Telemetry Showcase */}
      <div className="relative hidden lg:flex lg:w-7/12 flex-col justify-between p-12 bg-gradient-to-br from-[#111218] via-[#14151e] to-[#0c0d12] border-r border-white/5 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#fd3706]/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />

        {/* Subtle Architectural Dot Matrix Overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Header / Brand */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fd3706] text-white font-black shadow-lg shadow-[#fd3706]/30 text-lg">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">NUDGE</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 tracking-wider">
                  ERP 2.4
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">FMCG Distribution Network</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Tenant Operations Live</span>
          </div>
        </div>

        {/* Center Presentation: Vector Supply Chain Artwork */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#fd3706] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> High-Velocity Commerce Platform
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              One source of truth for FMCG brands & quick-commerce.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automate multi-channel purchase orders, warehouse FEFO stock allocation, dispatches, and GST invoicing for general trade and rapid 10-minute channels.
            </p>
          </div>

          {/* Interactive Floating Glass Vector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Vector Card 1: Channel Ingestion */}
            <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/20 text-[#fd3706] flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Quick-Commerce Sync</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  78% Vol
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
                <span>Blinkit • Zepto • Swiggy</span>
                <span className="font-semibold text-white">18m Turn</span>
              </div>

              <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div style={{ width: '34%' }} className="bg-[#fd3706]" title="Blinkit 34%" />
                <div style={{ width: '28%' }} className="bg-indigo-500 ml-0.5" title="Zepto 28%" />
                <div style={{ width: '22%' }} className="bg-amber-400 ml-0.5" title="Swiggy 22%" />
                <div style={{ width: '16%' }} className="bg-slate-400 ml-0.5" title="Direct 16%" />
              </div>
            </div>

            {/* Vector Card 2: Fill Rate & FEFO Telemetry */}
            <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Warehouse Telemetry</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  98.4% SLA
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
                <span>2 DCs: Bhiwandi & Sonipat</span>
                <span className="font-semibold text-emerald-400">100% FEFO</span>
              </div>

              {/* Mini Sparkline Vector SVG */}
              <div className="mt-2 h-3 w-full">
                <svg className="w-full h-full" viewBox="0 0 160 20" fill="none">
                  <path
                    d="M0,15 Q30,5 60,12 T120,4 T160,10"
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Connected FMCG Partners Banner */}
          <div className="pt-2 flex items-center gap-6 text-xs text-slate-400 border-t border-white/5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Trusted Suppliers:
            </span>
            <span className="text-slate-300 font-semibold tracking-wide">Britannia</span>
            <span className="text-slate-300 font-semibold tracking-wide">Nestle</span>
            <span className="text-slate-300 font-semibold tracking-wide">Parle</span>
            <span className="text-slate-300 font-semibold tracking-wide">ITC</span>
            <span className="text-slate-300 font-semibold tracking-wide">Amul</span>
          </div>
        </div>

        {/* Bottom Security / Trust Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> GST 3B & E-Way Ready
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Multi-Tenant Isolation
            </span>
          </div>
          <span>© 2026 Nudge ERP Inc.</span>
        </div>
      </div>

      {/* RIGHT SIDE: Classic, Professional Authentication Panel */}
      <div className="flex w-full lg:w-5/12 flex-col justify-center px-6 sm:px-12 xl:px-16 py-12 bg-slate-900 border-l border-white/5 relative">
        {/* Subtle background ambient highlight */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#fd3706]/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-sm space-y-6">
          {/* Mobile Logo (shown only on small screens) */}
          <div className="flex lg:hidden items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fd3706] text-white font-black text-base shadow-md shadow-[#fd3706]/30">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">NUDGE ERP</span>
              <span className="text-[10px] text-slate-400 font-mono">FMCG Operations</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Welcome back
            </h2>
            <p className="text-xs text-slate-400">
              Enter your credentials to access your tenant operations console.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Work Email</span>
                <span className="text-[10px] text-slate-400">Sharma FMCG Tenant</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="admin@nudge-demo.com"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <a href="#forgot" className="text-[11px] font-semibold text-[#fd3706] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-[#fd3706] focus:ring-[#fd3706] focus:ring-offset-slate-900"
                />
                <span>Remember this terminal</span>
              </label>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fd3706] text-white text-xs font-bold shadow-lg shadow-[#fd3706]/20 hover:bg-[#e03004] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Persona Switcher (Professional Feature) */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              1-Click Demo Personas (Click to Load)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillRole('admin@nudge-demo.com')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="h-6 w-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                  AD
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-[#fd3706] transition-colors">Admin</div>
                  <div className="text-[9px] text-slate-400 truncate">All Access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillRole('sales@nudge-demo.com')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="h-6 w-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  SL
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-[#fd3706] transition-colors">Sales Rep</div>
                  <div className="text-[9px] text-slate-400 truncate">Orders & QC</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillRole('warehouse@nudge-demo.com')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="h-6 w-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  WH
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-[#fd3706] transition-colors">Warehouse</div>
                  <div className="text-[9px] text-slate-400 truncate">FEFO Batches</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillRole('finance@nudge-demo.com')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left text-xs transition-colors cursor-pointer group"
              >
                <div className="h-6 w-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">
                  FN
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-[#fd3706] transition-colors">Finance</div>
                  <div className="text-[9px] text-slate-400 truncate">GST & Invoicing</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Need a dedicated organization?{' '}
            <Link to="/register" className="font-bold text-[#fd3706] hover:underline">
              Register new tenant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
