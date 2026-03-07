import { jsPDF } from "jspdf";
import { differenceInCalendarDays, endOfWeek, format, isSameMonth, startOfWeek, subWeeks } from "date-fns";

import type { HomeworkItem, LogEntry, Session, UserSettings } from "../context/AppContext";
import type { PlanType } from "./api";

const MARGIN_X = 14;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 14;
const CONTENT_WIDTH = 210 - MARGIN_X * 2;

const TYPE_LABELS: Record<LogEntry["type"], string> = {
  trigger: "Trigger",
  event: "Event",
  thought: "Thought",
  win: "Win",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DetailedPdfReportInput {
  displayName: string;
  plan: PlanType;
  settings: UserSettings;
  entries: LogEntry[];
  archivedEntries: LogEntry[];
  sessions: Session[];
  homework: HomeworkItem[];
}

class PdfWriter {
  private doc: jsPDF;
  private y = MARGIN_TOP;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  private ensureSpace(requiredHeight = 8) {
    const pageHeight = this.doc.internal.pageSize.getHeight();
    if (this.y + requiredHeight <= pageHeight - MARGIN_BOTTOM) return;
    this.doc.addPage();
    this.y = MARGIN_TOP;
  }

  title(text: string, subtitle?: string) {
    this.ensureSpace(26);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(20);
    this.doc.setTextColor(26, 24, 20);
    this.doc.text(text, MARGIN_X, this.y);
    this.y += 9;

    if (subtitle) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(10.5);
      this.doc.setTextColor(102, 94, 86);
      const lines = this.doc.splitTextToSize(subtitle, CONTENT_WIDTH);
      this.doc.text(lines, MARGIN_X, this.y);
      this.y += lines.length * 5;
    }

    this.y += 2;
    this.rule();
    this.y += 2;
  }

  section(title: string, subtitle?: string) {
    this.ensureSpace(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(13);
    this.doc.setTextColor(26, 24, 20);
    this.doc.text(title, MARGIN_X, this.y);
    this.y += 6;

    if (subtitle) {
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(120, 112, 102);
      const lines = this.doc.splitTextToSize(subtitle, CONTENT_WIDTH);
      this.doc.text(lines, MARGIN_X, this.y);
      this.y += lines.length * 4.5 + 1;
    }
  }

  paragraph(text: string, options?: { size?: number; color?: [number, number, number]; indent?: number; gapAfter?: number }) {
    const size = options?.size ?? 10;
    const color = options?.color ?? [33, 31, 28];
    const indent = options?.indent ?? 0;
    const width = CONTENT_WIDTH - indent;
    const lines = this.doc.splitTextToSize(text, width);
    const lineHeight = size <= 9 ? 4.2 : 4.8;

    this.ensureSpace(lines.length * lineHeight + 2);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.text(lines, MARGIN_X + indent, this.y);
    this.y += lines.length * lineHeight;
    this.y += options?.gapAfter ?? 1.6;
  }

  keyValue(label: string, value: string | number) {
    this.paragraph(`${label}: ${value}`);
  }

  bullet(text: string, indent = 0) {
    this.paragraph(`- ${text}`, { indent });
  }

  rule() {
    this.ensureSpace(3);
    this.doc.setDrawColor(224, 217, 208);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN_X, this.y, MARGIN_X + CONTENT_WIDTH, this.y);
    this.y += 2.5;
  }
}

function clip(text: string, max: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function getTimeBucket(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 11) return "Morning (5-11)";
  if (hour >= 12 && hour <= 16) return "Afternoon (12-16)";
  if (hour >= 17 && hour <= 21) return "Evening (17-21)";
  return "Late night (22-4)";
}

