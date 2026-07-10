import fs from "fs";
import path from "path";

const cssPath =
  "/home/vnicolas/workspace/repos/TimeUp/views/styles/card-section.css";
const content = fs.readFileSync(cssPath, "utf8");

console.log("--- Verifying CSS Fix for Entries List ---");

const entriesListBlock = content.match(/\.entries-list\s*\{([^}]*)\}/);

if (!entriesListBlock) {
  console.error("FAIL: Could not find .entries-list selector in CSS.");
  process.exit(1);
}

const blockContent = entriesListBlock[1];
const hasMaxHeight = /max-height:\s*180px/.test(blockContent);
const hasOverflowY = /overflow-y:\s*auto/.test(blockContent);

if (hasMaxHeight && hasOverflowY) {
  console.log("SUCCESS: .entries-list has max-height and overflow-y.");
} else {
  console.error("FAIL: .entries-list is missing scrolling properties.");
  console.error("Found:", blockContent);
  process.exit(1);
}

console.log("--- Verifying Aura Scrollbar ---");
const hasScrollbar = /\.entries-list::-webkit-scrollbar/.test(content);
if (hasScrollbar) {
  console.log("SUCCESS: Aura scrollbar styling found.");
} else {
  console.warn("WARNING: Aura scrollbar styling not found.");
}
