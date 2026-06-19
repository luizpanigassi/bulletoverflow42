extends Node

var powerups := {}

const POWERUP_SCENE := preload("res://client/scenes/entities/powerup.tscn")

func _ready() -> void:
	GameEvents.powerup_spawned.connect(_on_powerup_spawned)
	GameEvents.powerup_removed.connect(_on_powerup_removed)
	
func _on_powerup_spawned(state: PowerupState) -> void:
	if powerups.has(state.powerup_id):
		return
	
	var powerup = POWERUP_SCENE.instantiate()
	
	powerup.global_position = state.position
	powerup.powerup_type = state.powerup_type
	powerup.powerup_id = state.powerup_id
	
	get_tree().current_scene.add_child(powerup)
	
	powerups[state.powerup_id] = powerup

func _on_powerup_removed(powerup_id: int) -> void:
	var powerup = powerups.get(powerup_id)
	
	if not is_instance_valid(powerup):
		return
		
	powerups.erase(powerup_id)
	
	powerup.queue_free()
