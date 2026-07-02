SERVER_DIR := server
GODOT      := godot
SMOKE_SCENE := client/scenes/debug/network_smoke_test.tscn

.PHONY: help install server stop smoke-test-1 smoke-test-2

help:
	@echo "make server         - instala dependencias (se preciso) e sobe o backend (npm run dev)"
	@echo "make stop           - derruba o backend que estiver rodando em background"
	@echo "make smoke-test-1   - abre o client Godot conectado como slot 1"
	@echo "make smoke-test-2   - abre o client Godot conectado como slot 2"

$(SERVER_DIR)/node_modules: $(SERVER_DIR)/package.json $(SERVER_DIR)/package-lock.json
	cd $(SERVER_DIR) && npm install
	@touch $(SERVER_DIR)/node_modules

install: $(SERVER_DIR)/node_modules

server: install
	cd $(SERVER_DIR) && npm run dev

stop:
	@pkill -f "[t]sx watch src/main.ts" && echo "server parado" || echo "nenhum server rodando"

smoke-test-1:
	$(GODOT) --path . $(SMOKE_SCENE) -- --slot=1

smoke-test-2:
	$(GODOT) --path . $(SMOKE_SCENE) -- --slot=2
