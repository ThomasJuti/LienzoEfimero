export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Floor line for playable levels: the Y where a grounded player's feet rest.
export const GROUND_Y = 640;

export const MOVE_SPEED = 230;
export const JUMP_VELOCITY = -600;
export const GRAVITY_Y = 1550;

export const PLAYER_SCALE = 0.42;
// Physics body sizes are expressed in frame-local (unscaled) pixels; `true`
// passed to setSize() recenters the body on whichever frame is currently
// active, which keeps things simple when swapping between the walk sheet
// (256px-wide cells) and the actions sheet (~341px-wide cells).
export const PLAYER_BODY_FRAME_WIDTH = 130;
export const PLAYER_BODY_FRAME_HEIGHT = 380;
// Shorter box used while crouching (FRAME_CROUCH) — this is what actually
// lets the player duck under a SecurityCamera's cone; the standing box is
// tall enough to always be caught by it.
export const PLAYER_CROUCH_BODY_HEIGHT = 190;
