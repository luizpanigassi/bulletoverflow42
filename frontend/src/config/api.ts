const localHttpBase = "http://127.0.0.1:3000";
const localWsBase = "ws://127.0.0.1:3000";

function isLocalViteDev() {
	return window.location.port === "5173";
}

function getDefaultHttpBase() {
	return isLocalViteDev() ? localHttpBase : "/api";
}


function getDefaultPlayBase() {
	// em dev bate no backend, em produção o nginx serve o build da Godot e o backend no mesmo domínio, então não precisa de base
	return isLocalViteDev() ? localHttpBase : "";
}

function getDefaultWsBase() {
	if (isLocalViteDev()) {
		return localWsBase;
	}

	const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${wsProtocol}//${window.location.host}`;
}

export const API_HTTP_BASE = import.meta.env.VITE_API_HTTP_BASE ?? getDefaultHttpBase();
export const PLAY_BASE = import.meta.env.VITE_PLAY_BASE ?? getDefaultPlayBase();
export const API_WS_BASE = import.meta.env.VITE_API_WS_BASE ?? getDefaultWsBase();
