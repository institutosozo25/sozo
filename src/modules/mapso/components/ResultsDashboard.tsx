import { useAssessment } from "../contexts/AssessmentContext";
import { getInterventionRecommendations } from "../lib/miarpo-engine";
import { getRiskClassification, RISK_CLASSIFICATIONS } from "../data/miarpo-questionnaire";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Shield, AlertTriangle, TrendingDown, TrendingUp, FileText,
  RotateCcw, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSozo from "../assets/logo-sozo.png";

const ResultsDashboard = () => {
  const { result, organization, resetAssessment } = useAssessment();

  if (!result) return null;

  const recommendations = getInterventionRecommendations(result);

  const radarData = result.dimensions.map((d) => ({
    dimension: d.shortName,
    risco: Math.round(d.riskScore),
    fullMark: 100,
  }));

  const barData = result.dimensions.map((d) => ({
    name: d.shortName,
    score: Math.round(d.riskScore),
    color: d.classification.color,
  }));

  const riskColor = result.irpClassification.color;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl animate-fade-up">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={logoSozo} alt="Sozo" className="h-10 rounded-lg bg-primary p-1.5" />
            <div>
              <h1 className="mb-1 text-3xl font-bold text-foreground font-heading">Dashboard Executivo MAPSO</h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {organization?.name ?? "Organização"} · {organization?.sector} · {result.totalRespondents} respondentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetAssessment} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Nova Avaliação
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Índice de Risco (IRP)" value={`${result.irp}`} subtitle={result.irpClassification.label} color={riskColor} icon={<Shield className="h-5 w-5" />} />
          <KpiCard title="Índice de Proteção (IPP)" value={`${result.ipp}`} subtitle="100 − IRP" color="hsl(152, 60%, 42%)" icon={<TrendingUp className="h-5 w-5" />} />
          <KpiCard title="Vulnerabilidade (IVO)" value={`${result.ivo}/8`} subtitle="Dimensões > 60 pontos" color={result.ivo >= 3 ? "hsl(358, 83%, 56%)" : "hsl(33, 97%, 49%)"} icon={<AlertTriangle className="h-5 w-5" />} />
          <KpiCard title="Classificação" value={result.irpClassification.label} subtitle={result.irpClassification.description} color={riskColor} icon={<TrendingDown className="h-5 w-5" />} />
        </div>

        {/* Charts */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Perfil Dimensional de Risco</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 18%, 89%)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(220, 12%, 50%)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Risco" dataKey="risco" stroke="hsl(222, 95%, 28%)" fill="hsl(228, 88%, 57%)" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Score por Dimensão</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 92%)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => [`${v} pts`, "Score de Risco"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension Details */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">Diagnóstico por Dimensão</h3>
          <div className="space-y-3">
            {result.dimensions.map((d) => (
              <div key={d.dimensionId} className="flex items-center gap-4 rounded-lg border border-border p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ backgroundColor: d.classification.color + "20", color: d.classification.color }}
                >
                  {Math.round(d.riskScore)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-card-foreground">{d.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: d.classification.color + "18", color: d.classification.color }}
                    >
                      {d.classification.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Peso: {(d.weight * 100).toFixed(0)}% · {d.classification.description}</p>
                </div>
                <div className="hidden w-48 sm:block">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${d.riskScore}%`, backgroundColor: d.classification.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Scale Legend */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-card-foreground">Escala de Classificação de Risco</h3>
          <div className="flex flex-wrap gap-3">
            {RISK_CLASSIFICATIONS.map((rc) => (
              <div key={rc.level} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: rc.color }} />
                <span className="text-xs font-medium text-card-foreground">{rc.range[0]}–{rc.range[1]}</span>
                <span className="text-xs text-muted-foreground">{rc.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <FileText className="h-5 w-5 text-primary" /> Recomendações de Intervenção
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          Relatório gerado em {new Date(result.completedAt).toLocaleDateString("pt-BR")} · Instituto Plenitude Sozo Business · MAPSO
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, subtitle, color, icon }: { title: string; value: string; subtitle: string; color: string; icon: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      <div style={{ color }}>{icon}</div>
    </div>
    <div className="mb-1 text-3xl font-bold" style={{ color }}>{value}</div>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </div>
);

export default ResultsDashboard;
