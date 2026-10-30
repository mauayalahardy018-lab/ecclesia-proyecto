export function parseCents(input) {
  const value = String(input);
  if (!/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value))
    throw new Error("Monto inválido: usa pesos con máximo dos decimales");
  const [pesos, fraction = ""] = value.split(".");
  const cents = BigInt(pesos) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents > 9223372036854775807n) throw new Error("Monto fuera de rango");
  return cents;
}

export function centsToPesos(cents) {
  const amount = BigInt(cents);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, "0")}`;
}
