/**
 * Paystack client for generating payment URLs
 * Requires PAYSTACK_SECRET_KEY env variable
 */

import { serverConfig } from "../config";

const PAYSTACK_API_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = serverConfig.PAYSTACK_SECRET_KEY || "";

interface PaystackPaymentParams {
  email: string;
  amount: number; // in kobo (smallest denomination)
  reference: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function generatePaystackUrl(
  params: PaystackPaymentParams,
): Promise<string> {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn("PAYSTACK_SECRET_KEY not configured, using dummy URL");
    return `https://paystack.com/pay/${params.reference}`;
  }

  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
      }),
    });

    const data: PaystackInitializeResponse = await response.json();

    if (data.status && data.data?.authorization_url) {
      return data.data.authorization_url;
    }

    console.error("Paystack API error:", data.message);
    return `https://paystack.com/pay/${params.reference}`;
  } catch (error) {
    console.error("Error calling Paystack API:", error);
    return `https://paystack.com/pay/${params.reference}`;
  }
}

export async function verifyPaystackPayment(
  reference: string,
): Promise<boolean> {
  if (!PAYSTACK_SECRET_KEY) {
    return true; // Allow in development
  }

  try {
    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();
    return data.status === true && data.data?.status === "success";
  } catch (error) {
    console.error("Error verifying Paystack payment:", error);
    return false;
  }
}
