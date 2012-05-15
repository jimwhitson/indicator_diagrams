exports.transform = function (req, res) {
  var redis = require('redis');
  var rdb = redis.createClient();
  var printMcs = function(mcs) {
    for(var i = 0; i < mcs.length; i++) {
      mcs[i].print();
    }
  };
  var printAllMcs = function(mcs) {
    for(var i = 0; i < mcs.length; i++) {
      mcs[i].print();
      mcs[i].printChildren();
    }
  };
  var makeModelCircle = function(name, uid) {
    var mc = {};
    mc.name = name;
    mc.uid = uid;
    mc.tos = [];
    mc.froms = [];
    mc.print = function () {
      console.log("ModelCircle: "+this.name+".");
    };
    mc.copyVc = function(vc) {
      this.pos = [];
      this.pos[0] = vc.pos[0];
      this.pos[1] = vc.pos[1];
      this.name = vc.name;
      this.uid = vc.uid;
      this.fontSize = vc.fontSize;
      this.size = vc.size;
      this.type = vc.type;
    };
    mc.copyToVc = function(vc) {
      vc.pos = [];
      vc.pos[0] = this.pos[0];
      vc.pos[1] = this.pos[1];
      vc.name = this.name;
      vc.uid = this.uid;
      vc.fontSize = this.fontSize;
      vc.size = this.size;
      vc.type = this.type;
    };
    mc.printChildren = function() {
      console.log("Tos:");
      printMcs(this.tos);
      console.log("Froms:");
      printMcs(this.froms);
    };
    mc.toFlat = function () {
      var tmp = {};
      this.copyToVc(tmp);
      tmp.tos = tmp.froms = [];
      for(var i = 0; i < this.tos.length; i++) {
        tmp.tos.push(this.tos[i].uid);
      }
      return tmp;
    };
    return mc;
  };

  var findObjByUid = function(arry, uid) {
    for(var i = 0; i < arry.length; i++) {
      if(arry[i].uid === uid) {
        return arry[i];
      }
    }
  };

  var JsonToMcs = function(d) {
    var objs = JSON.parse(d);
    var mobjs = [];
    for(var i = 0; i < objs.length; i++) {
      tmp = makeModelCircle(objs[i].name, objs[i].uid);
      tmp.copyVc(objs[i]);
      mobjs.push(tmp);
    }
    for(var i = 0; i < objs.length; i++) {
      for(var j = 0; j < objs[i].tos.length; j++) {
        var dest = findObjByUid(mobjs, objs[i].tos[j]);
        mobjs[i].tos.push(dest);
        dest.froms.push(mobjs[i]);
      }
    }
    return mobjs;
  }
  function mcsToJson(mobjs) {
    var objs = [];
    for(var i = 0; i < mobjs.length; i++) {
      objs.push(mobjs[i].toFlat());
    }
    return JSON.stringify(objs);
  }
  var naiveStraighten = function(mobjs, epsilon) {
    for(var i = 0; i < mobjs.length; i++) {
      var x = mobjs[i].pos[0];
      var y = mobjs[i].pos[1];
      for(var j = 0; j < mobjs.length; j++) {
        if(Math.abs(mobjs[j].pos[0] - x) < epsilon) {
          mobjs[j].pos[0] = x;
        }
        if(Math.abs(mobjs[j].pos[1] - y) < epsilon) {
          mobjs[j].pos[1] = y;
        }
      }
    }
  }

  var pruneExceptNeigbours = function(target) {
    var mobjs = [];
    var targetCopy = makeModelCircle(target.name, target.uid);
    target.copyToVc(targetCopy);
    mobjs.push(targetCopy);
    for(var i = 0; i < target.tos.length; i++) {
      toCopy = makeModelCircle(target.tos[i].name, target.tos[i].uid);
      target.tos[i].copyToVc(toCopy);
      targetCopy.tos.push(toCopy);
      mobjs.push(toCopy);
    }
    for(var i = 0; i < target.froms.length; i++) {
      fromCopy = makeModelCircle(target.froms[i].name, target.froms[i].uid);
      target.froms[i].copyToVc(fromCopy);
      fromCopy.tos.push(targetCopy);
      targetCopy.froms.push(fromCopy);
      mobjs.push(fromCopy);
    }
    return mobjs;

  };

  var equifan = function(target) {
    var margin = 150 + target.size;
    var fanHeight = 5 * target.size;
    var toFanGap, toFanTop, fromFanGap, fromFanTop;
    if(target.tos.length === 1) {
      toFanGap = 0;
      toFanTop = target.pos[1];
    } else {
      toFanGap = fanHeight / (target.tos.length - 1);
      toFanTop = target.pos[1] - fanHeight/2;
    }
    if(target.froms.length === 1) {
      fromFanGap = 0;
      fromFanTop = target.pos[1];
    } else {
      fromFanGap = fanHeight / (target.froms.length - 1);
      fromFanTop = target.pos[1] - fanHeight/2;
    }

    for(var i = 0; i < target.tos.length; i++) {
      target.tos[i].pos[0] = target.pos[0] - margin;
      target.tos[i].pos[1] = toFanTop + (i * toFanGap);
    }
    for(var i = 0; i < target.froms.length; i++) {
      target.froms[i].pos[0] = target.pos[0] + margin;
      target.froms[i].pos[1] = fromFanTop + (i * fromFanGap);
    }
  };

  var labelizeNeighbours = function(target) {
    for(var i = 0; i < target.tos.length; i++) {
      target.tos[i].type = "#FFFFFF";
    }
    for(var i = 0; i < target.froms.length; i++) {
      target.froms[i].type = "#FFFFFF";
    }
  };

  var mobjs = JsonToMcs(req.body.objectsData);
  var nobjs = pruneExceptNeigbours(findObjByUid(mobjs, req.params.uid));
  equifan(findObjByUid(nobjs, req.params.uid));
  labelizeNeighbours(findObjByUid(nobjs, req.params.uid));
  var serialized = mcsToJson(nobjs);
  res.send(serialized);
}
