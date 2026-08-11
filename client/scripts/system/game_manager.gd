extends Node

@onready var entities: Node2D = $"../../Entities"
@onready var match_end_screen = $"../../UI/MatchEndScreen"
@onready var match_end_label = $"../../UI/MatchEndScreen/Label"
@onready var round_result_screen = $"../../UI/RoundResultScreen"
@onready var arena_container = $"../../World/ArenaContainer"
@onready var round_countdown_screen = $"../../UI/RoundCountdownScreen"
@onready var music_player = $"../../MusicPlayer"
@onready var stinger_player = $"../../StingPlayer"

@export var player_scene: PackedScene
@export var powerup_scene: PackedScene

var player1: Player
var player2: Player
var bot_controller: Node
var bot_name: String = ""
var match_finished: bool = false
var round_active: bool = false
var spawn_points: Array[Marker2D] = []
var powerup_spawn_points: Array[Marker2D] = []
var active_powerup: Powerup = null
var round_number: int = 0
var waiting_for_opponent_reconnect: bool = false
var _force_quit_js_callback: JavaScriptObject
var scores: Dictionary = {
	1: 0,
	2: 0
}

const BotControllerScene = preload("res://client/scripts/system/bot_controller.gd")
const SCORE_TO_WIN: int = 5
const ARENAS := {
	"arena_01": preload("res://client/scenes/arenas/arena_ruins.tscn"),
	"arena_02": preload("res://client/scenes/arenas/arena_badlands.tscn"),
	"arena_03": preload("res://client/scenes/arenas/arena_catacombs.tscn")
}

const ARENA_MUSIC := {
	"arena_01": preload("res://client/assets/music/arena_ruins.ogg"),
	"arena_02": preload("res://client/assets/music/arena_badlands.ogg"),
	"arena_03": preload("res://client/assets/music/arena_catacombs.ogg"),
}

const VICTORY_JINGLE := preload("res://client/assets/music/victory.ogg")
const DEFEAT_JINGLE := preload("res://client/assets/music/defeat.ogg")

const MUSIC_FADE_DURATION := 1.0
const MUSIC_FADE_OUT_VOLUME := -40.0

const MIN_SPAWN_DISTANCE := 600.0

signal match_ended(winner_id: int)

func _ready() -> void:
	load_arena()
	var found_spawns: Array[Node] = get_tree().get_nodes_in_group("spawn_points")
	var found_powerup_spawns: Array[Node] = get_tree().get_nodes_in_group("powerup_spawns")
	
	for spawn in found_spawns:
		spawn_points.append(spawn as Marker2D)
		
	for powerup_spawn in found_powerup_spawns:
		powerup_spawn_points.append(powerup_spawn as Marker2D)
	
	GameEvents.round_started.connect(_on_network_round_started)
	GameEvents.round_ended.connect(_on_network_round_ended)
	GameEvents.player_died.connect(_on_network_player_died)
	GameEvents.match_ended.connect(_on_network_match_ended)
	GameEvents.state_sync_requested.connect(_on_state_sync_requested)
	GameEvents.state_sync_received.connect(_on_state_sync_received)
	GameEvents.forfeit_victory_claimed.connect(_on_forfeit_victory_claimed)
	GameEvents.opponent_disconnected.connect(_on_opponent_disconnected)
	GameEvents.player_state_updated.connect(_on_player_state_updated_reconnect_check)
	
	if OS.has_feature("web"):
		_register_force_quit_bridge()
	
	if MatchData.session == null or MatchData.session.mode == &"local":
		start_round()
		start_powerup_loop.call_deferred()
	elif MatchData.session.mode == &"online" and not NetworkClient.is_network_connected:
		if MatchData.session.websocket_url.is_empty():
			GameEvents.match_event_received.emit({"type": "match_start", "match_id": String(MatchData.session.match_id)})
			GameEvents.match_event_received.emit({"type": "round_start"})
		elif not NetworkClient.is_network_connected:
			await NetworkClient.network_connected

