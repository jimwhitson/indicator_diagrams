var linking_mode = 0;
var deleting_mode = 0;
var detail_mode = 0;
var link_source = 0;
var link_dest = 0;
var overall_opacity = 0.7;

function makeLabel(text, left, top) {
  var l = new fabric.nativeText(text, {
        fontFamily: 'GentiumBookBasic',
        left: left,
        fontSize: 24,
        selectable: false,
        top: top});
  l.id = "label";
  return l;
}

function makeCircle(left, top, to_lines, from_lines, radius) {
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
  c.to_lines = to_lines;
  c.from_lines = from_lines;  
  c.opacity = overall_opacity;
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
  c.rm_arrow = function (arrow) {
    var tmp_to_lines = this.to_lines.slice(0);
    for(var i = 0; i < tmp_to_lines.length; i++) {
        if(tmp_to_lines[i] === arrow) {
          tmp_to_lines.splice(i, 1);
        }
    }
    this.to_lines = tmp_to_lines;

    var tmp_from_lines = this.from_lines.slice(0);
    for(var i = 0; i < tmp_from_lines.length; i++) {
        if(tmp_from_lines[i] === arrow) {
          tmp_from_lines.splice(i, 1);
        }
    }
    this.from_lines = tmp_from_lines;
  };
  c.change_label = function(name) {
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
    for(i = 0; i < this.from_lines.length; i++) {
      this.from_lines[i].update();
    }
    for(i = 0; i < this.to_lines.length; i++) {
      this.to_lines[i].update();
    }
  }
  return c;
}
function makeRect(left, top, width, height) {
  var r = new fabric.Rect({
    left: left,
    top: top,
    strokeWidth: 5,
    width: width,
    height: height,
    fill: '#fff',
    stroke: '#000'
  });
  r.opacity = overall_opacity;
  r.hasControls = r.hasBorders = false;
  return r;
}
function makeTriangle(left, top, width, height) {
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
  t.opacity = overall_opacity;
  return t;
}


function arrow_coords(link_source, link_dest, head_size) {
    var coords = [link_source.left, link_source.top, link_dest.left, link_dest.top]
    var from_r = link_source.radius; 
    var to_r = link_dest.radius + head_size;
    var to_r2 = link_dest.radius + 2*head_size;
    var phi = Math.atan2(coords[0] - coords[2], coords[1] - coords[3]);
    var d_x = from_r * Math.sin(Math.PI + phi);
    var d_y = from_r * Math.cos(Math.PI + phi);
    coords[0] += d_x;
    coords[1] += d_y;
    var theta = Math.atan2(coords[2] - coords[0], coords[3] - coords[1]);
    d_x = to_r * Math.sin(Math.PI + theta);
    d_y = to_r * Math.cos(Math.PI + theta);
    d_x2 = to_r2 * Math.sin(Math.PI + theta);
    d_y2 = to_r2 * Math.cos(Math.PI + theta);
    coords[4] = coords[2] + d_x;
    coords[5] = coords[3] + d_y;
    coords[2] += d_x2;
    coords[3] += d_y2;
    coords[6] = phi;
    return coords;
}

function makeArrow(link_source, link_dest) {
    coords = arrow_coords(link_source, link_dest, 10);
    line_coords = coords.slice(0, 4);
    var l = new fabric.Line(line_coords, {
        strokeWidth: 5,
        selectable: false
    });
    l.source = link_source;
    l.dest = link_dest;
    l.opacity = overall_opacity;
    var h = makeTriangle(coords[4], coords[5], 20, 20);
    l.clickable = h.clickable = 1;
    h.theta = 2*Math.PI - coords[6];
    h.line = l;
    l.id = h.id = "arrow";
    l.head = h;
    l.update = function() {
        new_coords = arrow_coords(l.source, l.dest, 10);
        if (new_coords[0] > new_coords[2]) {
          l.set('x1', new_coords[2]);
          l.set('y1', new_coords[3]);
          l.set('x2', new_coords[0]);
          l.set('y2', new_coords[1]);
        } else {
          l.set('x1', new_coords[0]);
          l.set('y1', new_coords[1]);
          l.set('x2', new_coords[2]);
          l.set('y2', new_coords[3]);
        }
        l.head.set('left', new_coords[4]);
        l.head.set('top', new_coords[5]);
        l.head.theta = 2*Math.PI - new_coords[6];
    }
    l.draw = function() { 
        canvas.insertAt(l, 0);
        canvas.insertAt(l.head, 0);
    };
    return l;
}
        

