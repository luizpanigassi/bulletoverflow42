extends CharacterBody2D
class_name Player

const InputSnapshotRef = preload("res://client/scripts/system/input_snapshot.gd")

signal died(player_id: int)
signal ammo_changed(player_id: int, ammo: int)

@onready var input_handler: Node = $InputHandler
@onready var reload_fill: ColorRect = $PlayerUI/ReloadBarBackground/ReloadFill
@onready var reload_bar_background: ColorRect = $PlayerUI/ReloadBarBackground
@onready var animated_sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var player_id_label: Label = $PlayerIdLabel
@onready var powerup_icon: Sprite2D = $PowerupIcon
@onready var ammo_icon: Sprite2D = $AmmoIcon

@export var base_speed: float = 300.0
@export var acceleration: float = 1800.0
@export var deceleration: float = 2200.0
@export var player_id: int = 1
@export var projectile_scene: PackedScene
@export var base_shoot_cooldown: float = 0.35
@export var dash_speed: float = 850.0
@export var dash_duration: float = 0.15
@export var dash_cooldown: float = 0.6
@export var max_ammo: int = 3
@export var reload_duration: float = 1.2
@export var shield_icon: Texture2D
@export var rapid_fire_icon: Texture2D
@export var speed_icon: Texture2D
@export var ammo_0_texture: Texture2D
@export var ammo_1_texture: Texture2D
@export var ammo_2_texture: Texture2D
@export var ammo_3_texture: Texture2D
@export var is_bot: bool = false

var player_name: String = ""
var can_shoot: bool = true
var is_dashing: bool = false
var can_dash: bool = true
var current_ammo: int = 0
var is_reloading: bool = false
var character_data: CharacterData
var facing_axis: StringName = &"down"
var is_attacking: bool = false
var external_input_snapshot: InputSnapshot
var use_external_input: bool = false
var is_invulnerable: bool = false
var controls_enabled: bool = true

var active_effects: Dictionary = {}
var speed_multiplier: float = 1.0
var cooldown_multiplier: float = 1.0
var shield_hits: int = 0
var active_powerup: int = -1

var current_snapshot: InputSnapshot
var is_network_controlled: bool = false

const BOT_NAMES := [
	"BOT-42",
	"BOT-TA-TÁ",
	"BOT-ERR",
	"BOT-TOM",
	"BOT-OPIA",
	"BOT-MAN",
]

func _ready() -> void:
	input_handler.set_player_id(player_id)
	current_ammo = max_ammo
	update_ammo_icon()
	
	if character_data:
		animated_sprite.sprite_frames = character_data.sprite_frames
		_configure_attack_animation_loops()

	if not animated_sprite.animation_changed.is_connected(_on_animation_changed):
		animated_sprite.animation_changed.connect(_on_animation_changed)

	if not animated_sprite.animation_finished.is_connected(_on_animation_finished):
		animated_sprite.animation_finished.connect(_on_animation_finished)

	animated_sprite.flip_h = false
	player_id_label.text = player_name if not player_name.is_empty() else "Player %d" % player_id
	_update_animation(true)

func _physics_process(delta: float) -> void:
	
	if not controls_enabled:
		return
	
	current_snapshot = _get_input_snapshot()
	var snapshot := current_snapshot
	
	if player_id == 1:
		NetworkInputSender.send_input(snapshot)
	
	if snapshot.dash_pressed:
		start_dash()
		
	if snapshot.reload_pressed:
		reload()
	
	_update_facing_from_input(snapshot)

	if is_dashing:
		move_and_slide()
		return
	
	var target_velocity: Vector2 = snapshot.move_direction * get_speed()
	if snapshot.move_direction != Vector2.ZERO:
		velocity = velocity.move_toward(target_velocity, acceleration * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, deceleration * delta)
	
	if not is_network_controlled:
		move_and_slide()
	
	if snapshot.shoot_pressed:
		shoot()

	_update_animation()

func get_speed() -> float:
	return base_speed * speed_multiplier
	
