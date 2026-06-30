extends Area2D
class_name Powerup

@onready var sprite: Sprite2D = $Sprite2D

@export var speed_boost_texture: Texture2D
@export var rapid_fire_texture: Texture2D
@export var shield_texture: Texture2D

var powerup_id: int = -1
var powerup_type: PowerupTypes.Type
var float_time: float = 0.0

func _ready():
	add_to_group("powerups")
	configure_visual()
	
func _process(delta: float) -> void:
	float_time += delta
	var wave: float = sin(float_time * 2.0)

	sprite.position.y = wave * 6.0
	sprite.scale = Vector2.ONE * (1.2 + wave * 0.2)
	

func _on_body_entered(body: Node2D) -> void:
	if not body is Player:
		return
		
	if MatchData.session and MatchData.session.mode == &"online":
		var collect_request := {
			"type": "powerup_collect_request",
			"player_slot": body.player_id,
			"powerup_id": powerup_id
		}
		if NetworkClient.is_network_connected:
			NetworkClient.send_message(collect_request)
		else:
			MockMatchServer.receive_powerup_collect(collect_request)
		return

	body.apply_powerup(powerup_type)
	queue_free()

func configure_visual() -> void:
	match powerup_type:
		PowerupTypes.Type.RAPID_FIRE:
			sprite.texture = rapid_fire_texture
		PowerupTypes.Type.SPEED_BOOST:
			sprite.texture = speed_boost_texture
		PowerupTypes.Type.SHIELD:
			sprite.texture = shield_texture
