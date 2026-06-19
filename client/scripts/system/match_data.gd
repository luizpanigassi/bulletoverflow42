extends Node

var local_player_slot: int = 1
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
	session.match_seed = randi()
	session.host_id = &""
	session.game_type = &"vs_bot"
	session.players = [
		_make_player_state(1, p1_character_id, true),
		_make_player_state(2, p2_character_id, true),
	]

func _make_player_state(slot: int, character_id: StringName, is_ready: bool, username: String = "") -> PlayerSessionState:
	var state := PlayerSessionState.new()
	state.slot = slot
	state.character_id = character_id
	state.ready = is_ready
	state.username = username
	return state

func set_bot_session(p1_character_id: StringName) -> void:
	session = SessionConfig.new()
	
	session.mode = &"local"
	session.game_type = &"vs_bot"
	
	session.arena_id = arena_ids.pick_random()
	session.match_seed = randi()
	
	session.players = [
		_make_player_state(1, p1_character_id, true),
		_make_player_state(2, &"adventurer", true)
	]

func load_session_from_web() -> void:
	if OS.has_feature("web"):
		var js_data = JavaScriptBridge.eval("window.godotSessionData")
		if js_data:
			var dict = JSON.parse_string(String(js_data))
			if dict is Dictionary:
				session = SessionConfig.from_dict(dict)
				NetworkClient.connect_to_server("ws://servidor" + session.match_id)
				get_tree().change_scene_to_file("res://client/scenes/game.tscn")
