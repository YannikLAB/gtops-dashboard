import {
  CourseraApiError,
  fetchConfiguredCourseraReport,
  getConfiguredReportInfo,
  summarizeUnknownJson,
} from "@/lib/coursera";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reportInfo = getConfiguredReportInfo();

    if (!reportInfo.configured) {
      return NextResponse.json(
        {
          ok: false,
          report: reportInfo,
          message:
            "No report endpoint configured. Add COURSERA_REPORT_PATH to .env.local after confirming the documented Coursera Business report endpoint.",
        },
        { status: 400 },
      );
    }

    const report = await fetchConfiguredCourseraReport();

    return NextResponse.json({
      ok: true,
      reportUrl: report.url,
      shape: summarizeUnknownJson(report.data),
      sample: report.data,
    });
  } catch (error) {
    if (error instanceof CourseraApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.details,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: { message: "Unexpected Coursera report probe failure." },
      },
      { status: 500 },
    );
  }
}
