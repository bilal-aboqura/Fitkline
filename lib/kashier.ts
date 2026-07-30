import "server-only";

type KashierSessionResponse = {
  _id?: string;
  sessionUrl?: string;
  status?: string;
  message?: string;
};

export type KashierVerificationResponse = {
  message?: string;
  data?: {
    sessionId?: string;
    status?: string;
    merchantOrderId?: string;
    orderId?: string;
    amount?: string;
    currency?: string;
  };
};

type CreateKashierSessionInput = {
  reference: string;
  amount: number;
  customerEmail: string;
  customerReference: string;
  origin: string;
};

export function getKashierConfiguration() {
  const merchantId = process.env.KASHIER_MERCHANT_ID ?? "";
  const apiKey = process.env.KASHIER_API_KEY ?? "";
  const secretKey = process.env.KASHIER_SECRET_KEY ?? "";
  const mode = process.env.KASHIER_MODE === "live" ? "live" : "test";
  return {
    merchantId,
    apiKey,
    secretKey,
    mode,
    ready: Boolean(merchantId && apiKey && secretKey),
  };
}

export async function createKashierSession(input: CreateKashierSessionInput) {
  const config = getKashierConfiguration();
  if (!config.ready) throw new Error("Kashier is not configured");

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const base =
    config.mode === "test"
      ? "https://test-api.kashier.io"
      : "https://api.kashier.io";
  const response = await fetch(`${base}/v3/payment/sessions`, {
    method: "POST",
    headers: {
      Authorization: config.secretKey,
      "api-key": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expireAt: expiresAt,
      maxFailureAttempts: 3,
      paymentType: "credit",
      amount: input.amount.toFixed(2),
      currency: "EGP",
      order: input.reference,
      merchantRedirect: `${input.origin}/checkout/result?order=${encodeURIComponent(input.reference)}`,
      display: "ar",
      type: "one-time",
      allowedMethods: "card,wallet",
      iframeBackgroundColor: "#07100a",
      merchantId: config.merchantId,
      failureRedirect: true,
      brandColor: "#b7ff18",
      defaultMethod: "card",
      description: `Fitkline order ${input.reference}`,
      manualCapture: false,
      customer: {
        email: input.customerEmail,
        reference: input.customerReference,
      },
      saveCard: "disabled",
      retrieveSavedCard: false,
      interactionSource: "ECOMMERCE",
      enable3DS: true,
      serverWebhook: `${input.origin}/api/payments/kashier/webhook`,
      notes: `Fitkline ${input.reference}`,
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as KashierSessionResponse;
  if (!response.ok || !result.sessionUrl || !result._id) {
    throw new Error(result.message ?? "Kashier session creation failed");
  }
  return { sessionId: result._id, sessionUrl: result.sessionUrl };
}

export async function verifyKashierSession(sessionId: string) {
  const config = getKashierConfiguration();
  if (!config.ready) throw new Error("Kashier is not configured");
  const base =
    config.mode === "test" ? "https://test-api.kashier.io" : "https://api.kashier.io";
  const response = await fetch(
    `${base}/v3/payment/sessions/${encodeURIComponent(sessionId)}/payment`,
    {
      headers: { Authorization: config.secretKey },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Unable to verify Kashier session");
  return response.json() as Promise<KashierVerificationResponse>;
}

export function inspectKashierPayment(
  response: KashierVerificationResponse,
  expected: {
    sessionId: string;
    reference: string;
    amount: number;
    currency: string;
  },
) {
  const data = response.data;
  const status = data?.status?.toUpperCase() ?? "";
  const reportedAmount = Number(data?.amount);
  const amountMatches =
    Number.isFinite(reportedAmount) &&
    Math.abs(reportedAmount - expected.amount) < 0.005;
  const currencyMatches =
    data?.currency?.toUpperCase() === expected.currency.toUpperCase();
  const referenceMatches = data?.merchantOrderId === expected.reference;
  const sessionMatches =
    !data?.sessionId || data.sessionId === expected.sessionId;
  const paidStatus = ["PAID", "SUCCESS", "CAPTURED"].includes(status);
  const failedStatus = ["FAILED", "CANCELLED", "EXPIRED"].includes(status);

  return {
    paid: paidStatus && amountMatches && currencyMatches && referenceMatches && sessionMatches,
    failed: failedStatus,
    integrityValid:
      amountMatches && currencyMatches && referenceMatches && sessionMatches,
    paymentId: data?.orderId,
    status,
  };
}
