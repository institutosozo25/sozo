import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Eye, UserCircle } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const actionLabels: Record<string, string> = {
  view_report: "Visualizou relatório",
  generate_report: "Gerou relatório",
  login: "Login",
  signup: "Cadastro",
};

const actionColors: Record<string, string> = {
  view_report: "bg-secondary/10 text-secondary",
  generate_report: "bg-accent/10 text-accent",
  login: "bg-primary/10 text-primary",
  signup: "bg-sozo-green/10 text-sozo-green",
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  async function fetchLogs() {
    setIsLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("action", filter);
    }

    const { data } = await query;
    setLogs((data as AuditLog[]) || []);
    setIsLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <ScrollText className="w-8 h-8" /> Logs de Auditoria
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="view_report">Visualização de relatório</SelectItem>
            <SelectItem value="generate_report">Geração de relatório</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum registro de auditoria encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="py-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      {log.action === "view_report" ? (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {actionLabels[log.action] || log.action}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.entity_type}{log.entity_id ? ` → ${log.entity_id.slice(0, 8)}...` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={actionColors[log.action] || "bg-muted text-muted-foreground"}>
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <p className="text-xs text-muted-foreground font-mono">
                  user: {log.user_id ? `${log.user_id.slice(0, 12)}...` : "anônimo"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
