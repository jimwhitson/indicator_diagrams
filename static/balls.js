(function() {
  var alertFallback = true;
  if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    if (alertFallback) {
      console.log = function(msg) {
        alert(msg);
      };
    } else {
      console.log = function() {};
    }
  }
  
  /* global state */

  var linkingMode = 0;
  var deletingMode = 0;
  var detailMode = 0;
  var linkSource = 0;
  var linkDest = 0;
  var selectingMode = 0;

  /* shapes */

  var config = {};
  config.overallOpacity = 0.7;

  var makeLabel = function(text, left, top) {
    var l = new fabric.nativeText(text, {
      fontFamily: 'GentiumBookBasic',
      left: left,
      fontSize: 24,
      selectable: false,
      top: top
    });
    l.id = "label";
    return l;
  }

  var makeCircle = function(left, top, toLines, fromLines, radius) {
    var c = new fabric.Circle({
      left: left,
      top: top,
      strokeWidth: 5,
      radius: 30,
      fill: '#fff',
      stroke: '#000'
    });
    if(radius) {
      c.radius = radius;
    }
    c.normalColour = '#000000';
    c.hasControls = c.hasBorders = false;
    c.id = "circle";
    c.uid = Math.floor(Math.random() * 10000000000).toString(16);
    c.name = "New";
    c.label = makeLabel(c.name, c.left, c.top);
    c.toLines = toLines;
    c.fromLines = fromLines;  
    c.opacity = config.overallOpacity;
    c.highlight = function() {
      this.fill = "#00BBFF";
    }
    c.unhighlight = function() {
      this.fill = "#ffffff";
    }
    c.changeColour = function(newColour) {
      this.normalColour = newColour;
      this.stroke = this.normalColour;
    }
    c.rmArrow = function (arrow) {
      var tmpToLines = this.toLines.slice(0);
      for(var i = 0; i < tmpToLines.length; i++) {
        if(tmpToLines[i] === arrow) {
          tmpToLines.splice(i, 1);
        }
      }
      this.toLines = tmpToLines;

      var tmpFromLines = this.fromLines.slice(0);
      for(var i = 0; i < tmpFromLines.length; i++) {
        if(tmpFromLines[i] === arrow) {
          tmpFromLines.splice(i, 1);
        }
      }
      this.fromLines = tmpFromLines;
    };
    c.changeLabel = function(name) {
      this.name = name;
      this.label.setText(name);
    }
    c.draw = function() {
      canvas.add(this.label);
      canvas.add(this);
    }
    c.update = function () {
      this.label.left = this.left;
      this.label.top = this.top;
      for(i = 0; i < this.fromLines.length; i++) {
        this.fromLines[i].update();
      }
      for(i = 0; i < this.toLines.length; i++) {
        this.toLines[i].update();
      }
    }
    c.copy = function() {
      c2 = makeCircle(this.left, this.top, [], [], this.radius);
      c2.name = this.name;
      c2.label = makeLabel(this.name, this.left, this.top);
      c2.label.fontSize = this.label.fontSize;
      c2.normalColour = this.normalColour;
      c2.stroke = this.stroke;
      c2.name = this.name;
      return c2;
    };

    return c;
  };
  var makeRect = function(left, top, width, height) {
    var r = new fabric.Rect({
      left: left,
      top: top,
      strokeWidth: 5,
      width: width,
      height: height,
      fill: '#fff',
      stroke: '#000'
    });
    r.opacity = config.overallOpacity;
    r.hasControls = r.hasBorders = false;
    return r;
  };
  var makeTriangle = function(left, top, width, height) {
    var t = new fabric.Triangle({
      left: left,
      top: top,
      strokeWidth: 1,
      width: width,
      height: height,
      fill: '#000',
      stroke: '#000'
    });
    t.selectable = t.hasControls = t.hasBorders = false;
    t.opacity = config.overallOpacity;
    return t;
  };

  var arrowCoords = function(src, dst, headSize) {
    var coords = [src.left, src.top, dst.left, dst.top]
    var fromR = src.radius; 
    var toR = dst.radius + headSize;
    var toR2 = dst.radius + 2*headSize;
    var phi = Math.atan2(coords[0] - coords[2], coords[1] - coords[3]);
    var dX = fromR * Math.sin(Math.PI + phi);
    var dY = fromR * Math.cos(Math.PI + phi);
    coords[0] += dX;
    coords[1] += dY;
    var theta = Math.atan2(coords[2] - coords[0], coords[3] - coords[1]);
    dX = toR * Math.sin(Math.PI + theta);
    dY = toR * Math.cos(Math.PI + theta);
    dX2 = toR2 * Math.sin(Math.PI + theta);
    dY2 = toR2 * Math.cos(Math.PI + theta);
    coords[4] = coords[2] + dX;
    coords[5] = coords[3] + dY;
    coords[2] += dX2;
    coords[3] += dY2;
    coords[6] = phi;
    return coords;
  };

  var makeArrow = function(src, dst) {
    coords = arrowCoords(src, dst, 10);
    lineCoords = coords.slice(0, 4);
    var l = new fabric.Line(lineCoords, {
      strokeWidth: 5,
      selectable: false
    });
    l.source = src;
    l.dest = dst;
    l.opacity = config.overallOpacity;
    var h = makeTriangle(coords[4], coords[5], 20, 20);
    l.clickable = h.clickable = 1;
    h.theta = 2*Math.PI - coords[6];
    h.line = l;
    l.id = h.id = "arrow";
    l.head = h;
    l.update = function() {
      newCoords = arrowCoords(l.source, l.dest, 10);
      if (newCoords[0] > newCoords[2]) {
        l.set('x1', newCoords[2]);
        l.set('y1', newCoords[3]);
        l.set('x2', newCoords[0]);
        l.set('y2', newCoords[1]);
      } else {
        l.set('x1', newCoords[0]);
        l.set('y1', newCoords[1]);
        l.set('x2', newCoords[2]);
        l.set('y2', newCoords[3]);
      }
      l.head.set('left', newCoords[4]);
      l.head.set('top', newCoords[5]);
      l.head.theta = 2*Math.PI - newCoords[6];
    }
    l.draw = function() { 
      canvas.insertAt(l, 0);
      canvas.insertAt(l.head, 0);
    };
    return l;
  };
          
  var makeControl = function(left, top, name, id, handler) {
    var control = {};
    control.button = makeRect(left, top, 60, 18);
    control.name = name;
    control.button.id = id;
    control.button.selectable = 0;
    control.button.clickable = 1;
    control.button.strokeWidth = 1;
    control.button.opacity = 0.5;
    control.label = new fabric.nativeText(control.name, {
      fontFamily: 'GentiumBookBasic',
      left: control.button.left,
      fontSize: 18,
      selectable: false,
      top: control.button.top
    });
    control.draw = function() {
      canvas.add(control.label);
      canvas.add(control.button);
    };
    control.highlight = function() {
      control.button.fill = "#00BBFF";
    }
    control.unhighlight = function() {
      control.button.fill = "#FFFFFF";
    }
    control.handler = handler;
    return control;
  };



  var addCircleControl = {};
  addCircleControl.button =  makeCircle(40, 40, [], [], 10);
  addCircleControl.button.id = "acc";
  addCircleControl.button.selectable = 0;
  addCircleControl.button.clickable = 1;
  addCircleControl.button.strokeWidth = 1;
  addCircleControl.handler = function(t) {
    if(t.id === "acc") {
      var tmpCircle = makeCircle(t.top, t.left, [], []);
      tmpCircle.draw();
      return;
    } 
  };

  addCircleControl.draw = function() {
    canvas.add(addCircleControl.button);
  };

  /* handlers */

  var selectControlHandler = function(t) {
    if(t.id === "selc") {
      if(selectingMode) {
        selectingMode = 0;
        selectControl.unhighlight();
      } else {
        selectingMode = 1;
        selectControl.highlight();
      }
    }
    if(selectingMode && t.id === "circle") {
      var objectsData = serializeDiagram();
      $.ajax({
        type: 'POST',
        url: '/transform/selectOne/'+t.uid+'/',
        data: {objectsData: objectsData}
        })
        .fail(function(e) {
            console.log(e);
        })
        .done(function(d) {
          selectControl.unhighlight();
          loadFromJSON(d);
        });
      selectingMode = 0;
    }
    return;
  };



  var linkControlHandler = function(t) {
    if(t.id === "lcc") {
      if(linkingMode) {
        linkingMode = 0;    
        linkControl.unhighlight();
      } else {
        linkingMode = 1;
        linkControl.highlight();
      }
      return;
    };

    if(t.id === "circle") {
      if(linkingMode === 1) {
        linkSource = t;
        t.highlight();
        linkingMode = 2;
        return;
      } 
      if(linkingMode === 2) {
        linkDest = t;
        linkSource.unhighlight();
        var tmpArrow = makeArrow(linkSource, linkDest);
        linkSource.fromLines.push(tmpArrow);
        linkDest.toLines.push(tmpArrow);
        tmpArrow.draw();
        linkingMode = 0;
        linkControl.unhighlight();
        return;
      }
    }
  };

  var deleteArrow = function(t) {
    if(t.line) {
      t = t.line;
    }
    if(t.source) {
      t.source.rmArrow(t);
    }
    if(t.dest) {
      t.dest.rmArrow(t);
    }
    if(t.head) {
      canvas.remove(t.head);
    }
    canvas.remove(t);
  };


  var deleteControlHandler = function(t) {
    if(t.id === "rcc") {
      if(deletingMode) {
        deletingMode = 0;
        deleteControl.unhighlight();
      } else {
        deletingMode = 1;
        deleteControl.highlight();
      }
      return;
    }
    if(t.id != "arrow" && t.id != "circle"){
      return;
    }
    if(deletingMode) {
      if(t.id === "arrow") {
        deleteArrow(t);
      }
      if(t.id === "circle") {
        if(t.toLines != []) {
          var deadLines = [];
          for(var i = 0; i < t.toLines.length; i++) {
            canvas.remove(t.toLines[i].head);
            canvas.remove(t.toLines[i]);
            deadLines.push(t.toLines[i]);
          }
          for(var i = 0; i < deadLines.length; i++) {
            deadLines[i].source.rmArrow(deadLines[i]);
            t.rmArrow(deadLines[i]);
          }
        }
        if(t.fromLines != []) {
          var deadLines  = [];
          for(var i = 0; i < t.fromLines.length; i++) {
            canvas.remove(t.fromLines[i].head);
            canvas.remove(t.fromLines[i]);
            deadLines.push(t.fromLines[i]);
          }
          for(var i = 0; i < deadLines.length; i++) {
            deadLines[i].dest.rmArrow(deadLines[i]);
            t.rmArrow(deadLines[i]);
          }
        }
        if(t.label) {
          canvas.remove(t.label);
        }
      }
      canvas.remove(t);
      deleteControl.unhighlight();
      deletingMode = 0;
      return;
    }
  };

  var serializeDiagram = function() {
    var os = canvas._objects;
    var mos = [];
    for(var i = 0; i < os.length; i++){
      if(os[i].id && os[i].id === "circle") {
        var tmpC = {}
        tmpC.name = os[i].name;
        tmpC.type = os[i].normalColour;
        tmpC.size = os[i].radius;
        tmpC.uid = os[i].uid;
        tmpC.pos = [os[i].left, os[i].top];
        tmpC.fontSize = os[i].label.fontSize;
        tmpC.tos = [];
        for(var j = 0; j < os[i].toLines.length; j++) {
          var to = os[i].toLines[j].source.uid;
          tmpC.tos.push(to);
        }
        tmpC.froms = [];
        for(var j = 0; j < os[i].fromLines.length; j++) {
          var from = os[i].fromLines[j].dest.uid;
          tmpC.froms.push(from);
        }
        mos.push(tmpC);
      }
    }
    return JSON.stringify(mos);
  };



  var saveControlHandler = function(t) {
    if(t.id === 'sc') {
      saveControl.highlight();
      var objectsData = serializeDiagram();
      var fileName = $("#new-file-name").val();
      if(fileName === "") {
        fileName = "default";
      } else {
        fileName = fileName.replace(/[^a-zA-z 0-9-]/g, '');
      }

      $.ajax({
        type: 'POST',
        url: 'store/'+fileName+'/', 
        data: {objectsData: objectsData}
      })
      .fail(function(e) {
        console.log(e);
      })
      .done(function(e) {
        saveControl.unhighlight();
        canvas.renderAll();
      });
    }
  };


  var loadDiagram = function(newObjects){
    canvas.clear();
    drawCanvasControls();
    for(var i = 0; i < newObjects.length; i++) {
      var tmpC = makeCircle(newObjects[i].pos[0], newObjects[i].pos[1], [], []);
      tmpC.changeLabel(newObjects[i].name);
      tmpC.uid = newObjects[i].uid;
      tmpC.radius = newObjects[i].size;
      tmpC.changeColour(newObjects[i].type);
      tmpC.label.fontSize = newObjects[i].fontSize;
      tmpC.draw();
    }
    var findObjByUid = function(uid) {
      for(var i = 0; i < canvas._objects.length; i++) {
        if(canvas._objects[i].uid && canvas._objects[i].uid === uid) {
          return canvas._objects[i];
        }
      }
      return false;
    }
    for(var i = 0; i < newObjects.length; i++) {
      for(var j = 0; j < newObjects[i].tos.length; j ++) {
        var dst = findObjByUid(newObjects[i].uid);
        var src = findObjByUid(newObjects[i].tos[j]);
        if(!(src && dst)){
          console.log("Error loading diagram: bad link %d -> %d.", newObjects[i].uid, newObjects[i].tos[j]);
          return;
        }
        var tmpArrow = makeArrow(src, dst);
        src.fromLines.push(tmpArrow);
        dst.toLines.push(tmpArrow);
        tmpArrow.draw();
      }
    }
  };

  var loadFromJSON = function(data) {
    if(!data || data === 'undefined') {
      return false;
    }
    var objects = $.parseJSON(data);
    loadDiagram(objects);
  };

  var loadHandler = function(fileName) {
      if(!fileName || fileName === "") {
        return;
      }
      $.ajax({
        type: 'GET',
        url: 'retrieve/'+fileName+'/'}).done(loadFromJSON);
  };

  var detailHandler = function(t) {
    if(t.id === 'cdc') {
      if(detailMode) {
        detailMode = 0;
        detailControl.unhighlight();
      } else {
        detailMode = 1;
        detailControl.highlight();
      }
      return;
    }
    if(!detailMode || t.id != 'circle') {
      return;
    }
    t.highlight();
    var applyForm = function() {
      t.changeLabel($("#circle-name").val());
      t.radius = Math.floor($("#circle-radius").val());
      t.height = t.width = 2 * t.radius;
      t.changeColour($('#circle-colour').val());
      t.label.fontSize = $('#text-size').val();
      t.update();
      console.log(t);
      canvas.renderAll();
    }
    var closeDialog = function() {
      $('#details').remove(); 
      $dialog.dialog('destroy'); 
      t.unhighlight(); 
      canvas.renderAll();
    }
    var colours = ['CF4D3F', 'FF9900', 'FCFC06', '92CC47', '092E20', '00A3E6', '1A2A59', '662678', 'FFFFFF', '000000'];
    var colourTable = '<table><tr>';
    for(var i = 0; i < colours.length; i++) {
      colourTable += '<td id="colour-'+colours[i]+'" class="colour-clicker"> </td>';
    }
    colourTable += '</tr></table>';
    var $dialog = $("<div id='details-dialog'></div>")
      .html("<div id='details'><form id='details-form'>Name: <input id='circle-name' type='text' value='"+t.name+"'><br />" +
        "Size: <input id='circle-radius' type='text' value='"+t.radius+"'> <br />" +
        "Text size: <input id='text-size' type='text' value='"+t.label.fontSize+"'> <br />" +
        "Colour: <input id='circle-colour' type='hidden' value='"+t.normalColour+"'> " +
        "</form>"+colourTable+"</div>" )
      .dialog({autoOpen: false, title: 'Circle details', modal: true,
        minHeight: 50, 
        position: [t.left - 2, t.top ],
        buttons: [
          {
            text: 'Apply',
            click: function() {
              applyForm();
              return false;
            }
          },
          {
            text: 'Done',
            click: function() {
              applyForm();
              closeDialog();
              return true;
            }
          }],
        open: function() {$('#circle-name').focus();},
        close: closeDialog
      });
    detailControl.unhighlight();
    $('.colour-clicker').click(function() {
      var colour = $(this).attr('id').replace(/^colour-/, '#');
      $('#circle-colour').val(colour);
      canvas.renderAll();
    });
    $('.colour-clicker').each(function() {
      var colour = $(this).attr('id').replace(/^colour-/, '#');
      $(this).css('background-color', colour).
        css('height', "1em");
    });
    $('#details').keyup(function(e) {
      if (e.keyCode == $.ui.keyCode.ENTER){
        $('.ui-dialog').find('button:first').trigger('click');
      }
    });
    $dialog.dialog('open');
    detailMode = 0;
  };

  /* controls */

  var detailControl = makeControl(215, 40, "Details", "cdc", detailHandler);
  var saveControl = makeControl(290, 40, "Save", "sc", saveControlHandler);
  var deleteControl = makeControl(150, 40, "Delete", "rcc", deleteControlHandler);
  var linkControl = makeControl(85, 40, "Link", "lcc",  linkControlHandler);
  var selectControl = makeControl(370, 40, "Select", "selc", selectControlHandler); 

  /* main */ 

  canvasControls = [ selectControl, deleteControl, saveControl, linkControl, detailControl, addCircleControl];

  var canvas = new fabric.Canvas('c', { selection: false });

  var drawCanvasControls = function() {
    for(var i = 0; i < canvasControls.length; i++) {
      canvasControls[i].draw();
    }
  };

  drawCanvasControls();

  var mousedowns = [];
  for(var i = 0; i < canvasControls.length; i ++) {
    mousedowns.push(canvasControls[i].handler);
  }

  var mousedownDispatcher = function(e) {
    var t = e.memo.target;
    console.log(t);
    for(var i = 0; i < canvasControls.length; i++) {
      if(canvasControls[i].button == t) {
        console.log("-->"+t.id);
      }
    }
    if(t) {
      for(var i = 0; i < mousedowns.length; i++) {
        mousedowns[i](t);
      }
    }
    canvas.renderAll();
  };

  canvas.observe('mouse:down', mousedownDispatcher);

  canvas.observe('object:moving', function(e) {
    if(e.memo.target && e.memo.target.id === "circle") {
      var p = e.memo.target;
      p.update();
      canvas.renderAll();
    }
  });

  $('#load-control-fn').change(function() {
    var str = $('select#load-control-fn option:selected').val();
    str = str.replace(/[^a-zA-z 0-9-]/g, '');
    loadHandler(str);
    $('#new-file-name').val(str);
  });

  csrfToken = $("input#csrf-token").val()
  $("body").bind("ajaxSend", function(elm, xhr, s){
    if (s.type == "POST") {
      xhr.setRequestHeader('X-CSRF-Token', csrfToken);
    }
  });

  $('button#load').click(function() { $('#load-control-fn').change(); } );

})();
