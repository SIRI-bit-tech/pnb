export interface MockStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  sparkline: number[];
}

export interface Holding {
  id?: string;
  ticker: string;
  name?: string;
  shares: number;
  avg_cost?: number;
  avgCost?: number;
  current_price?: number;
  value?: number;
  gain_loss?: number;
  gain_loss_percent?: number;
  type: "long" | "short";
}

export type TradeType = "buy" | "sell" | "short" | "cover";
export type TransferType = "deposit" | "withdraw";
