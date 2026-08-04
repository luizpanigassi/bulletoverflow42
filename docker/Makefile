COMPOSE := docker compose -f docker-compose.app.yml -f docker-compose.proxy.yml

.PHONY: up down restart build logs ps config clean

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) down
	$(COMPOSE) up -d --build

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

config:
	$(COMPOSE) config

clean:
	$(COMPOSE) down -v --remove-orphans
