import { createApp } from "vue";
import ContextMenu from "./components/ContextMenu.vue";
import "./context-menu.css";

const hostId = "eduarte-tools-context-menu";
const initializationKey = "__eduarteToolsContextMenuInitializing";

if (!globalThis[initializationKey] && !document.getElementById(hostId)) {
  globalThis[initializationKey] = true;
  Promise.all([
    import("@material/web/menu/menu.js"),
    import("@material/web/menu/menu-item.js"),
  ]).then(() => {
    if (document.getElementById(hostId)) return;
    const host = document.createElement("div");
    host.id = hostId;
    document.documentElement.append(host);
    createApp(ContextMenu).mount(host);
  }).catch((error) => {
    delete globalThis[initializationKey];
    console.error("Eduarte Tools kon het contextmenu niet initialiseren.", error);
  });
}
