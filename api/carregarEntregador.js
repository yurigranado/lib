export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { cpf } = req.body;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const API_KEY = process.env.SUPABASE_API_KEY;

    if (!SUPABASE_URL || !API_KEY) {
      return res.status(500).json({ erro: "Chaves ausentes" });
    }

    // 1️⃣ Buscar entregador
    const resEntregador = await fetch(`${SUPABASE_URL}/rest/v1/entregadores?cpf=eq.${cpf}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const dados = await resEntregador.json();
    if (!dados.length) {
      return res.status(200).json({ status: "nao_encontrado" });
    }

    const entregador_id = dados[0].id;
    const nome = dados[0].nome;

    // 2️⃣ Buscar vínculos
    const resVinculo = await fetch(`${SUPABASE_URL}/rest/v1/vinculos_entregadores?entregador_id=eq.${entregador_id}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const vinculos = await resVinculo.json();

    return res.status(200).json({
      status: "ok",
      entregador_id,
      nome,
      vinculos
    });

  } catch (erro) {
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
