import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { plans } from "@/lib/plans";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck, Check, ChevronDown, Globe, Headphones, MapPin, ShieldCheck,
  Ship, Signal, Smartphone, Star, Tractor, Truck, Users, Building2, Mountain, Zap,
} from "lucide-react";
import logo from "@/assets/starlink-logo.png.asset.json";
import hero from "@/assets/hero-banner.jpg.asset.json";
import phone from "@/assets/phone-call.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chip Virtual Starlink — Internet via Satélite no Celular" },
      { name: "description", content: "Transforme seu smartphone em um modem via satélite com a tecnologia Direct-to-Cell da Starlink." },
      { property: "og:title", content: "Chip Virtual Starlink — Internet via Satélite no Celular" },
      { property: "og:description", content: "Transforme seu smartphone em um modem via satélite com a tecnologia Direct-to-Cell." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
      <span className="h-2 w-2 animate-pulse rounded-full bg-primary glow" />
      {children}
    </span>
  );
}

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / 1500, 1);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{v.toLocaleString("pt-BR")}{suffix}</span>;
}

const nav = [
  ["Como Funciona", "#como-funciona"],
  ["Oferta", "#oferta"],
  ["Para quem", "#para-quem"],
];



function Index() {
  const [plan, setPlan] = useState(1);
  const navigate = useNavigate();
  // Tracking pixels can intercept link clicks; if navigation stalls, go to checkout anyway (keeping UTMs).
  const buyRef = useRef<HTMLAnchorElement>(null);
  const planRef = useRef(plan);
  planRef.current = plan;
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const onClick = () => {
      window.setTimeout(() => {
        if (window.location.pathname === "/") navigate({ to: "/checkout", search: (prev: Record<string, unknown>) => ({ ...prev, plano: planRef.current }) });
      }, 1200);
    };
    el.addEventListener("click", onClick, true);
    return () => el.removeEventListener("click", onClick, true);
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <a href="#" className="shrink-0"><img src={logo.url} alt="Starlink" className="h-6 w-auto" /></a>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            {nav.map(([l, h]) => <a key={h} href={h} className="transition hover:text-foreground">{l}</a>)}
          </nav>
          <a href="#oferta" className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground glow transition hover:opacity-90">Ativar Agora</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <img src={hero.url} alt="Antena Starlink sob o céu estrelado" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <Badge>Tecnologia Direct-to-Cell</Badge>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-7xl">Chip Virtual <span className="text-gradient">Starlink</span></h1>
            <p className="mt-4 text-xl font-semibold text-foreground/90 md:text-2xl">Internet Via Satélite Direto no Seu Celular</p>
            <p className="mt-5 text-muted-foreground md:text-lg">Transforme seu smartphone em um modem via satélite. Com mais de 7.000 satélites em órbita baixa, a Starlink leva conectividade para onde as redes tradicionais não chegam.</p>
            <a href="#como-funciona" className="mt-8 inline-block rounded-full bg-gradient-brand px-8 py-3.5 font-semibold text-primary-foreground glow transition hover:scale-105">Saiba Mais</a>
          </div>
          <div className="glass mt-14 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl p-6">
            {[[7000, "+", "Satélites em órbita"], [100, "+", "Países atendidos"], [4, "M+", "Usuários ativos"]].map(([n, s, l]) => (
              <div key={l as string} className="text-center">
                <div className="text-2xl font-extrabold text-primary md:text-4xl"><Counter to={n as number} suffix={s as string} /></div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <a href="#parceria" className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground"><ChevronDown /></a>
      </section>

      {/* Autoridade */}
      <section id="parceria" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>Programa Oficial</Badge>
          <h2 className="mt-6 text-3xl font-extrabold uppercase md:text-4xl">Acesso exclusivo através do programa <span className="text-gradient">Starlink Partner Solutions</span></h2>
          <p className="mt-6 text-muted-foreground">Somos parceiros oficiais autorizados, garantindo a você acesso legítimo e seguro à tecnologia de internet via satélite mais avançada do mundo.</p>
          <p className="mt-3 text-muted-foreground">Uma iniciativa conjunta com operadoras brasileiras para homologação e teste da rede Direct-to-Cell.</p>
          <div className="glass mx-auto mt-8 inline-flex items-center gap-3 rounded-2xl px-5 py-4 text-left">
            <BadgeCheck className="h-8 w-8 shrink-0 text-success" />
            <div><div className="font-bold">Selo de Credibilidade</div><div className="text-sm text-muted-foreground">Protocolo de Teste Autorizado - Fase de Integração de Rede</div></div>
          </div>
          <h3 className="mt-16 text-2xl font-bold">Por que confiar no Chip Virtual Starlink?</h3>
          <p className="mt-3 text-muted-foreground">Três pilares garantem que você recebe um produto oficial, seguro e com suporte de verdade — do primeiro clique até a ativação em qualquer canto do Brasil.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            [ShieldCheck, "Autorizada Starlink", "Certificação oficial Starlink para operar no Brasil, com selo autenticado e emissão de documentação de conformidade regulatória."],
            [Signal, "Acesso Garantido", "Conexão direta à rede oficial de satélites em órbita baixa, sem intermediários e com tráfego priorizado na infraestrutura Starlink."],
            [Headphones, "Suporte Dedicado", "Atendimento especializado 7 dias por semana, com equipe técnica treinada para ativar e resolver qualquer questão do seu chip."],
          ].map(([I, t, d]) => <Card key={t as string} Icon={I as any} title={t as string} text={d as string} />)}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="scroll-mt-16 border-y border-border bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center">
            <Badge>Tecnologia Direct-to-Cell</Badge>
            <h2 className="mt-6 text-3xl font-extrabold md:text-5xl">O Que é o <span className="text-gradient">Chip Virtual Starlink</span>?</h2>
            <p className="mt-6 text-muted-foreground">O Chip Virtual Starlink utiliza a revolucionária tecnologia Direct-to-Cell, que transforma os satélites em órbita em torres de celular no espaço. Isso significa que seu smartphone pode se conectar diretamente aos satélites, sem necessidade de antenas externas ou equipamentos adicionais.</p>
          </div>
          <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
            <img src={phone.url} alt="Videochamada no celular em alto mar" className="w-full rounded-3xl border border-border object-cover glow" />
            <div>
              <h3 className="text-2xl font-bold md:text-3xl">Satélites como Torres de Celular no Espaço</h3>
              <p className="mt-4 text-muted-foreground">A constelação Starlink opera com mais de 7.000 satélites em órbita baixa (LEO), criando uma rede global de conectividade sem precedentes. Diferente da internet via satélite tradicional, a tecnologia Direct-to-Cell permite que qualquer smartphone moderno se conecte diretamente, transformando seu aparelho em um verdadeiro modem via satélite.</p>
              <ul className="mt-6 space-y-3">
                {["Funciona com qualquer smartphone Android ou iOS", "Não precisa de antena externa ou equipamentos", "Cobertura em áreas remotas, rurais e marítimas", "Ideal para viagens, barcos, fazendas e expedições"].map((t) => (
                  <li key={t} className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"><Check className="h-4 w-4" /></span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              [Globe, "Cobertura Global", "Mais de 7.000 satélites em órbita baixa garantem cobertura em praticamente qualquer lugar do planeta, incluindo áreas onde as operadoras tradicionais não chegam."],
              [Smartphone, "Sem Equipamentos", "Diferente da Starlink tradicional, você não precisa de antena ou equipamentos especiais. Seu smartphone atual é tudo que você precisa para se conectar."],
              [Zap, "Baixa Latência", "Por operar em órbita baixa (550km), a Starlink oferece latência muito menor que satélites tradicionais, permitindo chamadas de vídeo, streaming e navegação fluida."],
            ].map(([I, t, d]) => <Card key={t as string} Icon={I as any} title={t as string} text={d as string} />)}
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section id="para-quem" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold md:text-5xl">Para Quem é o <span className="text-gradient">Chip Virtual</span>?</h2>
          <p className="mt-5 text-muted-foreground">Se você precisa de internet em lugares onde as operadoras tradicionais não chegam, o Chip Virtual Starlink é a solução ideal para você.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [Tractor, "Produtores Rurais", "Mantenha-se conectado na fazenda, monitore equipamentos IoT e gerencie seu negócio de qualquer lugar da propriedade."],
            [Ship, "Navegadores e Pescadores", "Internet confiável em alto mar para comunicação, navegação GPS e emergências. Nunca mais fique isolado."],
            [Mountain, "Aventureiros e Viajantes", "Trilhas, acampamentos e expedições em locais remotos com acesso garantido à internet para segurança e comunicação."],
            [Truck, "Motoristas e Caminhoneiros", "Conectividade nas estradas, mesmo em trechos sem cobertura de operadoras tradicionais."],
            [Building2, "Empresas em Áreas Remotas", "Operações de mineração, construção civil e energia em locais isolados com internet estável."],
            [Users, "Comunidades Isoladas", "Acesso à educação, telemedicina e serviços essenciais para comunidades em regiões sem infraestrutura."],
          ].map(([I, t, d]) => <Card key={t as string} Icon={I as any} title={t as string} text={d as string} />)}
        </div>
      </section>

      {/* Oferta */}
      <section id="oferta" className="scroll-mt-16 border-y border-border bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold md:text-5xl">Adquira Seu <span className="text-gradient">Plano Starlink</span></h2>
            <p className="mt-4 text-muted-foreground">Escolha o plano ideal para você e comece a usar hoje mesmo</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Escolha seu Plano", "Selecione o plano que melhor atende às suas necessidades."],
              ["Baixe o App", "Instale o App Modem Virtual disponível para Android e iOS."],
              ["Conecte-se", "Pronto! Seu celular agora funciona como um modem via satélite."],
            ].map(([t, d], i) => (
              <div key={t} className="glass rounded-2xl p-6">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand font-extrabold text-primary-foreground">{i + 1}</div>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <span className="mx-auto mt-16 block w-fit rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background">2 Meses de Uso Grátis</span>
          <div className="mx-auto mt-10 grid max-w-4xl items-stretch gap-6 md:grid-cols-3">
            {plans.map((p, i) => (
              <div
                key={p.data}
                onClick={() => setPlan(i)}
                className={`group relative flex cursor-pointer flex-col rounded-2xl border p-6 text-left transition duration-300 hover:-translate-y-1.5 ${plan === i ? "border-foreground/60 bg-card" : "border-border bg-card/60 hover:border-foreground/30"}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-4 py-1 text-xs font-bold text-background">Mais Popular</span>
                )}
                <span className="w-fit rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background">{p.data}</span>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="mb-6 mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10"><Check className="h-3 w-3" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <span className={`mt-auto w-full rounded-full py-3 text-center text-sm font-bold transition ${plan === i ? "bg-foreground text-background" : "bg-white/10 text-foreground/80 group-hover:bg-white/15"}`}>
                  {plan === i ? "Selecionado" : "Selecionar"}
                </span>
              </div>
            ))}
          </div>
          <div className="glass mx-auto mt-12 max-w-3xl rounded-2xl p-7 text-center">
            <h3 className="text-lg font-bold">Como Funciona o Pagamento</h3>
            <div className="mt-7 grid gap-7 sm:grid-cols-3">
              {[
                ["Compra do Chip", `R$ ${plans[plan]?.price ?? "59,98"}`, "Valor do chip escolhido pago agora"],
                ["Ativação do Chip", "Diretamente com o gerente", "Ativação Starlink personalizada"],
                ["Após 2 Meses", `R$ ${plans[plan]?.price ?? "59,98"}`, "Primeira mensalidade do plano"],
              ].map(([t, m, d], i) => (
                <div key={t} className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-sm font-bold text-background">{i + 1}</div>
                  <div className="mt-3 text-sm font-bold">{t}</div>
                  <div className="mt-1 text-lg font-extrabold">{m}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>
            <p className="mt-7 text-sm text-muted-foreground">Você terá 2 meses de uso grátis. A primeira mensalidade só será cobrada após esse período. Cancele quando quiser.</p>
          </div>
          <Link to="/checkout" search={(prev: Record<string, unknown>) => ({ ...prev, plano: plan })} ref={buyRef} className="mx-auto mt-8 block w-fit rounded-full bg-foreground px-10 py-4 text-lg font-bold text-background transition hover:scale-[1.02] hover:opacity-90">Comprar Chip Agora</Link>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold md:text-5xl">O que estão dizendo</h2>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Stars /><span className="text-2xl font-extrabold">4,9</span><span className="text-sm text-muted-foreground">baseado em 2.847 avaliações</span>
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            ["Moro em zona rural e nunca tive sinal decente. Com o Chip Virtual Starlink, hoje faço videochamada com meus filhos sem travar. Mudou minha rotina.", "RS", "Ricardo S.", "Bahia · há 3d"],
            ["Uso na comunidade ribeirinha onde trabalho como enfermeira. Consigo acessar prontuários e falar com médicos em Manaus. Simplesmente essencial.", "AL", "Ana L.", "Amazonas · há 6d"],
            ["Sou caminhoneiro. Antes ficava horas sem sinal em estradas. Agora tenho GPS, WhatsApp e streaming rodando o tempo todo. Recomendo demais.", "PM", "Paulo M.", "Mato Grosso do Sul · há 9d"],
            ["Tenho pousada em área rural e meus hóspedes exigiam Wi-Fi. Instalação zero, ativei o chip e resolvi o problema no mesmo dia. Vale cada centavo.", "JC", "Juliana C.", "Rio Grande do Sul · há 12d"],
          ].map(([q, a, n, o]) => (
            <div key={n} className="glass rounded-2xl p-6">
              <Stars />
              <p className="mt-4 italic text-foreground/90">"{q}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">{a}</div>
                <div><div className="font-semibold">{n}</div><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{o}</div></div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground"><BadgeCheck className="h-4 w-4 text-success" />Avaliações verificadas · clientes que compraram e receberam</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <img src={logo.url} alt="Starlink" className="h-6 w-auto" />
            <nav className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
              {[...nav, ["Termos de Uso", "#"], ["Política de Privacidade", "#"]].map(([l, h]) => <a key={l} href={h} className="hover:text-foreground">{l}</a>)}
            </nav>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            <p>Este serviço é oferecido em parceria com a tecnologia Starlink Direct-to-Cell. Starlink é uma marca registrada da SpaceX. A disponibilidade do serviço pode variar de acordo com a localização e cobertura de satélites.</p>
            <p className="mt-3">© 2026 Chip Virtual Starlink. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stars() {
  return <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-star text-star" />)}</div>;
}

function Card({ Icon, title, text }: { Icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-primary/40">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
