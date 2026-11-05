import type { CustomSiteOrder } from "@/lib/custom-site/paid";

/** Where an order is, in the seller's words. */
export function orderStatus(order: CustomSiteOrder): string {
  if (order.cancelled_at) return "Cancelado";
  if (order.finished_at) return "Concluído";
  if (order.adjustment_requested_at) return "Ajuste pedido";
  if (order.delivered_at) return "Entregue";
  if (order.paid_at && order.briefing_sent_at) return "Em produção";
  if (order.paid_at) return "Pago, falta o briefing";
  if (order.briefing_sent_at) return "Aguardando pagamento";
  return "Preenchendo o briefing";
}

/** Less than a day to the promised date (or past it), while still not delivered. */
export function orderLate(order: CustomSiteOrder, now = Date.now()): boolean {
  return Boolean(
    order.due_at && !order.delivered_at && Date.parse(order.due_at) - now < 86_400_000,
  );
}
