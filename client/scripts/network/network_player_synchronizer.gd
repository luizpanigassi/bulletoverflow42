extends Node

var players := {}

func _ready() -> void:
	GameEvents.player_state_updated.connect(_on_player_state_updated)

func register_player(player: Player) -> void:
	player.is_network_controlled = true
	players[player.player_id] = player
	
func unregister_player(player_id: int) -> void:
	players.erase(player_id)

func _on_player_state_updated(state: PlayerState) -> void:
	var player: Player = players.get(state.player_slot)
	
	if not is_instance_valid(player):
		return
		
	player.global_position = state.position
