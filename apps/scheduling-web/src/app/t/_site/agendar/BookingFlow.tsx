'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../../../_lib/api';
import type { ShopProfile } from '../content';
import {
  buildCatalog,
  eligiblePros,
  onlyDigits,
  quote,
  quoteRange,
  upcomingDays,
  validateClient,
  type ClientErrors,
} from '../booking';
import { gateway, type BookingResult } from '../gateway';
import { useShopData } from '../useShopData';
import { Razor } from '../components/Razor';
import { Button } from '../components/Button';
import { IconAlert, IconArrowLeft } from '../components/icons';
import { useDaySlots, type Slot } from './useDaySlots';
import { StepServices } from './StepServices';
import { StepPro } from './StepPro';
import { StepTime } from './StepTime';
import { StepDetails } from './StepDetails';
import { Summary } from './Summary';
import { Done } from './Done';
import styles from './Booking.module.css';

type Step = 'servicos' | 'profissional' | 'horario' | 'dados';
const DAYS_AHEAD = 14;

const STEP_TITLE: Record<Step, string> = {
  servicos: 'O que vamos fazer hoje?',
  profissional: 'Com quem?',
  horario: 'Que dia e que horas?',
  dados: 'Pra quem é a cadeira?',
};

type Props = { profile: ShopProfile; initialServiceId?: string };

