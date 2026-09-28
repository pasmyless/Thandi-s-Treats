import { z } from "zod";
import {
  authenticateAdmin,
  changeAdminPassword,
  clearAdminSessionCookie,
  createAdminSession,
  getAdminSession,
  requireAdmin,
  setAdminSessionCookie,
} from "../adminAuth";
import { getAdminDashboardData, updateBookingStatus } from "../db";
import { publicProcedure, router } from "../_core/trpc";

function cookieHeader(ctx: { req: { headers: { cookie?: string } } }) {
  return ctx.req.headers.cookie;
}

export const adminRouter = router({
  me: publicProcedure.query(async ({ ctx }) => getAdminSession(cookieHeader(ctx))),
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const admin = await authenticateAdmin(input.email, input.password);
      if (!admin) return { success: false } as const;
      setAdminSessionCookie(ctx.res, await createAdminSession(admin));
      return { success: true, admin } as const;
    }),
  logout: publicProcedure.mutation(({ ctx }) => {
    clearAdminSessionCookie(ctx.res);
    return { success: true } as const;
  }),
  dashboard: publicProcedure.query(async ({ ctx }) => {
    await requireAdmin(cookieHeader(ctx));
    return getAdminDashboardData();
  }),
  updateBookingStatus: publicProcedure
    .input(
      z.object({
        bookingId: z.number().int().positive(),
        status: z.enum(["new", "confirmed", "completed", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(cookieHeader(ctx));
      await updateBookingStatus(input.bookingId, input.status);
      return { success: true } as const;
    }),
  changePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(9, "Use at least 9 characters").max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await requireAdmin(cookieHeader(ctx));
      await changeAdminPassword(admin.email, input.currentPassword, input.newPassword);
      return { success: true } as const;
    }),
});
