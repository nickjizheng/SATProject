import { useEffect, useState } from 'react';
import { SatService } from '../services/satService';
import TrademarkNotice from '../components/TrademarkNotice';
import { Card } from '../components/ui/card';
import type { SatBankSummary } from '../types/sat';

export interface ResourcesPageProps {
  bankSummary?: SatBankSummary | null;
  showEnrichment?: boolean;
}

type SummaryStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

type ExternalLink = {
  label: string;
  href: string;
};

type Resource = {
  index: string;
  title: string;
  category: string;
  description: string;
  useWhen: string;
  links: ExternalLink[];
};

const officialResources: Resource[] = [
  {
    index: '01',
    title: 'Student Question Bank',
    category: 'College Board · official questions',
    description: 'Build targeted sets by section, domain, skill, and difficulty on the official College Board platform.',
    useWhen: 'Use for focused practice after your dashboard identifies a skill to revisit.',
    links: [{ label: 'Open the Student Question Bank', href: 'https://satsuite.collegeboard.org/practice/student-question-bank' }],
  },
  {
    index: '02',
    title: 'Bluebook + My Practice',
    category: 'College Board · full-length practice',
    description: 'Take an adaptive practice test in Bluebook, then review scores, answers, and tailored next steps in My Practice.',
    useWhen: 'Use for a test-day simulation and a reliable diagnosis of your next study focus.',
    links: [
      { label: 'Download or open Bluebook information', href: 'https://bluebook.collegeboard.org/students/download-bluebook' },
      { label: 'Go to My Practice', href: 'https://mypractice.collegeboard.org/' },
    ],
  },
  {
    index: '03',
    title: 'Question of the Day',
    category: 'College Board · daily official practice',
    description: 'Answer one official Math or Reading and Writing question in a lightweight daily format.',
    useWhen: 'Use to maintain momentum on a day when a longer session will not fit.',
    links: [{ label: 'Answer today’s question', href: 'https://qotd.collegeboard.org/' }],
  },
  {
    index: '04',
    title: 'Khan Academy Digital SAT',
    category: 'Khan Academy · official partner',
    description: 'Review Digital SAT skills with free lessons, examples, exercises, and leveled practice.',
    useWhen: 'Use when an answer explanation reveals a concept that needs teaching, not just another attempt.',
    links: [{ label: 'Study on Khan Academy', href: 'https://www.khanacademy.org/digital-sat' }],
  },
  {
    index: '05',
    title: 'Schoolhouse.world SAT Bootcamps',
    category: 'Schoolhouse.world · official partner',
    description: 'Join free, live small-group SAT support led by trained peer tutors using official practice content.',
    useWhen: 'Use when you would benefit from a schedule, discussion, and a tutor who can unpack hard questions.',
    links: [{ label: 'Explore SAT Bootcamps', href: 'https://schoolhouse.world/sat-bootcamp' }],
  },
];

const enrichmentResources: Resource[] = [
  {
    index: 'A',
    title: 'OpenStax Mathematics',
    category: 'Enrichment · open textbooks',
    description: 'Free, peer-reviewed mathematics books for rebuilding algebra, functions, statistics, and other foundations.',
    useWhen: 'Use for a deeper concept review; these are not official SAT questions or score predictors.',
    links: [{ label: 'Browse OpenStax Math', href: 'https://openstax.org/subjects/math' }],
  },
  {
    index: 'B',
    title: 'Illustrative Mathematics',
    category: 'Enrichment · problem-based tasks',
    description: 'Standards-aligned tasks that develop mathematical reasoning and flexible problem-solving habits.',
    useWhen: 'Use when you understand a procedure but need practice explaining and applying the idea.',
    links: [{ label: 'Browse Illustrative Mathematics tasks', href: 'https://tasks.illustrativemathematics.org/content-standards' }],
  },
  {
    index: 'C',
    title: 'NAEP Questions Tool',
    category: 'Enrichment · released assessment items',
    description: 'Explore released U.S. assessment questions in mathematics, reading, writing, and related subjects.',
    useWhen: 'Use for broader grade-level reasoning practice; NAEP format and results are not SAT equivalents.',
    links: [{ label: 'Search released NAEP questions', href: 'https://www.nationsreportcard.gov/nqt/searchquestions' }],
  },
];

