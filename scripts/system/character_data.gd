extends Resource
class_name CharacterData

@export var character_name: String
@export var sprite_frames: SpriteFrames
@export var animation_offsets: Array[CharacterAnimationOffset] = []

func get_animation_offset(animation_name: StringName) -> Vector2:
	for animation_offset in animation_offsets:
		if animation_offset and animation_offset.animation_name == animation_name:
			return animation_offset.offset

	return Vector2.ZERO