func get_shoot_cooldown() -> float:
	return base_shoot_cooldown * cooldown_multiplier

func shoot() -> void:
	if current_ammo <= 0:
		reload()
		return
		
	if is_reloading:
		return
	
	if not can_shoot:
		return
	
	can_shoot = false
	_start_attack_animation()
	
	var projectile: Area2D = projectile_scene.instantiate()
	
	current_ammo -= 1
	update_ammo_icon()
	ammo_changed.emit(player_id, current_ammo)
	
	projectile.global_position = global_position
	
	var shoot_direction: Vector2 = current_snapshot.aim_direction
	
	if shoot_direction == Vector2.ZERO:
		shoot_direction = current_snapshot.last_move_direction
		
	projectile.direction = shoot_direction.normalized()
	
	
	projectile.owner_id = player_id
	
	get_tree().current_scene.add_child(projectile)
	
	reset_shoot_cooldown()
	
func reset_shoot_cooldown() -> void:
	await get_tree().create_timer(get_shoot_cooldown()).timeout
	can_shoot = true
	
func start_dash() -> void:
	if not can_dash:
		return
	
	animated_sprite.modulate.a = 0.3
	is_dashing = true
	is_invulnerable = true
	can_dash = false
	is_attacking = false
	
	var dash_direction: Vector2 = current_snapshot.move_direction
	
	if dash_direction == Vector2.ZERO:
		dash_direction = current_snapshot.last_move_direction
	
	velocity = dash_direction * dash_speed
	_apply_dash_pose()
	
	end_dash()
	reset_dash_cooldown()
	
func end_dash() -> void:
	await get_tree().create_timer(dash_duration).timeout
	is_dashing = false
	is_invulnerable = false
	
	animated_sprite.modulate.a = 1.0
	
	_update_animation()
	
func reset_dash_cooldown() -> void:
	await get_tree().create_timer(dash_cooldown).timeout
	can_dash = true
	
func reload() -> void:
	if is_reloading:
		return
		
	if current_ammo == max_ammo:
		return
		
	is_reloading = true
	
	reload_fill.size = Vector2(0, reload_fill.size.y)
	reload_fill.visible = true
	reload_bar_background.visible = true
	
	var tween: Tween = create_tween()
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(reload_fill, "size", Vector2(40, reload_fill.size.y), reload_duration)
	
	await tween.finished
	
	current_ammo = max_ammo
	update_ammo_icon()
	is_reloading = false
	ammo_changed.emit(player_id, current_ammo)
	
	reload_fill.visible = false
	reload_bar_background.visible = false

func die() -> void:
	died.emit(player_id)
	queue_free()

func take_hit() -> bool:
	if is_invulnerable:
		return false
		
	if shield_hits > 0:
		shield_hits -= 1
		clear_powerup_icon(PowerupTypes.Type.SHIELD)
		return true
	
	die()
	return true

func _on_animation_changed() -> void:
	apply_animation_offset(animated_sprite.animation)

func _on_animation_finished() -> void:
	if not is_attacking:
		return

	if animated_sprite.animation.begins_with("attack_"):
		is_attacking = false
		_update_animation()

func apply_animation_offset(animation_name: StringName) -> void:
	if character_data:
		animated_sprite.offset = character_data.get_animation_offset(animation_name)
	else:
		animated_sprite.offset = Vector2.ZERO

func _update_facing_from_input(snapshot: InputSnapshot) -> void:
	var source_direction: Vector2 = snapshot.move_direction
	if source_direction == Vector2.ZERO and snapshot.aim_direction != Vector2.ZERO:
		source_direction = snapshot.aim_direction

	if source_direction != Vector2.ZERO:
		facing_axis = _resolve_direction(source_direction)

func _resolve_direction(direction: Vector2) -> StringName:
	if direction == Vector2.ZERO:
		return facing_axis

	if absf(direction.x) > absf(direction.y):
		return &"left" if direction.x < 0.0 else &"right"

	return &"up" if direction.y < 0.0 else &"down"

func _animation_name(prefix: String) -> StringName:
	return StringName("%s_%s" % [prefix, facing_axis])

