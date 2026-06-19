extends Node

var players := {}

func _ready() -> void:
	GameEvents.player_state_updated.connect(_on_player_state_updated)
	GameEvents.player_spawned.connect(_on_player_spawned)
	GameEvents.powerup_collected.connect(_on_powerup_collected)

func register_player(player: Player) -> void:
	if MatchData.session == null or MatchData.session.mode == &"local":
		player.is_network_controlled = false
	else:
		player.is_network_controlled = true
	
	players[player.player_id] = player
	
func unregister_player(player_id: int) -> void:
	players.erase(player_id)

func _on_player_state_updated(state: PlayerState) -> void:
	var player: Player = players.get(state.player_slot)
	
	if not is_instance_valid(player):
		return
		
	player.global_position = state.position

func _on_player_spawned(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	var pos := Vector2(float(data["position_x"]), float(data["position_y"]))

	var player = players.get(slot)
	if is_instance_valid(player):
		player.global_position = pos
		if MatchData.session == null or MatchData.session.mode == &"local":
			MockMatchServer.player_positions[slot] = pos

func _on_powerup_collected(data: Dictionary) -> void:
	var player = players.get(int(data["player_slot"]))
	if is_instance_valid(player):
		player.apply_powerup(data["powerup_type"] as PowerupTypes.Type)
