export { prisma } from "./client";
export {
  getTenantBySlug,
  getTenantByDomain,
  setTenantSchema,
  withTenant,
} from "./tenant";
export type { TenantInfo } from "./tenant";

export {
  getTemplateWithQuestions,
  calculateScores,
  getDashboardData,
} from "./diagnostics";
export type {
  TemplateWithRelations,
  DimensionScore,
  DashboardData,
} from "./diagnostics";