func _update_animation(force: bool = false) -> void:
	if not force and (is_dashing or is_attacking):
		return

	var target_animation: StringName
	
	if velocity.length() > 0.1:
		target_animation = _animation_name("run")
	else:
		target_animation = _animation_name("idle")

	if animated_sprite.animation != target_animation:
		animated_sprite.play(target_animation)
	elif not animated_sprite.is_playing():
		animated_sprite.play(target_animation)

func _start_attack_animation() -> void:
	if is_dashing:
		return

	is_attacking = true
	var attack_animation: StringName = _animation_name("attack")
	animated_sprite.play(attack_animation)

func _apply_dash_pose() -> void:
	var run_animation: StringName = _animation_name("run")
	if animated_sprite.animation != run_animation:
		animated_sprite.play(run_animation)

	animated_sprite.frame = 0
	animated_sprite.frame_progress = 0.0
	animated_sprite.stop()

func _configure_attack_animation_loops() -> void:
	if not animated_sprite.sprite_frames:
		return

	var attack_animations: Array[StringName] = [
		&"attack_up",
		&"attack_down",
		&"attack_left",
		&"attack_right",
	]

	for animation_name in attack_animations:
		if animated_sprite.sprite_frames.has_animation(animation_name):
			animated_sprite.sprite_frames.set_animation_loop(animation_name, false)

func set_external_input(snapshot: InputSnapshot) -> void:
	external_input_snapshot = snapshot
	use_external_input = snapshot != null

func _get_input_snapshot() -> InputSnapshot:
	if use_external_input and external_input_snapshot:
		return external_input_snapshot

	if is_bot:
		return InputSnapshot.new()
		
	input_handler.process_input()
	return input_handler.get_snapshot()

func apply_powerup(powerup_type: PowerupTypes.Type) -> void:
	clear_all_powerups()
	
	set_powerup_icon(powerup_type)
	
	match powerup_type:
		PowerupTypes.Type.RAPID_FIRE:
			_apply_rapid_fire()
			
		PowerupTypes.Type.SPEED_BOOST:
			_apply_speed_boost()
			
		PowerupTypes.Type.SHIELD:
			_apply_shield()
			
func _apply_rapid_fire() -> void:
	cooldown_multiplier = 0.5
	
	await get_tree().create_timer(5.0).timeout
	
	cooldown_multiplier = 1.0
	clear_powerup_icon(PowerupTypes.Type.RAPID_FIRE)
	
func _apply_speed_boost() -> void:
	speed_multiplier = 1.4
	
	await get_tree().create_timer(5.0).timeout
	
	speed_multiplier = 1
	clear_powerup_icon(PowerupTypes.Type.SPEED_BOOST)
	
func _apply_shield() -> void:
	if shield_hits > 0:
		return
	shield_hits = 1

func set_powerup_icon(powerup_type: PowerupTypes.Type) -> void:
	active_powerup = powerup_type
	
	match powerup_type:
		PowerupTypes.Type.SHIELD:
			powerup_icon.texture = shield_icon
		PowerupTypes.Type.RAPID_FIRE:
			powerup_icon.texture = rapid_fire_icon
		PowerupTypes.Type.SPEED_BOOST:
			powerup_icon.texture = speed_icon
			
	powerup_icon.visible = true
	
func clear_powerup_icon(powerup_type: PowerupTypes.Type) -> void:
	if active_powerup != powerup_type:
		return
		
	active_powerup = -1
	powerup_icon.visible = false

func clear_all_powerups() -> void:
	speed_multiplier = 1.0
	cooldown_multiplier = 1.0
	shield_hits = 0
	
	active_powerup = -1
	powerup_icon.visible = false

func update_ammo_icon() -> void:
	match current_ammo:
		0:
			ammo_icon.texture = ammo_0_texture
		1:
			ammo_icon.texture = ammo_1_texture
		2:
			ammo_icon.texture = ammo_2_texture
		3:
			ammo_icon.texture = ammo_3_texture
