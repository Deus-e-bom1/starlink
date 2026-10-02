export const plans = [
  { data: "150 GB", price: "49,98", features: ["1 Conexão Simultânea", "Sinal Via Satélite", "Chip Virtual / Físico"] },
  { data: "450 GB", price: "59,98", popular: true, features: ["3 Conexões Simultâneas", "Sinal Via Satélite", "Chip Virtual / Físico"] },
  { data: "600 GB", price: "79,98", features: ["6 Conexões Simultâneas", "Velocidade Extraordinária", "Sinal Via Satélite", "Chip Físico"] },
] as { data: string; price: string; popular?: boolean; features: string[] }[];
