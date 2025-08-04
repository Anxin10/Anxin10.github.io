// グローバルに socket を宣言
var socket = null;

const wsKeyMap = {
  0: "q", 1: "w", 2: "e",
  3: "a", 4: "s", 5: "d",
  6: "z", 7: "x", 8: "c"
};

let previousCtrl = Array(9).fill(0);

function simulateKeyEvent(key, type = "keydown") {
  const event = new KeyboardEvent(type, { key: key });
  document.dispatchEvent(event);
}

function setupInputWebSocket() {
  try {
    socket = new WebSocket("wss://icdc.onrender.com");
    socket.onopen = () => console.log("[WS] Connected");
    socket.onclose = () => console.log("[WS] Disconnected");
    socket.onerror = err => console.error("[WS] Error:", err);

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (!("ctrl" in data)) return;

        const ctrl = data.ctrl;
        for (let i = 0; i < ctrl.length; i++) {
          const key = wsKeyMap[i];
          if (!key) continue;

          if (ctrl[i] === 1 && previousCtrl[i] === 0) {
            simulateKeyEvent(key, "keydown");
          } else if (ctrl[i] === 0 && previousCtrl[i] === 1) {
            simulateKeyEvent(key, "keyup");
          }
        }
        previousCtrl = ctrl;
      } catch (e) {
        console.error("[WS] JSON parse error:", e);
      }
    };
  } catch (e) {
    console.warn("[WS] WebSocket setup failed (debug mode):", e);
    socket = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupInputWebSocket();
});

