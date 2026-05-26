extends Node
class_name CharacterRegistry

const CHARACTERS: Dictionary = {
	&"huntress": preload("res://data/resources/characters/huntress.tres"),
	&"ranger": preload("res://data/resources/characters/ranger.tres"),
	&"crystal_mauler": preload("res://data/resources/characters/crystal_mauler.tres"),
	&"spearwoman": preload("res://data/resources/characters/spearwoman.tres"),
	&"monk": preload("res://data/resources/characters/monk.tres"),
}

static func get_character(character_id: StringName) -> CharacterData:
	return CHARACTERS.get(character_id, null)

static func has_character(character_id: StringName) -> bool:
	return CHARACTERS.has(character_id)
