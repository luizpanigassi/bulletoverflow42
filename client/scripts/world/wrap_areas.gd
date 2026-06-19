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
	var new_pos := body.global_position

	match wrap_type:
		WrapType.LEFT:
			new_pos.x = ARENA_WIDTH - OFFSET
			
		WrapType.RIGHT:
			new_pos.x = OFFSET
			
		WrapType.TOP:
			new_pos.y = ARENA_HEIGHT - OFFSET
			
		WrapType.BOTTOM:
			new_pos.y = OFFSET
			
	body.global_position = new_pos
	
	if MatchData.session and MatchData.session.mode == &"online" and body is Player:
		GameEvents.entity_wrapped.emit(body.player_id, new_pos)

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
