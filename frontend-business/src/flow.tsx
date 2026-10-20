import { createContext, useContext, useState, type ReactNode } from "react";
import type { Quote } from "./types";
const Flow = createContext<{
  quote: Quote | null;
  setQuote: (quote: Quote) => void;
} | null>(null);
export function TripFlowProvider({ children }: { children: ReactNode }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  return <Flow.Provider value={{ quote, setQuote }}>{children}</Flow.Provider>;
}
export function useTripFlow() {
  const flow = useContext(Flow);
  if (!flow) throw new Error("Falta el contexto de viajes Business.");
  return flow;
}
