import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import Brand from '../components/Brand';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => setIsLogin(searchParams.get('mode') !== 'register'), [searchParams]);

  const setMode = (login: boolean) => {
    setIsLogin(login);
    navigate(`/auth?mode=${login ? 'login' : 'register'}`);
  };

  return (
    <div className="auth-canvas relative min-h-screen overflow-hidden bg-[#173c39] px-3 py-4 sm:px-8 sm:py-6">
      <div className="absolute -left-40 -top-40 size-[34rem] rounded-full border-[5rem] border-white/[.035]" />
      <div className="absolute -bottom-52 right-[-8rem] size-[38rem] rounded-full bg-[#e96b4d]/15 blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
        <motion.section initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden px-8 text-white lg:block xl:px-16">
          <div className="flex items-center gap-3">
            <Brand inverse />
          </div>
          <div className="mt-24 max-w-xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#f1b49f]"><Sparkles size={14} /> Built for focused progress</p>
            <h1 className="mt-5 font-display text-6xl font-medium leading-[.98] tracking-[-.045em]">Your preparation,<br /><em className="font-light text-[#f1b49f]">finally in focus.</em></h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-teal-50/60">Move from practice to insight without losing your place. Every answer, saved word and domain score stays connected.</p>
            <div className="mt-10 space-y-4">
              {['Synced practice across both question modes', 'Account-specific progress and saved items', 'Clear feedback after every submitted answer'].map(item => (
                <p key={item} className="flex items-center gap-3 text-sm font-semibold text-teal-50/78"><CheckCircle2 className="text-[#f1b49f]" size={18} />{item}</p>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section key={isLogin ? 'login' : 'register'} initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .38 }} className="flex items-center justify-center">
          <div className="w-full max-w-[540px]">
            <div className="mb-6 flex justify-center lg:hidden"><Brand inverse /></div>
            {isLogin ? (
              <LoginForm onSuccess={() => navigate('/home')} onSwitchToRegister={() => setMode(false)} />
            ) : (
              <RegisterForm onSuccess={() => navigate('/home')} onSwitchToLogin={() => setMode(true)} />
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
