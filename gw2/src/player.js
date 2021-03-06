/* eslint-disable radix, no-unused-vars */
var offsets = require('./offsets');

module.exports = (process, module, memory) => {
  var that = {};

  const mousePosition         = new Buffer(0xC);
  const playerRealPosition    = new Buffer(0xC);
  const playerRotation        = new Buffer(0x8);
  const positiveFloat         = new Buffer(4);
  const negativeFloat         = new Buffer(4);
  const isFlyingBuffer       	= new Buffer(4);
  isFlyingBuffer.writeFloatLE(0);
  positiveFloat.writeFloatLE(1);
  negativeFloat.writeFloatLE(-1);

  const speedDisabled         = new Buffer(4);
  const speedEnabled          = new Buffer(4);
  speedDisabled.writeFloatLE(0);
  speedEnabled.writeFloatLE(9.1875);

  let camera;
  let playerOffsetBase    = memory.readMultiLevelPtr(offsets.player.pos.ptr);
  let playerVisualBase    = memory.readMultiLevelPtr(offsets.player.visualPos.ptr);

  let playerCurrPosition = {
    x: null,
    y: null,
    z: null
  };

  let mouseRealPosition = {
    x: null,
    y: null,
    z: null
  };

  var movementOriginalByteCode = new Buffer(offsets.player.movement.byteLength);
  var movementOffset = module + offsets.player.movement.offset;
  var movementBufferLength = offsets.player.movement.byteLength;
  memory.readData(movementOffset, movementOriginalByteCode, offsets.player.movement.byteLength);

  that.disablePlayerMovement = () => {
    memory.writeData(movementOffset, Buffer.alloc(movementBufferLength, 0x90), offsets.player.movement.byteLength);
  };

  that.enablePlayerMovement = () => {
    memory.writeData(movementOffset, movementOriginalByteCode, offsets.player.movement.byteLength);
  };

  that.setCameraReference = (cameraRef) => {
    camera = cameraRef;
  };

  that.updateOffsetBase = () => {
    playerOffsetBase    = memory.readMultiLevelPtr(offsets.player.pos.ptr);
    playerVisualBase    = memory.readMultiLevelPtr(offsets.player.visualPos.ptr);
  };

  that.getPosition = () => {
    memory.readData(playerOffsetBase + offsets.player.pos.x, playerRealPosition, 0xC);
    playerCurrPosition.x = playerRealPosition.readFloatLE(0);
    playerCurrPosition.y = playerRealPosition.readFloatLE(4);
    playerCurrPosition.z = playerRealPosition.readFloatLE(8);
    return playerCurrPosition;
  };


  that.getRotation = () => {
    memory.readData(playerVisualBase + offsets.player.visualPos.headingA, playerRotation, 0x8);
    var cos = playerRotation.readFloatLE(0);
    var sin = playerRotation.readFloatLE(0x4);
    var result = Math.atan2(cos, sin) * (180 / Math.PI);
    if (result < 0) result += 360;
    return { degrees: parseInt(result), headingA: cos, headingB: sin, radians: Math.atan2(cos, sin) };
  };

  that.getMousePosition = () => {
    memory.readData(module +  offsets.mouse.base, mousePosition, 0xC);
    if (mousePosition.readFloatLE(0).toString() === 'Infinity') return false;

    mouseRealPosition.x = mousePosition.readFloatLE(0) / 32;
    mouseRealPosition.y = mousePosition.readFloatLE(4) / 32;
    mouseRealPosition.z = mousePosition.readFloatLE(8) / 32;

    return mouseRealPosition;
  };

  return that;
};
