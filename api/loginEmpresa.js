// /api/loginEmpresa.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { email, senha } = JSON.parse(req.body);

  const API_KEY = process.env.SUPABASE_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;

  try {
    // 1️⃣ Verifica como restaurante
    const resEmpresa = await fetch(`${SUPABASE_URL}/rest/v1/empresas?email=eq.${email}&senha=eq.${senha}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const dadosEmpresa = await resEmpresa.json();
    if (dadosEmpresa.length === 1) {
      return res.status(200).json({ tipo: "empresa", dados: dadosEmpresa[0] });
    }

    // 2️⃣ Verifica como terceirizada
    const resTerceira = await fetch(`${SUPABASE_URL}/rest/v1/terceirizadas?email=eq.${email}&senha=eq.${senha}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const dadosTerceira = await resTerceira.json();
    if (dadosTerceira.length === 1) {
      return res.status(200).json({ tipo: "terceirizada", dados: dadosTerceira[0] });
    }

    // ❌ Nenhum login válido
    return res.status(401).json({ erro: "Login inválido" });

  } catch (erro) {
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
