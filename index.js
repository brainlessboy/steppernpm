var i2c = require('i2c');
var sleep = require('sleep');

/**
 * Stepper Motor Controller (Adafruit)
 */
var Motor = {

    sleepTime: 500,
    wire: null,

    /**
     * make sure all hardware is hooked before testing
     * the test will loop 10 times each type of coil
     */
    test: function () {

        try {

            var mh = new Motor.MotorHat();
            mh.init();

            var myStepper = mh.getStepper(200, 1);
            myStepper.setSpeed(30);

            for (var i = 0; i < 5; i++) {
                console.log("Single coil steps");
                myStepper.step(100, mh.FORWARD, mh.SINGLE);
                myStepper.step(100, mh.BACKWARD, mh.SINGLE);

                console.log("Double coil steps");
                myStepper.step(100, mh.FORWARD, mh.DOUBLE);
                myStepper.step(100, mh.BACKWARD, mh.DOUBLE);

                console.log("Interleaved coil steps");
                myStepper.step(100, mh.FORWARD, mh.INTERLEAVE);
                myStepper.step(100, mh.BACKWARD, mh.INTERLEAVE);

                console.log("Microsteps");
                myStepper.step(100, mh.FORWARD, mh.MICROSTEP);
                myStepper.step(100, mh.BACKWARD, mh.MICROSTEP);
            }
        } catch (err) {
            console.log(err);
        }
    },
    /**
     * initial setup of the motor hat i2c wire
     * @param address
     */
    init:function(address){
        Motor.wire= new i2c(address, {device: '/dev/i2c-1'});
    },
    /**
     * MotorHat object containing all required functions
     * @constructor
     */
    MotorHat: function () {

        this.FORWARD = 1;
        this.BACKWARD = 2;
        this.BRAKE = 3;
        this.RELEASE = 4;

        this.SINGLE = 1;
        this.DOUBLE = 2;
        this.INTERLEAVE = 3;
        this.MICROSTEP = 4;

        this.i2caddr = 0x60;
        this.frequency = 1600.0;

        // array of motors attached
        this.motors = [];
        this.steppers = [];

        this.pwm;

        /**
         * @param addr = 0x60
         * @param freq = 1600
         */
        this.init = function (addr, freq) {

            if (addr) {
                this.i2caddr = addr;
            }

            if (freq) {
                this.frequency = freq;
            }

            this.motors = [];

            var stepperOne = new Motor.StepperMotor();
            stepperOne.init(this, 0, 200);

            var stepperTwo = new Motor.StepperMotor();
            stepperTwo.init(this, 1, 200);

            this.steppers = [stepperOne, stepperTwo];

            try {
                this.pwm = new Motor.PWM();
                this.pwm.init(0x60);
                this.pwm.setPWMFreq(this.frequency);
            } catch (err) {
                console.log(err);
            }
        };

        this.setPin = function (pin, value) {

            if (pin < 0 || pin > 15) {
                console.log('PWM pin must be between 0 and 15 inclusive');
            }
            if (value != 0 && value != 1) {
                console.log('Pin value must be 0 or 1!');
            }
            if (value == 0) {
                this.pwm.setPWM(pin, 0, 4096);
            }
            if (value == 1) {
                this.pwm.setPWM(pin, 4096, 0);
            }
        };

        this.getStepper = function (steps, num) {
            if (num < 1 || num > 2) {
                console.log('MotorHAT Stepper must be between 1 and 2 inclusive');
            }
            return this.steppers[num - 1];
        }

        this.getMotor = function (num) {
            if (num < 1 || num > 4) {
                console.log('MotorHAT Motor must be between 1 and 4 inclusive');
            }
            return this.motors[num - 1];
        }
    },
    PWM: function () {

        this.MODE1 = 0x00;
        this.MODE2 = 0x01;
        this.SUBADR1 = 0x02;
        this.SUBADR2 = 0x03;
        this.SUBADR3 = 0x04;
        this.PRESCALE = 0xFE;
        this.LED0_ON_L = 0x06;
        this.LED0_ON_H = 0x07;
        this.LED0_OFF_L = 0x08;
        this.LED0_OFF_H = 0x09;
        this.ALL_LED_ON_L = 0xFA;
        this.ALL_LED_ON_H = 0xFB;
        this.ALL_LED_OFF_L = 0xFC;
        this.ALL_LED_OFF_H = 0xFD;

        // Bits
        this.RESTART = 0x80;
        this.SLEEP = 0x10;
        this.ALLCALL = 0x01;
        this.INVRT = 0x10;
        this.OUTDRV = 0x04;

        this.prescaleval;
        this.prescale;
        this.oldmode;
        this.newmode;
        this.mode1;

        this.softwareReset = function () {
            Motor.wire.writeByte(0x06, function (err) {
                if (err) {
                    console.out("general software reset sent failure ->" + err);
                }
            });
        };

        this.init = function (address) {

            this.setALLPWM(0, 0);

            this.writeBytes(this.MODE2, [this.OUTDRV]);
            this.writeBytes(this.MODE1, [this.ALLCALL]);

            sleep.usleep(Motor.sleepTime);

            Motor.wire.readBytes(this.MODE1, 1, function (err, res) {

                if (err) {
                    console.log("problem reading bytes from MODE1 length 1 " + err);
                }
                console.log("read error:" + res);

                this.mode1 = res;
            });

            this.mode1 = this.mode1 & ~this.SLEEP;
            this.writeBytes(this.MODE1, [this.mode1]);

            sleep.usleep(Motor.sleepTime);
        };

        /**
         * @param freq must be float value!
         */
        this.setPWMFreq = function (freq) {

            var prescaleval = 25000000.0;
            prescaleval /= 4096.0;
            prescaleval /= freq;
            prescaleval -= 1.0;
            this.prescale = Math.floor(prescaleval + 0.5);

            Motor.wire.readBytes(this.MODE1, 1, function (err, res) {

                if (err) {
                    console.log("problem reading bytes from MODE1 length 1 " + err);
                }
                console.log("read error:" + res);

                this.oldmode = res;
            });

            this.newmode = (this.oldmode & 0x7F) | 0x10;
            this.writeBytes(this.MODE1, [this.newmode]);
            this.writeBytes(this.PRESCALE, [Math.floor(this.prescale)]);
            this.writeBytes(this.MODE1, [this.oldmode]);
            sleep.usleep(Motor.sleepTime);
            this.writeBytes(this.MODE1, [this.oldmode | 0x80]);
        };

        this.setPWM = function (channel, on, off) {
            this.writeBytes(this.LED0_ON_L + 4 * channel, [on & 0xFF]);
            this.writeBytes(this.LED0_ON_H + 4 * channel, [on >> 8]);
            this.writeBytes(this.LED0_OFF_L + 4 * channel, [off & 0xFF]);
            this.writeBytes(this.LED0_OFF_H + 4 * channel, [off >> 8]);
        };

        this.setALLPWM = function (on, off) {
            this.writeBytes(this.ALL_LED_ON_L, [on & 0xFF]);
            this.writeBytes(this.ALL_LED_ON_H, [on >> 8]);
            this.writeBytes(this.ALL_LED_OFF_L, [off & 0xFF]);
            this.writeBytes(this.ALL_LED_OFF_H, [off >> 8]);
        };

        this.writeBytes = function (address, bytes) {
            Motor.wire.writeBytes(address, bytes, function (err) {
                if (err) {
                    console.out("PWM write failure ->" + err);
                }
            });
        }
    },

    /**
     * Stepper Motor Object
     * @constructor
     */
    StepperMotor: function () {

        this.MICROSTEPS = 8;
        this.MICROSTEP_CURVE = [0, 50, 98, 142, 180, 212, 236, 250, 255];

        this.MC;
        this.revsteps;
        this.motornum;
        // 1 sec = 1000000 microsecond
        this.sec_per_step = Math.floor(0.01 * 1000000);
        this.steppingcounter = 0;
        this.currentstep = 0;
        this.PWMA;
        this.AIN2;
        this.AIN1;
        this.PWMB;
        this.BIN2;
        this.BIN1;

        this.init = function (controller, num, steps) {

            this.MC = controller;
            this.revsteps = steps;
            this.motornum = num;

            if (num == 0) {
                this.PWMA = 8;
                this.AIN2 = 9;
                this.AIN1 = 10;
                this.PWMB = 13;
                this.BIN2 = 12;
                this.BIN1 = 11;

            } else if (num == 1) {
                this.PWMA = 2;
                this.AIN2 = 3;
                this.AIN1 = 4;
                this.PWMB = 7;
                this.BIN2 = 6;
                this.BIN1 = 5;
            } else {
                console.log('MotorHAT Stepper must be between 1 and 2 inclusive');
            }
        };

        this.setSpeed = function (rpm) {
            this.sec_per_step = Math.floor((60 * 1000000) / (this.revsteps * rpm));
            this.steppingCounter = 0;
            console.log("speed: " + rpm + " " + this.sec_per_step);
        };

        this.oneStep = function (dir, style) {

            var pwm_a = 255;
            var pwm_b = 255;

            // todo: just implemented one style, make the others as well

            // single
            if (style == Motor.MotorHat.SINGLE) {
                if ((this.currentstep / (this.MICROSTEPS / 2)) % 2) {

                    if (dir == Motor.MotorHat.FORWARD) {
                        this.currentstep += this.MICROSTEPS / 2;
                    } else {
                        this.currentstep -= this.MICROSTEPS / 2;
                    }
                } else {
                    if (dir == Motor.MotorHat.FORWARD) {
                        this.currentstep += this.MICROSTEPS;
                    } else {
                        this.currentstep -= this.MICROSTEPS;
                    }
                }
            }

            // double
            if (style == Motor.MotorHat.DOUBLE) {

                if (!(this.currentstep / (this.MICROSTEPS / 2) % 2)) {
                    if (dir == Motor.MotorHat.FORWARD) {
                        this.currentstep += this.MICROSTEPS / 2;
                    } else {
                        this.currentstep -= this.MICROSTEPS / 2;
                    }
                } else {
                    if (dir == Motor.MotorHat.FORWARD) {
                        this.currentstep += this.MICROSTEPS;
                    } else {
                        this.currentstep -= this.MICROSTEPS;
                    }
                }
            }

            // interleave
            if (style == Motor.MotorHat.INTERLEAVE) {
                if (dir == Motor.MotorHat.FORWARD) {
                    this.currentstep += this.MICROSTEPS / 2
                }
                else {
                    this.currentstep -= this.MICROSTEPS / 2
                }
            }

            // microstep
            if (style == Motor.MotorHat.MICROSTEP) {

                if (dir == Motor.MotorHat.FORWARD) {
                    this.currentstep += 1;
                } else {
                    this.currentstep -= 1;
                }

                this.currentstep += this.MICROSTEPS * 4;
                this.currentstep %= this.MICROSTEPS * 4;

                pwm_a = 0;
                pwm_b = 0;

                if (this.currentstep >= 0 && this.currentstep < this.MICROSTEPS) {
                    pwm_a = this.MICROSTEP_CURVE[this.MICROSTEPS - this.currentstep];
                    pwm_b = this.MICROSTEP_CURVE[this.currentstep];
                } else {
                    if (this.currentstep >= this.MICROSTEPS && this.currentstep < this.MICROSTEPS * 2) {
                        pwm_a = this.MICROSTEP_CURVE[this.currentstep - this.MICROSTEPS];
                        pwm_b = this.MICROSTEP_CURVE[this.MICROSTEPS * 2 - this.currentstep]
                    } else if (this.currentstep >= this.MICROSTEPS * 2 && this.currentstep < this.MICROSTEPS * 3) {
                        pwm_a = this.MICROSTEP_CURVE[this.MICROSTEPS * 3 - this.currentstep];
                        pwm_b = this.MICROSTEP_CURVE[this.currentstep - this.MICROSTEPS * 2]
                    } else if (this.currentstep >= this.MICROSTEPS * 3 && this.currentstep < this.MICROSTEPS * 4) {
                        pwm_a = this.MICROSTEP_CURVE[this.currentstep - this.MICROSTEPS * 3];
                        pwm_b = this.MICROSTEP_CURVE[this.MICROSTEPS * 4 - this.currentstep]
                    }
                }
            }

            this.currentstep += this.MICROSTEPS * 4;
            this.currentstep %= this.MICROSTEPS * 4;

            this.MC.pwm.setPWM(this.PWMA, 0, pwm_a * 16);
            this.MC.pwm.setPWM(this.PWMB, 0, pwm_b * 16);

            var coils = [0, 0, 0, 0];

            if (style == Motor.MotorHat.MICROSTEP) {
                if (this.currentstep >= 0 && this.currentstep < this.MICROSTEPS) {
                    coils = [1, 1, 0, 0];
                } else if (this.currentstep >= this.MICROSTEPS && this.currentstep < this.MICROSTEPS * 2) {
                    coils = [0, 1, 1, 0];
                } else if (this.currentstep >= this.MICROSTEPS * 2 && this.currentstep < this.MICROSTEPS * 3) {
                    coils = [0, 0, 1, 1];
                } else if (this.currentstep >= this.MICROSTEPS * 3 && this.currentstep < this.MICROSTEPS * 4) {
                    coils = [1, 0, 0, 1];
                }
            } else {
                var step2coils = [[1, 0, 0, 0],
                    [1, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 1, 0],
                    [0, 0, 1, 0],
                    [0, 0, 1, 1],
                    [0, 0, 0, 1],
                    [1, 0, 0, 1]];

                coils = step2coils[this.currentstep / (this.MICROSTEPS / 2)];
            }

            this.MC.setPin(this.AIN2, coils[0]);
            this.MC.setPin(this.BIN1, coils[1]);
            this.MC.setPin(this.AIN1, coils[2]);
            this.MC.setPin(this.BIN2, coils[3]);

            return this.currentstep
        };

        this.step = function (steps, direction, stepstyle) {

            var s_per_s = this.sec_per_step;
            var lateststep = 0;

            console.log("s_per_s:" + s_per_s);

            if (stepstyle == Motor.MotorHat.INTERLEAVE) {
                s_per_s = Math.floor(s_per_s / 2);
            }

            if (stepstyle == Motor.MotorHat.MICROSTEP) {
                s_per_s = Math.floor(s_per_s / this.MICROSTEPS);
                steps *= this.MICROSTEPS;
            }

            for (i = 0; i < steps; i++) {
                lateststep = this.oneStep(direction, stepstyle);
                sleep.usleep(s_per_s);
            }

            if (stepstyle == Motor.MotorHat.MICROSTEP) {
                while (lateststep != 0 && lateststep != this.MICROSTEPS) {
                    lateststep = this.oneStep(direction, stepstyle);
                    sleep.sleep(s_per_s);
                }
            }
        };
    }
};
module.exports = Motor;
