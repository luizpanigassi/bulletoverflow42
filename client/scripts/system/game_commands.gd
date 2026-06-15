extends Node

signal round_start_requested()
signal player_spawn_requested(data)
signal player_died_requested(player_id)

signal round_end_requested(winner_id)
signal match_end_requested(winner_id)
signal powerup_spawn_requested(data)
