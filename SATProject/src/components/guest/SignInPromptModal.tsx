import { Modal } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowRight, Cloud, LockKeyhole, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { getSignInPromptCopy, useSignInDestination, type SignInPromptReason } from './signInPromptSupport';

export interface SignInPromptModalProps {
  open: boolean;
  onClose: () => void;
  reason?: SignInPromptReason;
  returnTo?: string;
  title?: string;
  description?: string;
}

export function SignInPromptModal({
  open,
  onClose,
  reason = 'account-required',
  returnTo,
  title,
  description,
}: SignInPromptModalProps) {
  const copy = getSignInPromptCopy(reason);
  const destination = useSignInDestination(returnTo, reason);
  const Icon = reason === 'personalized' ? Sparkles : reason === 'save' ? Cloud : LockKeyhole;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      width={520}
      title={<span className="font-display text-2xl font-semibold text-stone-900">{title || copy.title}</span>}
    >
      <div className="pt-2">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-teal-800/10 text-teal-800"><Icon size={21} /></span>
        <p className="mt-4 text-sm leading-7 text-stone-600">{description || copy.description}</p>
        <p className="mt-3 rounded-xl bg-stone-100/80 px-3 py-2 text-xs leading-5 text-stone-500">
          Signing in returns you to this page. The guest trial stores entitlement status only—not answers or question content.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Not now</Button>
          <Button asChild variant="secondary"><Link to={destination.registerPath} state={destination.state}>Create account</Link></Button>
          <Button asChild><Link to={destination.loginPath} state={destination.state}>Sign in <ArrowRight size={16} /></Link></Button>
        </div>
      </div>
    </Modal>
  );
}
