extends Node

var session: SessionConfig
var arena_ids := [
	&"arena_ruins",
	&"arena_badlands",
	&"arena_catacombs",
]

func clear_session() -> void:
	session = null

func set_local_session(p1_character_id: StringName, p2_character_id: StringName) -> void:
	session = SessionConfig.new()
	session.mode = &"local"
	session.match_id = &""
	session.arena_id = arena_ids.pick_random()
	session.session_seed = randi()
	session.host_id = &""
	session.players = [
		_make_player_state(1, p1_character_id, true),
		_make_player_state(2, p2_character_id, true),
	]

func _make_player_state(slot: int, character_id: StringName, is_ready: bool) -> PlayerSessionState:
	var state := PlayerSessionState.new()
	state.slot = slot
	state.character_id = character_id
	state.ready = is_ready
	return state