func get_random_spawn_positions() -> Array[Marker2D]:
	var valid_pairs: Array = []
	
	for i in range(spawn_points.size()):
		for j in range(i + 1, spawn_points.size()):
			var a := spawn_points[i]
			var b := spawn_points[j]
			
			if a.global_position.distance_to(b.global_position) >= MIN_SPAWN_DISTANCE:
				valid_pairs.append([a, b])
	
	var rng := RandomNumberGenerator.new()
	rng.seed = MatchData.session.match_seed + round_number
	
	if valid_pairs.is_empty():
		push_error("No valid spawn point pairs found")
		var shuffled: Array[Marker2D] = spawn_points.duplicate()
		shuffled.shuffle()
		
		return [shuffled[0], shuffled[1]]
	
	var pair: Array = valid_pairs[rng.randi() % valid_pairs.size()]
	
	return [pair[0] as Marker2D, pair[1] as Marker2D]

func spawn_player(player_state: PlayerSessionState, spawn_position: Vector2, is_bot_player: bool = false) -> Player:
	var player_instance: Player = player_scene.instantiate() as Player
	if not player_instance:
		push_error("Player scene did not instantiate as Player")
		return
	
	var character_data := CharacterRegistry.get_character(player_state.character_id)
	if not character_data:
		push_error("Unknown character_id: %s" % player_state.character_id)
		return
	
	player_instance.player_name = player_state.username
	player_instance.player_id = player_state.slot
	player_instance.character_data = character_data
	player_instance.global_position = spawn_position
	player_instance.network_target_position = spawn_position
	player_instance.died.connect(_on_player_died)
	player_instance.is_bot = player_state.is_bot or is_bot_player
	entities.add_child(player_instance)
	player_instance.player_id_label.text = player_instance.player_name if not player_instance.player_name.is_empty() else "Player %d" % player_instance.player_id
	
	return player_instance

func spawn_bot() -> void:
	if is_instance_valid(bot_controller):
		bot_controller.queue_free()
	
	bot_controller = BotControllerScene.new()
	
	bot_controller.controlled_player = player2
	bot_controller.target_player = player1
	
	if MatchData.session:
		bot_controller.difficulty = MatchData.session.bot_difficulty
	
	add_child(bot_controller)

func _on_player_died(dead_player_id: int) -> void:
	if not round_active:
		return

	if MatchData.session and MatchData.session.mode == &"online":
		return

	var winner_id: int
	
	if dead_player_id == 1:
		winner_id = 2
	else:
		winner_id = 1
	
	end_round(winner_id)
	
func start_round() -> void:
	round_result_screen.hide_screen()
	if MatchData.session == null:
		push_error("No session available")
		return
	
	round_number += 1
	clear_projectiles()
	clear_players()
	
	var selected_spawns: Array[Marker2D] = get_random_spawn_positions()
	var players: Array = MatchData.session.players
	
	if players.size() < 2:
		push_error("Session needs at least 2 players")
		return
	
	var is_bot_match := MatchData.session.game_type == &"vs_bot"
	
	if is_bot_match and bot_name.is_empty():
		bot_name = Player.BOT_NAMES.pick_random()
	
	player1 = spawn_player(players[0], selected_spawns[0].global_position)
	player2 = spawn_player(players[1], selected_spawns[1].global_position, is_bot_match)
	
	NetworkPlayerSynchronizer.register_player(player1)
	NetworkPlayerSynchronizer.register_player(player2)
	
	if MatchData.session.mode == &"local" or (MatchData.session.mode == &"online" and not NetworkClient.is_network_connected):
		MockMatchServer.set_spawn(1, selected_spawns[0].global_position)
		MockMatchServer.set_spawn(2, selected_spawns[1].global_position)
	
	if is_bot_match:
		player2.player_name = bot_name
		player2.player_id_label.text = bot_name
		spawn_bot()
	
	player1.controls_enabled = false
	player2.controls_enabled = false
	
	start_round_countdown()
	
func start_round_countdown() -> void:
	player1.modulate.a = 0.5
	player2.modulate.a = 0.5
	
	await round_countdown_screen.start_countdown(scores[1], scores[2])
	
	player1.controls_enabled = true
	player2.controls_enabled = true
	
	player1.modulate.a = 1
	player2.modulate.a = 1
	
	round_active = true
	GameEvents.round_gameplay_started.emit()
	
