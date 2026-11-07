import { createApp } from "vue";
import "@material/web/menu/menu.js";
import "@material/web/menu/menu-item.js";
import ContextMenu from "./components/ContextMenu.vue";
import "./context-menu.css";

const host = document.createElement("div");
host.id = "eduarte-tools-context-menu";
document.documentElement.append(host);
createApp(ContextMenu).mount(host);
