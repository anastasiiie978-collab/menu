export function formatSom(price: number) {
  return `${price.toLocaleString("uz-UZ").replace(/,/g, " ")} so'm`;
}