function longestStreak(dayKeys: string[]) {
  if (dayKeys.length === 0) return 0;
  const sorted = [...new Set(dayKeys)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const previous = new Date(sorted[i - 1]);
    const next = new Date(sorted[i]);
    const diff = differenceInCalendarDays(next, previous);
    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  return best;
}

function formatDateRange(dates: Date[]) {
  if (dates.length === 0) return "No activity recorded yet";
  const min = dates.reduce((acc, date) => (date < acc ? date : acc), dates[0]);
  const max = dates.reduce((acc, date) => (date > acc ? date : acc), dates[0]);
  return `${format(min, "MMM d, yyyy")} to ${format(max, "MMM d, yyyy")}`;
}

export function buildDetailedUserReportPdf(input: DetailedPdfReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const writer = new PdfWriter(doc);
  const now = new Date();

  const allEntries = [...input.entries, ...input.archivedEntries]
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const sessions = input.sessions
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const completedSessions = sessions.filter((session) => session.completed);
  const allDates = [
    ...allEntries.map((entry) => entry.timestamp),
    ...sessions.map((session) => session.date),
    ...input.homework.map((item) => item.sessionDate),
  ];

  const typeCounts = allEntries.reduce<Record<LogEntry["type"], number>>(
    (acc, entry) => {
      acc[entry.type] += 1;
      return acc;
    },
    { trigger: 0, event: 0, thought: 0, win: 0 },
  );

  const weekdayCounts = allEntries.reduce<number[]>((acc, entry) => {
    acc[entry.timestamp.getDay()] += 1;
    return acc;
  }, [0, 0, 0, 0, 0, 0, 0]);

  const timeBuckets = allEntries.reduce<Record<string, number>>((acc, entry) => {
    const bucket = getTimeBucket(entry.timestamp);
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {});

  const sortedBucket = Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0];
  const busiestWeekdayIndex = weekdayCounts.reduce((bestIndex, count, index, counts) =>
    count > counts[bestIndex] ? index : bestIndex, 0);

  const activeDayKeys = allEntries.map((entry) => format(entry.timestamp, "yyyy-MM-dd"));
  const longestActiveStreak = longestStreak(activeDayKeys);

  const averageIntensity = allEntries.length > 0
    ? Number((allEntries.reduce((sum, entry) => sum + entry.intensity, 0) / allEntries.length).toFixed(2))
    : 0;
  const highIntensityCount = allEntries.filter((entry) => entry.intensity >= 4).length;

  const logsThisMonth = allEntries.filter((entry) => isSameMonth(entry.timestamp, now)).length;

  const completedHomework = input.homework.filter((item) => item.completed);
  const openHomework = input.homework.filter((item) => !item.completed);
  const overdueHomework = openHomework.filter(
    (item) => item.dueDate && item.dueDate.getTime() < now.getTime(),
  );

  const homeworkCompletionRate = input.homework.length > 0
    ? Math.round((completedHomework.length / input.homework.length) * 100)
    : 0;

  const averagePostMood = completedSessions.length > 0
    ? Number((completedSessions.reduce((sum, session) => sum + session.postMood, 0) / completedSessions.length).toFixed(2))
    : 0;

  const topicCounts = completedSessions.reduce<Record<string, number>>((acc, session) => {
    for (const topic of session.topics) {
      acc[topic] = (acc[topic] ?? 0) + 1;
    }
    return acc;
  }, {});
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const weeklySnapshots = Array.from({ length: 8 }, (_, index) => {
    const weekStart = startOfWeek(subWeeks(now, 7 - index), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekEntries = allEntries.filter((entry) => {
      const ts = entry.timestamp.getTime();
      return ts >= weekStart.getTime() && ts <= weekEnd.getTime();
    });

    const avg = weekEntries.length
      ? Number((weekEntries.reduce((sum, entry) => sum + entry.intensity, 0) / weekEntries.length).toFixed(1))
      : 0;

    return {
      label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
      logs: weekEntries.length,
      wins: weekEntries.filter((entry) => entry.type === "win").length,
      triggers: weekEntries.filter((entry) => entry.type === "trigger").length,
      avgIntensity: avg,
    };
  });

  writer.title(
    "Sessionly Detailed Personal Report",
    `Generated ${format(now, "PPP p")} for ${input.displayName || "User"}. This report includes account setup, activity snapshots, trend summaries, and detailed historical records.`,
  );

  writer.section("Report Scope");
  writer.keyValue("User", input.displayName || "User");
  writer.keyValue("Plan", input.plan);
  writer.keyValue("Data coverage", formatDateRange(allDates));
  writer.keyValue("Generated at", format(now, "PPP p"));
  writer.keyValue("Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "System default");

  writer.section("Account & Therapy Setup");
  writer.keyValue("Display name", input.settings.displayName || "Not set");
  writer.keyValue("Therapist name", input.settings.therapistName || "Not provided");
  writer.keyValue("Session frequency", input.settings.sessionFrequency);
  writer.keyValue("Session day", input.settings.sessionDay);
  writer.keyValue("Session time", input.settings.sessionTime);
  writer.keyValue("Next session begins", format(input.settings.nextSessionDate, "PPP p"));
  writer.keyValue("Theme / font size", `${input.settings.theme} / ${input.settings.fontSize}`);
  writer.keyValue("AI suggestions", input.settings.aiSuggestions ? "Enabled" : "Disabled");

  writer.section("Data Snapshot");
  writer.keyValue("Total logs", allEntries.length);
  writer.keyValue("Active logs", input.entries.length);
  writer.keyValue("Archived logs", input.archivedEntries.length);
  writer.keyValue("Logs this month", logsThisMonth);
  writer.keyValue("Total sessions", sessions.length);
  writer.keyValue("Completed sessions", completedSessions.length);
  writer.keyValue("Total homework items", input.homework.length);
  writer.keyValue("Homework completion", `${homeworkCompletionRate}% (${completedHomework.length}/${input.homework.length || 0})`);
  writer.keyValue("Open homework", openHomework.length);
  writer.keyValue("Overdue homework", overdueHomework.length);

  writer.section("Behavioral Signals", "Observed from your logging behavior over time.");
  writer.keyValue("Average log intensity", averageIntensity || "N/A");
  writer.keyValue("High-intensity logs (4-5)", `${highIntensityCount} (${allEntries.length ? Math.round((highIntensityCount / allEntries.length) * 100) : 0}%)`);
  writer.keyValue("Most active weekday", `${WEEKDAY_LABELS[busiestWeekdayIndex]} (${weekdayCounts[busiestWeekdayIndex]} logs)`);
  writer.keyValue("Most active time window", sortedBucket ? `${sortedBucket[0]} (${sortedBucket[1]} logs)` : "N/A");
  writer.keyValue("Distinct active days", new Set(activeDayKeys).size);
  writer.keyValue("Longest day-streak", `${longestActiveStreak} day${longestActiveStreak === 1 ? "" : "s"}`);

  writer.section("Log Type Distribution");
  (Object.keys(typeCounts) as LogEntry["type"][]).forEach((type) => {
    const count = typeCounts[type];
    const percent = allEntries.length ? Math.round((count / allEntries.length) * 100) : 0;
    writer.bullet(`${TYPE_LABELS[type]}: ${count} (${percent}%)`);
  });

  writer.section("Session Trends");
  writer.keyValue("Average post-session mood", averagePostMood || "N/A");
  if (completedSessions.length > 0) {
    const latest = completedSessions[0];
    writer.keyValue("Latest completed session", `${format(latest.date, "PPP")} · mood ${latest.postMood}/10${latest.moodWord ? ` · "${latest.moodWord}"` : ""}`);
  }
  if (topTopics.length > 0) {
    writer.paragraph("Most recurring topics:");
    topTopics.forEach(([topic, count]) => writer.bullet(`${topic}: ${count} session${count === 1 ? "" : "s"}`));
  } else {
    writer.paragraph("No recurring session topics available yet.");
  }

  writer.section("Weekly Activity Overview (Last 8 Weeks)");
  weeklySnapshots.forEach((week) => {
    writer.bullet(`${week.label}: ${week.logs} logs · wins ${week.wins} · triggers ${week.triggers} · avg intensity ${week.avgIntensity}`);
  });

  writer.section("Recent Session Notes (Detailed)", "Includes your saved notes, topics, prep items, and mood context.");
  if (sessions.length === 0) {
    writer.paragraph("No sessions found.");
  } else {
    for (const session of sessions) {
      writer.paragraph(
        `Session #${session.number} · ${format(session.date, "PPP p")}${session.endDate ? ` · ended ${format(session.endDate, "PPP")}` : " · ongoing"}`,
        { size: 9.8, color: [26, 24, 20] },
      );
      writer.paragraph(`Topics: ${session.topics.length > 0 ? session.topics.join(", ") : "None recorded"}`, { size: 9.4, indent: 3 });
      writer.paragraph(`Mood: ${session.postMood}/10${session.moodWord ? ` (${session.moodWord})` : ""}`, { size: 9.4, indent: 3 });
      writer.paragraph(`What stood out: ${session.whatStoodOut ? clip(session.whatStoodOut, 1000) : "No note saved."}`, { size: 9.4, indent: 3 });
      if (session.prepItems.length > 0) {
        writer.paragraph("Prep items:", { size: 9.4, indent: 3 });
        session.prepItems.forEach((item) => writer.bullet(item, 6));
      }
      writer.rule();
    }
  }

  writer.section("Log Timeline (Detailed)", "Entries are ordered newest first and include intensity and prep markers.");
  if (allEntries.length === 0) {
    writer.paragraph("No logs found.");
  } else {
    for (const entry of allEntries) {
      writer.paragraph(
        `${format(entry.timestamp, "PPP p")} · ${TYPE_LABELS[entry.type]} · intensity ${entry.intensity}/5${entry.isArchived ? " · archived" : ""}${entry.addedToPrep ? " · in prep" : ""}`,
        { size: 9.2 },
      );
      writer.paragraph(`Note: ${clip(entry.text, 600)}`, { size: 9.2, indent: 3 });
      if (entry.prepNote) {
        writer.paragraph(`Prep note: ${clip(entry.prepNote, 600)}`, { size: 9.2, indent: 3 });
      }
      writer.rule();
    }
  }

  writer.section("Homework Register", "Open and completed homework across sessions.");
  if (input.homework.length === 0) {
    writer.paragraph("No homework items found.");
  } else {
    writer.paragraph("Open items:");
    if (openHomework.length === 0) {
      writer.bullet("None");
    } else {
      openHomework.forEach((item) => {
        writer.bullet(
          `${item.text} · session ${format(item.sessionDate, "PPP")}${item.dueDate ? ` · due ${format(item.dueDate, "PPP")}` : ""}${item.dueDate && item.dueDate.getTime() < now.getTime() ? " · overdue" : ""}`,
        );
      });
    }
    writer.paragraph("Completed items:");
    if (completedHomework.length === 0) {
      writer.bullet("None");
    } else {
      completedHomework.forEach((item) => {
        writer.bullet(
          `${item.text} · session ${format(item.sessionDate, "PPP")}${item.completedDate ? ` · completed ${format(item.completedDate, "PPP")}` : ""}`,
        );
      });
    }
  }

  const fileDate = format(now, "yyyy-MM-dd");
  const filename = `sessionly-detailed-report-${fileDate}.pdf`;
  doc.save(filename);
  return filename;
}
