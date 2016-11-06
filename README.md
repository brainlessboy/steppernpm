# steppernpm
Stepper Motor npm module for node.js 

This library is a javascript/node.js rewrite of adafruits python based motor drivers to support the Raspberry pi motor hat https://www.adafruit.com/product/2348

example code:

    var mh = new this.MotorHat();
    mh.init();

    myStepper = mh.getStepper(200, 1);
    myStepper.setSpeed(30);

    //Single coil steps
    myStepper.step(100, mh.FORWARD, mh.SINGLE);
    myStepper.step(100, mh.BACKWARD, mh.SINGLE);

    //Double coil steps
    myStepper.step(100, mh.FORWARD, mh.DOUBLE);
    myStepper.step(100, mh.BACKWARD, mh.DOUBLE);

    //Interleaved coil steps
    myStepper.step(100, mh.FORWARD, mh.INTERLEAVE);
    myStepper.step(100, mh.BACKWARD, mh.INTERLEAVE);

    //Microsteps
    myStepper.step(100, mh.FORWARD, mh.MICROSTEP);
    myStepper.step(100, mh.BACKWARD, mh.MICROSTEP);


todo: library documentaiton