func end_round(winner_id: int) -> void:
	round_active = false
	
	player1.controls_enabled = false
	player2.controls_enabled = false
	
	if is_instance_valid(active_powerup):
		active_powerup.queue_free()
	
	scores[winner_id] += 1
	
	if scores[winner_id] >= SCORE_TO_WIN:
		if MatchData.session and MatchData.session.mode == &"online":
			if not NetworkClient.is_network_connected:
				GameEvents.match_event_received.emit({
					"type": "match_end",
					"winner_slot": winner_id,
					"player1_score": scores[1],
					"player2_score": scores[2]
				})
		else:
			end_match(winner_id)
			_wait_for_jingle_then_return()
	else:
		var winner: Player = player1
		
		if winner_id == 2:
			winner = player2
		round_result_screen.show_round_result(winner.player_name, player1.player_name, player2.player_name, scores[1], scores[2])
		await get_tree().create_timer(2.0).timeout
		round_result_screen.hide_screen()
		
		reset_round()

func _on_network_match_ended(state: MatchState):
	if MatchData.session and MatchData.session.mode == &"online":
		if match_finished:
			return
		end_match(state.winner_slot)
		_wait_for_jingle_then_return()

func reset_round() -> void:
	if MatchData.session and MatchData.session.mode == &"online":
		GameEvents.match_event_received.emit({"type": "round_start"})
		return
	start_round()

func clear_projectiles() -> void:
	var projectiles: Array[Node] = get_tree().get_nodes_in_group("projectiles")
	
	for projectile in projectiles:
		projectile.queue_free()

func clear_players() -> void:
	var players: Array[Node] = get_tree().get_nodes_in_group("players")
	
	if is_instance_valid(bot_controller):
		bot_controller.queue_free()
	
	bot_controller = null
	
	for player in players:
		NetworkPlayerSynchronizer.unregister_player(player.player_id)
		player.queue_free()
	
func start_powerup_loop() -> void:
	while not match_finished:
		var wait_time := randf_range(1.0, 10.0)
		
		await get_tree().create_timer(wait_time).timeout
		
		if not round_active:
			continue
			
		spawn_random_powerup()
		
func spawn_random_powerup() -> void:
	if powerup_spawn_points.is_empty():
		return
	if is_instance_valid(active_powerup):
		return
		
	var spawn_point: Marker2D = powerup_spawn_points.pick_random()
	var powerup: Powerup = powerup_scene.instantiate() as Powerup
	var powerup_types := [
		PowerupTypes.Type.RAPID_FIRE,
		PowerupTypes.Type.SPEED_BOOST,
		PowerupTypes.Type.SHIELD,
	]
	powerup.powerup_type = powerup_types.pick_random()
		
	powerup.global_position = spawn_point.global_position
	entities.add_child(powerup)
	
	active_powerup = powerup
	powerup.tree_exited.connect(_on_powerup_removed)
	
func _on_powerup_removed() -> void:
	active_powerup = null

func end_match(winner_id: int) -> void:
	round_result_screen.hide_screen()
	show_winner(winner_id)
	clear_players()
	
	if is_instance_valid(active_powerup):
		active_powerup.queue_free()
	
	bot_name = ""
	active_powerup = null
	round_active = false
	match_finished = true
	match_ended.emit(winner_id)

func show_winner(winner_id: int) -> void:
	match_end_screen.visible = true
	
	var winner_name := player1.player_name
	
	if winner_id == 2:
		winner_name = player2.player_name
		
	match_end_label.text = "%s WINS!" % winner_name
	
	play_end_jingle(winner_id)

func _return_to_matchmaking() -> void:
	print("Returning to matchmaking...")
	music_player.stop()
	stinger_player.stop()
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.onMatchEnded && window.onMatchEnded();")
		get_tree().quit()
	else:
		get_tree().quit()

func _register_force_quit_bridge() -> void:
	_force_quit_js_callback = JavaScriptBridge.create_callback(_on_force_quit_requested)
	var window = JavaScriptBridge.get_interface("window")
	if window:
		window.forceQuitGame = _force_quit_js_callback
		print("JavaScript bridge registered: window.forceQuitGame")

func _on_force_quit_requested(_args) -> void:
	print("Force quit requested from JS (saída manual pro menu)")
	music_player.stop()
	stinger_player.stop()
	get_tree().quit()

func load_arena() -> void:
	if MatchData.session == null:
		return
	
	var arena_id := String(MatchData.session.arena_id)
	
	if not ARENAS.has(arena_id):
		push_error("Arena not found: %s" % arena_id)
		return
		
	var arena_scene: PackedScene = ARENAS[arena_id]
	var arena = arena_scene.instantiate()
	
	arena_container.add_child(arena)
	
	play_arena_music(arena_id)

