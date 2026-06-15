extends Node
class_name SessionLoader

static func load_from_dict(data: Dictionary) -> SessionConfig:
	return SessionConfig.from_dict(data)
