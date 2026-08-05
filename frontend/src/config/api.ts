const localHttpBase = "http://127.0.0.1:3000";
const localWsBase = "ws://127.0.0.1:3000";

function isLocalViteDev() {
	return window.location.port === "5173";
}

function getDefaultHttpBase() {
	return isLocalViteDev() ? localHttpBase : "/api";
}

function getDefaultWsBase() {
	if (isLocalViteDev()) {
		return localWsBase;
	}

	const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${wsProtocol}//${window.location.host}`;
}

export const API_HTTP_BASE = import.meta.env.VITE_API_HTTP_BASE ?? getDefaultHttpBase();
export const API_WS_BASE = import.meta.env.VITE_API_WS_BASE ?? getDefaultWsBase();
