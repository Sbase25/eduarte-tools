import { createApp } from "vue";
import ContextMenu from "./components/ContextMenu.vue";
import "./context-menu.css";

const hostId = "eduarte-tools-context-menu";
const initializationKey = "__eduarteToolsContextMenuInitializing";

if (!globalThis[initializationKey] && !document.getElementById(hostId)) {
  globalThis[initializationKey] = true;
  const host = document.createElement("div");
  host.id = hostId;
  document.documentElement.append(host);
  createApp(ContextMenu).mount(host);
}
