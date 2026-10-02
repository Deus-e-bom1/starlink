import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createPix, getOrderStatus } from "@/lib/pix.functions";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, ArrowRight, Check, Smartphone, Package, Zap, Truck, Clock, Sparkles, User, Mail, Phone,
  CreditCard, Lock, Hash, RefreshCw, Wifi, ShieldCheck, Copy, Loader2, CheckCircle2,
} from "lucide-react";
import logo from "@/assets/starlink-logo.png.asset.json";
import { plans } from "@/lib/plans";

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => z.object({ plano: z.coerce.number().int().min(0).max(2).catch(1) }).passthrough().parse(s),
  head: () => ({
    meta: [
      { title: "Checkout — Chip Virtual Starlink" },
      { name: "description", content: "Escolha seu chip, preencha seus dados e pague via PIX para ativar seu Chip Virtual Starlink." },
      { property: "og:title", content: "Checkout — Chip Virtual Starlink" },
      { property: "og:description", content: "Ative seu Chip Virtual Starlink em poucos passos com pagamento via PIX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const toNum = (p: string) => Number(p.replace(",", "."));
const brl = (n: number) => n.toFixed(2).replace(".", ",");
const SHIP = 9.99;
const DDDS = ["11","12","13","14","15","16","17","18","19","21","22","24","27","28","31","32","33","34","35","37","38","41","42","43","44","45","46","47","48","49","51","53","54","55","61","62","63","64","65","66","67","68","69","71","73","74","75","77","79","81","82","83","84","85","86","87","88","89","91","92","93","94","95","96","97","98","99"];

function validCPF(v: string) {
  const c = v.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const d = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return d(9) === Number(c[9]) && d(10) === Number(c[10]);
}
const maskCPF = (v: string) => v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const schema = z.object({
  nome: z.string().trim().min(5, "Informe seu nome completo").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  telefone: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "Telefone inválido"),
  cpf: z.string().refine(validCPF, "CPF inválido"),
  appEmail: z.string().trim().email("Email inválido").max(255),
  appSenha: z.string().min(6, "Mínimo 6 caracteres").max(64),
  final: z.string().regex(/^\d{4}$/, "Digite 4 dígitos"),
});
type Form = z.infer<typeof schema> & { ddd: string };

const rand5 = () => "9" + String(Math.floor(1000 + Math.random() * 9000));

function Checkout() {
  const search = Route.useSearch() as Record<string, unknown>;
  const plano = search["plano"] as number;
  const plan = plans[plano] ?? plans[1]!;
  const price = toNum(plan.price);
  const [step, setStep] = useState(0); // 0 chip, 1 dados, 2 resumo, 3 pix, 4 concluido
  const [chip, setChip] = useState<"esim" | "fisico">("esim");
  const [f, setF] = useState<Form>({ nome: "", email: "", telefone: "", cpf: "", appEmail: "", appSenha: "", final: "", ddd: "11" });
  const [prefix, setPrefix] = useState(rand5);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [avail, setAvail] = useState<null | boolean>(null);
  const [copied, setCopied] = useState(false);
  const ship = chip === "fisico" ? SHIP : 0;
  const total = price + ship;
  const chipLabel = chip === "esim" ? "Chip Virtual (eSIM)" : "Chip Físico";
  const chipSub = chip === "esim" ? "Ativação no mesmo dia" : "Entrega em até 7 dias úteis";

  const [pix, setPix] = useState<{ orderId: string; pixCode: string; qrCode: string | null } | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const createPixFn = useServerFn(createPix);
  const statusFn = useServerFn(getOrderStatus);
  const pixCode = pix?.pixCode ?? "";

  const pagar = async () => {
    setPaying(true); setPayError("");
    try {
      const r = await createPixFn({ data: { plano, chip, nome: f.nome, email: f.email, telefone: f.telefone, cpf: f.cpf, appEmail: f.appEmail, numero: `(${f.ddd}) ${prefix}-${f.final}`, utms: collectUtms(search) } });
      if ("error" in r) { setPayError(r.error); return; }
      setPix(r); go(3);
    } catch (e) { console.error("createPix failed", e); setPayError("Não foi possível gerar o PIX. Tente novamente."); }
    finally { setPaying(false); }
  };

  useEffect(() => {
    if (step !== 3 || !pix) return;
    let stop = false;
    const t = setInterval(async () => {
      try {
        const r = await statusFn({ data: { orderId: pix.orderId } });
        if (stop) return;
        if (r.status === "paid") { clearInterval(t); go(4); }
        if (r.status === "failed") { clearInterval(t); setPayError("O pagamento não foi concluído. Gere um novo PIX."); }
      } catch { /* tenta de novo no próximo ciclo */ }
    }, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [step, pix]);

  const go = (s: number) => { setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const set = (k: keyof Form, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const submitDados = () => {
    const r = schema.safeParse(f);
    if (!r.success) {
      const e: Partial<Record<keyof Form, string>> = {};
      r.error.issues.forEach((i) => { e[i.path[0] as keyof Form] ??= i.message; });
      setErrors(e);
      return;
    }
    go(2);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(pixCode); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/"><img src={logo.url} alt="Starlink" className="h-5 w-auto" /></Link>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <Link to="/" hash="como-funciona" className="hover:text-foreground">Como Funciona</Link>
            <Link to="/" hash="oferta" className="hover:text-foreground">Oferta</Link>
            <Link to="/" hash="para-quem" className="hover:text-foreground">Para quem</Link>
          </nav>
          <Link to="/" hash="oferta" className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background">Ativar Agora</Link>
        </div>
        {step >= 1 && <BigStepper current={step - 1} />}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {step === 0 && (
          <div className="mx-auto max-w-3xl">
            <Link to="/" hash="oferta" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar para planos</Link>
            <SmallStepper />
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Plano selecionado</p><p className="font-bold">Chip Starlink {plan.data}</p></div>
              <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Valor</p><p className="font-bold">R$ {plan.price}</p></div>
            </div>
            <h1 className="mt-10 text-center text-2xl font-extrabold md:text-3xl">Como você prefere receber seu chip?</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">Toque em uma opção abaixo para selecionar</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ChipCard active={chip === "esim"} onClick={() => setChip("esim")} recommended icon={<Smartphone className="h-5 w-5" />} title="Chip Virtual (eSIM)" sub="Envio Grátis"
                items={[[<Zap key="a" className="h-3 w-3" />, "Ativação no mesmo dia", " — Receba por e-mail em minutos"], [<Check key="b" className="h-3 w-3" />, "Sem chip físico", " — Funciona junto ao seu chip atual"], [<Check key="c" className="h-3 w-3" />, "Compatível", " com a maioria dos smartphones modernos"]]}
                plan={plan.data} price={price} ship={0} />
              <ChipCard active={chip === "fisico"} onClick={() => setChip("fisico")} icon={<Package className="h-5 w-5" />} title="Chip Físico" sub={`+ R$ ${brl(SHIP)} de entrega`}
                items={[[<Truck key="a" className="h-3 w-3" />, "Entrega em até 7 dias úteis", " — Todo o Brasil"], [<Clock key="b" className="h-3 w-3" />, "Ativação após recebimento", " — Suporte para configuração"], [<Check key="c" className="h-3 w-3" />, "Compatível", " com todos os celulares com slot para chip"]]}
                plan={plan.data} price={price} ship={SHIP} />
            </div>
            <div className="mt-6 flex gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Sparkles className="h-4 w-4" /></div>
              <div><p className="text-sm font-semibold">Você não perde seu número atual</p><p className="mt-1 text-sm text-muted-foreground">Independente da escolha, o chip Starlink funciona junto ao chip que você já usa. Um novo número é entregue e você usa os dois simultaneamente.</p></div>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <PrimaryBtn onClick={() => go(1)}>Continuar para Pagamento</PrimaryBtn>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Pagamento seguro via PIX</span>
            </div>
          </div>
        )}

        {step >= 1 && step <= 3 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-2xl border border-border bg-card p-5 md:p-7">
              {step === 1 && (
                <>
                  <BackLink onClick={() => go(0)}>Voltar para chip</BackLink>
                  <h2 className="text-xl font-extrabold">Seus Dados</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Preencha seus dados para continuar com a ativação</p>
                  <div className="mt-6 space-y-4">
                    <Field label="Nome Completo" icon={<User />} value={f.nome} onChange={(v) => set("nome", v)} placeholder="Seu nome completo" error={errors.nome} />
                    <Field label="Email" icon={<Mail />} type="email" value={f.email} onChange={(v) => set("email", v)} placeholder="seu@email.com" error={errors.email} />
                    <Field label="Telefone / WhatsApp" icon={<Phone />} value={f.telefone} onChange={(v) => set("telefone", maskPhone(v))} placeholder="(00) 00000-0000" error={errors.telefone} inputMode="numeric" />
                    <Field label="CPF" icon={<CreditCard />} value={f.cpf} onChange={(v) => set("cpf", maskCPF(v))} placeholder="000.000.000-00" error={errors.cpf} inputMode="numeric" />
                  </div>
                  <hr className="my-6 border-border" />
                  <SectionTitle icon={<Smartphone className="h-4 w-4" />}>Acesso ao App Starlink</SectionTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Crie um email e senha para acessar o aplicativo Starlink</p>
                  <div className="mt-4 space-y-4">
                    <Field label="Email para o App" icon={<Mail />} type="email" value={f.appEmail} onChange={(v) => set("appEmail", v)} placeholder="seuemail@starlink.com" error={errors.appEmail} />
                    <Field label="Senha para o App" icon={<Lock />} type="password" value={f.appSenha} onChange={(v) => set("appSenha", v)} placeholder="Mínimo 6 caracteres" error={errors.appSenha} />
                  </div>
                  <hr className="my-6 border-border" />
                  <SectionTitle icon={<Hash className="h-4 w-4" />}>Cadastro do Número</SectionTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Escolha o DDD e os últimos 4 dígitos do seu novo número</p>
                  <label className="mt-4 block text-sm font-semibold">DDD</label>
                  <select value={f.ddd} onChange={(e) => { set("ddd", e.target.value); setAvail(null); }} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                    {DDDS.map((d) => <option key={d} value={d}>({d})</option>)}
                  </select>
                  <label className="mt-4 block text-sm font-semibold">Seu número</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm font-bold">({f.ddd})</span>
                    <button type="button" onClick={() => { setPrefix(rand5()); setAvail(null); }} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm font-bold" aria-label="Gerar outro prefixo">{prefix}<RefreshCw className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <span className="text-muted-foreground">-</span>
                    <input value={f.final} onChange={(e) => { set("final", e.target.value.replace(/\D/g, "").slice(0, 4)); setAvail(null); }} placeholder="0000" inputMode="numeric" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  {errors.final && <p className="mt-1 text-xs text-destructive">{errors.final}</p>}
                  <button type="button" disabled={f.final.length !== 4} onClick={() => setAvail(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-muted py-2.5 text-sm text-muted-foreground transition enabled:hover:text-foreground disabled:opacity-50">
                    <Phone className="h-4 w-4" /> Verificar disponibilidade
                  </button>
                  {avail && <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> ({f.ddd}) {prefix}-{f.final} está disponível!</p>}
                  <PrimaryBtn className="mt-6 w-full" onClick={submitDados}>Continuar para Pagamento</PrimaryBtn>
                </>
              )}

              {step === 2 && (
                <>
                  <BackLink onClick={() => go(1)}>Voltar para dados</BackLink>
                  <h2 className="text-xl font-extrabold">Resumo do Pedido</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Confira seus dados antes de finalizar a compra</p>
                  <div className="mt-5 flex gap-3 rounded-xl border border-border bg-muted p-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <div><p className="font-semibold">Dados cadastrados com sucesso!</p><p className="text-xs text-muted-foreground">Confira as informações abaixo e clique em "Pagar com PIX" para finalizar sua compra.</p></div>
                  </div>
                  <SectionTitle className="mt-6" icon={<User className="h-4 w-4" />}>Dados Pessoais</SectionTitle>
                  <InfoBox rows={[[<User key="a" />, "Nome Completo", f.nome], [<Mail key="b" />, "Email", f.email], [<Phone key="c" />, "Telefone / WhatsApp", f.telefone], [<CreditCard key="d" />, "CPF", f.cpf]]} />
                  <SectionTitle className="mt-6" icon={<Smartphone className="h-4 w-4" />}>Acesso ao App Starlink</SectionTitle>
                  <InfoBox rows={[[<Mail key="a" />, "Email do App", f.appEmail], [<Lock key="b" />, "Senha do App", "•".repeat(f.appSenha.length)]]} />
                  <SectionTitle className="mt-6" icon={<Smartphone className="h-4 w-4" />}>Tipo de Chip</SectionTitle>
                  <InfoBox rows={[[<Smartphone key="a" />, "Modelo", chipLabel]]} />
                  <SectionTitle className="mt-6" icon={<Hash className="h-4 w-4" />}>Número Escolhido</SectionTitle>
                  <div className="mt-3 rounded-xl border border-border bg-muted py-3 text-center font-mono text-lg font-bold">({f.ddd}) {prefix}-{f.final}</div>
                  <div className="mt-6 rounded-xl border border-border bg-muted p-4">
                    <p className="font-semibold">Valores</p>
                    <Row l={`Chip Starlink ${plan.data}`} r={`R$ ${plan.price}`} />
                    <Row l="Taxa de entrega" r={ship ? `R$ ${brl(ship)}` : "Grátis"} />
                    <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold"><span>Total</span><span className="text-xl">R$ {brl(total)}</span></div>
                  </div>
                  <PrimaryBtn className="mt-6 w-full" onClick={() => { if (!paying) void pagar(); }} noArrow={paying}>{paying ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando PIX...</> : "Pagar com PIX"}</PrimaryBtn>
                  {payError && <p className="mt-3 text-center text-sm text-destructive">{payError}</p>}
                  <p className="mt-3 text-center text-xs text-muted-foreground">Você será redirecionado para a página de pagamento seguro</p>
                </>
              )}

              {step === 3 && (
                <>
                  <BackLink onClick={() => go(2)}>Voltar para resumo</BackLink>
                  <h2 className="text-xl font-extrabold">Pague com PIX</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Escaneie o QR Code ou copie o código abaixo. Assim que o pagamento for confirmado, seu pedido será processado automaticamente.</p>
                  <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Aguardando pagamento...</div>
                  <div className="mt-4 flex justify-center rounded-xl bg-foreground p-5">{pix?.qrCode ? <img src={pix.qrCode.startsWith("http") || pix.qrCode.startsWith("data:") ? pix.qrCode : `data:image/png;base64,${pix.qrCode}`} alt="QR Code PIX" className="h-[200px] w-[200px]" /> : <QRCodeSVG value={pixCode || " "} size={200} bgColor="transparent" fgColor="currentColor" className="text-background" />}</div>
                  <p className="mt-5 text-xs text-muted-foreground">Código PIX copia e cola</p>
                  <div className="mt-1.5 break-all rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">{pixCode}</div>
                  <PrimaryBtn className="mt-5 w-full" onClick={copy} noArrow>
                    {copied ? <><Check className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar código PIX</>}
                  </PrimaryBtn>
                  {payError && <p className="mt-3 text-center text-sm text-destructive">{payError}</p>}
                </>
              )}
            </div>
            <Summary plan={plan.data} price={plan.price} chipLabel={chipLabel} chipSub={chipSub} ship={ship} total={total} />
          </div>
        )}

        {step === 4 && (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background"><Check className="h-7 w-7" /></div>
            <h2 className="mt-5 text-2xl font-extrabold">Pagamento confirmado!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Obrigado, {f.nome.split(" ")[0]}! Seu {chipLabel} de {plan.data} será {chip === "esim" ? "enviado para " + f.email + " em minutos" : "entregue em até 7 dias úteis"}. O gerente entrará em contato pelo WhatsApp {f.telefone} para a ativação.</p>
            <p className="mt-4 font-mono font-bold">Seu número: ({f.ddd}) {prefix}-{f.final}</p>
            <Link to="/" className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background">Voltar ao início</Link>
          </div>
        )}
      </main>
    </div>
  );
}

function SmallStepper() {
  const s = [["Plano", "done"], ["Chip", "cur"], ["Pagamento", ""]];
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm">
      {s.map(([l, st], i) => (
        <div key={l} className="flex items-center gap-2">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${st === "done" ? "bg-foreground text-background" : st === "cur" ? "border-2 border-foreground" : "border border-border text-muted-foreground"}`}>{st === "done" ? <Check className="h-3 w-3" /> : i + 1}</span>
          <span className={st ? "font-semibold" : "text-muted-foreground"}>{l}</span>
          {i < 2 && <span className="h-px w-6 bg-border sm:w-10" />}
        </div>
      ))}
    </div>
  );
}

function BigStepper({ current }: { current: number }) {
  const s = ["Dados", "Resumo", "Pagamento", "Concluído"];
  return (
    <div className="mx-auto flex max-w-xl items-start justify-between px-4 py-3">
      {s.map((l, i) => (
        <div key={l} className="relative flex flex-1 flex-col items-center">
          {i < 3 && <span className={`absolute left-1/2 top-3 h-px w-full ${i < current ? "bg-foreground" : "bg-border"}`} />}
          <span className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${i < current ? "bg-foreground text-background" : i === current ? "border-2 border-foreground bg-background ring-4 ring-foreground/10" : "border border-border bg-muted text-muted-foreground"}`}>{i < current ? <Check className="h-3.5 w-3.5" /> : `0${i + 1}`}</span>
          <span className={`mt-1.5 text-[9px] font-bold uppercase tracking-widest ${i <= current ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function ChipCard({ active, onClick, recommended, icon, title, sub, items, plan, price, ship }: {
  active: boolean; onClick: () => void; recommended?: boolean; icon: React.ReactNode; title: string; sub: string;
  items: [React.ReactNode, string, string][]; plan: string; price: number; ship: number;
}) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`relative cursor-pointer rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 ${active ? "border-foreground shadow-[0_0_30px_-10px] shadow-foreground/40" : "border-border hover:border-foreground/40"}`}>
      {recommended && <span className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold text-background"><Sparkles className="h-3 w-3" /> Recomendado</span>}
      <span className={`absolute right-5 top-5 flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-foreground text-background" : "border border-muted-foreground"}`}>{active && <Check className="h-3 w-3" />}</span>
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-foreground text-background" : "bg-muted"}`}>{icon}</div>
        <div><p className="text-lg font-bold">{title}</p><p className="text-xs font-semibold text-muted-foreground">{sub}</p></div>
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map(([ic, b, t]) => <li key={b} className="flex gap-2"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">{ic}</span><span><b>{b}</b><span className="text-muted-foreground">{t}</span></span></li>)}
      </ul>
      <div className="mt-5 border-t border-border pt-3 text-xs">
        <Row l={`Chip Starlink ${plan}`} r={`R$ ${brl(price)}`} />
        <Row l="Taxa de envio" r={ship ? `R$ ${brl(ship)}` : "Grátis"} />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3"><span className="text-sm font-semibold">Total</span><span className="text-xl font-extrabold">R$ {brl(price + ship)}</span></div>
      </div>
    </div>
  );
}

function Summary({ plan, price, chipLabel, chipSub, ship, total }: { plan: string; price: string; chipLabel: string; chipSub: string; ship: number; total: number }) {
  return (
    <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-36">
      <h3 className="font-bold">Resumo do Pedido</h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Wifi className="h-5 w-5" /></div>
        <div className="text-sm"><p className="font-semibold">Chip Starlink {plan}</p><p className="text-xs text-muted-foreground">Direct-to-Cell</p><p className="text-xs text-muted-foreground">Plano mensal</p></div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3"><Smartphone className="h-4 w-4" /><div><p className="text-xs font-semibold">{chipLabel}</p><p className="text-[10px] text-muted-foreground">{chipSub}</p></div></div>
      <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        {["2 meses de uso grátis", "App oficial para Android e iOS", "Suporte técnico em português", "Sem fidelidade ou contratos", "Cancele quando quiser"].map((b) => <li key={b} className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted"><Check className="h-2.5 w-2.5" /></span>{b}</li>)}
      </ul>
      <div className="mt-4 border-t border-border pt-3 text-xs">
        <Row l={`Compra do Chip (${plan})`} r={`R$ ${price}`} />
        <Row l="Taxa de envio" r={ship ? `R$ ${brl(ship)}` : "Grátis"} />
        <Row l="Período de teste" r="2 meses grátis" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4"><span className="text-sm font-semibold">Total hoje:</span><span className="text-2xl font-extrabold">R$ {brl(total)}</span></div>
      <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">Após 2 meses de uso grátis, será cobrada a mensalidade de <b className="text-foreground">R$ {price}/mês</b>. Cancele quando quiser.</p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Pagamento 100% seguro</p>
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4 opacity-50"><img src={logo.url} alt="Starlink" className="h-3 w-auto" /><span className="text-[10px]">Parceiro Autorizado</span></div>
    </aside>
  );
}

function Row({ l, r }: { l: string; r: string }) {
  return <div className="mt-2 flex justify-between text-muted-foreground"><span>{l}</span><span className="font-semibold text-foreground">{r}</span></div>;
}
function SectionTitle({ icon, children, className = "" }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <h3 className={`flex items-center gap-2 font-bold ${className}`}>{icon}{children}</h3>;
}
function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{children}</button>;
}
function PrimaryBtn({ onClick, children, className = "", noArrow }: { onClick: () => void; children: React.ReactNode; className?: string; noArrow?: boolean }) {
  return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-full bg-foreground px-10 py-4 font-semibold text-background transition hover:scale-[1.01] hover:opacity-90 ${className}`}>{children}{!noArrow && <ArrowRight className="h-4 w-4" />}</button>;
}
function InfoBox({ rows }: { rows: [React.ReactNode, string, string][] }) {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-4">
      {rows.map(([ic, l, v]) => (
        <div key={l} className="flex items-start gap-3"><span className="mt-1 text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">{ic}</span><div><p className="text-[10px] text-muted-foreground">{l}</p><p className="break-all text-sm font-semibold">{v}</p></div></div>
      ))}
    </div>
  );
}
function Field({ label, icon, value, onChange, placeholder, error, type = "text", inputMode }: {
  label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; error?: string | undefined; type?: string; inputMode?: "numeric";
}) {
  return (
    <div>
      <label className="block text-sm font-semibold">{label}</label>
      <div className={`mt-1.5 flex items-center gap-2.5 rounded-lg border bg-background px-3 focus-within:ring-2 focus-within:ring-ring ${error ? "border-destructive" : "border-border"}`}>
        <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground" />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function collectUtms(search: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const add = (k: string, v: unknown) => { if (v != null && String(v) && !out[k]) out[k] = String(v).slice(0, 300); };
  for (const [k, v] of Object.entries(search)) if (k !== "plano") add(k, v);
  if (typeof window !== "undefined") {
    new URLSearchParams(window.location.search).forEach((v, k) => add(k, v));
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck"]) {
      try { add(k, localStorage.getItem(k)); } catch { /* ignore */ }
    }
  }
  return out;
}
