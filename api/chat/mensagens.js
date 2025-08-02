export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { contrato_id, entregador_id } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const API_KEY = process.env.SUPABASE_API_KEY;

  if (!SUPABASE_URL || !API_KEY) return res.status(500).json({ erro: "Chaves ausentes" });

  if (!contrato_id || !entregador_id) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }

  try {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat?contrato_id=eq.${contrato_id}&entregador_id=eq.${entregador_id}&order=criado_em.asc`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
    });

    const mensagens = await resposta.json();
    return res.status(200).json(mensagens);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar mensagens", detalhes: err.message });
  }
}
