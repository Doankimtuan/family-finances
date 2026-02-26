export type QuantityPoint = {
  id: string;
  as_of_date: string;
  quantity: number;
};

export type PricePoint = {
  id: string;
  as_of_date: string;
  unit_price: number;
};

export type ValuationPoint = {
  date: string;
  quantity: number;
  unitPrice: number;
  value: number;
};

export function buildValuationTimeline(
  quantityHistory: QuantityPoint[],
  priceHistory: PricePoint[],
): ValuationPoint[] {
  const quantitySorted = [...quantityHistory].sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));
  const priceSorted = [...priceHistory].sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));

  const allDates = new Set<string>();
  quantitySorted.forEach((point) => allDates.add(point.as_of_date));
  priceSorted.forEach((point) => allDates.add(point.as_of_date));

  const sortedDates = [...allDates].sort((a, b) => a.localeCompare(b));

  let qIndex = 0;
  let pIndex = 0;
  let currentQ = 0;
  let currentP = 0;

  const timeline: ValuationPoint[] = [];

  for (const date of sortedDates) {
    while (qIndex < quantitySorted.length && quantitySorted[qIndex].as_of_date <= date) {
      currentQ = Number(quantitySorted[qIndex].quantity);
      qIndex += 1;
    }

    while (pIndex < priceSorted.length && priceSorted[pIndex].as_of_date <= date) {
      currentP = Number(priceSorted[pIndex].unit_price);
      pIndex += 1;
    }

    timeline.push({
      date,
      quantity: currentQ,
      unitPrice: currentP,
      value: currentQ * currentP,
    });
  }

  return timeline;
}
