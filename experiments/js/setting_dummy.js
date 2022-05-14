// function Trial() {
//   this.type = 'intuitive-physics',
//   this.dbname = 'physics_continual_learning';
//   this.colname = 'generalization';
//   this.iterationName = 'pilot1';
//   this.condition = 'train';
//   this.context = 'indoor'
// };

function setupGame() {
  socket.on('onConnected', function(d) {
    var correct_trials = 0;
    timeline = [];
    var gravity_2 = {
      type: 'intuitive-physics',
      scene: 'outdoor',
      prompt: 'Use the left & right arrow key to move the paddle. When you are ready, press the spacebar to launch the ball.',
      gravity: {x: 0, y: -10},
      wind: {x: 60, y: 0},
      theta: 0,
      corr: [1, 2, 3],
      rho: Math.PI*1,
      force: 60,
      ball: 1,
      // image_cue: 'outdoor_cue.png',
    };
    var feedback = {
      type: 'feedback',
      stimulus: function(){
          var last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
          // console.log(last_trial_correct);
          // console.log(last_trial_correct ? 1: 0);
          if(last_trial_correct){
          return "<p style='font-size:30px;'>🙌 You got that right! Press space to continue.</p>"; // the parameter value has to be returned from the function
          } else {
          return "<p style='font-size:30px;'>❌ You got that one wrong. Press space to continue.</p>"; // the parameter value has to be returned from the function
          }
      },
      choices: [' '],
      finishedTrials: function (){
          return (jsPsych.data.get().last(1).values()[0].trialInd + 1);
      },
      curr_correct_trials: function (){
          var last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
          correct_trials += (last_trial_correct ? 1: 0);
          return correct_trials;
      }
    };
    timeline.push(gravity_2);
    timeline.push(feedback);
    
    jsPsych.init({
      timeline: timeline
    });

  }); // close onConnected
} // close setup game