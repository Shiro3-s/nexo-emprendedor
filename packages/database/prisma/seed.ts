import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`SET search_path TO "tenants", public;`);

  // Roles
  const roles = [
    { name: "ADMIN", description: "Administrador del sistema" },
    { name: "ASESOR", description: "Asesor de emprendedores" },
    { name: "EMPRENDEDOR", description: "Emprendedor acompañado" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const existingTemplate = await prisma.diagnosticTemplate.findFirst({
    where: { name: "Caracterización y Valoración RTH UNIMINUTO 2026" },
  });

  if (existingTemplate) {
    console.log("El template UNIMINUTO ya existe. Seed omitido.");
    console.log("Ejecuta: pnpm db:reset si quieres reiniciar la BD.");
    return;
  }

  const template = await prisma.diagnosticTemplate.create({
    data: {
      name: "Caracterización y Valoración RTH UNIMINUTO 2026",
      description:
        "Diagnóstico integral de emprendedores - Centro de Emprendimiento UNIMINUTO RTH",
      scoringValues: { Si: 100, Parcialmente: 50, No: 0 },
      scoringLevels: [
        { min: 0, max: 33, label: "Bajo", color: "red" },
        { min: 34, max: 66, label: "Medio", color: "yellow" },
        { min: 67, max: 100, label: "Alto", color: "green" },
      ],
    },
  });

  // ============================================================
  // SECCIÓN 1 — CARACTERIZACIÓN
  // ============================================================
  const section1 = await prisma.diagnosticSection.create({
    data: {
      templateId: template.id,
      title: "Información General",
      description: "Caracterización del emprendedor",
      order: 1,
    },
  });

  const qData: {
    order: number;
    question: string;
    type: string;
    options?: string[];
    mapsTo?: string;
  }[] = [
    { order: 1, question: "He leído, he sido informado (a), y autorizo a UNIMINUTO el tratamiento de mis datos personales", type: "radio", options: ["SI", "NO"] },
    { order: 2, question: "Nombres y Apellidos completos", type: "text", mapsTo: "name" },
    { order: 3, question: "Tipo de Documento de Identidad", type: "select", options: ["CC", "CE", "Pasaporte", "TI"], mapsTo: "documentType" },
    { order: 4, question: "No. de Documento de Identidad", type: "text", mapsTo: "documentNumber" },
    { order: 5, question: "Correo Electrónico Uniminuto", type: "text", mapsTo: "email" },
    { order: 6, question: "Correo Electrónico Personal", type: "text" },
    { order: 7, question: "Celular", type: "text", mapsTo: "phone" },
    { order: 8, question: "Dirección Residencia", type: "text", mapsTo: "address" },
    { order: 9, question: "Ciudad de Residencia", type: "text" },
    { order: 10, question: "Fecha de Nacimiento", type: "date", mapsTo: "birthDate" },
    { order: 11, question: "Género con el que se identifica", type: "select", options: ["MASCULINO", "FEMENINO", "OTRO"], mapsTo: "gender" },
    { order: 12, question: "Estado Civil", type: "select", options: ["Soltero(a)", "Casado(a)", "Divorciado(a)", "Viudo(a)", "Unión Libre"], mapsTo: "maritalStatus" },
    { order: 13, question: "CU al cual pertenece", type: "select", options: [], mapsTo: "universityCenterId" },
    { order: 14, question: "Programa Académico", type: "select", options: [], mapsTo: "academicProgramId" },
    { order: 15, question: "Rol con la Universidad", type: "select", options: ["Estudiante Pregrado", "Estudiante Posgrado", "Egresado", "Docente", "Administrativo"] },
    { order: 16, question: "Semestre", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"], mapsTo: "semester" },
    { order: 17, question: "Tipo de modalidad", type: "select", options: ["Presencial", "Virtual", "Distancia"], mapsTo: "modality" },
    { order: 18, question: "Pertenece a algún grupo poblacional vulnerable", type: "select", options: ["SI", "NO"] },
    { order: 19, question: "Tiene actualmente un emprendimiento", type: "select", options: ["SI", "NO"] },
    { order: 20, question: "Nombre de su emprendimiento (si es idea de negocio, escriba NA)", type: "text", mapsTo: "entrepreneurshipName" },
    { order: 21, question: "Maneja redes sociales para su emprendimiento? Indicanos como podemos encontrarte", type: "text" },
    { order: 22, question: "Describa brevemente a qué se dedica su negocio o en qué consiste la idea de negocio", type: "textarea", mapsTo: "entrepreneurshipDescription" },
    { order: 23, question: "Está interesado en recibir acompañamiento en temas de financiación o capital semilla con entidades aliadas", type: "select", options: ["SI", "NO"] },
  ];

  for (const q of qData) {
    await prisma.diagnosticQuestion.create({
      data: { sectionId: section1.id, ...q, required: true },
    });
  }

  // ============================================================
  // SECCIÓN 2 — VALORACIÓN
  // ============================================================
  const section2 = await prisma.diagnosticSection.create({
    data: {
      templateId: template.id,
      title: "Valoración del Emprendimiento",
      description: "Evaluación por dimensiones estratégicas",
      order: 2,
    },
  });

  // Preamble questions (informativas, no scoring)
  const preamble = [
    { order: 24, question: "Si tiene Unidad Productiva (Que genera Ingresos) o Empresa Formalizada (Registrada en Cámara de Comercio), cuánto tiempo lleva en funcionamiento?", type: "select", options: ["Menos de 6 meses", "De 6 a 12 meses", "Más de 12 meses", "No aplica (idea de negocio)"] },
    { order: 25, question: "Para su idea de negocios o emprendimiento en marcha, ha desarrollado alguna de las siguientes herramientas de apoyo a procesos de Ideación y Validación", type: "checkbox", options: ["Brainstorming", "Lienzo Canvas", "Design Thinking", "Lean Startup", "Prototipado", "Pitch", "Ninguna"] },
    { order: 26, question: "A qué sector económico pertenece su actividad productiva", type: "select", options: ["Agropecuario", "Pecuario", "Industrial", "Comercio", "Servicios", "Tecnología", "Cultural", "Otro"] },
    { order: 27, question: "Cuál(es) de las siguientes áreas estratégicas considera prioridad para fortalecer en su idea o negocio", type: "checkbox", options: ["MODELO DE NEGOCIO", "MARKETING Y MERCADEO", "PRODUCTO O SERVICIO", "ADMINISTRATIVO FINANCIERO Y LEGAL", "INNOVACIÓN", "SOSTENIBILIDAD"] },
  ];

  for (const q of preamble) {
    await prisma.diagnosticQuestion.create({
      data: { sectionId: section2.id, ...q, required: true },
    });
  }

  // Scoring questions
  async function createScoringQ(order: number, question: string, type = "radio", options: string[] = ["Si", "No", "Parcialmente"]): Promise<string> {
    const q = await prisma.diagnosticQuestion.create({
      data: { sectionId: section2.id, order, question, type, options, required: true },
    });
    return q.id;
  }

  // 28-29: MODELO DE NEGOCIO
  const q28 = await createScoringQ(28, "Identifica cuál es la característica diferencial de su negocio respecto a la competencia y el mercado?", "radio", ["Si", "No"]);
  const q29 = await createScoringQ(29, "Cuenta con una planeación estratégica de tu negocio (Misión, Visión, Valores, Políticas, Diseño de procesos, Análisis de riesgos, Seguimiento y control, Modelo de operación)?");

  // 30-33: MARKETING Y MERCADEO
  const q30 = await createScoringQ(30, "Describa brevemente su mercado objetivo (Perfil de sus clientes)", "textarea", []);
  const q31 = await createScoringQ(31, "Identifica las tendencias del mercado que podrían impactar su emprendimiento?");
  const q32 = await createScoringQ(32, "Tiene establecidos los canales de venta y distribución?");
  const q33 = await createScoringQ(33, "Cuáles son los medios de promoción y comunicación de su empresa?", "textarea", []);

  // 34-36: PRODUCTO O SERVICIO
  const q34 = await createScoringQ(34, "Tiene identificadas las características del producto o servicios que comercializa (cantidad, presentación y comercialización)?", "radio", ["Si", "No", "Parcialmente"]);
  const q35 = await createScoringQ(35, "Ha definido etiquetado, empaque y embalaje, para su producto o servicio?", "radio", ["Si", "No", "Parcialmente"]);
  const q36 = await createScoringQ(36, "Tiene claro y establecido el paso a paso para la elaboración de su producto o la prestación del servicio?", "radio", ["Si", "No", "Parcialmente"]);

  // 37-40: ADMINISTRATIVO FINANCIERO Y LEGAL
  const q37 = await createScoringQ(37, "Tiene claridad de la situación financiera actual de su emprendimiento (ingresos, gastos, rentabilidad) o en caso de ser Idea de Negocio, tiene claro su identificación?");
  const q38 = await createScoringQ(38, "Cuál(es) es(son) su(s) fuente(s) de financiación?", "textarea", []);
  const q39 = await createScoringQ(39, "Ha construido su modelo de estructura orgánica presente y futura?", "radio", ["Si", "No"]);
  const q40 = await createScoringQ(40, "Conoce cuáles son los requerimientos Legales que debe cumplir para el desarrollo de su actividad económica?", "radio", ["Si", "No"]);

  // 41-44: INNOVACIÓN
  const q41 = await createScoringQ(41, "Ha aplicado alguna metodología de Innovación para el desarrollo de su modelo de negocio?", "radio", ["Si", "No"]);
  const q42 = await createScoringQ(42, "Qué herramientas tecnológicas y de IA ha identificado y aplica en su empresa?", "textarea", []);
  const q43 = await createScoringQ(43, "Tiene registrada su marca o conoce el proceso y los beneficios para hacerlo?", "radio", ["Si", "No"]);
  const q44 = await createScoringQ(44, "Integración de tecnologías, transformación de la idea de negocio, adaptación de nuevas metodologías?");

  // 45-47: SOSTENIBILIDAD
  const q45 = await createScoringQ(45, "Tiene claridad de los principales aspectos e impactos ambientales de su modelo de negocio?");
  const q46 = await createScoringQ(46, "Ha identificado los criterios e impacto social que genera su emprendimiento?");
  const q47 = await createScoringQ(47, "Reconoce y aplica los principios y estrategias de circularidad de su modelo de negocio?");

  // ============================================================
  // DIMENSIONES Y SCORING RULES
  // ============================================================
  const dim1 = await prisma.diagnosticDimension.create({ data: { templateId: template.id, name: "MODELO DE NEGOCIO", color: "#4F46E5", order: 1 } });
  const dim2 = await prisma.diagnosticDimension.create({ data: { templateId: template.id, name: "MARKETING Y MERCADEO", color: "#06B6D4", order: 2 } });
  const dim3 = await prisma.diagnosticDimension.create({ data: { templateId: template.id, name: "PRODUCTO O SERVICIO", color: "#10B981", order: 3 } });
  const dim4 = await prisma.diagnosticDimension.create({ data: { templateId: template.id, name: "ADMINISTRATIVO FINANCIERO Y LEGAL", color: "#F59E0B", order: 4 } });
  const dim5 = await prisma.diagnosticDimension.create({ data: { templateId: template.id, name: "INNOVACIÓN", color: "#EF4444", order: 5 } });
  const dim6 = await prisma.diagnosticDimension.create({ data: { templateId: template.id, name: "SOSTENIBILIDAD", color: "#8B5CF6", order: 6 } });

  // Solo las preguntas con opciones de scoring (Si/No/Parcialmente, Si/No) tienen ScoringRule
  const scoringDimensions = [
    { dimId: dim1.id, qIds: [q28, q29] },
    { dimId: dim2.id, qIds: [q31, q32] },                    // q30, q33 son textarea
    { dimId: dim3.id, qIds: [q34, q35, q36] },
    { dimId: dim4.id, qIds: [q37, q39, q40] },               // q38 es textarea
    { dimId: dim5.id, qIds: [q41, q43, q44] },               // q42 es textarea
    { dimId: dim6.id, qIds: [q45, q46, q47] },
  ];

  for (const { dimId, qIds } of scoringDimensions) {
    for (const qId of qIds) {
      await prisma.scoringRule.create({
        data: { dimensionId: dimId, questionId: qId, weight: 1.0 },
      });
    }
  }

  // ============================================================
  // DASHBOARD WIDGETS
  // ============================================================
  const allDimIds = [dim1.id, dim2.id, dim3.id, dim4.id, dim5.id, dim6.id];

  await prisma.dashboardWidget.create({
    data: {
      templateId: template.id,
      type: "radar",
      title: "Rendimiento por Dimensión",
      dimensionIds: allDimIds,
      config: { showLegend: true, responsive: true },
      placement: "diagnostics",
      order: 1,
    },
  });

  await prisma.dashboardWidget.create({
    data: {
      templateId: template.id,
      type: "bar",
      title: "Comparación por Dimensión",
      dimensionIds: allDimIds,
      config: { showValues: true, orientation: "horizontal" },
      placement: "diagnostics",
      order: 2,
    },
  });

  await prisma.dashboardWidget.create({
    data: {
      templateId: template.id,
      type: "gauge",
      title: "Score General",
      dimensionIds: [],
      config: { min: 0, max: 100, thresholds: [33, 66] },
      placement: "overview",
      order: 1,
    },
  });

  await prisma.dashboardWidget.create({
    data: {
      templateId: template.id,
      type: "scorecard",
      title: null,
      dimensionIds: allDimIds,
      config: {},
      placement: "overview",
      order: 2,
    },
  });

  console.log("✅ Seed completado:");
  console.log(`  Template: "Caracterización y Valoración RTH UNIMINUTO 2026"`);
  console.log(`  Secciones: 2 (${qData.length} preguntas caracterización + ${preamble.length} preguntas informativas + 20 preguntas scoring)`);
  console.log(`  Dimensiones: 6`);
  console.log(`  ScoringRules: ${scoringDimensions.reduce((acc, d) => acc + d.qIds.length, 0)}`);
  console.log(`  DashboardWidgets: 4`);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
