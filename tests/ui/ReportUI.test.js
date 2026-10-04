/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { readFileSync } from "node:fs";
import { getBoardMembers } from "../../src/services/TrelloService.js";

const html = readFileSync(new URL("../../views/report.html", import.meta.url), "utf8");
// Execute the page's actual report and export handlers with a mocked Trello SDK.
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
  .replace(/^\s*import .*;$/gm, "");
const timestamp = new Date("2026-10-04T10:00:00").getTime();
const entry = (memberId, startTime = timestamp) => ({
  memberId, startTime, endTime: startTime + 3600000,
  duration: 3600000, description: "Work",
});

describe("Time report user attribution", () => {
  let t;
  let buildReport;
  let download;

  beforeEach(() => {
    document.body.innerHTML = html.match(/<body>([\s\S]*?)<script/)[1];
    t = {
      board: jest.fn(async (field) => field === "members"
        ? { members: [
            { id: "alice", fullName: 'Žaneta, "QA" <team>' },
            { id: "bob", username: "bob" },
          ] }
        : { name: "Test board" }),
      cards: jest.fn(async () => [{ id: "card", name: "Card", url: "https://trello.com/c/test", idList: "list" }]),
      lists: jest.fn(async () => [{ id: "list", name: "Doing" }]),
      get: jest.fn(async () => ({ totalTime: 7200000, recentEntries: [entry("alice"), entry("bob")] })),
      render: jest.fn((callback) => { buildReport = callback; }),
    };
    URL.createObjectURL = jest.fn(() => "blob:report");
    URL.revokeObjectURL = jest.fn();
    download = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    new Function("AppConfig", "getBoardMembers", "TrelloPowerUp", script)(
      {}, getBoardMembers, { iframe: () => t },
    );
  });

  afterEach(() => { jest.restoreAllMocks(); });

  const exportCsv = async () => {
    document.getElementById("export-csv").click();
    const blob = URL.createObjectURL.mock.calls[0][0];
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  };

  test("exports each entry's user and escapes names in CSV and the work log", async () => {
    await buildReport();
    const csv = await exportCsv();
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('"Report period","Date","Time","Card name","List","Tracked hours","Description","User"');
    expect(lines[1]).toContain('"1","Work","Žaneta, ""QA"" <team>"');
    expect(lines[2]).toContain('"1","Work","bob"');
    const rows = document.querySelectorAll("#entry-rows tr");
    expect(rows[0].cells[5].textContent).toBe('Žaneta, "QA" <team>');
    expect(rows[0].querySelector("team")).toBeNull();
    expect(rows[1].cells[5].textContent).toBe("bob");
    expect(download).toHaveBeenCalledTimes(1);
  });

  test("preserves an unavailable member ID and marks unattributed entries as unknown", async () => {
    t.get.mockResolvedValue({ totalTime: 7200000, recentEntries: [entry("former-member"), entry(null)] });
    await buildReport();
    const lines = (await exportCsv()).split("\n");
    expect(lines[1]).toContain('"Work","former-member"');
    expect(lines[2]).toContain('"Work","Unknown"');
  });

  test("exports aggregate totals without inventing an author", async () => {
    t.get.mockResolvedValue({ totalTime: 7200000 });
    await buildReport();
    expect(await exportCsv()).toContain('"2","Aggregate total (no dated entries)","Unknown"');
  });

  test("keeps date filtering and CSV available when board member lookup fails", async () => {
    t.board.mockImplementation(async (field) => {
      if (field === "members") throw new Error("Members unavailable");
      return { name: "Test board" };
    });
    t.get.mockResolvedValue({ totalTime: 7200000, recentEntries: [
      entry("alice"), entry("bob", new Date("2026-10-03T10:00:00").getTime()),
    ] });
    document.getElementById("date-from").value = "2026-10-04";
    document.getElementById("date-to").value = "2026-10-04";
    await buildReport();
    const csv = await exportCsv();
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain('"Work","alice"');
    expect(csv).not.toContain('"bob"');
    expect(document.getElementById("summary-time").textContent).toBe("1h 0m");
  });
});
