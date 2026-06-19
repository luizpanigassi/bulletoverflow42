extends Node

var _js_callback: JavaScriptObject
var local_player_slot: int = 1
var session: SessionConfig
var arena_ids := [
	&"arena_01",
	&"arena_02",
	&"arena_03",
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
	session.websocket_url = ""
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
	session.websocket_url = ""
	
	session.players = [
		_make_player_state(1, p1_character_id, true),
		_make_player_state(2, &"adventurer", true)
	]

func load_session_from_web() -> void:
	if OS.has_feature("web"):
		_js_callback = JavaScriptBridge.create_callback(_on_js_session_data)

func _on_js_session_data(args) -> void:
	var dict = JSON.parse_string(String(args[0]))
	if dict is Dictionary:
		session = SessionConfig.from_dict(dict)
		var websocket_url := session.websocket_url
		if websocket_url.is_empty():
			websocket_url = OS.get_environment("BULLET_OVERFLOW_WS_URL")
		if websocket_url.is_empty():
			push_error("Missing websocket_url for online session")
			return
		NetworkClient.connect_to_server(websocket_url)
		get_tree().change_scene_to_file("res://client/scenes/game.tscn")

func set_online_session_mock(p1_character_id: StringName, p2_character_id: StringName, my_slot: int = 1) -> void:
	session = SessionConfig.new()
	session.mode = &"online"
	session.match_id = &"match_test_001"
	session.arena_id = arena_ids.pick_random()
	session.match_seed = randi()
	session.host_id = &""
	session.websocket_url = ""
	session.game_type = &"pvp"
	session.players = [
		_make_player_state(1, p1_character_id, true),
		_make_player_state(2, p2_character_id, true),
	]
	local_player_slot = my_slot
