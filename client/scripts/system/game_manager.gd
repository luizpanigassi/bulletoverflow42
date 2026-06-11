extends Node

@onready var entities: Node2D = $"../../Entities"
@onready var hud: CanvasLayer = $"../../UI/Hud"
@onready var match_end_screen = $"../../UI/MatchEndScreen"
@onready var match_end_label = $"../../UI/MatchEndScreen/Label"
@onready var round_result_screen = $"../../UI/RoundResultScreen"
@onready var arena_container = $"../../World/ArenaContainer"

@export var player_scene: PackedScene
@export var powerup_scene: PackedScene

var match_finished: bool = false
var round_active: bool = false
var spawn_points: Array[Marker2D] = []
var powerup_spawn_points: Array[Marker2D] = []
var active_powerup: Powerup = null
var scores: Dictionary ={
	1: 0,
	2: 0
}

const SCORE_TO_WIN: int = 5
const ARENAS := {
	"arena_ruins": preload("res://client/scenes/arenas/arena_ruins.tscn"),
	"arena_badlands": preload("res://client/scenes/arenas/arena_badlands.tscn"),
	"arena_catacombs": preload("res://client/scenes/arenas/arena_catacombs.tscn")
}

signal match_ended(winner_id: int)

func _ready() -> void:
	load_arena()
	var found_spawns: Array[Node] = get_tree().get_nodes_in_group("spawn_points")
	var found_powerup_spawns: Array[Node] = get_tree().get_nodes_in_group("powerup_spawns")
	
	for spawn in found_spawns:
		spawn_points.append(spawn as Marker2D)
		
	for powerup_spawn in found_powerup_spawns:
		powerup_spawn_points.append(powerup_spawn as Marker2D)
	
	await hud.ready
	hud.update_score(scores[1], scores[2])
	start_round()
	start_powerup_loop.call_deferred()

func get_random_spawn_positions() -> Array[Marker2D]:
	var shuffled_spawns: Array[Marker2D] = spawn_points.duplicate()
	shuffled_spawns.shuffle()
	return [shuffled_spawns[0], shuffled_spawns[1]]

func spawn_player(player_state: PlayerSessionState, spawn_position: Vector2) -> void:
	var player_instance: Player = player_scene.instantiate() as Player
	if not player_instance:
		push_error("Player scene did not instantiate as Player")
		return
	
	var character_data := CharacterRegistry.get_character(player_state.character_id)
	if not character_data:
		push_error("Unknown character_id: %s" % player_state.character_id)
		return

	player_instance.player_id = player_state.slot
	player_instance.character_data = character_data
	player_instance.global_position = spawn_position
	player_instance.died.connect(_on_player_died)
	entities.add_child(player_instance)

func _on_player_died(dead_player_id: int) -> void:
	if not round_active:
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

	round_active = true
	clear_projectiles()
	clear_players()
	
	var selected_spawns: Array[Marker2D] = get_random_spawn_positions()
	var players: Array = MatchData.session.players

	if players.size() < 2:
		push_error("Session needs at least 2 players")
		return
		
	spawn_player(players[0], selected_spawns[0].global_position)
	spawn_player(players[1], selected_spawns[1].global_position)
	
func end_round(winner_id: int) -> void:
	round_active = false
	
	if is_instance_valid(active_powerup):
		active_powerup.queue_free()
	
	scores[winner_id] += 1
	
	hud.update_score(scores[1], scores[2])
		
	if scores[winner_id] >= SCORE_TO_WIN:
		end_match(winner_id)
		
		await get_tree().create_timer(5.0).timeout
		_return_to_matchmaking()
	else:
		round_result_screen.show_round_result(winner_id, scores[1], scores[2])
		await get_tree().create_timer(2.0).timeout
		round_result_screen.hide_screen()
		
		reset_round()
	
func reset_round() -> void:
	start_round()

func clear_projectiles() -> void:
	var projectiles: Array[Node] = get_tree().get_nodes_in_group("projectiles")
	
	for projectile in projectiles:
		projectile.queue_free()

func clear_players() -> void:
	var players: Array[Node] = get_tree().get_nodes_in_group("players")
	
	for player in players:
		player.queue_free()

func start_powerup_loop() -> void:
	while not match_finished:
		var wait_time := randf_range(1.0, 20.0)
		
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
		
	active_powerup = null
	round_active = false
	match_finished = true
	match_ended.emit(winner_id)

func show_winner(winner_id: int) -> void:
	match_end_screen.visible = true
	match_end_label.text = "PLAYER %d WINS!" % winner_id

func _return_to_matchmaking() -> void:
	print("Returning to matchmaking...")
	pass

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
