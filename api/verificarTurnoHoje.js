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

    //  Verificar chegada ativa
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

    //  Buscar ESCALA do entregador
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
const empresaTurnoRes = await fetch(`${SUPABASE_URL}/rest/v1/empresa_turnos?empresa_id=eq.${contrato[0].empresa_id}`, {
  headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
});
const turnos = await empresaTurnoRes.json();

const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const hoje = diasSemana[agora.getDay()]; // exemplo: 'segunda'

const hoje = agora.toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase();

for (const turno of turnos) {
  const [horaStr, minutoStr] = turno.horario_inicio.split(":");
  const inicio = new Date(agora);
  inicio.setHours(+horaStr);
  inicio.setMinutes(+minutoStr - 15); // margem de 15min antes

  const fim = new Date(agora);
  const [horaFim, minFim] = turno.horario_fim.split(":");
  fim.setHours(+horaFim);
  fim.setMinutes(+minFim);

  const nomeTurno = turno.nome_turno?.toLowerCase();
  console.log("⏳ Avaliando turno:", nomeTurno, "entre", inicio.toISOString(), "e", fim.toISOString());

  if ((nomeTurno === "jantar" || nomeTurno === "almoco") && agora >= inicio && agora <= fim) {
    // 🔎 Verifica se o entregador está escalado hoje nesse turno
    const escalaRes = await fetch(`${SUPABASE_URL}/rest/v1/escala_semana?entregador_id=eq.${entregador_id}&contrato_id=eq.${contrato_id}&dia_semana=eq.${hoje}&turno=eq.${nomeTurno}`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });
    const escalado = await escalaRes.json();

    if (escalado.length > 0) {
      console.log("✅ Turno válido e entregador escalado:", nomeTurno);
      return res.status(200).json({
        status: "pode_confirmar",
        turno: nomeTurno,
        contrato_id
      });
    } else {
      console.warn("⚠️ Entregador NÃO escalado para esse turno:", nomeTurno);
    }
  }
}

console.warn("⏳ Fora do horário ou não escalado");
return res.status(200).json({ status: "fora_do_horario" });

    return res.status(200).json({ status: "fora_do_horario" });

  } catch (erro) {
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
