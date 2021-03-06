FF.View = function(data) {
    'use strict';
    var self = this;
    var minLength = Math.min(data.width, data.height);
    this.scale = data.width / FF.standardSize;
    this.stage = data.stage;
    this.controller = null;
    this.xOffset = 10;
    this.yOffset = 10;
    this.planeOffsetX = 64;
    this.planeOffsetY = 64;
    this.bulletOffsetX = 8;
    this.bulletOffsetY = 4;
    this.allFlyObjs = [];
    this.allFlyNames = [];
};

FF.View.prototype.paint = function(res) {
    'use strict';
    for (var i = 0; i < res.length; ++i) {
        this.updateFlyObj(res[i]);
    }
    this.stage.update();
    if (FF.controller.controlling) {
        FF.controller.planeControl();
    }
};

FF.View.prototype.remove = function(res) {
    'use strict';
    for (var i = this.allFlyObjs.length - 1; i >= 0; --i) {
        if (this.allFlyObjs[i].id === res.id) {
            //因为子弹和其所属飞机的id是一样的，这一步就可以同时删除飞机和子弹
            this.stage.removeChild(this.allFlyObjs[i]);
            this.allFlyObjs.splice(i, 1);
        }
    }
    this.stage.update();
};

FF.View.prototype.kill = function(res) {
    'use strict';
    var thisFlyObj;
    var stage = this.stage;

    for (var i = this.allFlyObjs.length - 1; i >= 0; --i) {
        thisFlyObj = this.allFlyObjs[i];
        if (thisFlyObj.id === res.killed.id) {
            if (thisFlyObj.type === 'f') {
                createjs.Tween.get(thisFlyObj, {loop: false})
                    .to({alpha: 0, scaleX: 1, scaleY: 1},
                    1000, createjs.Ease.getPowInOut(4))
                    .call(function(){
                        stage.removeChile(thisFlyObj);
                        this.allFlyObjs.splice(i, 1);
                    });
                createjs.Ticker.setFPS(60);
                createjs.Ticker.addEventListener('tick', stage);
            }
            if (thisFlyObj.type === 'b') {
                stage.removeChild(this.allFlyObjs[i]);
                this.allFlyObjs.splice(i, 1);
            }
        }
    }
    if(res.killer.id === FF.playerId) {
        FF.killList.push(res.killed.name);
        $('#shoot-down-list').append('<span class="glyphicon glyphicon-fire" aria-hidden="true"></span>');
    }else if(res.killed.id === FF.playerId) {
        FF.killedBy = res.killer.name;
        this.showGameEnding();
    }
    this.stage.update();
};

FF.View.prototype.showGameEnding = function() {
    $('#kill-list').text(FF.killList.toString());
    $('#killed-by').text(FF.killedBy);
    $('#btn-gameover').click();
};

FF.View.prototype.removeBullets = function(res) {
    'use strict';
    for(var j=res.length-1;j>=0;j--)
    {
        for (var i = this.allFlyObjs.length - 1; i >= 0; --i) {
            if (this.allFlyObjs[i].id === res[j].id && this.allFlyObjs[i].type === res[j].type  && this.allFlyObjs[i].order == res[j].order  ) {
                this.stage.removeChild(this.allFlyObjs[i]);
                this.allFlyObjs.splice(i, 1);
            }
        }
    }

    this.stage.update();
};

FF.View.prototype.updateFlyObj = function(resObj) {
    'use strict';
    var i, flyObj,flag;
    for (i = 0; i < this.allFlyObjs.length; ++i) {
        flyObj = this.allFlyObjs[i];
        if (flyObj.id === resObj.id && flyObj.type === resObj.type ) {
            flag = true;
            if(resObj.type === 'b')
            {
                if(resObj.order != flyObj.order)
                {
                   flag = false;
                }
            }
            if(flag)
            {
				if ((Math.abs(flyObj.x - resObj.x) + Math.abs(flyObj.y - resObj.y)) > 50) {
					flyObj.x = resObj.x;
					flyObj.y = resObj.y;
					flyObj.rotation = resObj.angle * 180 / Math.PI;
					if (flyObj.type === 'b') {
						flyObj.regX = this.bulletOffsetX;
						flyObj.regY = this.bulletOffsetY;
					}
					else if (flyObj.type === 'f') {
						flyObj.regX = this.planeOffsetX;
						flyObj.regY = this.planeOffsetY;
					}
				}
				else {
					if (flyObj.type === 'b') {
						createjs.Tween.get(flyObj, {loop: false})
								.to({x: resObj.x, y: resObj.y, rotation: (resObj.angle * 180 / Math.PI), regX: this.bulletOffsetX, regY: this.bulletOffsetY},
								50);
						createjs.Ticker.setFPS(60);
						createjs.Ticker.addEventListener('tick', this.stage);
					}
					else if (flyObj.type === 'f') {
						createjs.Tween.get(flyObj, {loop: false})
								.to({x: resObj.x, y: resObj.y, rotation: (resObj.angle * 180 / Math.PI), regX: this.planeOffsetX, regY: this.planeOffsetY},
								50);
						createjs.Ticker.setFPS(60);
						createjs.Ticker.addEventListener('tick', this.stage);
					}
				}
                return flyObj;
            }

        }
    }
    return this.createFlyObj(resObj);
};

FF.View.prototype.createFlyObj = function(resObj) {
    'use strict';
    var self = this;
    var flag = true;
    var img, f;
    if (self.allFlyNames[resObj.id] === undefined) {
        self.allFlyNames[resObj.id] = 1;
    } else {
        flag = false;
    }
    if(resObj.type === 'b')
    {
        img = new Image();
        img.src = '../img/bullet.png';
        img.onload = function() {
            f = new createjs.Bitmap(img);
            f.x = resObj.x;
            f.y = resObj.y;
            f.rotation = resObj.angle * 180 / Math.PI;
            f.scaleX = 1;
            f.scaleY = 1;
            f.alpha = 0.5;
            f.name = resObj.name;
            f.id = resObj.id;
            f.type = resObj.type;
            f.order = resObj.order;
            self.stage.addChild(f);
            self.allFlyObjs.push(f);
        };
    }
    if (flag) {
        if (resObj.type === 'f') {
            img = new Image();
            if (resObj.id === FF.playerId) {
                img.src = '../img/my-flight.png';
            } else {
                img.src = '../img/flight.png';
                FF.message.append(resObj.name + ' joins the game!', 'success');
            }
            img.onload = function() {
                f = new createjs.Bitmap(img);
                f.x = resObj.x;
                f.y = resObj.y;
                f.rotation = resObj.angle * 180 / Math.PI;
                f.scaleX = 0.25;
                f.scaleY = 0.25;
                f.alpha = 0.8;
                f.id = resObj.id;
                f.name = resObj.name;
                f.type = resObj.type;
                self.stage.addChild(f);
                self.allFlyObjs.push(f);
            };
        }
    }
};