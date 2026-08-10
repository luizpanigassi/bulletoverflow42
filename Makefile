SERVER_DIR := server
GODOT_VERSION := 4.4-stable
GODOT_BIN_DIR := $(HOME)/.local/bin
GODOT      := $(GODOT_BIN_DIR)/godot
GODOT_TEMPLATES_DIR := $(HOME)/.local/share/godot/export_templates/4.4.stable
SMOKE_SCENE := client/scenes/debug/network_smoke_test.tscn
BROWSER    := google-chrome
SERVER_URL := http://127.0.0.1:3000
GAME_URL   := $(SERVER_URL)/play/index.html
SERVER_LOG := /tmp/bulletoverflow42-server.log
BUILD_WEB_INDEX := build/web/index.html

.PHONY: help setup setup-godot setup-templates setup-chrome setup-export-preset setup-web-build install server server-bg stop smoke-test-1 smoke-test-2 play

help:
	@echo "make setup          - instala o que faltar nessa maquina (Godot, export templates, Chrome, deps do server, export_presets.cfg, build web)"
	@echo "make server         - instala dependencias (se preciso) e sobe o backend (npm run dev)"
	@echo "make stop           - derruba o backend que estiver rodando em background"
	@echo "make smoke-test-1   - abre o client Godot conectado como slot 1"
	@echo "make smoke-test-2   - abre o client Godot conectado como slot 2"
	@echo "make play           - garante o server rodando (sobe em background se preciso) e abre duas janelas do navegador, uma pra cada jogador"

setup: setup-godot setup-templates setup-chrome setup-export-preset setup-web-build install
	@echo "Setup completo."

setup-godot:
	@if [ -x "$(GODOT)" ]; then \
		echo "Godot já instalado em $(GODOT)"; \
	else \
		echo "Baixando Godot $(GODOT_VERSION)..."; \
		mkdir -p $(GODOT_BIN_DIR); \
		curl -sL -o /tmp/godot.zip "https://github.com/godotengine/godot/releases/download/$(GODOT_VERSION)/Godot_v$(GODOT_VERSION)_linux.x86_64.zip"; \
		rm -rf /tmp/godot_extracted && mkdir -p /tmp/godot_extracted; \
		unzip -o -q /tmp/godot.zip -d /tmp/godot_extracted; \
		mv /tmp/godot_extracted/Godot_v$(GODOT_VERSION)_linux.x86_64 $(GODOT); \
		chmod +x $(GODOT); \
		rm -rf /tmp/godot.zip /tmp/godot_extracted; \
		echo "Godot instalado em $(GODOT)"; \
	fi
	@echo "Gerando cache de import do projeto..."
	@$(GODOT) --headless --path . --import >/dev/null 2>&1 || true

