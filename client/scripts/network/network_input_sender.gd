extends Node

var time_since_last_tick: float = 0.0
const TICK_RATE: float = 1.0 / 60.0 # 60 sends por segundo

func _physics_process(delta: float) -> void:
	time_since_last_tick += delta

func send_input(snapshot: InputSnapshot, player_slot: int) -> void:
	if MatchData.session == null:
		return
	
	if time_since_last_tick < TICK_RATE:
		return
	
	var payload := snapshot.to_dict()
	var seq = PlayerInputBuffer.register_input(snapshot)
	
	payload["seq"] = seq
	payload["type"] = "player_input"
	payload["player_slot"] = player_slot
	
	if MatchData.session and MatchData.session.mode == &"online":
		if NetworkClient.is_network_connected:
			NetworkClient.send_message(payload)
		else:
			MockMatchServer.receive_input(payload)
	else:
		MockMatchServer.receive_input(payload)

	time_since_last_tick = 0.0

func is_bot_match() -> bool:
	return MatchData.session and MatchData.session.game_type == &"vs_bot"
