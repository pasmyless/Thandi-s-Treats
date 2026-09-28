import { z } from "zod";
import { createReview, getRatingSummary } from "../db";
import { notifyReview } from "../email";
import { publicProcedure, router } from "../_core/trpc";

export const PRODUCTS = [
  "Classic banana bread 800g",
  "Choc chip banana bread 800g",
  "Classic carrot cake 800g",
  "Carrot fruit cake 800g",
  "Chocolate chip cookies 5pcs",
  "Fudgy chocolate brownies",
  "Cupcakes 4pcs",
] as const;

const reviewInput = z.object({
  name: z.string().trim().max(100).optional(),
  products: z.array(z.enum(PRODUCTS)).min(1, "Choose at least one product"),
  comments: z.string().trim().min(6, "Please share a little more feedback").max(3000),
  rating: z.number().int().min(1).max(5),
  recommendation: z.enum(PRODUCTS),
  website: z.string().max(0).optional(),
});

export const reviewRouter = router({
  summary: publicProcedure.query(() => getRatingSummary()),
  create: publicProcedure.input(reviewInput).mutation(async ({ input }) => {
    if (input.website) return { id: 0 };
    const review = {
      guestName: input.name || undefined,
      products: input.products,
      comments: input.comments,
      rating: input.rating,
      recommendation: input.recommendation,
    };
    const id = await createReview(review);
    await notifyReview(review);
    return { id };
  }),
});
