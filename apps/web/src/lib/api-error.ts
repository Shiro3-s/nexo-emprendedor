import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  console.error("Error no manejado:", error);
  return NextResponse.json(
    {
      success: false,
      error: "INTERNAL_ERROR",
      message: "Error interno del servidor",
    },
    { status: 500 }
  );
}

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) });
}