var canvas = new fabric.Canvas('c', { selection: false });

  var add_circle_control = makeCircle(40, 40, [], [], 10);
  add_circle_control.id = "acc";
  add_circle_control.selectable = 0;
  add_circle_control.clickable = 1;
  add_circle_control.strokeWidth = 1;
  var link_circle_control = makeRect(85, 40, 60, 18);
  link_circle_control.strokeWidth = 1;
  link_circle_control.id = "lcc";
  link_circle_control.selectable = 0;
  link_circle_control.clickable = 1;
  link_circle_control.opacity = 0.5;

  var rm_circle_control = makeRect(150, 40, 60, 18);
  rm_circle_control.strokeWidth = 1;
  rm_circle_control.id = "rcc";
  rm_circle_control.selectable = 0;
  rm_circle_control.clickable = 1;
  rm_circle_control.opacity = 0.5;

  var circle_detail_control = makeRect(215, 40, 60, 18);
  circle_detail_control.strokeWidth = 1;
  circle_detail_control.id = 'cdc';
  circle_detail_control.clickable = 1;
  circle_detail_control.selectable = 0;
  circle_detail_control.opacity = 0.5;

  var save_control = makeRect(290, 40, 60, 18);
  save_control.strokeWidth = 1;
  save_control.id = 'sc';
  save_control.clickable = 1;
  save_control.selectable = 0;
  save_control.opacity = 0.5;

function draw_canvas_controls() {
  canvas.add(
    add_circle_control,
    new fabric.nativeText('Link', {
          fontFamily: 'GentiumBookBasic',
          left: link_circle_control.left,
          fontSize: 18,
          selectable: false,
          top: link_circle_control.top}),
    link_circle_control,
    new fabric.nativeText('Delete', {
          fontFamily: 'GentiumBookBasic',
          left: rm_circle_control.left,
          fontSize: 18,
          selectable: false,
          top: rm_circle_control.top}),
    rm_circle_control,
    new fabric.nativeText('Detail', {
          fontFamily: 'GentiumBookBasic',
          left: circle_detail_control.left,
          fontSize: 18,
          selectable: false,
          top: circle_detail_control.top}),
    circle_detail_control,
    new fabric.nativeText('Save', {
          fontFamily: 'GentiumBookBasic',
          left: save_control.left,
          fontSize: 18,
          selectable: false,
          top: save_control.top}),
    save_control

  );
}

draw_canvas_controls();
var acc_handler = function(t) {
  if(t.id === "acc") {
    var tmp_circle = makeCircle(t.top, t.left, [], []);
    tmp_circle.draw();
    return;
  } 
};
var lcc_handler = function(t) {
  if(t.id === "lcc") {
    if(linking_mode) {
      linking_mode = 0;    
      link_circle_control.stroke = '#000000';
      link_circle_control.fill = '#ffffff';
    } else {
      linking_mode = 1;
      t.stroke = '#00BBFF';
      t.fill = '#00BBFF';
    }
    return;
  } 
};
var rcc_handler = function(t) {
  if(t.id === "rcc") {
    if(deleting_mode) {
      deleting_mode = 0;
      t.stroke = '#000000';
      t.fill = '#FFFFFF';
    } else {
      deleting_mode = 1;
      t.stroke = '#00BBFF';
      t.fill = '#00BBFF';
    }
    return;
  }
};
var linking_handler = function(t) {
  if(t.id === "circle") {
    if(linking_mode === 1) {
      link_source = t;
      t.highlight();
      linking_mode = 2;
      return;
    } 
    if(linking_mode === 2) {
      link_dest = t;
      link_source.unhighlight();
      var tmp_arrow = makeArrow(link_source, link_dest);
      link_source.from_lines.push(tmp_arrow);
      link_dest.to_lines.push(tmp_arrow);
      tmp_arrow.draw();
      linking_mode = 0;
      link_circle_control.stroke = '#000000';
      link_circle_control.fill = '#ffffff';
      return;
    }
  }
};
var save_handler = function(t) {
  if(t.id === 'sc') {
    save_control.fill = "#00BBFF";
    save_control.stroke = "#00BBFF";
    var os = canvas._objects;
    var mos = [];
    for(var i = 0; i < os.length; i++){
      if(os[i].id && os[i].id === "circle") {
        var tmp_c = {}
        tmp_c.name = os[i].name;
        tmp_c.type = os[i].normalColour;
        tmp_c.size = os[i].radius;
        tmp_c.uid = os[i].uid;
        tmp_c.pos = [os[i].left, os[i].top];
        tmp_c.fontSize = os[i].label.fontSize;
        tmp_c.tos = [];
        for(var j = 0; j < os[i].to_lines.length; j++) {
          var to = os[i].to_lines[j].source.uid;
          tmp_c.tos.push(to);
        }
        tmp_c.froms = [];
        for(var j = 0; j < os[i].from_lines.length; j++) {
          var from = os[i].from_lines[j].dest.uid;
          tmp_c.froms.push(from);
        }
          
        mos.push(tmp_c);
      }
    }

    var objects_data = JSON.stringify(mos);

    $.ajax({
      type: 'POST',
      url: 'store/test/', 
      data: {objects_data: objects_data}
      })
      .fail(function(e) {
          console.log(e);
      })
      .done(function(e) {
          save_control.fill = '#ffffff';
          save_control.stroke = '#000000';
          canvas.renderAll();
          console.log(e);
      });

  }
};

