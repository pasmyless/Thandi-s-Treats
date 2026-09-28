import { z } from "zod";
import { createBooking } from "../db";
import { notifyBooking } from "../email";
import { publicProcedure, router } from "../_core/trpc";
import { PRODUCTS } from "./reviews";

const bookingInput = z
  .object({
    customerName: z.string().trim().min(2, "Please enter your name").max(120),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().min(7, "Enter a phone number").max(40),
    requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a requested date"),
    requestedTime: z.string().trim().min(1, "Choose a preferred time").max(40),
    fulfilment: z.enum(["collection", "delivery"]),
    address: z.string().trim().max(500).optional(),
    items: z
      .array(
        z.object({
          product: z.enum(PRODUCTS),
          quantity: z.number().int().min(1).max(99),
        }),
      )
      .min(1, "Add at least one treat to your booking"),
    occasion: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
    website: z.string().max(0).optional(),
  })
  .superRefine((value, context) => {
    if (value.fulfilment === "delivery" && !value.address) {
      context.addIssue({ code: "custom", path: ["address"], message: "Please add a delivery address" });
    }
  });

export const bookingRouter = router({
  create: publicProcedure.input(bookingInput).mutation(async ({ input }) => {
    if (input.website) return { id: 0 };
    const id = await createBooking(input);
    await notifyBooking(input, id);
    return { id };
  }),
});
