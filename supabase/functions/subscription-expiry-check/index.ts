import {
  getCorsHeaders, getAdminClient, logAuditEvent, errorResponse, jsonResponse,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminClient = getAdminClient();
    console.log("🔍 Iniciando verificação de assinaturas expiradas...");

    // Buscar profiles com assinaturas ativas mas que podem estar expiradas
    const { data: expiredProfiles, error: queryError } = await adminClient
      .from("profiles")
      .select("id, full_name, subscription_plan, subscription_status, asaas_customer_id")
      .eq("subscription_status", "active")
      .not("subscription_plan", "is", null);

    if (queryError) {
      console.error("Erro ao consultar profiles:", queryError);
      return errorResponse(corsHeaders, 500, "Erro interno ao consultar assinaturas.");
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      console.log("✅ Nenhuma assinatura ativa encontrada para verificar.");
      return jsonResponse(corsHeaders, { message: "Nenhuma assinatura ativa para verificar", processed: 0 });
    }

    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const ASAAS_BASE_URL = Deno.env.get("ASAAS_ENV") === "production"
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";

    if (!ASAAS_API_KEY) {
      console.error("❌ ASAAS_API_KEY não configurada");
      return errorResponse(corsHeaders, 503, "Gateway de pagamento não configurado.");
    }

    let processedCount = 0;
    let expiredCount = 0;

    for (const profile of expiredProfiles) {
      try {
        if (!profile.asaas_customer_id) {
          console.log(`⚠️ Profile ${profile.id} sem asaas_customer_id - pulando`);
          continue;
        }

        // Verificar status da assinatura no Asaas
        const subscriptionRes = await fetch(
          `${ASAAS_BASE_URL}/subscriptions?customer=${profile.asaas_customer_id}&status=ACTIVE`,
          {
            headers: { access_token: ASAAS_API_KEY },
          }
        );

        if (!subscriptionRes.ok) {
          console.error(`❌ Erro ao consultar Asaas para ${profile.id}:`, subscriptionRes.status);
          continue;
        }

        const subscriptionData = await subscriptionRes.json();
        const activeSubscriptions = subscriptionData.data || [];

        // Se não há assinaturas ativas no Asaas, revogar acesso
        if (activeSubscriptions.length === 0) {
          console.log(`🔴 Revogando acesso para ${profile.full_name || profile.id} - assinatura não encontrada no Asaas`);
          
          // Atualizar status para 'expired'
          const { error: updateError } = await adminClient
            .from("profiles")
            .update({ 
              subscription_status: "expired",
              updated_at: new Date().toISOString()
            })
            .eq("id", profile.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar profile ${profile.id}:`, updateError);
            continue;
          }

          // Log da auditoria
          await logAuditEvent(
            profile.id,
            "subscription_auto_expired",
            "subscription",
            null,
            { 
              reason: "assinatura_nao_encontrada_asaas",
              plan: profile.subscription_plan,
              previous_status: "active"
            }
          );

          expiredCount++;
        } else {
          // Verificar se alguma assinatura está realmente ativa
          const hasActiveSubscription = activeSubscriptions.some((sub: any) => 
            sub.status === "ACTIVE" && new Date(sub.nextDueDate) > new Date()
          );

          if (!hasActiveSubscription) {
            console.log(`🔴 Revogando acesso para ${profile.full_name || profile.id} - todas as assinaturas expiradas`);
            
            const { error: updateError } = await adminClient
              .from("profiles")
              .update({ 
                subscription_status: "expired",
                updated_at: new Date().toISOString()
              })
              .eq("id", profile.id);

            if (updateError) {
              console.error(`❌ Erro ao atualizar profile ${profile.id}:`, updateError);
              continue;
            }

            await logAuditEvent(
              profile.id,
              "subscription_auto_expired",
              "subscription",
              null,
              { 
                reason: "assinatura_expirada",
                plan: profile.subscription_plan,
                previous_status: "active",
                next_due_dates: activeSubscriptions.map((s: any) => s.nextDueDate)
              }
            );

            expiredCount++;
          }
        }

        processedCount++;
      } catch (error) {
        console.error(`❌ Erro ao processar profile ${profile.id}:`, error);
      }
    }

    console.log(`✅ Verificação concluída: ${processedCount} processados, ${expiredCount} expirados`);
    
    return jsonResponse(corsHeaders, { 
      message: "Verificação de assinaturas concluída",
      processed: processedCount,
      expired: expiredCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erro geral na verificação de assinaturas:", error);
    return errorResponse(corsHeaders, 500, "Erro interno na verificação de assinaturas.");
  }
});