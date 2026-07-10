/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this function whenever inserting external/user data into HTML.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for HTML insertion
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export const escapeHtml = (str) => {
  if (typeof str !== "string") {
    return "";
  }
  return str.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
};

export default escapeHtml;
