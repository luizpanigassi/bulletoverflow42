SERVER_DIR := server
GODOT      := godot
SMOKE_SCENE := client/scenes/debug/network_smoke_test.tscn
BROWSER    := google-chrome
GAME_URL   := http://127.0.0.1:3000/play/index.html

.PHONY: help install server stop smoke-test-1 smoke-test-2 play

help:
	@echo "make server         - instala dependencias (se preciso) e sobe o backend (npm run dev)"
	@echo "make stop           - derruba o backend que estiver rodando em background"
	@echo "make smoke-test-1   - abre o client Godot conectado como slot 1"
	@echo "make smoke-test-2   - abre o client Godot conectado como slot 2"
	@echo "make play           - abre duas janelas do navegador, uma pra cada jogador"

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

play:
	$(BROWSER) --new-window --user-data-dir=/tmp/bulletoverflow42-chrome-p1 $(GAME_URL) &
	sleep 1
	$(BROWSER) --new-window --user-data-dir=/tmp/bulletoverflow42-chrome-p2 $(GAME_URL) &
