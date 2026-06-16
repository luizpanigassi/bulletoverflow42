extends Resource
class_name PlayerSessionState

@export var user_id: StringName = &""
@export var slot: int = 0
@export var character_id: StringName = &""
@export var ready: bool = false
@export var username: String = ""
@export var is_bot: bool = false

func to_dict() -> Dictionary:
	return {
		"user_id": String(user_id),
		"username": username,
		"slot": slot,
		"character_id": String(character_id),
		"ready": ready,
		"is_bot": is_bot,
	}

static func from_dict(data: Dictionary) -> PlayerSessionState:
	var state := PlayerSessionState.new()
	state.user_id = StringName(data.get("user_id", ""))
	state.slot = int(data.get("slot", 0))
	state.character_id = StringName(data.get("character_id", ""))
	state.ready = bool(data.get("ready", false))
	state.username = String(data.get("username", ""))
	state.is_bot = bool(data.get("is_bot", false))

	return state
