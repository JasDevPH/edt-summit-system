/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import ExcelJS from "exceljs";

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Check permission
    const permissionError = requirePermission("report:view", user.role);
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const format = searchParams.get("format") || "xlsx";

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Fetch event data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          orderBy: {
            createdAt: "asc",
          },
        },
        expenses: {
          include: {
            addedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Calculate summary
    const totalParticipants = event.participants.length;
    const totalMlkbanko = event.participants.reduce(
      (sum, p) => sum + p.mlkbankoAmount,
      0
    );
    const totalRegistrationFees = event.participants.reduce(
      (sum, p) => sum + p.registrationFee,
      0
    );
    const totalExpenses = event.expenses.reduce((sum, e) => sum + e.amount, 0);
    const distributedAmount = event.participants
      .filter((p) => p.distributionStatus === "DISTRIBUTED")
      .reduce((sum, p) => sum + p.mlkbankoAmount, 0);
    const certificateFees = totalParticipants * 200;

    if (format === "csv") {
      // Generate CSV
      const csv = generateCSV(event, {
        totalParticipants,
        totalMlkbanko,
        totalRegistrationFees,
        totalExpenses,
        distributedAmount,
        certificateFees,
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="event_report_${eventId}.csv"`,
        },
      });
    } else {
      // Generate Excel
      const buffer = await generateExcel(event, {
        totalParticipants,
        totalMlkbanko,
        totalRegistrationFees,
        totalExpenses,
        distributedAmount,
        certificateFees,
      });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="event_report_${eventId}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Report export error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});

function generateCSV(event: any, summary: any): string {
  const lines: string[] = [];

  // Section 1: Facilitator Summary
  lines.push("Table 1: FACILITATORS SUMMARY REPORT");
  lines.push("");
  lines.push(`Facilitator's Name,${event.facilitator}`);
  lines.push(`EDT Conducted Date,${new Date(event.date).toLocaleDateString()}`);
  lines.push("");
  lines.push(
    "Total Crypto Received,Personal (20%),For Distribution (80%),Total Recipients,Total Distributed,Remaining"
  );
  lines.push(
    `${summary.totalMlkbanko},${summary.totalMlkbanko * 0.2},${
      summary.totalMlkbanko * 0.8
    },${summary.totalParticipants},${summary.distributedAmount},${
      summary.totalMlkbanko * 0.8 - summary.distributedAmount
    }`
  );
  lines.push("");
  lines.push("");

  // Section 2: Detailed Participants
  lines.push("Table 2: DETAILED EDT REPORT");
  lines.push("");
  lines.push(
    "#,Full Name,Home Address,Birthday,Yoroi Address,MLKBANKO Amount,Status"
  );
  event.participants.forEach((p: any, index: number) => {
    lines.push(
      `${index + 1},"${p.fullname}","${p.homeAddress || ""}",${
        p.birthday ? new Date(p.birthday).toLocaleDateString() : ""
      },"${p.yoroiAddress}",${p.mlkbankoAmount},${p.distributionStatus}`
    );
  });
  lines.push("");
  lines.push("");

  // Section 3: Financial Report
  lines.push("Table 3: SUMMARY OF FINANCIAL REPORT FOR EDT CONDUCTED");
  lines.push("");
  lines.push(`Facilitator's Name,${event.facilitator}`);
  lines.push(`EDT Conducted Date,${new Date(event.date).toLocaleDateString()}`);
  lines.push(`Total Number of Delegates,${summary.totalParticipants}`);
  lines.push(`Received Registration Fees,${summary.totalRegistrationFees}`);
  lines.push(`Certificate Fees to BML,${summary.certificateFees}`);
  lines.push("");
  lines.push("EXPENSES");
  event.expenses.forEach((e: any) => {
    lines.push(`${e.description},${e.amount}`);
  });
  lines.push(`TOTAL EXPENSES,${summary.totalExpenses}`);
  lines.push("");
  lines.push("SIMPLE CASH BALANCE");
  lines.push(`Total Receipts,${summary.totalRegistrationFees}`);
  lines.push(`Less: Certificate Fees,${summary.certificateFees}`);
  lines.push(`Less: Total Expenses,${summary.totalExpenses}`);
  lines.push(
    `ENDING CASH BALANCE,${
      summary.totalRegistrationFees -
      summary.certificateFees -
      summary.totalExpenses
    }`
  );

  return lines.join("\n");
}

async function generateExcel(event: any, summary: any): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Facilitators Summary Report
  const sheet1 = workbook.addWorksheet("1. Facilitators Summary Report");

  sheet1.getCell("A1").value = "FACILITATOR'S AUDIT REPORT";
  sheet1.getCell("A1").font = { bold: true, size: 14 };

  sheet1.getCell("A3").value = "FACILITATOR'S NAME:";
  sheet1.getCell("C3").value = event.facilitator;

  sheet1.getCell("A4").value = "EDT CONDUCTED DATE:";
  sheet1.getCell("C4").value = new Date(event.date).toLocaleDateString();

  sheet1.getCell("A6").value = "Table 1: SUMMARY REPORT";
  sheet1.getCell("A6").font = { bold: true };

  // Headers
  sheet1.getCell("A7").value = "#";
  sheet1.getCell("B7").value = "FACILITATOR'S NAME";
  sheet1.getCell("C7").value = "TOTAL CRYPTO RECEIVED";
  sheet1.getCell("D7").value = "PERSONAL (20%)";
  sheet1.getCell("E7").value = "FOR DISTRIBUTION (80%)";
  sheet1.getCell("F7").value = "TOTAL RECIPIENTS";
  sheet1.getCell("G7").value = "TOTAL DISTRIBUTED";
  sheet1.getCell("H7").value = "REMAINING";

  // Data
  sheet1.getCell("A8").value = 1;
  sheet1.getCell("B8").value = event.facilitator;
  sheet1.getCell("C8").value = summary.totalMlkbanko;
  sheet1.getCell("D8").value = summary.totalMlkbanko * 0.2;
  sheet1.getCell("E8").value = summary.totalMlkbanko * 0.8;
  sheet1.getCell("F8").value = summary.totalParticipants;
  sheet1.getCell("G8").value = summary.distributedAmount;
  sheet1.getCell("H8").value =
    summary.totalMlkbanko * 0.8 - summary.distributedAmount;

  // Sheet 2: Detailed Report
  const sheet2 = workbook.addWorksheet("2. Detailed Report");

  sheet2.getCell("A1").value = "Table 2: DETAILED EDT REPORT";
  sheet2.getCell("A1").font = { bold: true, size: 14 };

  sheet2.getCell("B2").value = "FACILITATOR'S NAME:";
  sheet2.getCell("D2").value = event.facilitator;

  sheet2.getCell("B3").value = "Date of EDT:";
  sheet2.getCell("C3").value = new Date(event.date).toLocaleDateString();

  // Headers
  const headers = [
    "#",
    "Full Name",
    "Home Address",
    "Birthday",
    "Yoroi Address",
    "MLKBANKO Amount",
    "Distribution Status",
  ];
  headers.forEach((header, index) => {
    const cell = sheet2.getCell(5, index + 2);
    cell.value = header;
    cell.font = { bold: true };
  });

  // Participant data
  event.participants.forEach((participant: any, index: number) => {
    const row = 6 + index;
    sheet2.getCell(row, 1).value = index + 1;
    sheet2.getCell(row, 2).value = participant.fullname;
    sheet2.getCell(row, 3).value = participant.homeAddress || "";
    sheet2.getCell(row, 4).value = participant.birthday
      ? new Date(participant.birthday).toLocaleDateString()
      : "";
    sheet2.getCell(row, 5).value = participant.yoroiAddress;
    sheet2.getCell(row, 6).value = participant.mlkbankoAmount;
    sheet2.getCell(row, 7).value = participant.distributionStatus;
  });

  // Sheet 3: Financial Report
  const sheet3 = workbook.addWorksheet("3. Financial Report per EDT");

  sheet3.getCell("A1").value =
    "Table 3: SUMMARY OF FINANCIAL REPORT FOR EDT CONDUCTED";
  sheet3.getCell("A1").font = { bold: true, size: 14 };

  sheet3.getCell("B2").value = "FACILITATOR'S NAME";
  sheet3.getCell("D2").value = event.facilitator;

  sheet3.getCell("B3").value = "EDT CONDUCTED DATE:";
  sheet3.getCell("D3").value = new Date(event.date).toLocaleDateString();

  sheet3.getCell("B4").value = "TOTAL NUMBER OF DELEGATES:";
  sheet3.getCell("D4").value = summary.totalParticipants;

  sheet3.getCell("B5").value = "RECEIVED REGISTRATION FEES:";
  sheet3.getCell("D5").value = summary.totalRegistrationFees;

  sheet3.getCell("B6").value = "CERTIFICATE FEES TO BML:";
  sheet3.getCell("D6").value = summary.certificateFees;

  // Expenses
  sheet3.getCell("E4").value = "EXPENSES:";
  sheet3.getCell("E4").font = { bold: true };

  let expenseRow = 5;
  event.expenses.forEach((expense: any) => {
    sheet3.getCell(expenseRow, 6).value = expense.description;
    sheet3.getCell(expenseRow, 7).value = expense.amount;
    expenseRow++;
  });

  sheet3.getCell(expenseRow + 1, 6).value = "TOTAL EXPENSES";
  sheet3.getCell(expenseRow + 1, 6).font = { bold: true };
  sheet3.getCell(expenseRow + 1, 7).value = summary.totalExpenses;
  sheet3.getCell(expenseRow + 1, 7).font = { bold: true };

  // Cash Balance
  const balanceStartRow = expenseRow + 4;
  sheet3.getCell(balanceStartRow, 3).value = "SIMPLE CASH BALANCE";
  sheet3.getCell(balanceStartRow, 3).font = { bold: true };

  sheet3.getCell(balanceStartRow + 1, 3).value = "TOTAL RECEIPTS:";
  sheet3.getCell(balanceStartRow + 1, 6).value = summary.totalRegistrationFees;

  sheet3.getCell(balanceStartRow + 2, 3).value = "LESS:";
  sheet3.getCell(balanceStartRow + 3, 3).value = "      CERTIFICATE FEES:";
  sheet3.getCell(balanceStartRow + 3, 6).value = summary.certificateFees;

  sheet3.getCell(balanceStartRow + 4, 3).value = "      TOTAL EXPENSES:";
  sheet3.getCell(balanceStartRow + 4, 6).value = summary.totalExpenses;

  sheet3.getCell(balanceStartRow + 6, 3).value = "ENDING CASH BALANCE:";
  sheet3.getCell(balanceStartRow + 6, 3).font = { bold: true };
  sheet3.getCell(balanceStartRow + 6, 6).value =
    summary.totalRegistrationFees -
    summary.certificateFees -
    summary.totalExpenses;
  sheet3.getCell(balanceStartRow + 6, 6).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
