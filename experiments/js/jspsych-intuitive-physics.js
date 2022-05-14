/*
 * custom plugin for intuitive physics
 */

jsPsych.plugins["intuitive-physics"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "intuitive-physics",
    parameters: {
      scene: {type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: ""
      },
      criticalTrial: {type: jsPsych.plugins.parameterType.BOOL,
        default: false
      },
      scene_shuffle: {type: jsPsych.plugins.parameterType.STRING,
        default: ""
      },
      held_out: {type: jsPsych.plugins.parameterType.STRING,
        default: ""
      },
      prompt: {type: jsPsych.plugins.parameterType.STRING,
        default: ""
      },
      gravity: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: {x: 0, y: -50}
      },
      wind: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: {x: -150, y: 0}
      },
      // axial_F: {
      //   type: jsPsych.plugins.parameterType.FLOAT,
      //   default: 100
      // },
      // radial_A: {
      //   type: jsPsych.plugins.parameterType.FLOAT,
      //   default: 0
      // },
      rho: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 1*Math.PI/2
      },
      paddle_rho_original: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 1*Math.PI/2
      },
      force: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 70.0
      },
      theta: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0//-Math.PI/20
      },
      rho_original: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0
      },
      paddle_rho: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0
      },
      paddle_sigma: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0
      },
      paddle_noise: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0
      },
      ball: {
        type: jsPsych.plugins.parameterType.INT,
        default: 0
      },
      ball_corr: {
        type: jsPsych.plugins.parameterType.INT,
        default: [1, 2, 3]
      },
      enableDebugDraw: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: false
      },
      scale: {
        type: jsPsych.plugins.parameterType.INT,
        default: 30
      },
      fps: {
        type: jsPsych.plugins.parameterType.INT,
        default: 60
      },
      // ratios for scaling physics
      center_x_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0.5
      },
      center_y_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0.5
      },
      radius_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0.45
      },
      ball_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 30/711
      },
      paddle_height_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 40/711
      },
      paddle_width_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 2.5/711
      },
      force_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 1/711
      },
      wind_ratio: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0.45
      },
      //
      canvas_size: {
        type: jsPsych.plugins.parameterType.INT,
        array: true,
        default: [800, 1000]
      },
      image_cue: {
        type: jsPsych.plugins.parameterType.STRING,
        default: true//'wind_cue.png'
      },
      image_x: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0
      },
      image_y: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 0
      },
      image_width: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 800
      },
      image_height: {
        type: jsPsych.plugins.parameterType.FLOAT,
        default: 600
      },
      trialInd: {
        type: jsPsych.plugins.parameterType.INT,
        default: 0
      },
      totalTrials: {
          type: jsPsych.plugins.parameterType.INT,
          default: 100
      },
      curr_correct_trials: {
          type: jsPsych.plugins.parameterType.FLOAT,
          default: 0
      }
    }
  }

  plugin.trial = function(display_element, trial) {
    var new_html = '<div class="jspsych-prompt">' + trial.prompt + '</div>';
    new_html += '<div id="jspsych-intuitive-physics">' + '<canvas id="b2dCanvas"></canvas>' + '</div>';
    if (trial.image_cue){
      new_html += '<div style="display:none;"><img id="wind_cue" src="' + 'image/' + trial.scene + '_image.jpg"></div>';
    }
    display_element.innerHTML = new_html;
    // console.log(trial.criticalTrial);

    // Global classnames from Box2d namespace
    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    var b2Mat22 = Box2D.Common.Math.b2Mat22;
    var b2BodyDef = Box2D.Dynamics.b2BodyDef;
    var b2Body = Box2D.Dynamics.b2Body;
    var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    var b2World = Box2D.Dynamics.b2World;
    var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
    var b2ConstantForceController = Box2D.Dynamics.Controllers.b2ConstantForceController;
    var b2Math = Box2D.Common.Math.b2Math;
    var b2ContactListener = Box2D.Dynamics.b2ContactListener;

    var world;
    var gravity = new b2Vec2(0, 0);

    var key_down = false;
    var block_mouse = false;
    var on_bound = false;
    if (trial.image_cue){
      var img = document.getElementById("wind_cue");
    }
    var block_listener = false;
    var canvas = document.getElementById("b2dCanvas");
    canvas.width = window.innerWidth*0.85;
    canvas.height = window.innerHeight*0.85;
    var ctx = canvas.getContext('2d');

    var ball_img = new Image();
    ball_img.src = 'image/example_' + trial.ball_corr[trial.ball-1] + '.png';

    // get internal dimensions of the canvas
    const canvas_width = canvas.width;
    const canvas_height = canvas.height;
    var mouseAngle = trial.paddle_rho;
    var gtAngle;
    var trajectory = [];
    var mouse_tr = [];
    var movePaddleTime = [];
    var startTime, pressSpaceTime, endTime, finishAnimationTime;
    var last_ball_center = trial.radius_ratio*canvas_height;
    var onBonund_count = 0;
    var showArrow = true;
    var trustAgent = true;

    var paddle;
    var shadow = null;
    var ball;
    var mass;
    var arrow_color;
    const ball_options = [{ball_color: "purple", ball_density: 1.3912797011035622}, {ball_color: "blue", ball_density: 2}, {ball_color: "green", ball_density: 3.5}];
    const ball_info = ball_options[trial.ball-1];

    var ConstantForceController = new b2ConstantForceController();
    // var ConstantAxialForceController = new b2ConstantAxialForceController();
    // var ConstantRadialAccelController = new b2ConstantRadialAccelController();

    const force = {x: trial.force*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio)*Math.cos(trial.rho+trial.theta), y: trial.force*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio)*Math.sin(trial.rho+trial.theta)};
    const start_position = {x: canvas_width*trial.center_x_ratio+trial.radius_ratio*canvas_height * Math.cos(trial.rho), y: canvas_height*trial.center_y_ratio+trial.radius_ratio*canvas_height * Math.sin(trial.rho)};

    // lococation of the ball
    var vector;
    var last_vector = start_position;

    // box2d to canvas scale , therefor 1 metre of box2d = 100px of canvas :)
    const timeStep = 1/trial.fps;
    const arrow_headlen = 5;

    // Draw a world, this method is called in a loop to redraw the world
    var draw_canvas = function (myshaddow) {
        // first clear the canvas
        ctx.clearRect(0, 0, canvas_width, canvas_height);

        if (trial.image_cue){
          // ctx.drawImage(img, trial.image_x, trial.image_y, trial.image_width, trial.image_height);canvas_width
          ctx.drawImage(img, trial.image_x, trial.image_y, canvas_width, canvas_height);
        }

        //set the fill color of the overlay
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.rect(canvas_width/2-trial.radius_ratio*canvas_height*1.1, 0, trial.radius_ratio*canvas_height*2.2, canvas_height);
        ctx.fill();

        // draw the progress
        var idx = trial.trialInd+1;
        ctx.font = "30px Quicksand";
        ctx.fillStyle = "#000000";
        ctx.fillText("Trial "+idx+" of "+trial.totalTrials, 0.1*canvas_width, 0.95*canvas_height);

        // add agent thinking (erikb)
        animate_agent();

        // convert the canvas coordinate directions to cartesian
        ctx.save();
        ctx.translate(0 , canvas_height);
        ctx.scale(1 , -1);

        // draw the bondary of the room
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(canvas_width*trial.center_x_ratio, canvas_height*trial.center_y_ratio, trial.radius_ratio*canvas_height, 0, Math.PI*2);
        ctx.closePath();
        ctx.stroke();

        if (showArrow){
          if (trial.force == 60.0){
            arrow_color = "#ffad33";
          } else {
            arrow_color = "#ff0000";
          }
          fromx = start_position.x;
          fromy = start_position.y;
          tox = start_position.x-3*force.x/((canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio));
          toy = start_position.y-3*force.y/((canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio));
          // This makes it so the end of the arrow head is located at tox, toy, don't ask where 1.15 comes from
          let angle = Math.atan2(toy-fromy,tox-fromx);
          tox -= Math.cos(angle) * ((trial.force*(canvas_height*trial.force_ratio)/5));
          toy -= Math.sin(angle) * ((trial.force*(canvas_height*trial.force_ratio)/5));

          //starting path of the arrow from the start square to the end square and drawing the stroke
          ctx.beginPath();
          ctx.moveTo(fromx, fromy);
          ctx.lineTo(tox, toy);
          ctx.strokeStyle = arrow_color;
          ctx.lineWidth = trial.force*(canvas_height*trial.force_ratio)/5;
          ctx.stroke();

          //starting a new path from the head of the arrow to one of the sides of the point
          ctx.beginPath();
          ctx.moveTo(tox, toy);
          ctx.lineTo(tox-arrow_headlen*Math.cos(angle-Math.PI/7),toy-arrow_headlen*Math.sin(angle-Math.PI/7));

          //path from the side point of the arrow, to the other side point
          ctx.lineTo(tox-arrow_headlen*Math.cos(angle+Math.PI/7),toy-arrow_headlen*Math.sin(angle+Math.PI/7));

          //path from the side point back to the tip of the arrow, and then again to the opposite side point
          ctx.lineTo(tox, toy);
          ctx.lineTo(tox-arrow_headlen*Math.cos(angle-Math.PI/7),toy-arrow_headlen*Math.sin(angle-Math.PI/7));

          //draws the paths created above
          ctx.strokeStyle = arrow_color;
          ctx.lineWidth = trial.force*(canvas_height*trial.force_ratio)/5;
          ctx.stroke();
          ctx.fillStyle = arrow_color;
          ctx.fill();
        }

        // draw the physical world
        if (trial.enableDebugDraw){
            world.DrawDebugData();
        } else {
            draw_shaddow(myshaddow);
            draw_world();
        }
        ctx.restore();
    };

    var draw_shaddow = function (shadow) {
      if (shadow) {
        var position = new b2Vec2(shadow.position.x, shadow.position.y);
        var options = shadow.options;
        ctx.fillStyle = options.color;

        let col1 = new b2Vec2(shadow.m_xf.col1.x, shadow.m_xf.col1.y);
        let col2 = new b2Vec2(shadow.m_xf.col2.x, shadow.m_xf.col2.y);
        var vert = [new b2Vec2(shadow.ver[0].x, shadow.ver[0].y), new b2Vec2(shadow.ver[1].x, shadow.ver[1].y), new b2Vec2(shadow.ver[2].x, shadow.ver[2].y), new b2Vec2(shadow.ver[3].x, shadow.ver[3].y)];
        var m_xf = new b2Mat22();
        m_xf.col1 = col1;
        m_xf.col2 = col2;
        b2Math.MulMV(m_xf,vert[0]);
        var tV = b2Math.AddVV(position, b2Math.MulMV(m_xf, vert[0]));
        ctx.beginPath();
        ctx.moveTo(tV.x*trial.scale, tV.y*trial.scale);
        for (var i = 0; i < vert.length; i++) {
            var v = b2Math.AddVV(position, b2Math.MulMV(m_xf, vert[i]));
            ctx.lineTo(v.x*trial.scale, v.y*trial.scale);
        }
        ctx.lineTo(tV.x*trial.scale, tV.y*trial.scale);
        ctx.closePath();
        ctx.strokeStyle = options.color;
        ctx.lineWidth = 5*(canvas_height*trial.force_ratio);
        ctx.stroke();
        ctx.fill();
      }
    };

    // function for drawing agent in different states (erikb)
    var draw_agent = function(x, y, color) {
        let w = 0.12*canvas_width;
        let h = w;
        let r = 0.1*w;
        // TODO move the below to separate functions?
        // NB: this function taken from:
        // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
        // Draw head
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.arcTo(x+w, y, x+w, y+h, r);
        ctx.arcTo(x+w, y+h, x, y+h, r);
        ctx.arcTo(x, y+h, x, y, r);
        ctx.arcTo(x, y, x+w, y, r);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Draw ears
        ctx.beginPath();
        ctx.arc(x+w, y+0.45*w, 0.12*w, 1.5*Math.PI, 0.5*Math.PI, false);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y+0.45*w, 0.12*w, 1.5*Math.PI, 0.5*Math.PI, true);
        ctx.fill();

        // Draw head transmitter
        // NB: can swap out ears and transmitter shapes
        ctx.beginPath();
        // ctx.arc(x + 0.5*w, y, 0.1*w, 0, Math.PI, true);
        ctx.ellipse(x+0.5*w, y, 0.25*w, 0.1*w, 0, 0, Math.PI, true);
        ctx.fill();

        // Draw eyes
        ctx.beginPath();
        ctx.arc(x+0.33*w, y+0.33*w, 0.08*w, 0, 2*Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        // pupils
        ctx.beginPath();
        ctx.arc(x+0.32*w, y+0.31*w, 0.03*w, 0, 2*Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x+0.66*w, y+0.33*w, 0.08*w, 0, 2*Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        //pupils
        ctx.beginPath();
        ctx.arc(x + 0.65*w, y + 0.31*w, 0.03*w, 0, 2*Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();

        // Draw mouth
        let mx = x + 0.33*w;
        let my = y + 0.66*w;
        let mw = 0.33*w;
        let mh = 0.25*mw;
        let mr = 0.1*mw;
        ctx.beginPath();
        ctx.moveTo(mx+mr, my);
        ctx.arcTo(mx+mw, my, mx+mw, my+mh, mr);
        ctx.arcTo(mx+mw, my+mh, mx, my+mh, mr);
        ctx.arcTo(mx, my+mh, mx, my, mr);
        ctx.arcTo(mx, my, mx+mw, my, mr);
        ctx.closePath();
        ctx.strokestyle = 'black';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'white';
        ctx.stroke();
        ctx.fill();

        // reset stroke color to default
        ctx.strokeStyle = 'black';
    };

    // function for filling in bot thought bubbles (erikb)
    var draw_thought_bubble = function(x, y, rad, color) {
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 2*Math.PI, false);
        // Draw edges around thought bubbles?
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.fill();
        // reset stroke color to default if not drawing bubble edges above
        ctx.strokeStyle = 'black';
    };

    // function for adding bot thought cloud (erikb)
    var draw_thought_space = function(agent_type, x, y, color) {
        let w = 0.075*canvas_width;
        let h = 0.5*w;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0, 0, 2*Math.PI, false);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.fillStyle = color;
        ctx.stroke();
        ctx.fill();

        // Draw thought content
        ctx.font = "32px Quicksand";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        switch (agent_type) {
          case 'thinking':
            ctx.fillText("hmmm...", x, y);
            break;
          case 'finished':
            ctx.fillText("try this!", x, y);
            break;
        }
    };

    // function for 'animating' agent by drawing agent and thought bubbles (erikb)
    var animate_agent = function() {
      draw_agent(0.85*canvas_width, 0.55*canvas_height, 'rgb(167, 125, 216)');
	    let tmp = thought_tracker.toString(2); // convert to binary representation, then evaluate bitmap length in switch
	    switch (tmp.length) {
        case 1:
          break;
        case 2:
          draw_thought_bubble(0.9*canvas_width, 0.5*canvas_height, 8, 'rgb(167, 125, 216, 0.6)'); // small bubble 1
		      break;
        case 3:
          draw_thought_bubble(0.9*canvas_width, 0.5*canvas_height, 8, 'rgb(167, 125, 216, 0.6)'); // small bubble 1
          draw_thought_bubble(0.89*canvas_width, 0.45*canvas_height, 10, 'rgb(167, 125, 216, 0.6)'); // medium bubble 2
          if (tmp[1] == '1') {
              draw_thought_bubble(0.88*canvas_width, 0.39*canvas_height, 12, 'rgb(167, 125, 216, 0.6)'); // large bubble 3
          }
          break;
        case 4:
          draw_thought_bubble(0.9*canvas_width, 0.5*canvas_height, 8, 'rgb(167, 125, 216, 0.6)'); // small bubble 1
          draw_thought_bubble(0.89*canvas_width, 0.45*canvas_height, 10, 'rgb(167, 125, 216, 0.6)'); // medium bubble 2
          draw_thought_bubble(0.88*canvas_width, 0.39*canvas_height, 12, 'rgb(167, 125, 216, 0.6)'); // large bubble 3
          draw_thought_space('thinking', 0.9*canvas_width, 0.275*canvas_height, 'rgb(167, 125, 216, 0.6)');
          break;
        case 5:
          draw_agent(0.85*canvas_width, 0.55*canvas_height, 'rgb(3, 171, 180)');
          draw_thought_bubble(0.9*canvas_width, 0.5*canvas_height, 8, 'rgb(3, 171, 180, 0.6)'); // small bubble 1
          draw_thought_bubble(0.89*canvas_width, 0.45*canvas_height, 10, 'rgb(3, 171, 180, 0.6)'); // medium bubble 2
          draw_thought_bubble(0.88*canvas_width, 0.39*canvas_height, 12, 'rgb(3, 171, 180, 0.6)'); // large bubble 3
          draw_thought_space('finished', 0.9*canvas_width, 0.275*canvas_height, 'rgb(3, 171, 180, 0.6)');
          break;
	    }
    };

    var draw_world = function () {
        let obj = world.GetBodyList();
        while(obj) {
            let b = obj;
            obj = obj.GetNext();
            var position = b.GetPosition();
            if (position.x < 0 || position.x >(canvas_width/trial.scale)) {
                world.DestroyBody(b);
                continue;
            }
            // if (b.GetType() == b2Body.b2_dynamicBody) {
            var fl = b.GetFixtureList();
            if (!fl) {
                continue;
            }
            var shape = fl.GetShape();
            var shapeType = shape.GetType();
            var options = b.GetUserData();
            ctx.fillStyle = options.color;
            switch(shapeType){
                case 0: // b2Shape.e_circleShape:
                    ctx.beginPath();
                    ctx.arc(position.x*trial.scale, position.y*trial.scale, shape.GetRadius()*trial.scale, 0, Math.PI*2);
                    ctx.clip();
                    ctx.lineWidth = 5;
                    ctx.strokeStyle="black";
                    ctx.closePath();
                    ctx.stroke();
                    // hacky thing to adjust the coordinate of the img
                    ctx.drawImage(ball_img, position.x*trial.scale-shape.GetRadius()*trial.scale-2*(canvas_height*trial.force_ratio), position.y*trial.scale-shape.GetRadius()*trial.scale-2*(canvas_height*trial.force_ratio), 64*(canvas_height*trial.force_ratio), 64*(canvas_height*trial.force_ratio));
                    break;
                case 1: // b2Shape.e_polygonShape:
                    var vert = shape.GetVertices();
                    b2Math.MulMV(b.m_xf.R,vert[0]);
                    var tV = b2Math.AddVV(position, b2Math.MulMV(b.m_xf.R, vert[0]));
                    ctx.beginPath();
                    ctx.moveTo(tV.x*trial.scale, tV.y*trial.scale);
                    for (var i = 0; i < vert.length; i++) {
                        var v = b2Math.AddVV(position, b2Math.MulMV(b.m_xf.R, vert[i]));
                        ctx.lineTo(v.x*trial.scale, v.y*trial.scale);
                    }
                    ctx.lineTo(tV.x*trial.scale, tV.y*trial.scale);
                    ctx.closePath();
                    ctx.strokeStyle = options.color;
                    ctx.lineWidth = 5*(canvas_height*trial.force_ratio);
                    ctx.stroke();
                    ctx.fill();
                    break;
            }
            // }
        }
    };

    // Create box2d world object
    var createWorld = function (user_ball) {
        // Gravity: - 10 m/s2 - thats earth!!
        gravity = new b2Vec2(trial.gravity.x*(canvas_height*trial.force_ratio), trial.gravity.y*(canvas_height*trial.force_ratio));
        // constant wind force
        if (trial.scene == 'outdoor'){
          ConstantForceController.F = new b2Vec2(trial.wind.x*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio), trial.wind.y*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio)*(canvas_height*trial.force_ratio));
        }
        else if (trial.scene == 'indoor'){
          ConstantForceController.F = new b2Vec2(0, 0);
        }

        world = new b2World(gravity, true);

        ball = createBody({ shape: "circle", type: "kinematic", x: 0.8*canvas_width, y: 0.1*canvas_height, radius: trial.ball_ratio*canvas_height, density: user_ball.ball_density, options: {"name": "ball", color: user_ball.ball_color, isContacted: false } });
        paddle = createBody({ shape:"block", type: "kinematic", x: canvas_width*trial.center_x_ratio+trial.radius_ratio*canvas_height+5*(canvas_height*trial.force_ratio), y: canvas_height*trial.center_y_ratio, height: trial.paddle_height_ratio*canvas_height, width: trial.paddle_width_ratio*canvas_height, options: {"name": "paddle", color: "red", isContacted: false } });
        mass = Math.PI*(trial.ball_ratio*canvas_height/trial.scale)*(trial.ball_ratio*canvas_height/trial.scale)*user_ball.ball_density;

        // setup debug draw
        var debugDraw = new b2DebugDraw();
        debugDraw.SetSprite(ctx);
        debugDraw.SetDrawScale(trial.scale);
        debugDraw.SetFillAlpha(0.3);
        debugDraw.SetLineThickness(1.0);
        debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        world.SetDebugDraw(debugDraw);
    };

    // customize a physical body according to its properties
    var createBody = function (details) {
      // Create the definition
      var body_def = new b2BodyDef();
      // Set up the definition
      body_def.position= new b2Vec2(details.x / trial.scale, details.y / trial.scale);
      if (details.type == "kinematic"){
        body_def.type = b2Body.b2_kinematicBody;
      } else if (details.type == "dynamic"){
        body_def.type = b2Body.b2_dynamicBody;
      } else if (details.type == "static"){
        body_def.type = b2Body.b2_staticBody;
      }

      body_def.userData = details.options || {};
      // Create the Body
      var b = world.CreateBody(body_def);

      // Create the definition
      var fix_def = new b2FixtureDef();
      // Set up the definition
      fix_def.density = details.density;
      fix_def.friction = details.friction || 0;
      fix_def.restitution = details.restitution || 1;

      switch(details.shape) {
        case "circle":
          fix_def.shape = new b2CircleShape(details.radius / trial.scale);
          break;
        case "polygon":
          fix_def.shape = new b2PolygonShape;
          fix_def.shape.SetAsArray(details.points,details.points.length);
          break;
        case "block":
          fix_def.shape = new b2PolygonShape;
          fix_def.shape.SetAsBox(details.width/trial.scale,
                                        details.height/trial.scale);
          break;
      }
      // Create the fixture
      b.CreateFixture(fix_def);

      return b;
    };

    var create_contact_listener = function () {
      // set contact listener
      var contactListener = new b2ContactListener();
      contactListener.BeginContact = function (contact) {
          var bodyA = contact.GetFixtureA().GetBody(),
          bodyB = contact.GetFixtureB().GetBody(),
          bAData = bodyA.GetUserData(),
          bBData = bodyB.GetUserData();

          var setContacted = function (data) {
              data && (data.isContacted = true);
          };

          setContacted(bAData);
          setContacted(bBData);
      };
      world.SetContactListener(contactListener);
    };

    // This method will draw the world again and again, called by settimeout, self looped
    var step = function () {
        draw_canvas(shadow);

        if (key_down) {
          // move the world ahead
          world.Step(timeStep, 8, 3);
          world.ClearForces();
          ball_center = ball2center();
          if (ball_center < trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height && !block_listener){
            create_contact_listener();
            block_listener = true;
          }

          if (!on_bound){CheckonBound(ball_center, last_ball_center);}
          last_ball_center = ball_center;
          last_vector = vector;
          var data = paddle.GetUserData();
          if (data.isContacted){
            if (onBonund_count != 1){
              if (Math.abs(last_ball_center-(trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height)) > Math.abs(length-(trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height))){
                gtAngle = Math.atan2(vector.y, vector.x);
              } else {
                gtAngle = Math.atan2(last_vector.y, last_vector.x);
              }
              if (gtAngle<0){ gtAngle = gtAngle+2*Math.PI; }
            }
            draw_canvas(shadow);
            ctx.font = "40px Quicksand";
            ctx.fillStyle = "#000000";
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText("🙌 You caught it!", 0.5*canvas_width, 0.5*canvas_height);
            clearInterval(id);
            setTimeout(function(){
            }, 1000);
            end_trial(true);}
          else if(outofWindow(ball_center)){
            draw_canvas(shadow);
            ctx.font = "40px Quicksand";
            ctx.fillStyle = "#000000";
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText("❌ You missed it.", 0.5*canvas_width, 0.5*canvas_height);
            clearInterval(id);
            setTimeout(function(){
            }, 1000);
            end_trial(false);
          }
        }
        else {
          display_thinking();
          display_ready();
        }
    };

    var CheckonBound = function(length){
      ll = trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height;
      if (last_ball_center<=trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height && length>=trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height){onBonund_count += 1;}
      if (onBonund_count == 1){
        if (Math.abs(last_ball_center-(trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height)) > Math.abs(length-(trial.radius_ratio*canvas_height-trial.ball_ratio*canvas_height))){
          gtAngle = Math.atan2(vector.y, vector.x);
        } else {
          gtAngle = Math.atan2(last_vector.y, last_vector.x);
        }
        if (gtAngle<0){ gtAngle = gtAngle+2*Math.PI; }
        on_bound = true;
      }
    };

    var outofWindow = function(length){
      if (length>=trial.radius_ratio*canvas_height+trial.ball_ratio*canvas_height){
        world.DestroyBody(ball);
        return true; }
      else{ return false; }
    };

    var ball2center = function(){
      let ball_pos = ball.GetPosition();
      let ball_on_canvas = {x: ball_pos.x*trial.scale, y: ball_pos.y*trial.scale};
      let canvas_center = {x: trial.center_x_ratio*canvas_width, y: canvas_height-trial.center_y_ratio*canvas_height};
      vector = {x: ball_on_canvas.x-canvas_center.x, y: ball_on_canvas.y-canvas_center.y};
      let length = Math.sqrt(vector.x*vector.x+vector.y*vector.y);
      let Angle = Math.atan2(vector.y, vector.x);
      if (Angle<0){ Angle = Angle+2*Math.PI; }
      ball_polar_coord = {r: length/(trial.radius_ratio*canvas_height), angle: Angle};
      trajectory.push(ball_polar_coord);
      return length;
    };

    // This method will convert canvas position into world position
    var calculateWorldPosition = function (e) {
        return point = {
          x: (e.offsetX || e.layerX) / trial.scale,
          y: -((e.offsetY || e.layerY)-canvas_height) / trial.scale
        };
    };

    var display_thinking = function(){
      if (thought_tracker<10){
        ctx.font = "bold 40px Quicksand";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText("ROBOT'S TURN", 0.5*canvas_width, 0.5*canvas_height);
      }
    };

    var display_ready = function(){
      if (thought_tracker==16){
        ctx.font = "bold 40px Quicksand";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText("YOUR TURN", 0.5*canvas_width, 0.5*canvas_height);
      }
    };

    var makeArr = function (startValue, stopValue, step) {
      var arr = [];
      var cardinality = Math.floor((stopValue - startValue) / step);
      if (cardinality < 0){
        let neg_cardinality = -1*cardinality;
        for (var i = 0; i <= neg_cardinality; i++) {
          arr.push(startValue - (step * i));
        }
      }
      else if (cardinality > 0){
        for (var i = 0; i <= cardinality; i++) {
          arr.push(startValue + (step * i));
        }
      }
      if (arr[arr.length-1] != stopValue) {
        arr.push(stopValue);
      }
      return arr;
    };

    var keyboard_enabled = false;
    // first create the world
    createWorld(ball_info);
    ctx.clearRect(0, 0, canvas_width, canvas_height);

    // place the ball
    const ball_position = calculateWorldPosition({offsetX: start_position.x, offsetY: canvas_height-(start_position.y)});
    ball.SetPositionAndAngle(new b2Vec2(ball_position.x, ball_position.y, 0));

    startTime = Date.now();

    // place the paddle
    var agent_paddle = [];
    if (trial.paddle_rho >= Math.PI && trial.paddle_rho < 2*Math.PI){
      agent_paddle = makeArr(0, trial.paddle_rho-2*Math.PI, 0.1);
    }
    else if (trial.paddle_rho < Math.PI && trial.paddle_rho > 0){
      agent_paddle = makeArr(0, trial.paddle_rho, 0.1);
    }
    var counter = 0;
    var thought_tracker = 0; // global variable for keeping track of bot agent's thoughts (erikb)
    var i = setInterval(function(){
      // update global variable for keeping track of bot agent's thoughts (erikb) CAUTION: this handling is a bit hacky
      thought_tracker = counter % 10;
      // move the paddle
      paddle.SetPositionAndAngle(new b2Vec2((trial.radius_ratio*(canvas_height+5*(canvas_height*trial.force_ratio)) * Math.cos(agent_paddle[counter]) + canvas_width*trial.center_x_ratio) / trial.scale, (trial.radius_ratio*(canvas_height+5*(canvas_height*trial.force_ratio)) * Math.sin(agent_paddle[counter]) + canvas_height*trial.center_x_ratio) / trial.scale), agent_paddle[counter]);

      if(counter == agent_paddle.length-1) {
        thought_tracker = 16; // set global variable for displaying agent's thoughts to be in "final" state (erikb) CAUTION: number is kind of random here, should maybe be a global
        keyboard_enabled = true;
        clearInterval(i);
        const position = {x: paddle.GetPosition().x, y: paddle.GetPosition().y};
        verr = paddle.GetFixtureList().GetShape().GetVertices();
        const ver = [{x: verr[0].x, y: verr[0].y}, {x: verr[1].x, y: verr[1].y}, {x: verr[2].x, y: verr[2].y}, {x: verr[3].x, y: verr[3].y}]
        const r = {col1: {x: paddle.m_xf.R.col1.x, y: paddle.m_xf.R.col1.y}, col2: {x: paddle.m_xf.R.col2.x, y: paddle.m_xf.R.col2.y}};
        shadow = { position: position, ver: ver, options: {color: "grey" }, m_xf: r };
        finishAnimationTime = Date.now();
      }

      counter++;
    }, 200);

    document.addEventListener("keydown",function(e) {
      if (keyboard_enabled){
        if(e.keyCode == 32 && e.target == document.body) {
          e.preventDefault();
          if(key_down) {return};
          pressSpaceTime = Date.now();
          key_down = true;
          ball.SetType(b2Body.b2_dynamicBody);

          let obj = world.GetBodyList();
          while(obj) {
            var b = obj;
            if (b.GetType() == b2Body.b2_dynamicBody) {
                ConstantForceController.AddBody(b);
                // ConstantAxialForceController.AddBody(b);
                // ConstantRadialAccelController.AddBody(b);
                }
            obj = obj.GetNext();
          }
          world.AddController(ConstantForceController);
          // world.AddController(ConstantAxialForceController);
          // world.AddController(ConstantRadialAccelController);

          ball.ApplyImpulse({x: -force.x, y: -force.y }, ball.GetWorldCenter());

          showArrow = false;
          // disable mouse moves
          block_mouse = true;
        }
        else if (e.keyCode == 39) {
          trustAgent = false;
          if (block_mouse) { return; }
          e.preventDefault();
          let moveTime = Date.now();
          movePaddleTime.push(moveTime);
          paddle.SetPositionAndAngle(new b2Vec2((trial.radius_ratio*(canvas_height+5*(canvas_height*trial.force_ratio)) * Math.cos(mouseAngle+0.1) + canvas_width*trial.center_x_ratio) / trial.scale, (trial.radius_ratio*(canvas_height+5*(canvas_height*trial.force_ratio)) * Math.sin(mouseAngle+0.1) + canvas_height*trial.center_x_ratio) / trial.scale), mouseAngle+0.1);
          mouseAngle = paddle.GetAngle();
          if (mouseAngle<0){ mouseAngle = mouseAngle+2*Math.PI; }
          else if (mouseAngle>2*Math.PI){ mouseAngle = mouseAngle-2*Math.PI; }
          mouse_tr.push(mouseAngle);
        }
        else if (e.keyCode == 37) {
          trustAgent = false;
          if (block_mouse) { return; }
          e.preventDefault();
          let moveTime = Date.now();
          movePaddleTime.push(moveTime);
          paddle.SetPositionAndAngle(new b2Vec2((trial.radius_ratio*(canvas_height+5*(canvas_height*trial.force_ratio)) * Math.cos(mouseAngle-0.1) + canvas_width*trial.center_x_ratio) / trial.scale, (trial.radius_ratio*(canvas_height+5*(canvas_height*trial.force_ratio)) * Math.sin(mouseAngle-0.1) + canvas_height*trial.center_x_ratio) / trial.scale), mouseAngle-0.1);
          mouseAngle = paddle.GetAngle();
          if (mouseAngle<0){ mouseAngle = mouseAngle+2*Math.PI; }
          else if (mouseAngle>2*Math.PI){ mouseAngle = mouseAngle-2*Math.PI; }
          mouse_tr.push(mouseAngle);
        }
      }
    });

    var id = window.setInterval(step, 1000 / 60);

    // function to end trial when it is time
    var end_trial = function(caught) {
      endTime = Date.now();
      // data saving
      var trial_data = {
        // experiment data
        gameID: trial.gameID,
        //SONA_ID: trial.SONA_ID,
        prolificID : trial.prolificID,
        studyID : trial.studyID,
        sessionID : trial.sessionID,
        dbname: trial.dbname,
        colname: trial.colname,
        iterationName: trial.iterationName,
        agent_cond: trial.agent_cond, // agent condition: 'good', 'bad', or 'improving'


        // trial settings
        canvas_width: canvas_width,
        canvas_height: canvas_height,
        radius: canvas_height*trial.radius_ratio,
        launching_rho_original: trial.rho_original,
        launching_rho: trial.rho,
        // TODO: add ground truth and noised paddle location
        paddle_rho: trial.paddle_rho,
        paddle_rho_original: trial.paddle_rho_original,
        paddle_sigma: trial.paddle_sigma,
        paddle_noise: trial.paddle_noise,
        launching_force: trial.force,
        launching_theta: trial.theta,
        launching_ball_image: trial.ball_corr[trial.ball-1],
        launching_ball_index: trial.ball,
        launching_ball_mass: mass,
        gravity: -gravity.y,
        wind: ConstantForceController.F.x,
        force: Math.sqrt(force.x*force.x+force.y*force.y),
        const_30: trial.ball_ratio*canvas_height,

        scene: trial.scene,
        sessionBlock: trial.block,
        trialInd: trial.trialInd,
        totalTrials: trial.totalTrials,
        curr_correct_trials: trial.curr_correct_trials,

        // user data
        paddleAngle: mouseAngle,
        correct: caught,
        trustedAgent: trustAgent,
        groundtruthAngle: gtAngle,
        trajectory: trajectory,
        paddle_tr: mouse_tr,
        startTime: startTime,
        movePaddleTime: movePaddleTime,
        pressSpaceTime: pressSpaceTime,
        finishAnimationTime: finishAnimationTime,
        endTime: endTime,
        criticalTrial: trial.criticalTrial
      };
      // console.log(trial_data);

      // end trial
      if (caught){
        jsPsych.pluginAPI.setTimeout(function(){
          jsPsych.finishTrial(trial_data);
        }, 1500);
      } else {
        jsPsych.pluginAPI.setTimeout(function(){
          jsPsych.finishTrial(trial_data)
        }, 1500);
      }

      // // end trial
      // jsPsych.finishTrial(trial_data);
    };
  };

  return plugin;
})();
