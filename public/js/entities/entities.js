/*------------------- 
a player entity
-------------------------------- */
game.PlayerEntity = me.ObjectEntity.extend({

    init: function (x, y, settings) {
        this.parent(x, y, settings);

        this.gravity = 0;
        this.isWeaponCoolDown = false;
        this.weaponCoolDownTime = 500;

        // set up multiplayer
        this.isMP = settings.isMP;
        this.step = 0;

        // set up mouseCoordinates
        game.felix_mouseX = 0;
        game.felix_mouseY = 0;

        this.isCollidable = true;

        this.renderable.addAnimation("run-down", [0,1,2,3], 1);
        this.renderable.addAnimation("run-left", [4,5,6,7], 1);
        this.renderable.addAnimation("run-up", [8,9,10,11], 1);
        this.renderable.addAnimation("run-right", [12,13,14,15], 1);
        this.renderable.setCurrentAnimation("run-down");

        // set the default horizontal & vertical speed (accel vector)
        this.setVelocity(5, 5);

        // set the display to follow our position on both axis
        if (!this.isMP) {
            me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);

            window.onmousemove = this.handleMouseMove;

        }
    },

    handleMouseMove: function (event) {
        event = event || window.event; // IE-ism
        // event.clientX and event.clientY contain the mouse position
        game.felix_mouseX = event.clientX;
        game.felix_mouseY = event.clientY;
        // console.log("Recorded for client: " + this.mouseX + " " + this.mouseY);
    },

    /* -----
 
    update the player pos
 
    ------ */
    update: function () {

        if (!this.isMP) {
            this.vel.x = 0;
            this.vel.y = 0;

            if (me.input.isKeyPressed('shoot')) {

                if (!this.isWeaponCoolDown && me.input.isKeyPressed('shoot')) {
                    this.isWeaponCoolDown = true;
                    var player = this;
                    setTimeout(function () { player.isWeaponCoolDown = false; }, this.weaponCoolDownTime);

                    var pos = me.input.globalToLocal(game.felix_mouseX, game.felix_mouseY);
                    var anglePlayerToBullet = this.angleToPoint(pos);
                    
                    var obj = me.entityPool.newInstanceOf('bullet', this.pos.x + 12, this.pos.y + 12, {
                        image: 'bullet',
                        spritewidth: 24,
                        spriteheight: 24,
                        angle: anglePlayerToBullet,
                        target: pos
                    });

                    me.game.add(obj, this.z);
                    me.game.sort();
                }
            }

            if (me.input.isKeyPressed('left')) {
                // update the entity velocity
                this.renderable.setCurrentAnimation("run-left");
                this.vel.x -= this.accel.x * me.timer.tick;
            }

            if (me.input.isKeyPressed('right')) {
                // update the entity velocity
                this.renderable.setCurrentAnimation("run-right");
                this.vel.x += this.accel.x * me.timer.tick;
            }

            if (me.input.isKeyPressed('up')) {
                // TODO: New sprite level
                // update the entity velocity
                this.renderable.setCurrentAnimation("run-up");
                this.vel.y = -this.accel.y * me.timer.tick;
            }

            if (me.input.isKeyPressed('down')) {
                // TODO: New sprite level
                // update the entity velocity
                this.renderable.setCurrentAnimation("run-down");
                this.vel.y = this.accel.y * me.timer.tick;
            }

            // check & update player movement
            this.updateMovement();

            // Multiplayer: Fix player position
            if (this.vel.x !== 0 || this.vel.y !== 0) {
                // Whatever we need to do hee
            }

            // Multiplayer: Let's communicate our new position
            if (!this.isMP) { // Check if it's time to send a message 
                if (this.step == 0) {
                    game.mp.sendMessage({
                        action: "update",
                        pos: {
                            x: this.pos.x,
                            y: this.pos.y
                        },
                        vel: {
                            x: this.vel.x,
                            y: this.vel.y
                        }
                    });
                }
                if (this.step++ > 3) this.step = 0;
            }

            // update animation if necessary
            return true;
        }
    }

});

game.BulletEntity = me.ObjectEntity.extend({

    init: function (x, y, settings) {
        // call the constructor
        this.parent(x, y, settings);
        // disable gravity
        this.gravity = 0;
        this.collidable = true;
        this.canBreakTile = true;

        this.shotAngle = settings.angle;
        this.renderable.angle = this.shotAngle;
        console.log(settings.target);

        var localX = (settings.target.x - x);
        var localY = (settings.target.y - y);

        var localTargetVector = new me.Vector2d(localX, localY);
        localTargetVector.normalize();
        localTargetVector.scale(new me.Vector2d(20, 20));

        console.log(localX + " " + localY);
        this.setVelocity(localTargetVector.x, localTargetVector.y);

        // check for direction
        // this.direction = settings.direction;


    },
    
    onCollision: function() {
        console.log("Hello");
    },

    // Update bullet position
    update: function () {


        this.vel.x += this.accel.x * me.timer.tick;
        this.vel.y += this.accel.y * me.timer.tick;
        this.computeVelocity(this.vel);
        this.updateMovement();

        if (!this.renderable.visible) {
            me.game.remove(this);
        }
    }

});