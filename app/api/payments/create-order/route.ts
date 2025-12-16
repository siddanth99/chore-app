import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/server/auth/role";
import { prisma } from "@/server/db/client";

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

    const body = await req.json().catch(() => {
      console.error("Failed to parse request body as JSON");
      return null;
    });
    
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }
    
    const { amount: clientAmount, choreId, notes: clientNotes } = body;

    // If choreId is provided, validate that the chore exists and belongs to the user
    let assignedWorker = null
    let workerPayoutPaise = null
    let platformFeePaise = null
    let amountInRupees: number | null = null
    let chore = null

    if (choreId) {
      chore = await prisma.chore.findUnique({
        where: { id: choreId },
        select: {
          id: true,
          createdById: true,
          budget: true,
          agreedPrice: true,
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

      // Derive amount from chore's budget or agreedPrice
      amountInRupees = chore.budget ?? chore.agreedPrice ?? null;
      
      if (!amountInRupees || amountInRupees <= 0) {
        return NextResponse.json(
          { error: "Chore has no valid payment amount (budget or agreedPrice)" },
          { status: 400 }
        );
      }
    } else {
      // If no choreId, require amount from client
      if (typeof clientAmount !== "number" || clientAmount <= 0) {
        return NextResponse.json(
          { error: "Either choreId or amount is required" },
          { status: 400 }
        );
      }
      amountInRupees = clientAmount;
    }

    // Validate amount
    if (!amountInRupees || amountInRupees <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    if (chore) {

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

      // Allow payment if UNPAID or PENDING (both are payable states)
      // Block only when FUNDED, REFUNDED, or other terminal states
      const payableStatuses = ["UNPAID", "PENDING", null, undefined];
      const isPayableStatus = payableStatuses.includes(chore.paymentStatus as any);
      
      if (!isPayableStatus) {
        return NextResponse.json(
          { error: `Cannot create payment. Payment status is ${chore.paymentStatus}. Only UNPAID or PENDING chores can be paid.` },
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

      // Note: We no longer block payment if worker doesn't have Route account
      // Payment will proceed without transfers if razorpayAccountId is invalid/missing

      // Update chore paymentStatus to PENDING if it's currently UNPAID (status remains ASSIGNED)
      // This allows retrying payment if a previous order was created but not completed
      if (chore.paymentStatus === "UNPAID" || !chore.paymentStatus) {
        await prisma.chore.update({
          where: { id: choreId },
          data: { paymentStatus: "PENDING" },
        });
      }
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
    const amountInPaise = Math.round(amountInRupees * 100);

    // Build base order options
    const orderOptions: any = {
      amount: amountInPaise,
      currency: "INR",
      notes: {
        ...notes,
        workerId: assignedWorker?.id ?? null,
      },
    };

    // Validate if worker has a valid Razorpay Route account ID
    // Account ID must start with "acc_" and be exactly 18 characters
    const hasValidRouteAccount = 
      assignedWorker &&
      assignedWorker.razorpayAccountId &&
      assignedWorker.razorpayAccountId.startsWith("acc_") &&
      assignedWorker.razorpayAccountId.length === 18;

    if (hasValidRouteAccount && assignedWorker) {
      // 10% platform fee, 90% to worker
      platformFeePaise = Math.round(amountInPaise * 0.10);
      workerPayoutPaise = amountInPaise - platformFeePaise;

      // Include transfers in order payload for split payments
      orderOptions.transfers = [
        {
          account: assignedWorker.razorpayAccountId,
          amount: workerPayoutPaise,
          currency: "INR",
          on_hold: true, // Hold until client approves
        },
      ];
    } else if (assignedWorker) {
      // Worker assigned but no valid Route account - log warning but allow payment
      console.warn(
        "Worker has no valid Razorpay sub-account; creating order without transfers",
        {
          workerId: assignedWorker.id,
          razorpayAccountId: assignedWorker.razorpayAccountId ?? null,
        }
      );
    }

    // Create Razorpay order (with or without transfers)
    const order = await razorpay.orders.create(orderOptions);

    console.log("Razorpay order created:", {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      hasTransfers: !!orderOptions.transfers,
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
        platformFee: platformFeePaise ?? null,
        workerPayout: workerPayoutPaise ?? null,
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
