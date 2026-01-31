import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createAnalysisReport, 
  getAnalysisReportById, 
  getAnalysisReportsByUserId,
  updateAnalysisReport,
  deleteAnalysisReport
} from "./db";
import { analyzeSearchTerms, parseExcelData, AnalysisSummary } from "./adAnalyzer";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Analysis report router
  analysis: router({
    // Create a new analysis report (upload file data)
    create: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.array(z.record(z.string(), z.unknown())), // Excel rows as JSON
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Create initial report record
        const reportId = await createAnalysisReport({
          userId,
          fileName: input.fileName,
          status: 'processing',
        });
        
        try {
          // Parse and analyze the data
          const searchTermData = parseExcelData(input.fileData);
          const analysisResult = analyzeSearchTerms(searchTermData);
          
          // Update report with results
          await updateAnalysisReport(reportId, {
            status: 'completed',
            totalKeywords: analysisResult.totalKeywords,
            increaseBidCount: analysisResult.increaseBidCount,
            decreaseBidCount: analysisResult.decreaseBidCount,
            negativeCount: analysisResult.negativeCount,
            reasonableCount: analysisResult.reasonableCount,
            pendingCount: analysisResult.pendingCount,
            overallAcos: analysisResult.overallAcos.toFixed(2),
            overallConversionRate: analysisResult.overallConversionRate.toFixed(2),
            averageCpc: analysisResult.averageCpc.toFixed(2),
            analysisResult: analysisResult as unknown as Record<string, unknown>,
            completedAt: new Date(),
          });
          
          return {
            success: true,
            reportId,
            summary: {
              totalKeywords: analysisResult.totalKeywords,
              increaseBidCount: analysisResult.increaseBidCount,
              decreaseBidCount: analysisResult.decreaseBidCount,
              negativeCount: analysisResult.negativeCount,
              reasonableCount: analysisResult.reasonableCount,
              pendingCount: analysisResult.pendingCount,
              overallAcos: analysisResult.overallAcos,
              overallConversionRate: analysisResult.overallConversionRate,
              averageCpc: analysisResult.averageCpc,
            }
          };
        } catch (error) {
          // Update report with error
          await updateAnalysisReport(reportId, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
          
          throw error;
        }
      }),

    // Get a specific report by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await getAnalysisReportById(input.id);
        
        if (!report) {
          return null;
        }
        
        // Ensure user owns this report
        if (report.userId !== ctx.user.id) {
          return null;
        }
        
        return report;
      }),

    // List user's reports
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getAnalysisReportsByUserId(ctx.user.id, input?.limit ?? 20);
      }),

    // Delete a report
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await getAnalysisReportById(input.id);
        
        if (!report || report.userId !== ctx.user.id) {
          throw new Error("Report not found");
        }
        
        await deleteAnalysisReport(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
