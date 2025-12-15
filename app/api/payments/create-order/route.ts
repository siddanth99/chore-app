import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/server/auth/role";
import { prisma } from "@/server/db/client";
import { isRouteMockEnabled, isRouteLiveEnabled } from "@/lib/paymentsConfig";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json().catch(() => null);
    const { amount, choreId, notes: clientNotes } = body ?? {};

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      console.error("Invalid amount in create-order:", body);
      return NextResponse.json(
        { error: "Invalid amount passed to create-order" },
        { status: 400 }
      );
    }

    // If choreId is provided, validate that the chore exists and belongs to the user
    let assignedWorker = null
    let workerPayoutPaise = null
    let platformFeePaise = null

    if (choreId) {
      const chore = await prisma.chore.findUnique({
        where: { id: choreId },
        select: {
          id: true,
          createdById: true,
          budget: true,
          paymentStatus: true,
          status: true,
          assignedWorkerId: true,
        },
      });

      if (!chore) {
        return NextResponse.json(
          { error: "Chore not found" },
          { status: 404 }
        );
      }

      if (chore.createdById !== userId) {
        return NextResponse.json(
          { error: "Unauthorized: You can only create payments for your own chores" },
          { status: 403 }
        );
      }

      // Enforce escrow model: chore must be ASSIGNED with a worker
      if (chore.status !== "ASSIGNED") {
        return NextResponse.json(
          { error: `Cannot create payment. Chore must be ASSIGNED to a worker first, but it is ${chore.status}` },
          { status: 400 }
        );
      }

      if (!chore.assignedWorkerId) {
        return NextResponse.json(
          { error: "Cannot create payment. Chore must have an assigned worker." },
          { status: 400 }
        );
      }

      if (chore.paymentStatus !== "UNPAID") {
        return NextResponse.json(
          { error: `Cannot create payment. Payment status must be UNPAID, but it is ${chore.paymentStatus}` },
          { status: 400 }
        );
      }

      // Fetch assigned worker to get razorpayAccountId
      assignedWorker = await prisma.user.findUnique({
        where: { id: chore.assignedWorkerId },
        select: {
          id: true,
          razorpayAccountId: true,
        },
      });

      if (!assignedWorker) {
        return NextResponse.json(
          { error: "Assigned worker not found" },
          { status: 404 }
        );
      }

      if (!assignedWorker.razorpayAccountId) {
        return NextResponse.json(
          { error: "Assigned worker has not completed payout onboarding" },
          { status: 400 }
        );
      }

      // Update chore paymentStatus to PENDING (status remains ASSIGNED)
      await prisma.chore.update({
        where: { id: choreId },
        data: { paymentStatus: "PENDING" },
      });
    }

    if (!KEY_ID || !KEY_SECRET) {
      console.error("Missing Razorpay env vars:", {
        hasKeyId: !!KEY_ID,
        hasKeySecret: !!KEY_SECRET,
      });
      return NextResponse.json(
        { error: "Server payment configuration error (env missing)" },
        { status: 500 }
      );
    }

    // Build notes object with user and chore info
    const notes = {
      ...clientNotes,
      userId,
      choreId: choreId ?? null,
      source: clientNotes?.source ?? "manual-test",
    };

    const razorpay = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });

    // Razorpay expects paise
    const amountInPaise = Math.round(amount * 100);

    // Calculate split payment if worker is assigned
    // Always compute fees (needed for both mock and live modes)
    if (assignedWorker && assignedWorker.razorpayAccountId) {
      // 10% platform fee, 90% to worker
      platformFeePaise = Math.round(amountInPaise * 0.10);
      workerPayoutPaise = amountInPaise - platformFeePaise;

      // MOCK MODE: Don't send transfers to Razorpay, generate fake transferId
      if (isRouteMockEnabled()) {
        // Create order WITHOUT transfers (works with regular Razorpay test account)
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          notes,
        });

        console.log("Razorpay order created (mock mode, no transfers):", {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        });

        // Generate fake transfer ID
        const fakeTransferId = `tr_mock_${order.id}`;

        // Create RazorpayPayment record with fake transferId
        const paymentRecord = await prisma.razorpayPayment.create({
          data: {
            userId,
            choreId: choreId ?? null,
            amount:
              typeof order.amount === "string"
                ? parseInt(order.amount, 10)
                : order.amount, // paise from Razorpay
            currency: order.currency,
            status: "PENDING",
            razorpayOrderId: order.id,
            platformFee: platformFeePaise,
            workerPayout: workerPayoutPaise,
            transferId: fakeTransferId,
            notes,
          },
        });

        // Return order details to client
        return NextResponse.json(
          {
            orderId: order.id,
            amount: order.amount, // paise
            currency: order.currency,
            paymentId: paymentRecord.id, // internal DB id
          },
          { status: 200 }
        );
      }

      // LIVE MODE: Include transfers in order payload
      if (isRouteLiveEnabled()) {
        const transfers = [
          {
            account: assignedWorker.razorpayAccountId,
            amount: workerPayoutPaise,
            currency: "INR",
            on_hold: true, // Hold until client approves
          },
        ];

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          notes,
          transfers,
        });

        console.log("Razorpay order created (live mode, with transfers):", {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        });

        // Extract transfer_id from order response (handles both array and collection shape)
let transferId: string | null = null;

if (order.transfers) {
  const transfersArray = Array.isArray(order.transfers)
    ? order.transfers
    : order.transfers.items;

  if (transfersArray && transfersArray.length > 0) {
    transferId = transfersArray[0]?.id ?? null;
  }
}

        // Create RazorpayPayment record
        const paymentRecord = await prisma.razorpayPayment.create({
          data: {
            userId,
            choreId: choreId ?? null,
            amount:
              typeof order.amount === "string"
                ? parseInt(order.amount, 10)
                : order.amount, // paise from Razorpay
            currency: order.currency,
            status: "PENDING",
            razorpayOrderId: order.id,
            platformFee: platformFeePaise,
            workerPayout: workerPayoutPaise,
            transferId: transferId,
            notes,
          },
        });

        // Return order details to client
        return NextResponse.json(
          {
            orderId: order.id,
            amount: order.amount, // paise
            currency: order.currency,
            paymentId: paymentRecord.id, // internal DB id
          },
          { status: 200 }
        );
      }
    }

    // No worker assigned - regular order creation (no transfers)
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      notes,
    });

    console.log("Razorpay order created:", {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    // Create RazorpayPayment record without transferId
    const paymentRecord = await prisma.razorpayPayment.create({
      data: {
        userId,
        choreId: choreId ?? null,
        amount:
          typeof order.amount === "string"
            ? parseInt(order.amount, 10)
            : order.amount, // paise from Razorpay
        currency: order.currency,
        status: "PENDING",
        razorpayOrderId: order.id,
        platformFee: platformFeePaise ?? null,
        workerPayout: workerPayoutPaise ?? null,
        transferId: null,
        notes,
      },
    });

    // Return order details to client
    return NextResponse.json(
      {
        orderId: order.id,
        amount: order.amount, // paise
        currency: order.currency,
        paymentId: paymentRecord.id, // internal DB id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/payments/create-order:", error);
    return NextResponse.json(
      {
        error: "Error creating Razorpay order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
