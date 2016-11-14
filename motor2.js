var stepper = require('pisteppermotor');

try {
    stepper.init(0x60);
    stepper.test();
} catch (err) {
    console.log(err);
}