export function BookingFlow({ profile, initialServiceId }: Props) {
  const { slug, timeZone } = profile;
  const data = useShopData(slug);
  const pros = useMemo(
    () => (data.status === 'ready' ? data.professionals : []),
    [data],
  );
  const catalog = useMemo(() => buildCatalog(pros), [pros]);
  const shopName =
    profile.name || (data.status === 'ready' ? data.name : '') || 'Barbearia';

  // ── estado do pedido ──────────────────────────────────
  const [step, setStep] = useState<Step>('servicos');
  const [selected, setSelected] = useState<string[]>([]);
  const [proChoice, setProChoice] = useState<string | null>(null); // id ou 'any'
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ClientErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Serviço vindo do site (?servico=…) já entra marcado.
  useEffect(() => {
    if (initialServiceId && catalog.some((s) => s.id === initialServiceId)) {
      setSelected((cur) => (cur.length ? cur : [initialServiceId]));
    }
  }, [initialServiceId, catalog]);

  const eligible = useMemo(
    () => eligiblePros(pros, selected),
    [pros, selected],
  );
  const needsProStep = eligible.length > 1;
  const steps: Step[] = needsProStep
    ? ['servicos', 'profissional', 'horario', 'dados']
    : ['servicos', 'horario', 'dados'];
  const stepIndex = steps.indexOf(step);

  // Profissional efetivo: escolha explícita, ou o único que atende.
  const effectivePro =
    proChoice ?? (eligible.length === 1 ? eligible[0].id : null);
  useEffect(() => {
    if (
      proChoice &&
      proChoice !== 'any' &&
      !eligible.some((p) => p.id === proChoice)
    )
      setProChoice(null);
  }, [eligible, proChoice]);

  const proIdsForSlots = useMemo(
    () =>
      effectivePro === 'any'
        ? eligible.map((p) => p.id)
        : effectivePro
          ? [effectivePro]
          : [],
    [effectivePro, eligible],
  );
  const days = useMemo(
    () => upcomingDays(new Date(), DAYS_AHEAD, timeZone),
    [timeZone],
  );
  const { byDay, invalidate } = useDaySlots(
    slug,
    step === 'horario' || step === 'dados' ? proIdsForSlots : [],
    selected,
    days,
  );

  // Mudou serviço ou profissional: o horário escolhido deixa de valer.
  const selectionKey = `${selected.join(',')}|${effectivePro ?? ''}`;
  const lastKey = useRef(selectionKey);
  useEffect(() => {
    if (lastKey.current !== selectionKey) {
      lastKey.current = selectionKey;
      setSlot(null);
    }
  }, [selectionKey]);

  // Primeiro dia com vaga vira o dia selecionado.
  useEffect(() => {
    if (step !== 'horario' || date) return;
    const first = days.find((d) => {
      const s = byDay[d];
      return s?.status === 'ready' && s.slots.length > 0;
    });
    const allSettled = days.every(
      (d) => byDay[d] && byDay[d].status !== 'loading',
    );
    if (first) setDate(first);
    else if (allSettled) setDate(days[0]);
  }, [step, date, days, byDay]);

  const bookedPro = slot
    ? pros.find((p) => p.id === slot.proId)
    : effectivePro && effectivePro !== 'any'
      ? pros.find((p) => p.id === effectivePro)
      : undefined;
  const range = quoteRange(
    effectivePro && effectivePro !== 'any'
      ? eligible.filter((p) => p.id === effectivePro)
      : eligible,
    selected,
  );
  const exact = bookedPro ? quote(bookedPro, selected) : null;

  // ── navegação com histórico (o "voltar" do celular volta um passo) ──
  const goTo = useCallback((next: Step, push = true) => {
    setStep(next);
    setNotice(null);
    if (push && typeof window !== 'undefined')
      window.history.pushState({ step: next }, '');
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    window.history.replaceState({ step: 'servicos' }, '');
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { step?: Step } | null)?.step;
      if (s) goTo(s, false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [goTo]);

  const next = () => {
    const i = steps.indexOf(step);
    if (i < steps.length - 1) goTo(steps[i + 1]);
  };
  const back = () => window.history.back();

  // ── envio ─────────────────────────────────────────────
  async function submit() {
    const errs = validateClient(name, phone);
    setFieldErrors(errs);
    if (Object.keys(errs).length || !slot) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await gateway.book(slug, {
        professionalId: slot.proId,
        serviceIds: selected,
        clientName: name.trim(),
        clientPhone: onlyDigits(phone),
        startAt: slot.startAt,
      });
      setResult(res);
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.code === 'errors.agenda.slotUnavailable' ||
          err.code === 'errors.agenda.leadTime'
        ) {
          if (date) invalidate(date);
          setSlot(null);
          goTo('horario');
          setNotice(
            err.code === 'errors.agenda.leadTime'
              ? 'Esse horário ficou em cima da hora (é preciso 1h de antecedência). Escolha outro.'
              : 'Alguém pegou esse horário agora há pouco. Escolha outro — os horários já foram atualizados.',
          );
        } else if (err.issues.length) {
          const fe: ClientErrors = {};
          for (const i of err.issues) {
            if (i.path.includes('clientName')) fe.name = i.message;
            if (i.path.includes('clientPhone')) fe.phone = i.message;
          }
          setFieldErrors(fe);
          setNotice(Object.keys(fe).length ? null : err.message);
        } else {
          setNotice(err.message);
        }
      } else {
        setNotice(
          'Não conseguimos confirmar agora. Verifique sua conexão e tente de novo.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── telas de estado ───────────────────────────────────
  if (result && slot && bookedPro) {
    return (
      <Done
        profile={profile}
        shopName={shopName}
        clientName={name}
        pro={bookedPro}
        services={selected.map(
          (id) => catalog.find((c) => c.id === id)?.name ?? '',
        )}
        price={quote(bookedPro, selected).price}
        result={result}
      />
    );
  }

  const canContinue =
    step === 'servicos'
      ? selected.length > 0 && eligible.length > 0
      : step === 'profissional'
        ? Boolean(proChoice)
        : step === 'horario'
          ? Boolean(slot)
          : true;

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        {stepIndex > 0 ? (
          <button type="button" className={styles.backBtn} onClick={back}>
            <IconArrowLeft /> Voltar
          </button>
        ) : (
          <Link href={`/t/${slug}`} className={styles.backBtn}>
            <IconArrowLeft /> Site
          </Link>
        )}
        <Link
          href={`/t/${slug}`}
          className={styles.topBrand}
          aria-label={`${shopName} — voltar ao site`}
        >
          <Razor open className={styles.topMark} shine={false} />
          <span>{shopName.replace(/\s+barbearia$/i, '')}</span>
        </Link>
        <span className={styles.stepCount} aria-hidden>
          {stepIndex + 1}/{steps.length}
        </span>
      </header>

      {/* Barra de progresso em "degradê": cada passo concluído escurece um trecho. */}
      <div className={styles.progress} aria-hidden>
        {steps.map((s, i) => (
          <span
            key={s}
            data-state={
              i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'
            }
          />
        ))}
      </div>

      <div className={styles.layout}>
        <main className={styles.main}>
          <p className={styles.stepLabel}>
            Passo {stepIndex + 1} de {steps.length}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            {STEP_TITLE[step]}
          </h1>

          {notice ? (
            <div className={styles.notice} role="alert">
              <IconAlert /> <span>{notice}</span>
            </div>
          ) : null}

          {data.status === 'loading' ? (
            <div
              className={styles.loadingList}
              aria-busy="true"
              aria-label="Carregando serviços"
            >
              {[0, 1, 2, 3].map((i) => (
                <span key={i} />
              ))}
            </div>
          ) : data.status === 'error' ? (
            <div className={styles.emptyState} role="alert">
              <p className={styles.emptyTitle}>
                Não conseguimos abrir a agenda.
              </p>
              <p>{data.message}</p>
              <Button variant="ghost" onClick={data.retry}>
                Tentar de novo
              </Button>
            </div>
          ) : data.status === 'not-found' || catalog.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>
                Agendamento online indisponível no momento.
              </p>
              <p>
                {profile.contact.whatsapp ? (
                  <a href={`https://wa.me/${profile.contact.whatsapp}`}>
                    Chame no WhatsApp
                  </a>
                ) : (
                  'Fale direto com a barbearia para marcar seu horário.'
                )}
              </p>
            </div>
          ) : step === 'servicos' ? (
            <StepServices
              catalog={catalog}
              selected={selected}
              onChange={setSelected}
              noProForCombo={selected.length > 0 && eligible.length === 0}
            />
          ) : step === 'profissional' ? (
            <StepPro
              pros={eligible}
              serviceIds={selected}
              value={proChoice}
              onChange={setProChoice}
            />
          ) : step === 'horario' ? (
            <StepTime
              days={days}
              byDay={byDay}
              date={date}
              onDate={(d) => {
                setDate(d);
                setSlot(null);
              }}
              slot={slot}
              onSlot={setSlot}
              timeZone={timeZone}
              pros={pros}
              showPro={effectivePro === 'any'}
              onRetryDay={invalidate}
            />
          ) : (
            <StepDetails
              name={name}
              phone={phone}
              onName={(v) => {
                setName(v);
                if (fieldErrors.name)
                  setFieldErrors((e) => ({ ...e, name: undefined }));
              }}
              onPhone={(v) => {
                setPhone(v);
                if (fieldErrors.phone)
                  setFieldErrors((e) => ({ ...e, phone: undefined }));
              }}
              errors={fieldErrors}
              onSubmit={submit}
            />
          )}
        </main>

        <Summary
          catalog={catalog}
          selected={selected}
          pro={bookedPro}
          anyPro={effectivePro === 'any' && !slot}
          slot={slot}
          timeZone={timeZone}
          priceLabel={
            exact
              ? exact.price
              : range
                ? [range.minPrice, range.maxPrice]
                : null
          }
          durationLabel={
            exact
              ? exact.duration
              : range
                ? [range.minDuration, range.maxDuration]
                : null
          }
          action={
            data.status === 'ready' && catalog.length > 0 ? (
              step === 'dados' ? (
                <Button
                  size="lg"
                  block
                  arrow
                  type="submit"
                  form="dados-form"
                  loading={submitting}
                >
                  {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  block
                  arrow
                  onClick={next}
                  disabled={!canContinue}
                >
                  Continuar
                </Button>
              )
            ) : null
          }
        />
      </div>
    </div>
  );
}
