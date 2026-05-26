extends Node

@onready var entities: Node2D = $"../../Entities"
@onready var hud: CanvasLayer = $"../../UI/Hud"

@export var player_scene: PackedScene

var round_active: bool = false

var spawn_points: Array[Marker2D] = []
var scores: Dictionary ={
	1: 0,
	2: 0
}

func _ready() -> void:
	var found_spawns: Array[Node] = get_tree().get_nodes_in_group("spawn_points")
	
	for spawn in found_spawns:
		spawn_points.append(spawn as Marker2D)
	
	await hud.ready
	hud.update_score(scores[1], scores[2])
	start_round()

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
	player_instance.ammo_changed.connect(hud.update_ammo)
	entities.add_child(player_instance)
	hud.update_ammo(player_state.slot, player_instance.current_ammo)

func _on_player_died(dead_player_id: int) -> void:
	if not round_active:
		return

	var winner_id: int
	
	if dead_player_id == 1:
		winner_id = 2
	else:
		winner_id = 1
	
	print("Player morreu: ", dead_player_id)
	end_round(winner_id)
	
func start_round() -> void:
	if MatchData.session == null:
		push_error("No session available")
		return

	round_active = true
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
	scores[winner_id] += 1
	
	hud.update_score(scores[1], scores[2])
	
	print("Player vencedor: ", winner_id)
	print(scores)
	
	reset_round()
	
func reset_round() -> void:
	await get_tree().create_timer(2.0).timeout
	
	start_round()
	
func clear_players() -> void:
	var players: Array[Node] = get_tree().get_nodes_in_group("players")
	
	for player in players:
		player.queue_free()
