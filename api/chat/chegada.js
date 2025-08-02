export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { entregador_id } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const API_KEY = process.env.SUPABASE_API_KEY;

  if (!SUPABASE_URL || !API_KEY) return res.status(500).json({ erro: "Chaves ausentes" });

  try {
    const hoje = new Date().toISOString().split("T")[0];

    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/confirmacoes_chegada?entregador_id=eq.${entregador_id}&encerrado=eq.false&select=contrato_id,data`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });

    const chegadas = await resposta.json();
    const temHoje = chegadas.find(c => c.data?.startsWith(hoje));

    if (!temHoje) return res.status(200).json({ status: "sem_chegada" });

    return res.status(200).json({
      status: "autorizado",
      contrato_id: temHoje.contrato_id
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao verificar chegada", detalhes: err.message });
  }
}
