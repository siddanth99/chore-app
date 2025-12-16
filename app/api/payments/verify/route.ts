import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/server/db/client";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment parameters" },
        { status: 400 }
      );
    }

    if (!KEY_SECRET) {
      console.error("Missing RAZORPAY_KEY_SECRET");
      return NextResponse.json(
        { success: false, error: "Server payment configuration error" },
        { status: 500 }
      );
    }

    // Find existing payment record
    const existing = await prisma.razorpayPayment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay signature for order:", razorpay_order_id);

      // Update payment record to FAILED if it exists
      if (existing) {
        await prisma.razorpayPayment.update({
          where: { razorpayOrderId: razorpay_order_id },
          data: {
            status: "FAILED",
            meta: {
              ...(existing.meta as Record<string, any> || {}),
              failedReason: "INVALID_SIGNATURE",
              verifiedAt: new Date().toISOString(),
            },
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Signature is valid - update payment record to SUCCESS
    if (!existing) {
      // Payment record not found - log warning but still return success
      console.warn(
        "RazorpayPayment row not found for order:",
        razorpay_order_id,
        "- payment verified but not tracked in DB"
      );
    } else {
      // Note: transferId should already be stored from create-order response
      // But we can also fetch it from Razorpay payment/order API if needed
      await prisma.razorpayPayment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          meta: {
            ...(existing.meta as Record<string, any> || {}),
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      // Update chore payment status and status to FUNDED if choreId exists
      // Make this idempotent - if already FUNDED, just return success
      if (existing.choreId) {
        const chore = await prisma.chore.findUnique({
          where: { id: existing.choreId },
          select: { paymentStatus: true, status: true },
        });

        // Only update if not already FUNDED (idempotency)
        if (chore && chore.paymentStatus !== "FUNDED") {
          await prisma.chore.update({
            where: { id: existing.choreId },
            data: {
              paymentStatus: "FUNDED",
              status: "FUNDED", // Escrow funded - ready for worker to start
            },
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Payment verified and chore funded",
    }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/payments/verify:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error verifying payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
