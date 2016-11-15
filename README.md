# pisteppermotor
Stepper Motor npm module for node.js 

This library is a javascript/node.js rewrite of adafruits python based motor drivers to support the Raspberry pi motor hat https://www.adafruit.com/product/2348

## Installation

        npm install pisteppermotor --save

## Usage

Note: i was only able to drive one stepper at a time, simultaneous steppers currently not possible.

    var mh = new this.MotorHat();
    mh.init();

    // get stepper one
    var stepperOne = mh.getStepper(200, 1);
    stepperOne.setSpeed(30);
    
    // get stepper one
    var stepperTwo = mh.getStepper(200, 2);
    stepperTwo.setSpeed(30);

    //Single coil steps
    stepperOne.step(100, mh.FORWARD, mh.SINGLE);
    stepperOne.step(100, mh.BACKWARD, mh.SINGLE);

    //Double coil steps
    stepperOne.step(100, mh.FORWARD, mh.DOUBLE);
    stepperOne.step(100, mh.BACKWARD, mh.DOUBLE);

    //Interleaved coil steps
    stepperOne.step(100, mh.FORWARD, mh.INTERLEAVE);
    stepperOne.step(100, mh.BACKWARD, mh.INTERLEAVE);

    //Microsteps
    stepperOne.step(100, mh.FORWARD, mh.MICROSTEP);
    stepperOne.step(100, mh.BACKWARD, mh.MICROSTEP);

## Tests

        npm test

        tests motor one only
        
also motor.js can be used for inital tests on the RaspberryP

        node motor2.js
        
        tests the motor via the module

## Release History

* 0.0.1 Initial release (tested)

