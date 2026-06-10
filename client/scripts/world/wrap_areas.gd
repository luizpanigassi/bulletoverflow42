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
	body_entered.connect(_on_body_entered)
	area_entered.connect(_on_area_entered)
	
func _on_body_entered(body: Node2D) -> void:
	match wrap_type:
		WrapType.LEFT:
			body.global_position.x = ARENA_WIDTH - OFFSET
			
		WrapType.RIGHT:
			body.global_position.x = OFFSET
			
		WrapType.TOP:
			body.global_position.y = ARENA_HEIGHT - OFFSET
			
		WrapType.BOTTOM:
			body.global_position.y = OFFSET

func _on_area_entered(area: Area2D) -> void:	
	match wrap_type:
		WrapType.LEFT:
			area.global_position.x = ARENA_WIDTH - OFFSET
			
		WrapType.RIGHT:
			area.global_position.x = OFFSET
			
		WrapType.TOP:
			area.global_position.y = ARENA_HEIGHT - OFFSET
			
		WrapType.BOTTOM:
			area.global_position.y = OFFSET
