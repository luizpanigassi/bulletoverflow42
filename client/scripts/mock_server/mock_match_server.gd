extends Node

var next_projectile_id: int = 1
var packet_count := 0
var position := Vector2(100, 200)
var player_positions := {
	1: Vector2.ZERO,
	2: Vector2.ZERO
}
var next_powerup_id := 1

const MOVE_SPEED := 300.0
const TICK := 1.0 / 60.0

func _ready() -> void:
	pass

func receive_input(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	
	var player = NetworkPlayerSynchronizer.players.get(slot)
	if is_instance_valid(player):
		var move_dir := Vector2(data["move_x"], data["move_y"])
		player.velocity = move_dir * player.get_speed()
		player.move_and_slide()
		player_positions[slot] = player.global_position
	else:
		player_positions[slot] += Vector2(data["move_x"], data["move_y"]) * MOVE_SPEED * TICK
	
	if data.get("shoot", false):
		var aim_dir := Vector2(data["aim_x"], data["aim_y"])
		if aim_dir == Vector2.ZERO:
			aim_dir = Vector2.RIGHT

		var proj_id := "proj_%d_%d" % [slot, next_projectile_id]
		next_projectile_id += 1

		GameEvents.match_event_received.emit({
			"type": "projectile_spawn",
			"projectile_id": proj_id,
			"owner_slot": slot,
			"position_x": player_positions[slot].x,
			"position_y": player_positions[slot].y,
			"direction_x": aim_dir.normalized().x,
			"direction_y": aim_dir.normalized().y,
			"speed": 700.0
		})

	var player_state := {
		"type": "player_state",
		"player_slot": slot,
		"position_x": player_positions[slot].x,
		"position_y": player_positions[slot].y,
		"velocity_x": 0,
		"velocity_y": 0,
		"aim_x": data["aim_x"],
		"aim_y": data["aim_y"]
	}
	
	GameEvents.match_event_received.emit(player_state)

func spawn_mock_powerup() -> void:
	var packet := {
		"type": "powerup_spawn",
		"powerup_id": next_powerup_id,
		"powerup_type": PowerupTypes.Type.SHIELD,
		"position_x": 500,
		"position_y": 300
	}
	
	next_powerup_id += 1
	GameEvents.match_event_received.emit(packet)

func remove_mock_powerup(powerup_id: int) -> void:
	GameEvents.match_event_received.emit({
		"type": "powerup_removed",
		"powerup_id": powerup_id
	})

func spawn_mock_projectile() -> void:
	GameEvents.match_event_received.emit({
		"type": "projectile_spawn",
		"projectile_id": "proj_01",
		"owner_slot": 1,
		"position_x": 400,
		"position_y": 300,
		
		"direction_x": 1,
		"direction_y": 0,
		
		"speed": 500
	})

func set_spawn(player_id: int, pos: Vector2) -> void:
	player_positions[player_id] = pos
	send_spawn(player_id, pos)
	
func send_spawn(player_id: int, pos: Vector2) -> void:
	GameEvents.match_event_received.emit({
		"type": "player_spawn",
		"player_slot": player_id,
		"position_x": pos.x,
		"position_y": pos.y
	})

func receive_hit(data: Dictionary) -> void:
	var target_slot: int = int(data["target_slot"])
	var shooter_slot: int = (data["shooter_slot"])

	GameEvents.match_event_received.emit({
		"type": "player_died",
		"player_slot": target_slot
	})

	GameEvents.match_event_received.emit({
		"type": "round_end",
		"winner_slot": shooter_slot
	})

func receive_powerup_collect(data: Dictionary) -> void:
	var player_slot: int = int(data["player_slot"])
	var powerup_id: int = int(data["powerup_id"])

	GameEvents.match_event_received.emit({
		"type": "powerup_collected",
		"player_slot": player_slot,
		"powerup_type": NetworkPowerupSynchronizer.powerups[powerup_id].powerup_type
	})

	GameEvents.match_event_received.emit({
		"type": "powerup_removed",
		"powerup_id": powerup_id
	})
