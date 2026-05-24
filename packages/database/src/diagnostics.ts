import { z } from "zod";
import { prisma } from "./client";

const ScoringValueSchema = z.record(z.string(), z.number().min(0).max(100));
const ScoringLevelSchema = z.array(
  z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
    label: z.string().min(1),
    color: z.string(),
  })
);
const WidgetConfigSchema = z.record(z.string(), z.unknown());
const DimensionIdsSchema = z.array(z.string());

export type TemplateWithRelations = Awaited<
  ReturnType<typeof getTemplateWithQuestions>
>;

export type DimensionScore = {
  dimensionId: string;
  dimensionName: string;
  color: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  level: string | null;
};

export type DashboardData = {
  generalScore: number;
  generalLevel: string | null;
  dimensions: DimensionScore[];
  widgets: {
    type: string;
    title: string | null;
    dimensionIds: string[];
    config: unknown;
    placement: string;
  }[];
};

function parseScoringValues(data: unknown): Record<string, number> {
  const result = ScoringValueSchema.safeParse(data);
  if (!result.success) {
    console.warn("scoringValues inválido, usando default", result.error.format());
    return { Si: 100, No: 0 };
  }
  return result.data;
}

function parseScoringLevels(data: unknown): { min: number; max: number; label: string; color: string }[] {
  const result = ScoringLevelSchema.safeParse(data);
  if (!result.success) {
    console.warn("scoringLevels inválido, usando default", result.error.format());
    return [
      { min: 0, max: 33, label: "Bajo", color: "red" },
      { min: 34, max: 66, label: "Medio", color: "yellow" },
      { min: 67, max: 100, label: "Alto", color: "green" },
    ];
  }
  return result.data;
}

function parseWidgetConfig(data: unknown): Record<string, unknown> {
  const result = WidgetConfigSchema.safeParse(data);
  if (!result.success) {
    console.warn("widget config inválido, usando objeto vacío", result.error.format());
    return {};
  }
  return result.data;
}

function parseDimensionIds(data: unknown): string[] {
  const result = DimensionIdsSchema.safeParse(data);
  if (!result.success) {
    console.warn("dimensionIds inválido, usando array vacío", result.error.format());
    return [];
  }
  return result.data;
}

export async function getTemplateWithQuestions(templateId: string) {
  return prisma.diagnosticTemplate.findUnique({
    where: { id: templateId },
    include: {
      sections: {
        include: { questions: true },
        orderBy: { order: "asc" },
      },
      dimensions: {
        include: { scoringRules: true },
        orderBy: { order: "asc" },
      },
      dashboardWidgets: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function calculateScores(
  userId: string,
  templateId: string
): Promise<DimensionScore[]> {
  const template = await getTemplateWithQuestions(templateId);
  if (!template) throw new Error("Template no encontrado");

  const responses = await prisma.diagnosticResponse.findMany({
    where: { userId, templateId },
  });

  const responseMap = new Map(responses.map((r) => [r.questionId, r.value]));
  const scoringValues = parseScoringValues(template.scoringValues);
  const levels = parseScoringLevels(template.scoringLevels);

  const scores: DimensionScore[] = [];

  for (const dim of template.dimensions) {
    let totalRaw = 0;
    let totalMax = 0;

    for (const rule of dim.scoringRules) {
      const value = responseMap.get(rule.questionId);

      if (value !== undefined) {
        const numericValue = scoringValues[String(value)] ?? Number(value);
        const maxValue = 100;
        totalRaw += numericValue * rule.weight;
        totalMax += maxValue * rule.weight;
      }
    }

    const percentage = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0;

    let level: string | null = null;
    for (const l of levels) {
      if (percentage >= l.min && percentage <= l.max) {
        level = l.label;
        break;
      }
    }

    scores.push({
      dimensionId: dim.id,
      dimensionName: dim.name,
      color: dim.color,
      rawScore: totalRaw,
      maxScore: totalMax,
      percentage,
      level,
    });
  }

  return scores;
}

export async function getDashboardData(
  userId: string,
  templateId: string
): Promise<DashboardData> {
  const template = await prisma.diagnosticTemplate.findUnique({
    where: { id: templateId },
    include: {
      dimensions: true,
      dashboardWidgets: { orderBy: { order: "asc" } },
    },
  });

  if (!template) throw new Error("Template no encontrado");

  const scores = await calculateScores(userId, templateId);
  const levels = parseScoringLevels(template.scoringLevels);

  const generalPercentage =
    scores.length > 0
      ? Math.round(
          scores.reduce((acc, s) => acc + s.percentage, 0) / scores.length
        )
      : 0;

  let generalLevel: string | null = null;
  for (const l of levels) {
    if (generalPercentage >= l.min && generalPercentage <= l.max) {
      generalLevel = l.label;
      break;
    }
  }

  return {
    generalScore: generalPercentage,
    generalLevel,
    dimensions: scores,
    widgets: template.dashboardWidgets.map((w) => ({
      type: w.type,
      title: w.title,
      dimensionIds: parseDimensionIds(w.dimensionIds),
      config: parseWidgetConfig(w.config),
      placement: w.placement,
    })),
  };
}