setup-templates:
	@if [ -d "$(GODOT_TEMPLATES_DIR)" ] && [ -n "$$(ls -A $(GODOT_TEMPLATES_DIR) 2>/dev/null)" ]; then \
		echo "Export templates já instalados em $(GODOT_TEMPLATES_DIR)"; \
	else \
		echo "Baixando export templates do Godot $(GODOT_VERSION) (~1.2GB, pode demorar)..."; \
		mkdir -p $(GODOT_TEMPLATES_DIR); \
		curl -sL -o /tmp/godot_templates.tpz "https://github.com/godotengine/godot/releases/download/$(GODOT_VERSION)/Godot_v$(GODOT_VERSION)_export_templates.tpz"; \
		rm -rf /tmp/godot_templates_extracted && mkdir -p /tmp/godot_templates_extracted; \
		unzip -o -q /tmp/godot_templates.tpz -d /tmp/godot_templates_extracted; \
		mv /tmp/godot_templates_extracted/templates/* $(GODOT_TEMPLATES_DIR)/; \
		rm -rf /tmp/godot_templates.tpz /tmp/godot_templates_extracted; \
		echo "Export templates instalados"; \
	fi

setup-chrome:
	@if command -v $(BROWSER) >/dev/null 2>&1; then \
		echo "Chrome já instalado"; \
	else \
		echo "Baixando e instalando Google Chrome (vai pedir senha do sudo)..."; \
		curl -sL -o /tmp/google-chrome-stable_current_amd64.deb "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"; \
		sudo apt install -y /tmp/google-chrome-stable_current_amd64.deb; \
		rm -f /tmp/google-chrome-stable_current_amd64.deb; \
	fi

setup-export-preset:
	@if [ -f export_presets.cfg ]; then \
		echo "export_presets.cfg já existe"; \
	else \
		echo "export_presets.cfg não existe (é gitignored) — criando a partir do template..."; \
		cp export_presets.cfg.template export_presets.cfg; \
		echo "export_presets.cfg criado"; \
	fi

# Depende de godot/templates/preset já existirem — precisa rodar depois deles.
setup-web-build: setup-godot setup-templates setup-export-preset
	@if [ -f "$(BUILD_WEB_INDEX)" ]; then \
		echo "Build web já existe em $(BUILD_WEB_INDEX)"; \
	else \
		echo "Build web não existe, exportando..."; \
		mkdir -p build/web; \
		$(GODOT) --headless --export-release "Web" $(BUILD_WEB_INDEX); \
	fi

$(SERVER_DIR)/node_modules: $(SERVER_DIR)/package.json $(SERVER_DIR)/package-lock.json
	cd $(SERVER_DIR) && npm install
	@touch $(SERVER_DIR)/node_modules

install: $(SERVER_DIR)/node_modules

server: install
	cd $(SERVER_DIR) && npm run dev

server-bg: install
	@if curl -s -o /dev/null -w "%{http_code}" $(SERVER_URL)/ | grep -q 200; then \
		echo "server já está rodando"; \
	else \
		echo "server não está rodando, subindo em background (log em $(SERVER_LOG))..."; \
		( cd $(SERVER_DIR) && nohup npm run dev > $(SERVER_LOG) 2>&1 & ); \
		sleep 2; \
	fi

stop:
	@pkill -f "[t]sx watch src/main.ts" && echo "server parado" || echo "nenhum server rodando"

smoke-test-1:
	$(GODOT) --path . $(SMOKE_SCENE) -- --slot=1

smoke-test-2:
	$(GODOT) --path . $(SMOKE_SCENE) -- --slot=2

play: server-bg setup-web-build
	$(BROWSER) --new-window --user-data-dir=/tmp/bulletoverflow42-chrome-p1 $(GAME_URL) &
	sleep 1
	$(BROWSER) --new-window --user-data-dir=/tmp/bulletoverflow42-chrome-p2 $(GAME_URL) &

DOCKER_DIR       := docker
DOCKER_ENV       := $(DOCKER_DIR)/.env
COMPOSE_APP      := $(DOCKER_DIR)/docker-compose.app.yml
COMPOSE_PROXY    := $(DOCKER_DIR)/docker-compose.proxy.yml
DOCKER_NETWORK   := transcendence_net

.PHONY: docker-network docker-app-up docker-proxy-up docker-up docker-app-down docker-proxy-down docker-down docker-restart docker-logs docker-ps docker-build

docker-network:
	@if docker network inspect $(DOCKER_NETWORK) >/dev/null 2>&1; then \
		echo "rede $(DOCKER_NETWORK) já existe"; \
	else \
		echo "criando rede $(DOCKER_NETWORK)..."; \
		docker network create $(DOCKER_NETWORK); \
	fi

docker-app-up: docker-network
	docker compose -f $(COMPOSE_APP) --env-file $(DOCKER_ENV) up -d --build

docker-proxy-up: docker-network
	docker compose -f $(COMPOSE_PROXY) --env-file $(DOCKER_ENV) up -d

docker-up: docker-network docker-app-up docker-proxy-up
	@echo "stacks de app e proxy no ar."

docker-app-down:
	docker compose -f $(COMPOSE_APP) --env-file $(DOCKER_ENV) down

docker-proxy-down:
	docker compose -f $(COMPOSE_PROXY) --env-file $(DOCKER_ENV) down

docker-down: docker-proxy-down docker-app-down
	@echo "stacks de app e proxy derrubadas."

docker-restart: docker-down docker-up
	@echo "stacks reiniciadas."

docker-logs:
	docker compose -f $(COMPOSE_APP) -f $(COMPOSE_PROXY) --env-file $(DOCKER_ENV) logs -f

docker-ps:
	docker compose -f $(COMPOSE_APP) --env-file $(DOCKER_ENV) ps
	docker compose -f $(COMPOSE_PROXY) --env-file $(DOCKER_ENV) ps

docker-build:
	docker compose -f $(COMPOSE_APP) --env-file $(DOCKER_ENV) build --no-cache backend frontend
