extends Node

signal player_state_received(data)

signal match_started(data)
signal round_started(data)

signal player_spawned(data)
signal player_died(player_id)

signal projectile_spawn(data)
signal projectile_destroy(data)

signal powerup_spawned(data)
signal powerup_collected(data)

signal round_ended(winner_id)
signal score_updated(data)
signal match_ended(winner_id)
