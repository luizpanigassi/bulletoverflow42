extends CharacterBody2D

signal died(player_id: int)

@onready var input_handler: Node = $InputHandler

@export var speed: float = 300.0
@export var JUMP_FORCE: float = -500.0
@export var GRAVITY: float = 1200.0
@export var acceleration: float = 1800.0
@export var deceleration: float = 2200.0
@export var air_acceleration: float = 1200.0
@export var jump_cut_multiplier: float = 0.5
@export var coyote_time_duration: float = 0.1
@export var jump_buffer_duration: float = 0.12
@export var player_id: int = 1
@export var projectile_scene: PackedScene
@export var shoot_cooldown: float = 0.35

var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var facing_direction: float = 1.0
var can_shoot: bool = true

func _ready() -> void:
	if player_id == 1:
		input_handler.left_action = "p1_left"
		input_handler.right_action = "p1_right"
		input_handler.jump_action = "p1_jump"
		input_handler.shoot_action = "p1_shoot"

	elif player_id == 2:
		input_handler.left_action = "p2_left"
		input_handler.right_action = "p2_right"
		input_handler.jump_action = "p2_jump"
		input_handler.shoot_action = "p2_shoot"

func _physics_process(delta: float) -> void:
	input_handler.process_input()
	
	if input_handler.move_input != 0:
		facing_direction = input_handler.move_input
	
	if input_handler.jump_pressed:
		jump_buffer_timer = jump_buffer_duration
	else:
		jump_buffer_timer -= delta
	
	var target_speed: float = input_handler.move_input * speed
	
	if not is_on_floor():
		velocity.y += GRAVITY * delta
		
	if is_on_floor():
		coyote_timer = coyote_time_duration
	else:
		coyote_timer -= delta
	
	if is_on_floor():
		if input_handler.move_input != 0:
			velocity.x = move_toward(velocity.x, target_speed, acceleration * delta)
		else:
			velocity.x = move_toward(velocity.x, 0, deceleration * delta)
	
	else:
		velocity.x = move_toward(velocity.x, target_speed, air_acceleration * delta)
	
	if jump_buffer_timer > 0 and coyote_timer > 0:
		velocity.y = JUMP_FORCE
		 
		coyote_timer = 0
		jump_buffer_timer = 0
		
	if velocity.y < 0 and not input_handler.jump_held:
		velocity.y *= jump_cut_multiplier
		
	move_and_slide()
	
	if input_handler.shoot_pressed:
		shoot()
	
func shoot() -> void:
	if not can_shoot:
		return
	
	can_shoot = false
	
	var projectile: Area2D = projectile_scene.instantiate()
	
	projectile.global_position = global_position
	projectile.direction = facing_direction
	projectile.owner_id = player_id
	
	get_tree().current_scene.add_child(projectile)
	
	reset_shoot_cooldown()
	
func reset_shoot_cooldown() -> void:
	await get_tree().create_timer(shoot_cooldown).timeout
	can_shoot = true

func die() -> void:
	died.emit(player_id)
	queue_free()
