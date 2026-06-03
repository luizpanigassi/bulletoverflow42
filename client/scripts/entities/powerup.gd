extends Area2D
class_name Powerup

@onready var sprite: Sprite2D = $Sprite2D

@export var speed_boost_texture: Texture2D
@export var rapid_fire_texture: Texture2D
@export var shield_texture: Texture2D

var powerup_type: PowerupTypes.Type

func _ready():
	configure_visual()

func _on_body_entered(body: Node2D) -> void:
	if not body is Player:
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