var load_handler = function(id) {
    $.ajax({
      type: 'GET',
      url: 'retrieve/'+id}).done(function(data){

        var new_objects = $.parseJSON(data);
        canvas.clear();
        draw_canvas_controls();
        for(var i = 0; i < new_objects.length; i++) {
          var tmp_c = makeCircle(new_objects[i].pos[0], new_objects[i].pos[1], [], []);
          tmp_c.change_label(new_objects[i].name);
          tmp_c.uid = new_objects[i].uid;
          tmp_c.radius = new_objects[i].size;
          tmp_c.changeColour(new_objects[i].type);
          tmp_c.label.fontSize = new_objects[i].fontSize;
          tmp_c.draw();
        }
        function find_obj_by_uid(uid) {
          for(var i = 0; i < canvas._objects.length; i++) {
            if(canvas._objects[i].uid && canvas._objects[i].uid === uid) {
              return canvas._objects[i];
            }
          }
          return false;
        }
        for(var i = 0; i < new_objects.length; i++) {
          for(var j = 0; j < new_objects[i].tos.length; j ++) {
            var dst = find_obj_by_uid(new_objects[i].uid);
            var src = find_obj_by_uid(new_objects[i].tos[j]);
            if(!(src && dst)){
              console.log("Error loading diagram: bad link %d -> %d.", new_objects[i].uid, new_objects[i].tos[j]);
              return;
            }
            var tmp_arrow = makeArrow(src, dst);
            src.from_lines.push(tmp_arrow);
            dst.to_lines.push(tmp_arrow);
            tmp_arrow.draw();
          }
        }
    });
};

