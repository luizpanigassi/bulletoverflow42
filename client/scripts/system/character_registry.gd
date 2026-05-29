extends Node
class_name CharacterRegistry

const CHARACTERS: Dictionary = {
	&"adventurer": preload("res://client/data/resources/characters/adventurer.tres"),
	&"crimson_warrior": preload("res://client/data/resources/characters/crimson_warrior.tres"),
	&"explorer": preload("res://client/data/resources/characters/explorer.tres"),
}

static func get_character(character_id: StringName) -> CharacterData:
	return CHARACTERS.get(character_id, null)

static func has_character(character_id: StringName) -> bool:
	return CHARACTERS.has(character_id)
