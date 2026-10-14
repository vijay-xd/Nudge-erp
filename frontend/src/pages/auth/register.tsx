import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  Mail,
  Lock,
  Boxes,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      organizationName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await registerAuth(data);
      toast.success('Organization registered successfully! Welcome to Nudge ERP.');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0d0e12] text-slate-100 font-sans antialiased overflow-hidden">
      {/* LEFT SIDE: Immersive Artwork & Supply Chain Presentation */}
      <div className="relative hidden lg:flex lg:w-7/12 flex-col justify-between p-12 bg-gradient-to-br from-[#111218] via-[#14151e] to-[#0c0d12] border-r border-white/5 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#fd3706]/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

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
            <span>Dedicated Tenant Setup</span>
          </div>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#fd3706] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> High-Density Enterprise Operations
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
              Scale your FMCG distribution network with precision.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Register your organization to unify multi-location inventory, automated supplier replenishment, quick-commerce dark stores, and tax invoicing in one isolated database tenant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Boxes className="h-4 w-4 text-[#fd3706]" /> Multi-Location Inventory
              </div>
              <p className="text-[11px] text-slate-400">
                FEFO batch tracking, bin management, and cross-docking across all your warehouses.
              </p>
            </div>

            <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <ShoppingBag className="h-4 w-4 text-emerald-400" /> Channel Integrations
              </div>
              <p className="text-[11px] text-slate-400">
                Direct automated dispatch sync with Blinkit, Zepto, Swiggy Instamart, and wholesale.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Badges */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Isolated Database Schema
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> GST E-Invoice & E-Way Ready
            </span>
          </div>
          <span>© 2026 Nudge ERP Inc.</span>
        </div>
      </div>

      {/* RIGHT SIDE: Register Form Panel */}
      <div className="flex w-full lg:w-5/12 flex-col justify-center px-6 sm:px-12 xl:px-16 py-12 bg-slate-900 border-l border-white/5 relative">
        <div className="relative z-10 mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight text-white">
              Create organization
            </h2>
            <p className="text-xs text-slate-400">
              Set up your primary administrator account and company workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  {...register('name')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Company / Organization Name
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Sharma FMCG Distributors Pvt. Ltd."
                  {...register('organizationName')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
                />
              </div>
              {errors.organizationName && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.organizationName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Work Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="operations@sharmafmcg.in"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706] transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fd3706] text-white text-xs font-bold shadow-lg shadow-[#fd3706]/20 hover:bg-[#e03004] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Organization...</span>
                </div>
              ) : (
                <>
                  <span>Create Tenant Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an active account?{' '}
            <Link to="/login" className="font-bold text-[#fd3706] hover:underline">
              Sign in to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
