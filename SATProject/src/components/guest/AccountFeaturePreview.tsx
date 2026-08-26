import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  BookMarked,
  Brain,
  Check,
  Languages,
  LockKeyhole,
  LogIn,
  NotebookTabs,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { buildAuthPath, currentReturnPath, isSignedIn } from '../../services/guestTrialService';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export type AccountFeatureKey =
  | 'dashboard'
  | 'review'
  | 'mistakes'
  | 'favorite-words'
  | 'favorite-questions';

interface FeaturePreviewCopy {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  accountReason: string;
  highlights: [string, string, string];
  practicePath: string;
  practiceLabel: string;
}

const featureCopy: Record<AccountFeatureKey, FeaturePreviewCopy> = {
  dashboard: {
    icon: BarChart3,
    kicker: 'Progress studio',
    title: 'See the story behind your practice.',
    description: 'The dashboard connects accuracy, activity and skill patterns so your next study block has a clear purpose.',
    accountReason: 'Progress only becomes meaningful across sessions, so this view needs an account-linked answer history.',
    highlights: ['Accuracy and activity trends', 'Domain-level strengths and gaps', 'A clearer next study move'],
    practicePath: '/sat-practice',
    practiceLabel: 'Try guest practice',
  },
  review: {
    icon: Brain,
    kicker: 'Memory review',
    title: 'Return before the lesson fades.',
    description: 'Memory Review brings questions back at expanding intervals, helping corrected mistakes stay corrected.',
    accountReason: 'Every review date is personal and depends on saved answers over time, so the schedule belongs to your account.',
    highlights: ['A personal due-now queue', 'Expanding review intervals', 'Recall evidence that updates the plan'],
    practicePath: '/sat-practice',
    practiceLabel: 'Try guest practice',
  },
  mistakes: {
    icon: NotebookTabs,
    kicker: 'Mistake lab',
    title: 'Turn each miss into a repair plan.',
    description: 'Mistake Lab groups recurring patterns, keeps your reflections together and turns them into specific follow-up work.',
    accountReason: 'This workspace is built from your saved attempts and reflections, which are never stored for a guest session.',
    highlights: ['Pattern and cause analysis', 'Private answer reflections', 'Focused repair actions'],
    practicePath: '/sat-practice',
    practiceLabel: 'Try guest practice',
  },
  'favorite-words': {
    icon: Languages,
    kicker: 'Vocabulary collection',
    title: 'Build a vocabulary shelf that stays with you.',
    description: 'Save unfamiliar words from study sessions, then return to definitions and examples when you are ready to review.',
    accountReason: 'Saved words are a personal collection, so an account is required to keep them available across devices and sessions.',
    highlights: ['One place for saved words', 'Definitions ready for review', 'A collection that travels with you'],
    practicePath: '/dictionary',
    practiceLabel: 'Explore the dictionary',
  },
  'favorite-questions': {
    icon: BookMarked,
    kicker: 'Question collection',
    title: 'Keep the questions worth revisiting.',
    description: 'Bookmark useful questions and return to their reasoning without trying to remember where you found them.',
    accountReason: 'Bookmarks must be saved to a personal collection; guest answers and question activity are intentionally not stored.',
    highlights: ['A focused question shortlist', 'Reasoning worth reviewing', 'Bookmarks available after you return'],
    practicePath: '/sat-practice',
    practiceLabel: 'Try guest practice',
  },
};

interface AccountFeatureRouteProps extends PropsWithChildren {
  feature: AccountFeatureKey;
}

/**
 * Keeps saved-data workspaces visible to guests without pretending they can work
 * without persistent account history. Public study tools remain one click away.
 */
export function AccountFeatureRoute({ feature, children }: AccountFeatureRouteProps) {
  if (isSignedIn()) return <>{children}</>;
  return <AccountFeaturePreview feature={feature} />;
}

interface AccountFeaturePreviewProps {
  feature: AccountFeatureKey;
}

export function AccountFeaturePreview({ feature }: AccountFeaturePreviewProps) {
  const copy = featureCopy[feature];
  const Icon = copy.icon;
  const returnTo = currentReturnPath('/home');
  const loginPath = buildAuthPath(returnTo, 'login');
  const registerPath = buildAuthPath(returnTo, 'register');

  return (
    <section className="page-shell pb-12" aria-labelledby={`${feature}-preview-title`}>
      <div className="relative overflow-hidden rounded-[2rem] bg-[#123d3a] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
        <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full border-[42px] border-white/5" />
        <div aria-hidden="true" className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-[#e07a5f]/15 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#e6d8bb]">
              <Sparkles aria-hidden="true" size={13} /> {copy.kicker} preview
            </div>
            <span className="mt-8 grid size-14 place-items-center rounded-2xl bg-[#e07a5f] text-white shadow-lg shadow-black/10">
              <Icon aria-hidden="true" size={25} />
            </span>
            <h1 id={`${feature}-preview-title`} className="mt-7 max-w-3xl font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-teal-50/70 sm:text-base">{copy.description}</p>
          </div>

          <Card className="border-white/10 bg-white/[.07] p-6 text-white shadow-none backdrop-blur-sm sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6d8bb] text-[#123d3a]">
                <LockKeyhole aria-hidden="true" size={18} />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#e6d8bb]">Account-backed workspace</p>
                <p className="mt-2 text-sm leading-6 text-teal-50/65">{copy.accountReason}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
              {copy.highlights.map(highlight => (
                <div key={highlight} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[#f1b49f]">
                    <Check aria-hidden="true" size={13} strokeWidth={3} />
                  </span>
                  {highlight}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#d7e7e3] text-teal-900">
              <ShieldCheck aria-hidden="true" size={21} />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-teal-800">Why sign in?</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900">Keep your study record private and continuous.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                Guest practice is available without an account, but it does not save answers, notes, schedules or collections. Sign in when you want this feature to remember your work.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={loginPath}>Sign in <LogIn aria-hidden="true" size={16} /></Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to={registerPath}>Create account <UserPlus aria-hidden="true" size={16} /></Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-[#e6d8bb]/35 p-6 sm:p-8">
          <div>
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e07a5f] text-white">
              <PlayCircle aria-hidden="true" size={21} />
            </span>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.15em] text-stone-500">No account yet?</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900">You can still study now.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">Open a public study tool and use your one-time guest set. Nothing from the set will be saved.</p>
          </div>
          <Link to={copy.practicePath} className="mt-7 inline-flex w-fit items-center gap-1.5 text-sm font-extrabold text-teal-800 hover:text-teal-950">
            {copy.practiceLabel} <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </Card>
      </div>
    </section>
  );
}
