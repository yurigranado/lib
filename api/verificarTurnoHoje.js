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
    console.log("📦 Terceirizada ativa encontrada:", empresaData);

    if (!empresaData.length) {
      console.warn("⚠️ Nenhuma terceirizada ativa");
      return res.status(200).json({ status: "sem_empresa" });
    }

    const terceirizada_id = empresaData[0].terceirizada_id;

    // 🔎 Buscar contrato
    const contratoRes = await fetch(`${SUPABASE_URL}/rest/v1/contratos_empresas_terceirizadas?terceirizada_id=eq.${terceirizada_id}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const contrato = await contratoRes.json();
    console.log("📄 Contrato:", contrato);

    const contrato_id = contrato[0]?.id;
    if (!contrato_id) {
      console.warn("⚠️ Sem contrato para a terceirizada");
      return res.status(200).json({ status: "sem_contrato" });
    }

    // 🔎 Verificar chegada ativa
    const chegadaRes = await fetch(`${SUPABASE_URL}/rest/v1/confirmacoes_chegada?contrato_id=eq.${contrato_id}&or=(encerrado.is.false,encerrado.is.null)&select=data,turno,entregador_id`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const todas = await chegadaRes.json();
    const chegadas = todas.filter(c => String(c.entregador_id) === String(entregador_id));
    console.log("🚪 Chegadas abertas encontradas:", chegadas.length);

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

    // 🔎 Buscar turnos da empresa
    const empresaTurnoRes = await fetch(`${SUPABASE_URL}/rest/v1/empresa_turnos?empresa_id=eq.${contrato[0].empresa_id}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const turnos = await empresaTurnoRes.json();
    console.log("🕒 Turnos da empresa:", turnos);

    const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    for (const turno of turnos) {
      const [horaStr, minutoStr] = turno.horario_inicio.split(":");
      const inicio = new Date(agora);
      inicio.setHours(+horaStr);
      inicio.setMinutes(+minutoStr - 15);

      const fim = new Date(inicio);
      fim.setMinutes(fim.getMinutes() + 360);

      const nomeTurno = turno.nome?.toLowerCase();
      console.log("⏳ Avaliando turno:", nomeTurno, "entre", inicio.toISOString(), "e", fim.toISOString());

      if ((nomeTurno === "jantar" || nomeTurno === "almoco") && agora >= inicio && agora <= fim) {
        console.log("✅ Turno válido:", nomeTurno);
        return res.status(200).json({
          status: "pode_confirmar",
          turno: nomeTurno,
          contrato_id
        });
      }
    }

    console.warn("⏳ Fora do horário permitido");
    return res.status(200).json({ status: "fora_do_horario" });

  } catch (erro) {
    console.error("💥 Erro interno no verificarTurnoHoje:", erro.message);
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
