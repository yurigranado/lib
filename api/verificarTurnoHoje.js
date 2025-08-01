export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { entregador_id } = req.body;
    console.log("🔎 Iniciando verificação de turno para:", entregador_id);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const API_KEY = process.env.SUPABASE_API_KEY;

    if (!SUPABASE_URL || !API_KEY) {
      console.error("❌ Chaves de acesso ausentes");
      return res.status(500).json({ erro: "Chaves de acesso ausentes" });
    }

    // 🔎 Buscar terceirizada ativa
    const empresaRes = await fetch(`${SUPABASE_URL}/rest/v1/status_entregador?entregador_id=eq.${entregador_id}&ativo=eq.true&select=terceirizada_id`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const empresaData = await empresaRes.json();
    if (!empresaData.length) return res.status(200).json({ status: "sem_empresa" });

    const terceirizada_id = empresaData[0].terceirizada_id;

    // 🔎 Buscar contrato
    const contratoRes = await fetch(`${SUPABASE_URL}/rest/v1/contratos_empresas_terceirizadas?terceirizada_id=eq.${terceirizada_id}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const contrato = await contratoRes.json();
    const contrato_id = contrato[0]?.id;
    const empresa_id = contrato[0]?.empresa_id;
    if (!contrato_id || !empresa_id) return res.status(200).json({ status: "sem_contrato" });

    // 🔎 Verificar chegada ativa
    const chegadaRes = await fetch(`${SUPABASE_URL}/rest/v1/confirmacoes_chegada?contrato_id=eq.${contrato_id}&or=(encerrado.is.false,encerrado.is.null)&select=data,turno,entregador_id`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const todas = await chegadaRes.json();
    const chegadas = todas.filter(c => String(c.entregador_id) === String(entregador_id));

    if (chegadas.length > 0) {
      const ultima = chegadas.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
      const dataHora = new Date(ultima.data);
      const dataBrasilia = new Date(dataHora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      return res.status(200).json({
        status: "chegada_existente",
        data: dataBrasilia.toLocaleDateString("pt-BR"),
        hora: dataBrasilia.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      });
    }

    // 🔎 Buscar ESCALA do entregador
    const diaSemana = new Date().toLocaleString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" }).toLowerCase();
    const escalaRes = await fetch(`${SUPABASE_URL}/rest/v1/escala_semana?entregador_id=eq.${entregador_id}&contrato_id=eq.${contrato_id}&dia_semana=eq.${diaSemana}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const escalaHoje = await escalaRes.json();

    if (!escalaHoje.length) {
      console.warn("⚠️ Entregador não está escalado para hoje");
      return res.status(200).json({ status: "fora_do_horario" });
    }

    // 🔎 Buscar horários da empresa
    const empresaTurnoRes = await fetch(`${SUPABASE_URL}/rest/v1/empresa_turnos?empresa_id=eq.${empresa_id}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const turnosEmpresa = await empresaTurnoRes.json();

    const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    for (const esc of escalaHoje) {
      const turnoNome = esc.turno.toLowerCase();
      const infoTurno = turnosEmpresa.find(t => t.nome_turno.toLowerCase() === turnoNome);
      if (!infoTurno) continue;

      const [h, m] = infoTurno.horario_inicio.split(":");
      const inicio = new Date(agora);
      inicio.setHours(+h);
      inicio.setMinutes(+m - 15);

      const [hf, mf] = infoTurno.horario_fim.split(":");
      const fim = new Date(agora);
      fim.setHours(+hf);
      fim.setMinutes(+mf);

      if (agora >= inicio && agora <= fim) {
        return res.status(200).json({
          status: "pode_confirmar",
          turno: turnoNome,
          contrato_id
        });
      }
    }

    return res.status(200).json({ status: "fora_do_horario" });

  } catch (erro) {
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