func play_arena_music(arena_id) -> void:
	if not ARENA_MUSIC.has(arena_id):
		return
		
	music_player.stream = ARENA_MUSIC[arena_id]
	music_player.play()

func _on_network_round_started(_data: Dictionary) -> void:
	if MatchData.session and MatchData.session.mode == &"online":
		if round_active:
			return
		start_round()

func _on_network_round_ended(winner_id: int) -> void:
	if MatchData.session and MatchData.session.mode == &"online":
		if not round_active:
			return
		end_round(winner_id)

func _on_network_player_died(dead_player_id: int) -> void:
	if MatchData.session and MatchData.session.mode == &"online":
		if not round_active:
			return
		var winner_id: int = 2 if dead_player_id == 1 else 1
		end_round(winner_id)

func _on_state_sync_requested() -> void:
	if MatchData.session == null or MatchData.session.mode != &"online":
		return
	if not NetworkClient.is_network_connected:
		return
		
	var payload := {
		"type": "state_sync",
		"player1_score": scores[1],
		"player2_score": scores[2],
		"round_active": round_active,
	}
	
	if is_instance_valid(player1):
		payload["player1_pos_x"] = player1.global_position.x
		payload["player1_pos_y"] = player1.global_position.y
	if is_instance_valid(player2):
		payload["player2_pos_x"] = player1.global_position.x
		payload["player2_pos_y"] = player1.global_position.y
		
	NetworkClient.send_message(payload)

func _on_state_sync_received(data: Dictionary) -> void:
	if MatchData.session == null or MatchData.session.mode != &"online":
		return
		
	scores[1] = int(data.get("player1_score", scores[1]))
	scores[2] = int(data.get("player1_score", scores[2]))
	
	var remote_round_active: bool = bool(data.get("round_active", round_active))
	
	if remote_round_active and not round_active:
		start_round()
		return
		
	if MatchData.local_player_slot != 1 and is_instance_valid(player1) and data.has("player1_pos_x"):
		var pos1 := Vector2(float(data["player1_pos_x"]), float(data["player1_pos_y"]))
		player1.global_position = pos1
		player1.network_target_position = pos1
		
	if MatchData.local_player_slot != 2 and is_instance_valid(player1) and data.has("player2_pos_x"):
		var pos2 := Vector2(float(data["player2_pos_x"]), float(data["player2_pos_y"]))
		player2.global_position = pos2
		player2.network_target_position = pos2

func play_end_jingle(winner_id):
	fade_out_music()

	var local_wins: bool = winner_id == MatchData.local_player_slot
	
	stinger_player.stream = VICTORY_JINGLE if local_wins else DEFEAT_JINGLE
	stinger_player.play()
	
func _wait_for_jingle_then_return() -> void:
	var already_returned := [false]
	
	var do_return := func():
		if already_returned[0]:
			return
		already_returned[0] = true
		_return_to_matchmaking()
		
	stinger_player.finished.connect(do_return, CONNECT_ONE_SHOT)
	
	var fallback_duration := 8.0
	
	if stinger_player.stream:
		fallback_duration = stinger_player.stream.get_length() + 1.0
		
	await get_tree().create_timer(fallback_duration).timeout
	do_return.call()

func fade_out_music() -> void:
	if not music_player.playing:
		return
		
	var tween := create_tween()
	tween.tween_property(music_player, "volume_db", MUSIC_FADE_OUT_VOLUME, MUSIC_FADE_DURATION)
	tween.finished.connect(func (): 
		music_player.stop()
		music_player.volume_db = 0.0
		)

func _on_forfeit_victory_claimed() -> void:
	if MatchData.session == null or MatchData.session.mode != &"online":
		return
	
	NetworkClient.send_message({"type": "forfeit_claim"})

func _on_opponent_disconnected() -> void:
	if MatchData.session == null or MatchData.session.mode != &"online":
		return
		
	waiting_for_opponent_reconnect = true
	
	var local_player: Player = player1 if MatchData.local_player_slot == 1 else player2
	if is_instance_valid(local_player):
		local_player.controls_enabled = false
		
func _on_player_state_updated_reconnect_check(_data: Dictionary) -> void:
	if not waiting_for_opponent_reconnect:
		return
		
	waiting_for_opponent_reconnect = false
	
	var local_player: Player = player1 if MatchData.local_player_slot == 1 else player2
	if is_instance_valid(local_player):
		local_player.controls_enabled = true
