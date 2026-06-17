extends Node

var projectiles := {}

const PROJECTILE_SCENE := preload("res://client/scenes/entities/projectile_basic.tscn")

func _ready() -> void:
	GameEvents.projectile_spawn.connect(_on_projectile_spawn)
	GameEvents.projectile_destroy.connect(_on_projectile_destroy)
	
func _on_projectile_spawn(state: ProjectileState) -> void:
	if projectiles.has(state.projectile_id):
		return
	
	var projectile = PROJECTILE_SCENE.instantiate()
	
	projectile.global_position = state.position
	projectile.direction = state.direction
	projectile.owner_id = state.owner_slot
	projectile.speed = state.speed
	
	get_tree().current_scene.add_child(projectile)
	
	projectiles[state.projectile_id] = projectile
	
func _on_projectile_destroy(projectile_id: String) -> void:
	var projectile = projectiles.get(projectile_id)
	
	if not is_instance_valid(projectile):
		return
		
	projectiles.erase(projectile_id)
	
	projectile.queue_free()
