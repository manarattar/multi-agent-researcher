const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

export async function streamResearch(question, onEvent, onComplete, onError) {
  let response;
  try {
    response = await fetch(`${BASE}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  } catch (e) {
    onError("Could not connect to the backend.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const text = line.slice(6).trim();
        if (!text) continue;
        let data;
        try { data = JSON.parse(text); } catch { continue; }
        if (data.type === "complete") onComplete(data.report);
        else if (data.type === "error") onError(data.message);
        else onEvent(data);
      }
    }
  } catch (e) {
    onError(e.message);
  }
}

export async function getHistory() {
  const res = await fetch(`${BASE}/history`);
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${BASE}/history/${id}`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function deleteSession(id) {
  await fetch(`${BASE}/history/${id}`, { method: "DELETE" });
}

export async function askFollowUp(sessionId, question) {
  const res = await fetch(`${BASE}/followup/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("Failed to get answer");
  return res.json();
}
