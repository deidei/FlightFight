var util = require('util');
var async = require('async');

(function EventHandlerDefine() {

    Object.size = function(obj) {
        var size = 0,
            key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    var CONST = {
        sendId: 'send-id',
        getKeyPress: 'get-key-press',
        sendPos: 'send-pos',
        playerLeave: 'player-leave'
    };

    var self = this;
    var flyObj = require('./fly-obj.js');
    var sockets = []; //all users <- TODO: Persistence
    this.io = null;

    /*
     * class Player
     */
    function Player(name, socket) {
        this.id = socket.id;
        this.name = name;
        this.socket = socket;
        this.flight = flyObj.createFlight(this.id);
        this.score = 0;
    }

    Player.prototype.sendId = function() {
        this.socket.emit(CONST.sendId, this.id);
    };

    /*
     * class AllPlayers
     * player list and crud operations
     */
    var AllPlayers = {
        uniqueId: 1,
        players: {},
        flyings: [],

        printNumberOfPlayer: function() {
            console.log('[' + (new Date()).toString() + '] Online plyar: ' + Object.size(this.players));
        },

        playerJoin: function(socket) {
            var newPlayer = new Player("anonymity", socket);
            this.players[socket.id] = newPlayer;

            console.log('[' + (new Date()).toString() + '] a user connected. ');
            this.printNumberOfPlayer();
            return newPlayer;
        },

        playerLeft: function(socket) {
            if (this.players[socket.id]) {
                delete this.players[socket.id];

                for (var key in this.players) {
                    this.players[key].socket.emit(CONST.playerLeave, socket.id);
                }

                console.log('[' + (new Date()).toString() + '] player [id =' + socket.id + '] leave us.');
                this.printNumberOfPlayer();
            }
        },

        playerControl: function(socket, data) {
            for (var key in this.players) {
                if (this.players[key] !== null && this.players[key].socket == socket) {
                    this.players[key].flight.control(data);
                    break;
                }
            }
        },

        playerResetSpeed: function(socket) {
            for (var key in this.players) {
                if (this.players[key] !== null && this.players[key].socket == socket) {
                    this.players[key].flight.resetSpeed();
                    break;
                }
            }
        },

        queryPlayer: function(id) {
            return this.players[id.toString()];
        },

        bulletFire:function(socket)
        {
            for (var key in this.players) {
                if (this.players[key] !== null && this.players[key].socket == socket) {
                    var bullet = flyObj.fire(this.players[key].flight);
                    this.flyings.push(bullet);
                    break;
                }
            }
        },

        moveOneStep: function() {
            var key, p;
            for (key in this.players) {
                p = this.players[key];
                if (p !== null) {
                    p.flight.move();
                }
            }
            key = this.flyings.length;
            var outArr = [];
            while (key--) {
                if (this.flyings[key].move() === true ) {
                    outArr.push(this.flyings[key].toJson());
                    this.flyings.splice(key,1);
                }
            }
            if(outArr.length >0)
            {
                for (key in this.players) {
                    p = this.players[key];
                    if (p !== null ) {
                        p.socket.emit('bullet-remove',outArr);
                    }
                }
            }

        },

        sendPos: function() {
            var key, p, res = [];
            var hasPlayer = false;
            for (key in this.players) {
                p = this.players[key];
                if (p !== null) {
                    hasPlayer = true;
                    res.push(p.flight.toJson());
                }
            }
            if (hasPlayer === false) {
                return;
            }
            for (key = 0; key < this.flyings.length; ++key) {
                res.push(this.flyings[key].toJson());
            }
            //console.log('flying length is '+this.flyings.length);
            for (key in this.players) {
                p = this.players[key];
                if (p !== null) {
                    p.socket.emit(CONST.sendPos, res);
                }
            }
        }
    };

    module.exports.init = function(io) {
        this.io = io;
        io.on('connection', function(socket) {

            var newPlayer = AllPlayers.playerJoin(socket);
            newPlayer.sendId();


            socket.on('control', function(data) {
                //console.log('[' + (new Date()).toString() + '] a user control. ');
                AllPlayers.playerControl(socket, data);
            });

            socket.on('resetSpeed', function() {
                AllPlayers.playerResetSpeed(socket);
            });

            socket.on('fire', function() {
                AllPlayers.bulletFire(socket);
            });

            socket.on('disconnect', function() {
                console.log('[' + (new Date()).toString() + '] a user left. ');
                AllPlayers.playerLeft(socket);
            });

            socket.on('message', function(msg) {
                var text = String(msg || '');
                if (!text)
                    return;
                console.log('message: ' + msg);
                io.emit('message', msg);
            });
        });

    };

    var fts = 16; // frame per second
    var gameTimer; // = setInterval(gameLoop, 1000/fts);

    function gameLoop() {
        //one step movement
        AllPlayers.moveOneStep();
        //broadcast latest status
        //broadcast('message', new Date());
        AllPlayers.sendPos();
        //wait a moment and do again

    }

    module.exports.gameBegin = function() {
        gameTimer = setInterval(gameLoop, 1000 / fts);
    };

    module.exports.gameOver = function() {
        gameTimer = clearInterval(gameTimer);
    };

}());