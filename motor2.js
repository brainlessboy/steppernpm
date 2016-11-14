var stepper = require('pisteppermotor');

try {
    stepper.init(0x60);
    var steps = 100;
    var speed = 50;
    var motor = 1;
    stepper.moveForward(steps,speed,motor);
} catch (err) {
    console.log(err);
}
