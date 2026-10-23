const ENCODING = "gzip-base64-v1";

// Keep small/legacy objects unchanged; compress larger histories without dropping fields.
export const encodeTimerData = async (data) => {
  const json = JSON.stringify(data);
  if (json.length < 3000 || typeof CompressionStream === "undefined") {
    return data;
  }
  if (!Array.isArray(data.recentEntries)) return data;
  const stream = new Blob([JSON.stringify(data.recentEntries)])
    .stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // Leave totals and timer state readable to previously opened Power-Up frames.
  // Older clients preserve this extra field when saving newly recorded entries.
  const encoded = {
    ...data,
    recentEntries: [],
    timeupHistory: { encoding: ENCODING, data: btoa(binary) },
  };
  return JSON.stringify(encoded).length < json.length ? encoded : data;
};

export const decodeTimerData = async (data) => {
  if (data?.timeupHistory?.encoding !== ENCODING) return data;
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot read compressed time history. Please update your browser.");
  }
  try {
    const bytes = Uint8Array.from(atob(data.timeupHistory.data), (char) => char.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const entries = JSON.parse(await new Response(stream).text());
    if (!Array.isArray(entries)) throw new Error("Invalid history");
    const { timeupHistory, ...rest } = data;
    return { ...rest, recentEntries: [...(rest.recentEntries || []), ...entries] };
  } catch (error) {
    // Never replace unreadable history with defaults on a subsequent save.
    throw new Error("Time history could not be read. No changes were saved.", { cause: error });
  }
};