const qualityChecks = [
  {
    title: 'Quality-screened',
    copy: 'A question is usable only when it has a source-provided key or passes the current answer-evidence checks. Ambiguous model results stay out.',
  },
  {
    title: 'Ambiguity is quarantined',
    copy: 'Unclear wording, answer-key conflicts, broken media, and likely duplicates stay out of student practice until resolved.',
  },
  {
    title: 'Provenance travels with the item',
    copy: 'Every stored question should retain its author or source, permission status, review state, and relevant version history.',
  },
];

const importPolicies = [
  {
    label: 'owned',
    title: 'Original material',
    copy: 'Questions authored for SAT-Buddy may be stored, reviewed, revised, and served from the built-in bank.',
  },
  {
    label: 'licensed',
    title: 'Permission recorded',
    copy: 'Third-party material is stored only when its license or written permission permits the intended use and attribution is preserved.',
  },
  {
    label: 'link_only',
    title: 'Publisher-hosted',
    copy: 'Official and other external practice stays on its publisher’s platform when reuse rights are absent or have not been verified.',
  },
];

function ExternalResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#bd4e39]">{resource.category}</p>
        <span aria-hidden="true" className="font-display text-3xl leading-none text-stone-300">{resource.index}</span>
      </div>
      <h3 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight text-stone-900">{resource.title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{resource.description}</p>
      <p className="mt-5 border-l-2 border-[#e07a5f] pl-4 text-xs leading-5 text-stone-500">{resource.useWhen}</p>
      <div className="mt-auto flex flex-col items-start gap-2 pt-7">
        {resource.links.map(link => (
          <a
            key={link.href}
            aria-label={`${link.label} (opens in a new tab)`}
            className="rounded-md text-sm font-extrabold text-teal-800 underline decoration-teal-800/25 underline-offset-4 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/20"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label} <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </Card>
  );
}

