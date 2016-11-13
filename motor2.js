var i2c = require('i2c');
var sleep = require('sleep');
var stepper = require('pisteppermotor');

try {
    stepper.test();
} catch (err) {
    console.log(err);
}
