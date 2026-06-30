extends Resource
class_name SessionConfig

@export var mode: StringName = &"local"
@export var match_id: StringName = &""
@export var arena_id: StringName = &"arena_ruins"
@export var match_seed: int = 0
@export var host_id: StringName = &""
@export var websocket_url: String = ""
@export var players: Array[PlayerSessionState] = []
@export var game_type: StringName = &"pvp_local"
@export var bot_difficulty: String = "easy"

func to_dict() -> Dictionary:
	var players_data: Array[Dictionary] = []
	for player in players:
		players_data.append(player.to_dict())

	return {
		"mode": String(mode),
		"match_id": String(match_id),
		"arena_id": String(arena_id),
		"seed": match_seed,
		"host_id": String(host_id),
		"websocket_url": websocket_url,
		"players": players_data,
		"game_type": String(game_type),
		"bot_difficulty": bot_difficulty,
	}

static func from_dict(data: Dictionary) -> SessionConfig:
	var session := SessionConfig.new()
	session.mode = StringName(data.get("mode", "online"))
	session.match_id = StringName(data.get("match_id", ""))
	session.arena_id = StringName(data.get("arena_id", "arena_01"))
	session.match_seed = int(data.get("seed", 0))
	session.host_id = StringName(data.get("host_id", ""))
	session.websocket_url = String(data.get("websocket_url", ""))
	session.game_type = StringName(data.get("game_type", "pvp"))
	session.bot_difficulty = String(data.get("bot_difficulty", "easy"))
	
	var players_data: Array[Dictionary] = data.get("players", [])
	for player_data in players_data:
		session.players.append(PlayerSessionState.from_dict(player_data))
	
	return session
