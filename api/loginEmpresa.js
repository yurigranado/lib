export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  let rawBody = "";

  req.on("data", chunk => {
    rawBody += chunk;
  });

  req.on("end", async () => {
    try {
      const { email, senha } = JSON.parse(rawBody);

      const API_KEY = process.env.SUPABASE_API_KEY;
      const SUPABASE_URL = process.env.SUPABASE_URL;

      if (!API_KEY || !SUPABASE_URL) {
        return res.status(500).json({ erro: "Variáveis de ambiente ausentes" });
      }

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

      return res.status(401).json({ erro: "Login inválido" });

    } catch (erro) {
      return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
    }
  });
}
