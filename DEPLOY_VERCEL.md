# Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: Add New → Project → importe o repositório. Framework: "Other" (detecção automática). Não altere Build/Output.
3. Em Settings → Environment Variables, adicione:
   - SUPABASE_URL
   - SUPABASE_PUBLISHABLE_KEY
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
   - SUPABASE_SERVICE_ROLE_KEY  (chave secreta do banco — obrigatória para salvar pedidos)
   - SKALE_API_KEY              (chave da SkalePay)
4. Deploy. Depois, use https://SEU-DOMINIO/api/public/pix-webhook como URL de aviso na SkalePay.
