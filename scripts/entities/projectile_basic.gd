extends Area2D

@export var speed: float = 700.0

var direction: float = 1.0
var owner_id: int = -1

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	
func _physics_process(delta: float) -> void:
	global_position.x += direction * speed * delta

func _on_body_entered(body: Node2D) -> void:
	if not body.is_in_group("players"):
		return
	
	if body.player_id == owner_id:
		return
		
	body.die()
	queue_free()
	
func _on_visible_on_screen_notifier_2d_screen_exited() -> void:
	queue_free()
