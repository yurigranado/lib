export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const API_KEY = process.env.SUPABASE_API_KEY;
  const { contrato_id } = req.body;

  if (!SUPABASE_URL || !API_KEY) {
    return res.status(500).json({ erro: "Chaves de acesso ausentes" });
  }

  if (!contrato_id) {
    return res.status(400).json({ erro: "Contrato ID ausente" });
  }

  try {
    // Buscar o empresa_id do contrato
    const contratoRes = await fetch(`${SUPABASE_URL}/rest/v1/contratos_empresas_terceirizadas?id=eq.${contrato_id}&select=empresa_id`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const contrato = await contratoRes.json();
    const empresa_id = contrato[0]?.empresa_id;

    if (!empresa_id) return res.status(404).json({ erro: "Empresa não encontrada para o contrato" });

    // Buscar o nome da empresa
    const empresaRes = await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${empresa_id}&select=nome`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const empresa = await empresaRes.json();
    const nome = empresa[0]?.nome || "Restaurante";

    return res.status(200).json({ nome });
  } catch (erro) {
    console.error("❌ Erro ao buscar nome do restaurante:", erro);
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
