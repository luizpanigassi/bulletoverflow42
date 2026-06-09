extends Area2D

enum WrapType {
	LEFT,
	RIGHT,
	TOP,
	BOTTOM,
}

@export var wrap_type: WrapType

const ARENA_WIDTH := 1280
const ARENA_HEIGHT := 720
const OFFSET := 32

func _ready() -> void:
	print("Wrap ready: ", name)
	body_entered.connect(_on_body_entered)
	
func _on_body_entered(body: Node2D) -> void:
	print("Entrou: ", body.name)
	match wrap_type:
		WrapType.LEFT:
			body.global_position.x = ARENA_WIDTH - OFFSET
			
		WrapType.RIGHT:
			body.global_position.x = OFFSET
			
		WrapType.TOP:
			body.global_position.y = ARENA_HEIGHT - OFFSET
			
		WrapType.BOTTOM:
			body.global_position.y = OFFSET
