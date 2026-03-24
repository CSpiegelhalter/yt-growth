export async function startCheckout(): Promise<string> {
  const res = await fetch("/api/integrations/stripe/checkout", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(
      data.message ?? "Failed to start checkout. Please try again.",
    );
  }
  return data.url;
}
