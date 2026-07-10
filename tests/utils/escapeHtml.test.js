/**
 * @jest-environment jsdom
 */

import { escapeHtml } from "../../src/utils/escapeHtml.js";

describe("escapeHtml", () => {
  describe("basic escaping", () => {
    test("should escape < character", () => {
      expect(escapeHtml("<")).toBe("&lt;");
    });

    test("should escape > character", () => {
      expect(escapeHtml(">")).toBe("&gt;");
    });

    test("should escape & character", () => {
      expect(escapeHtml("&")).toBe("&amp;");
    });

    test('should escape " character', () => {
      expect(escapeHtml('"')).toBe("&quot;");
    });

    test("should escape ' character", () => {
      expect(escapeHtml("'")).toBe("&#39;");
    });
  });

  describe("complex strings", () => {
    test("should escape full HTML tags", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
      );
    });

    test("should escape attributes with quotes", () => {
      expect(escapeHtml('<div class="test">')).toBe(
        "&lt;div class=&quot;test&quot;&gt;",
      );
    });

    test("should escape mixed special characters", () => {
      expect(escapeHtml('<a href="test?a=1&b=2">')).toBe(
        "&lt;a href=&quot;test?a=1&amp;b=2&quot;&gt;",
      );
    });

    test("should handle normal text without special characters", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });

    test("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("edge cases", () => {
    test("should return empty string for null", () => {
      expect(escapeHtml(null)).toBe("");
    });

    test("should return empty string for undefined", () => {
      expect(escapeHtml(undefined)).toBe("");
    });

    test("should return empty string for non-string types", () => {
      expect(escapeHtml(123)).toBe("");
      expect(escapeHtml({})).toBe("");
      expect(escapeHtml([])).toBe("");
    });

    test("should handle strings with only whitespace", () => {
      expect(escapeHtml("   ")).toBe("   ");
    });

    test("should handle newlines and tabs", () => {
      expect(escapeHtml("\n\t")).toBe("\n\t");
    });
  });

  describe("XSS prevention", () => {
    const xssVectors = [
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      "javascript:alert(1)",
      '<a href="javascript:alert(1)">click</a>',
      '<div onclick="alert(1)">click</div>',
      '"><script>alert(1)</script>',
      "'-alert(1)-'",
      "<iframe src=\"javascript:alert('XSS')\">",
    ];

    test.each(xssVectors)("should escape XSS vector: %s", (vector) => {
      const escaped = escapeHtml(vector);
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
    });
  });

  describe("entry data escaping", () => {
    test("should escape entry description with script tag", () => {
      const maliciousDesc = '<script>alert("xss")</script>Task done';
      const escaped = escapeHtml(maliciousDesc);
      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Task done",
      );
    });

    test("should escape entry ID with special characters", () => {
      const maliciousId = 'entry_<script>alert("xss")</script>';
      const escaped = escapeHtml(maliciousId);
      expect(escaped).toBe(
        "entry_&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      );
    });
  });
});
