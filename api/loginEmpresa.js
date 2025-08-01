export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    console.log("🔐 Requisição recebida.");

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const bodyString = Buffer.concat(buffers).toString();
    console.log("📦 Corpo bruto recebido:", bodyString);

    const { email, senha } = JSON.parse(bodyString);
    console.log("📧 Email recebido:", email);
    console.log("🔑 Senha recebida (MD5):", senha);

    const API_KEY = process.env.SUPABASE_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;

    if (!API_KEY || !SUPABASE_URL) {
      console.error("❌ Variáveis de ambiente ausentes!");
      return res.status(500).json({ erro: "Variáveis de ambiente não configuradas" });
    }

    console.log("🌐 Conectando no Supabase como empresa...");
    const resEmpresa = await fetch(`${SUPABASE_URL}/rest/v1/empresas?email=eq.${email}&senha=eq.${senha}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });
    const dadosEmpresa = await resEmpresa.json();
    console.log("🏢 Resultado empresa:", dadosEmpresa);

    if (dadosEmpresa.length === 1) {
      console.log("✅ Login empresa OK");
      return res.status(200).json({ tipo: "empresa", dados: dadosEmpresa[0] });
    }

    console.log("🔁 Tentando como terceirizada...");
    const resTerceira = await fetch(`${SUPABASE_URL}/rest/v1/terceirizadas?email=eq.${email}&senha=eq.${senha}`, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`
      }
    });
    const dadosTerceira = await resTerceira.json();
    console.log("🚚 Resultado terceirizada:", dadosTerceira);

    if (dadosTerceira.length === 1) {
      console.log("✅ Login terceirizada OK");
      return res.status(200).json({ tipo: "terceirizada", dados: dadosTerceira[0] });
    }

    console.warn("❌ Nenhuma conta encontrada.");
    return res.status(401).json({ erro: "Login inválido" });

  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
  }
}
