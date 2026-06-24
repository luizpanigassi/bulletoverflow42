extends Node

var round_active: bool = false
var round_resolved: bool = false
var next_projectile_id: int = 1
var packet_count := 0
var position := Vector2(100, 200)
var player_positions := {
	1: Vector2.ZERO,
	2: Vector2.ZERO
}
var next_powerup_id := 1
var pending_inputs: Array = []
var accumulated_time: float = 0.0

const MOVE_SPEED := 300.0
const TICK := 1.0 / 60.0

func _ready() -> void:
	GameEvents.round_started.connect(_on_round_started)
	GameEvents.round_ended.connect(_on_round_ended)
	
func _physics_process(delta: float) -> void:
	accumulated_time += delta
	
	while accumulated_time >= TICK:
		accumulated_time -= TICK
		process_inputs()

func receive_input(data: Dictionary) -> void:
	pending_inputs.append(data)

func spawn_mock_powerup() -> void:
	var spawn_points = get_tree().get_nodes_in_group("powerup_spawns")
	if spawn_points.is_empty():
		return
	
	if not NetworkPowerupSynchronizer.powerups.is_empty():
		return
	
	var powerup_spawn = spawn_points.pick_random() as Marker2D
	var powerup_types := [
		PowerupTypes.Type.RAPID_FIRE,
		PowerupTypes.Type.SHIELD,
		PowerupTypes.Type.SPEED_BOOST
	]

	var selected_type = powerup_types.pick_random()

	var packet := {
		"type": "powerup_spawn",
		"powerup_id": next_powerup_id,
		"powerup_type": selected_type,
		"position_x": powerup_spawn.global_position.x,
		"position_y": powerup_spawn.global_position.y
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
	if round_resolved:
		return

	round_resolved = true

	var target_slot: int = int(data["target_slot"])
	var shooter_slot: int = int(data["shooter_slot"])

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

func _on_round_started(_data: Dictionary) -> void:
	round_resolved = false
	round_active = true

	if MatchData.session and MatchData.session.mode == &"online" and not NetworkClient.is_network_connected:
		start_powerup_loop()
	
func _on_round_ended(_winner_id: int) -> void:
	round_active = false

func receive_wrap(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	player_positions[slot] = Vector2(float(data["new_pos_x"]), float(data["new_pos_y"]))

	GameEvents.match_event_received.emit({
		"type": "player_state",
		"player_slot": slot,
		"position_x": player_positions[slot].x,
		"position_y": player_positions[slot].y,
		"velocity_x": 0,
		"velocity_y": 0,
		"aim_x": 0,
		"aim_y": 0,
	})

func process_inputs() -> void:
	while pending_inputs.size() > 0:
		var data = pending_inputs.pop_front()
		
		process_player_input(data)
		
func process_player_input(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	var move_dir := Vector2(float(data["move_x"]), float(data["move_y"]))

	player_positions[slot] += move_dir * MOVE_SPEED * TICK

	var player = NetworkPlayerSynchronizer.players.get(slot)
	if is_instance_valid(player) and (slot == MatchData.local_player_slot or not player.is_network_controlled):
		player_positions[slot] = player.global_position
	else:
		player_positions[slot] += move_dir * MOVE_SPEED * TICK
	
	if data.get("shoot", false) and MatchData.session and MatchData.session.mode == &"online":
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
		"aim_y": data["aim_y"],
		"last_processed_seq": data.get("seq", 0)
	}
	
	GameEvents.match_event_received.emit(player_state)

func start_powerup_loop() -> void:
	while round_active and MatchData.session and MatchData.session.mode == &"online" and not NetworkClient.is_network_connected:
		var wait_time := randf_range(1.0, 10.0)

		await get_tree().create_timer(wait_time).timeout

		if not round_active:
			break
		spawn_mock_powerup()