export default function ResourcesPage({ bankSummary, showEnrichment = true }: ResourcesPageProps) {
  const [remoteSummary, setRemoteSummary] = useState<SatBankSummary | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>(bankSummary === undefined ? 'idle' : bankSummary ? 'ready' : 'unavailable');

  useEffect(() => {
    if (bankSummary !== undefined) {
      setRemoteSummary(null);
      setSummaryStatus(bankSummary ? 'ready' : 'unavailable');
      return;
    }

    let cancelled = false;
    setSummaryStatus('loading');
    void SatService.getBankSummary()
      .then(summary => {
        if (!cancelled) {
          setRemoteSummary(summary);
          setSummaryStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummaryStatus('unavailable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bankSummary]);

  const summary = bankSummary === undefined ? remoteSummary : bankSummary;
  const usableCount = summary?.usableQuestions;
  const quarantinedCount = summary?.quarantinedQuestions;
  const duplicateCount = summary?.duplicateQuestions;

  return (
    <div className="page-shell" id="main-content">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#173c39] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-72 rounded-full border-[42px] border-white/[.045]" />
        <div aria-hidden="true" className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-[#e96b4d]/15 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#f1b49f]">A trustworthy practice shelf</p>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,7vw,5.6rem)] font-medium leading-[.88] tracking-[-.05em]">
              The right source for <em className="font-light text-[#f1b49f]">every study job.</em>
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-teal-50/65 sm:text-base">
              Use SAT-Buddy for quality-screened built-in practice, then move to the publisher when you need official tests, official questions, lessons, or live support.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-6 backdrop-blur-sm sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#e6d8bb]">Link-only by design</p>
            <p className="mt-4 text-sm leading-6 text-white/72">
              External official question content stays on the publisher’s platform. These cards are safe outbound links; SAT-Buddy does not copy, scrape, or rehost that content.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-white/60">
              <span className="rounded-full border border-white/10 px-3 py-2">Publisher-hosted</span>
              <span className="rounded-full border border-white/10 px-3 py-2">No copied logos</span>
              <span className="rounded-full border border-white/10 px-3 py-2">Opens safely</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="official-resources-heading" className="py-16 sm:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-kicker">Official practice ecosystem</p>
            <h2 id="official-resources-heading" className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-none tracking-tight text-stone-900 sm:text-5xl">
              Go straight to the source.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-stone-600">
            Choose the format that matches today’s goal. Each destination opens in a new tab so your SAT-Buddy study record stays in place.
          </p>
        </div>

        <ul className="mt-9 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
          {officialResources.map(resource => (
            <li key={resource.title}>
              <ExternalResourceCard resource={resource} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="bank-quality-heading" className="rounded-[2rem] border border-stone-900/10 bg-[#e6d8bb]/35 p-6 sm:p-9 lg:p-11">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div>
            <p className="page-kicker">Built-in Bank Quality</p>
            <h2 id="bank-quality-heading" className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight text-stone-900 sm:text-5xl">
              Usable means screened.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
              Bank size is not a quality claim. The live total appears only when the service can report it; this page never substitutes a hardcoded number.
            </p>

            <div aria-live="polite" className="mt-7 rounded-3xl bg-[#123d3a] p-6 text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#f1b49f]">Current bank signal</p>
              {summaryStatus === 'loading' && <p className="mt-3 text-sm text-white/70">Checking the live quality summary…</p>}
              {summaryStatus === 'ready' && usableCount !== undefined && (
                <p className="mt-3 font-display text-4xl font-semibold">{usableCount.toLocaleString()} <span className="text-base font-normal text-white/60">usable questions</span></p>
              )}
              {summaryStatus === 'ready' && usableCount === undefined && (
                <p className="mt-3 text-sm text-white/70">The bank is reporting quality status without a usable-question total.</p>
              )}
              {(summaryStatus === 'idle' || summaryStatus === 'unavailable') && (
                <p className="mt-3 text-sm leading-6 text-white/70">Live usable total will appear when the bank-summary service is available.</p>
              )}
              {(quarantinedCount !== undefined || duplicateCount !== undefined) && (
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/55">
                  {quarantinedCount !== undefined && <span>{quarantinedCount.toLocaleString()} quarantined from practice</span>}
                  {duplicateCount !== undefined && <span>{duplicateCount.toLocaleString()} duplicate item{duplicateCount === 1 ? '' : 's'} excluded</span>}
                </div>
              )}
            </div>
          </div>

          <ol className="grid list-none gap-4 p-0 sm:grid-cols-3">
            {qualityChecks.map((check, index) => (
              <li key={check.title} className="rounded-3xl border border-stone-900/10 bg-white/75 p-6">
                <span aria-hidden="true" className="font-display text-3xl text-[#e07a5f]">0{index + 1}</span>
                <h3 className="mt-9 font-display text-2xl font-semibold leading-tight text-stone-900">{check.title}</h3>
                <p className="mt-3 text-xs leading-6 text-stone-600">{check.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="import-policy-heading" className="py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[.68fr_1.32fr]">
          <div>
            <p className="page-kicker">Import policy</p>
            <h2 id="import-policy-heading" className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight text-stone-900 sm:text-5xl">
              Provenance before volume.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
              Every source receives one explicit handling status. A public webpage is not, by itself, permission to copy its questions.
            </p>
          </div>

          <dl className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/70">
            {importPolicies.map((policy, index) => (
              <div key={policy.label} className={`grid gap-3 p-6 sm:grid-cols-[150px_1fr] sm:gap-6 sm:p-7 ${index > 0 ? 'border-t border-stone-900/10' : ''}`}>
                <dt>
                  <code className="rounded-full bg-[#173c39] px-3 py-2 text-[11px] font-bold text-[#f1b49f]">{policy.label}</code>
                </dt>
                <dd className="m-0">
                  <strong className="block font-display text-xl font-semibold text-stone-900">{policy.title}</strong>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{policy.copy}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {showEnrichment && (
        <section aria-labelledby="enrichment-heading" className="border-t border-stone-900/10 py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="page-kicker">Conditional enrichment</p>
            <h2 id="enrichment-heading" className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight text-stone-900 sm:text-5xl">
              Broaden the skill, when the skill is the issue.
            </h2>
            <p className="mt-5 text-sm leading-7 text-stone-600">
              These sources are useful when SAT practice exposes a deeper reading or mathematics gap. They supplement preparation; they are not official SAT simulations and remain <code className="rounded bg-stone-900/5 px-1.5 py-1 text-xs">link_only</code> here.
            </p>
          </div>

          <ul className="mt-9 grid list-none gap-5 p-0 lg:grid-cols-3">
            {enrichmentResources.map(resource => (
              <li key={resource.title}>
                <ExternalResourceCard resource={resource} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <TrademarkNotice className="mt-2" />
    </div>
  );
}