var detail_handler = function(t) {
  if(t.id === 'cdc') {
    if(detail_mode) {
      detail_mode = 0;
      t.stroke = '#000000';
      t.fill = '#FFFFFF';
    } else {
      detail_mode = 1;
      t.stroke = '#00BBFF';
      t.fill = '#00BBFF';
    }
    return;
  }
  if(!detail_mode) {
    return;
  }
  if(t.id != 'circle') {
    return;
  }
  t.highlight();
  var $dialog = $("<div id='details_dialog'></div>")
    .html("<div id='details'><form id='details_form'>Name: <input id='circle_name' type='text' value='"+t.name+"'><br />" +
        "Size: <input id='circle_radius' type='text' value='"+t.radius+"'> <br />" +
        "Text size: <input id='text_size' type='text' value='"+t.label.fontSize+"'> <br />" +
        "Colour: <input id='circle_colour' type='hidden' value='"+t.normalColour+"'> " +
        "</form><table><tr>" +
        "<td id='CF4D3F' class='colour_clicker'> </td><td id='FF9900' class='colour_clicker'> </td>" +
        "<td id='FCFC06' class='colour_clicker'> </td><td id='92CC47' class='colour_clicker'> </td>" +
        "<td id='092E20' class='colour_clicker'> </td><td id='00A3E6' class='colour_clicker'> </td>" +
        "<td id='1A2A59' class='colour_clicker'> </td><td id='662678' class='colour_clicker'> </td>" +
        "<td id='FFFFFF' class='colour_clicker'> </td><td id='000000' class='colour_clicker'> </td>" +
        "</tr></table></div>" )
    .dialog({autoOpen: false, title: 'Circle details', modal: true,
        minHeight: 50, 
        position: [t.left - 2, t.top ],
        buttons: [
          {
            text: 'Apply',
            click: function() {
              t.change_label($("#circle_name").val());
              t.radius = Math.floor($("#circle_radius").val());
              t.height = t.width = 2 * t.radius;
              t.changeColour($('#circle_colour').val());
              t.label.fontSize = $('#text_size').val();
              t.update();
              canvas.renderAll();
              return false;
            }
          },
          {
            text: 'Done',
            click: function() {
              t.unhighlight();
              t.change_label($("#circle_name").val());
              t.radius = Math.floor($("#circle_radius").val());
              t.height = t.width = 2 * t.radius;
              t.changeColour($('#circle_colour').val());
              t.update();
              $('#details').remove();
              $dialog.dialog('close');
              canvas.renderAll();
            }
          }],
        open: function() {$('#circle_name').focus();},
        close: function() {$('#details').remove(); $dialog.dialog('destroy'); t.unhighlight(); canvas.renderAll()}});
  circle_detail_control.stroke = '#000000';
  circle_detail_control.fill = '#FFFFFF';
  $('.colour_clicker').click(function() {
    $('#circle_colour').val('#'+(this.id));
    canvas.renderAll();
  });
  $('.colour_clicker').each(function() {
    $('#'+this.id).css('background-color', "#"+this.id);
    $('#'+this.id).css('height', "1em");
  });
  $('#details').keyup(function(e) {
      if (e.keyCode == $.ui.keyCode.ENTER){
        $('.ui-dialog').find('button:first').trigger('click');
      }
    });
  $dialog.dialog('open');
  detail_mode = 0;
}
var deleting_handler = function(t) {
  if(t.id != "arrow" && t.id != "circle"){
    return;
  }
  if(deleting_mode) {
      if(t.id === "arrow") {
        if(t.line) {
          t = t.line;
        }
        if(t.source) {
          t.source.rm_arrow(t);
        }
        if(t.dest) {
          t.dest.rm_arrow(t);
        }
        if(t.head) {
          canvas.remove(t.head);
        }
        canvas.remove(t);
      }
      if(t.id === "circle") {
        if(t.to_lines != []) {
          var dead_lines = [];
          for(var i = 0; i < t.to_lines.length; i++) {
            canvas.remove(t.to_lines[i].head);
            canvas.remove(t.to_lines[i]);
            dead_lines.push(t.to_lines[i]);
          }
          for(var i = 0; i < dead_lines.length; i++) {
            dead_lines[i].source.rm_arrow(dead_lines[i]);
            t.rm_arrow(dead_lines[i]);
          }
        }
        if(t.from_lines != []) {
          var dead_lines  = [];
          for(var i = 0; i < t.from_lines.length; i++) {
            canvas.remove(t.from_lines[i].head);
            canvas.remove(t.from_lines[i]);
            dead_lines.push(t.from_lines[i]);
          }
          for(var i = 0; i < dead_lines.length; i++) {
            dead_lines[i].dest.rm_arrow(dead_lines[i]);
            t.rm_arrow(dead_lines[i]);
          }
        }
        if(t.label) {
          canvas.remove(t.label);
        }
      }
      canvas.remove(t);
      rm_circle_control.stroke = '#000000';
      rm_circle_control.fill = '#ffffff';
      deleting_mode = 0;
      return;
  }
};

var mousedowns = [acc_handler, lcc_handler, rcc_handler, linking_handler, deleting_handler, detail_handler, save_handler];
var mousedown_dispatcher = function(e) {
  var t = e.memo.target;
  console.log(t);
  if(t) {
    for(var i = 0; i < mousedowns.length; i++) {
      mousedowns[i](t);
    }
  }
  canvas.renderAll();
};
canvas.observe('mouse:down', mousedown_dispatcher);

canvas.observe('object:moving', function(e) {
  if(e.memo.target && e.memo.target.id === "circle") {
    var p = e.memo.target;
    p.update();
    canvas.renderAll();
  }
});

$('.load_control').click(function() {
  load_handler(this.id);
});
