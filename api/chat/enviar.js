export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const API_KEY = process.env.SUPABASE_API_KEY;

  const { contrato_id, entregador_id, remetente_tipo, remetente_id, mensagem } = req.body;

  if (!contrato_id || !entregador_id || !remetente_tipo || !remetente_id || !mensagem) {
    return res.status(400).json({ erro: "Campos obrigatórios ausentes" });
  }

  try {
    const payload = {
      contrato_id,
      entregador_id,
      remetente_tipo,
      remetente_id,
      mensagem,
      criado_em: new Date().toISOString()
    };

    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat`, {
      method: "POST",
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      return res.status(400).json({ erro: "Erro ao salvar mensagem", detalhes: erroTexto });
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao enviar mensagem", detalhes: err.message });
  }
}
