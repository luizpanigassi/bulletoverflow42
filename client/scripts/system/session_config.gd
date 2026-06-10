extends Resource
class_name SessionConfig

@export var mode: StringName = &"local"
@export var match_id: StringName = &""
@export var arena_id: StringName = &"arena_ruins"
@export var session_seed: int = 0
@export var host_id: StringName = &""
@export var players: Array[PlayerSessionState] = []

func to_dict() -> Dictionary:
	var players_data: Array[Dictionary] = []
	for player in players:
		players_data.append(player.to_dict())

	return {
		"mode": String(mode),
		"match_id": String(match_id),
		"arena_id": String(arena_id),
		"session_seed": session_seed,
		"host_id": String(host_id),
		"players": players_data,
	}

static func from_dict(data: Dictionary) -> SessionConfig:
	var session := SessionConfig.new()
	session.mode = StringName(data.get("mode", "local"))
	session.match_id = StringName(data.get("match_id", ""))
	session.arena_id = StringName(data.get("arena_id", "arena_ruins"))
	session.session_seed = int(data.get("session_seed", 0))
	session.host_id = StringName(data.get("host_id", ""))
	
	var players_data: Array = data.get("players", [])
	for player_data in players_data:
		session.players.append(PlayerSessionState.from_dict(player_data))
	
	return session
