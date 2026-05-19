extends Node

@onready var entities: Node2D = $"../../Entities"

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
	
	start_round()

func get_random_spawn_positions() -> Array[Marker2D]:
	var shuffled_spawns: Array[Marker2D] = spawn_points.duplicate()
	shuffled_spawns.shuffle()
	return [shuffled_spawns[0], shuffled_spawns[1]]

func spawn_player(player_id: int, spawn_position: Vector2) -> void:
	var player_instance: CharacterBody2D = player_scene.instantiate()
	player_instance.player_id = player_id
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
	
	print("Player morreu: ", dead_player_id)
	end_round(winner_id)
	
func start_round() -> void:
	round_active = true
	clear_players()
	
	var selected_spawns: Array[Marker2D] = get_random_spawn_positions()
	spawn_player(1, selected_spawns[0].global_position)
	spawn_player(2, selected_spawns[1].global_position)
	
func end_round(winner_id: int) -> void:
	round_active = false
	scores[winner_id] += 1
	
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
