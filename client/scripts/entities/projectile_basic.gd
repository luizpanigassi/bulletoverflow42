extends Area2D

@export var speed: float = 700.0
@export var lifetime: float = 3.0

@onready var shape_cast: ShapeCast2D = $ShapeCast2D

var direction: Vector2 = Vector2.RIGHT
var owner_id: int = -1
var time_left: float

func _ready() -> void:
	time_left = lifetime
	body_entered.connect(_on_body_entered)
	
func _physics_process(delta: float) -> void:
	time_left -= delta
	if time_left <= 0.0:
		queue_free()
		return

	shape_cast.target_position = direction * 8.0
	shape_cast.force_shapecast_update()

	if shape_cast.is_colliding():
		var collider = shape_cast.get_collider(0)
		if collider and collider.is_in_group("walls"):
			var normal = shape_cast.get_collision_normal(0)
			direction = direction.bounce(normal).normalized()
			global_position += normal * 0.5
	
	global_position += direction * speed * delta

func _on_body_entered(body: Node2D) -> void:
	if not body.is_in_group("players"):
		return
	
	if body.player_id == owner_id:
		return
	
	if MatchData.session and MatchData.session.mode == &"online":
		var hit_report := {
			"type": "player_hit",
			"target_slot": body.player_id,
			"shooter_slot": owner_id
		}
		if NetworkClient.is_connected:
			NetworkClient.send_message(hit_report)
		else:
			MockMatchServer.receive_hit(hit_report)
		queue_free()
		return
	if body.take_hit():
		queue_free()

func _on_visible_on_screen_notifier_2d_screen_exited() -> void:
	queue_free()
